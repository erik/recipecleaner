// Try to handle all the wacky inconsistencies of recipes on the internet.

// Keys that should have `sanitize.common` run against them.
const COMMON_KEYS_TO_CLEAN = [
  'name',
  'author',
  'time',
  'description',
  'ingredients',
  'instructionText',
  'instructionList',
];

// Expect a scalar value, taking first item in list if not
function expectSingle (maybeList) {
  if (Array.isArray(maybeList)) {
    return maybeList.length > 0 ? maybeList[0] : null;
  }

  return maybeList;
}

function sanitizeImage (image) {
  if (!image) {
    return null;
  }

  if (image['@list']) {
    image = image['@list'];
  }

  image = expectSingle(image);

  if (image && image.url) {
    image = image.url;
  }

  return image;
}

function sanitizeAuthor (author) {
  if (!author) {
    return null;
  }

  author = expectSingle(author);

  // Sometimes a string, sometimes {"name": "..."}
  if (author && author.name !== undefined) {
    author = author.name;
  }

  // If author is an organization, use id (likely the URL) as a fallback.
  if (author && author['@type'] === 'Organization') {
    author = author['@id'];
  }

  // Some websites embed URLs as the author
  return (typeof author === 'string' && author !== "")
    ? author.replace('/contributors/', '')
    : null;
}

// PnYnMnDTnHnMnS
const numbers = '\\d+(?:[\\.,]\\d{0,3})?';
const weekPattern = `(?:${numbers}W)`;
const datePattern = `(?:${numbers}Y)?(?:${numbers}M)?(?:${numbers}D)?`;
const timePattern = `T(?:(${numbers})H)?(?:(${numbers})M)?(?:${numbers}S)?`;
const iso8601 = `^P(?:${weekPattern}|${datePattern}(?:${timePattern})?)$`;

// The ISO8601 regex for matching / testing durations
// Taken from https://github.com/tolu/ISO8601-duration (MIT)
const ISO8601_DURATION_RE = new RegExp(iso8601);

function sanitizeTime (time) {
  if (!time) {
    return null;
  }

  const match = time.trim().match(ISO8601_DURATION_RE);
  if (match !== null) {
    // eslint-disable-next-line no-unused-vars
    const [_match, hours, minutes] = match;
    const parts = [];

    if (hours && hours !== '0') {
      parts.push(`${hours} hr`);
    }

    if (minutes && minutes !== '0') {
      parts.push(`${minutes} min`);
    }

    return parts.length > 0 ? parts.join(' ') : null;
  }

  return null;
}


function sanitizeYield (yield_) {
  if (!yield_) {
    return null;
  }

  // Coerce to string because sometimes yield comes in as a number
  return `${yield_}`.trim()
    .replace(/^(serves|yield(s)?):?\s?/i, '')
    .toLowerCase();
}

const QUANTITIES = [
  'ounce(?:s)?',
  'oz',
  'pound(?:s)?',
  'lb(?:s)?',
  '(?:kilo)?gram(?:s)?',
  'g\\b',
  'kg',
  'teaspoon(?:s)?',
  'tablespoon(?:s)?',
  'cup(?:s)?',
  'tsp',
  'tbsp',
  'c\\.',
  'small',
  'medium',
  'large',
  'stick(?:s)?',
  'clove(?:s)?',
  'bunch(?:es)?',
  'can(?:s)?',
  'stalk(?:s)?',
  'head(?:s)?',
  'part(?:s)?'
];

// Mapping of ASCII encoded fraction to unicode.
// TODO: Missing some fractions still, but who uses 5/6
export const FRACT_MAP = {
  '1/2': '½',
  '1/3': '⅓',
  '2/3': '⅔',
  '1/4': '¼',
  '3/4': '¾',
  '1/8': '⅛',
  '1/10': '⅒',
};

const FRACTIONS = Object.values(FRACT_MAP).join('');

// Try to match things like "1 tablespoon sugar"
const RECIPE_QUANTITY_RE = new RegExp([
  '^',
  `((?:\\d+\\s?)?[\\d${FRACTIONS}⁄-]+)`,
  '\\s*',
  `(${QUANTITIES.join('|')})?\\.?`,
  '\\s*',
  '(.*)',
  '$'
].join(''), 'i');

function sanitizeIngredient (ingredient) {
  const match = ingredient.match(RECIPE_QUANTITY_RE);

  if (match === null) {
    return {ingredient};
  }

  return {quantity: match[1], unit: match[2], ingredient: match[3]};
}

function sanitizeInstructions (instructions) {
  if (typeof instructions === 'string') {
    instructions = sanitizeInstructionText(instructions);
  }

  if (Array.isArray(instructions)) {
    return sanitizeInstructionList(instructions);
  }

  return instructions;
}

// Possibly convert instructionText to a list, and otherwise clean up the data.
function sanitizeInstructionText (instructionText) {
  let text = instructionText;

  // Some recipe microdata systems embed HTML tags into the JSON.
  // These will be stripped by sanitizeCommon, so add a new line after
  // </p> tags so we can tell that this should really be a list, not a single
  // block. Yes, I know.
  const embeddedParagraph = /(<\/p>)|(&lt;\/p&gt;)/g;
  if (embeddedParagraph.test(text)) {
    text = text.replace(embeddedParagraph, '$&\n');
  }

  text = sanitizeCommon(text)
    .replace(/^preparation/i, '')
    .replace(/(\w)([.!?])(\w)/g, (_match, w1, pt, w2) => `${w1}${pt}\n${w2}`);

  // Sometimes the text block is actually a list in disguise.
  if (text.startsWith('1.')) {
    return text.split(/\d+\./);
  }


  if (text.includes('\n')) {
    return text.split(/\r?\n/);
  }

  return text;
}

