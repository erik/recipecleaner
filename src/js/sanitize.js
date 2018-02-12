// Try to handle all the wacky inconsistencies of recipes on the internet.


// Expect a scalar value, taking first item in list if not
function expectSingle (maybeList) {
    if (Array.isArray(maybeList)) {
        return maybeList[0];
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

    // Some websites have author names be URLs
    if (author) {
        author = author.replace('/contributors/', '');
    }

    return author || null;
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

    return yield_.trim()
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


// Handles common case stuff for sanitization.
function sanitizeCommon (input) {
    if (Array.isArray(input)) {
        return input.map(v => sanitizeString(v)).filter(i => i !== '');
    } else if (typeof input === 'string') {
        return sanitizeString(input);
    }

    return input;
}

function sanitizeString (input) {
    let str = input;

    // Sometimes HTML tags or encoded entities end up in the text. This is a
    // quick way to parse them out.
    if (/(<\/\w+>)|(&\w+;)/.test(str)) {
        const div = document.createElement('div');
        div.innerHTML = str;
        str = div.innerText;
    }

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

export default {
    expectSingle,
    author: sanitizeAuthor,
    common: sanitizeCommon,
    string: sanitizeString,
    image: sanitizeImage,
    ingredient: sanitizeIngredient,
    time: sanitizeTime,
    yield: sanitizeYield,
};