// Convert recipeInstructions from HowToSection schema to simple string.
function sanitizeHowToSection (section) {
  const elem = section['itemListElement'];

  // FIXME: I don't think this is exhaustive.
  if (typeof elem === 'string') {
    return elem;
  } else if (Array.isArray(elem)) {
    return elem.map(e => e.text || '').join('\n');
  } else if (typeof elem === 'object' && elem['@type'] === 'HowToStep') {
    return elem.text || '';
  }

  // Failure case: just return empty string
  return '';
}

function sanitizeInstructionList (list) {
  return list.map((instruction, i) => {
    let instructionText = instruction;

    // Handle the case where the list does not contain strings,
    // but HowToSteps.
    if (typeof instruction === 'object') {
      if (instruction['@type'] === 'HowToSection') {
        instructionText = sanitizeHowToSection(instruction);
      } else if (instruction['@type'] === 'HowToStep' || 'text' in instruction) {
        instructionText = instruction.text || '';
      } else {
        console.warn('Unknown instruction format! Expected string ' +
                             'or HowToSection', instruction);
        return '';
      }
    }

    // Sometimes the instruction list includes a number
    // prefix, strip that out.
    return instructionText
      .replace(/^(\d+)\.?\s*/, (orig, num) => {
        return +num === i + 1 ? '' : orig;
      })
      .trim();
  }).filter(i => i !== '');
}

// Handles common case stuff for sanitization.
function sanitizeCommon (input) {
  if (Array.isArray(input)) {
    return input
      .map(v => sanitizeString(v))
      .filter(i => i !== '');
  } else if (typeof input === 'string') {
    return sanitizeString(input);
  }

  return input;
}

// Handle majority of cases of stripping out HTML tags. Won't strip out on a
// site that's actively trying to show broken content, but eh.
function stripTags (input) {
  return input.replace(/<[^>]*?>/g, '');
}

function sanitizeString (input) {
  let str = input;

  // Sometimes, extra bad sites will double HTML escape. I don't know how.
  str = str.replace(/&amp;/g, '&');

  // Sometimes HTML encoded entities end up in the text.
  if (/&[#\w]+;/.test(str)) {
    // Using a text area decodes things like &amp; but doesn't execute
    // scripts.
    // FIXME: Potential issue: images loading? doesn't seem important as
    // FIXME: there is already a user controlled image field
    const node = document.createElement('textarea');
    node.innerHTML = str;
    str = node.innerText;
  }

  // If there are remaining HTML tags, strip them out.
  str = stripTags(str);

  // Convert fractions into their unicode equivalent, falling back
  // to the FRACTION character (U+2044).
  //
  // Clean up temperatures
  //
  // Junk that appears on some sites
  return str.replace(/(\d+)\/(\d+)/g, (m, n, d) => FRACT_MAP[m] || `${n}⁄${d}`)
    .replace(/(\d+) degree(?:s)? ([CF])/g, (_, n, d) => `${n}° ${d}`)
    .replace(/Save \$/, '')
    .trim();
}

function sanitizeRecipe (url, recipe) {
  // Deprecated, redundant, and still used :(
  if ((recipe['@context'] || '').includes('data-vocabulary.org')) {
    recipe = {
      name: recipe.name,
      ingredients: recipe.ingredient,
      description: recipe.summary,
      recipeInstructions: recipe.instructions
    };
  }

  const clean = {
    name: expectSingle(recipe.name || 'An untitled recipe'),
    description: recipe.description,
    ingredients: recipe.recipeIngredient || recipe.ingredients || [],
    image: sanitizeImage(recipe.image),
    author: sanitizeAuthor(recipe.author),
    time: sanitizeTime(recipe.totalTime),
    yield: sanitizeYield(recipe.recipeYield),
    url: url,
    original: recipe,
  };

    // Bug fix for single ingredient recipes.
  if (!Array.isArray(clean.ingredients)) {
    clean.ingredients = [clean.ingredients];
  }

  // Instructions could be either a list or a string. Sometimes it
  // comes in as a string but will be converted to a list by
  // `sanitizeInstructionText`.
  const inst = sanitizeInstructions(
    recipe.recipeInstructions || recipe.instructions || []);

  if (Array.isArray(inst)) {
    clean.instructionList = inst;
  } else {
    clean.instructionText = inst;
  }

  // Remove the junk from the strings.
  for (const key of COMMON_KEYS_TO_CLEAN) {
    clean[key] = sanitizeCommon(clean[key]);
  }

  // Try to map ingredients from text to [{quantity, ingredient, unit}]
  clean.ingredients = clean.ingredients.map(i => sanitizeIngredient(i));

  return clean;
}

export default {
  expectSingle,
  stripTags,
  author: sanitizeAuthor,
  common: sanitizeCommon,
  string: sanitizeString,
  image: sanitizeImage,
  ingredient: sanitizeIngredient,
  instructions: sanitizeInstructions,
  instructionText: sanitizeInstructionText,
  instructionList: sanitizeInstructionList,
  recipe: sanitizeRecipe,
  time: sanitizeTime,
  yield: sanitizeYield,
};
