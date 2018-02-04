import WAE from 'web-auto-extractor';
import he from 'he';


// Mapping of tab id -> recipe id
const TAB_RECIPE_MAP = {};
// Mapping of tab id -> recipe that is not persisted to storage.
const EPHEMERAL_TAB_MAP = {};


// Mapping of ASCII encoded fraction to unicode.
// TODO: Missing some fractions still, but who uses 5/6
const FRACT_MAP = {
    '1/2': '½',
    '1/3': '⅓',
    '2/3': '⅔',
    '1/4': '¼',
    '3/4': '¾',
    '1/8': '⅛',
    '1/10': '⅒',
};

const QUANTITIES = [
    'ounce(?:s)?',
    'oz',
    'pound(?:s)?',
    'lb(?:s)?',
    '(?:kilo)?gram(?:s)?',
    'g',
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
];

const FRACTIONS = Object.values(FRACT_MAP).join('');

// Try to match things like "1 tablespoon sugar"
const RECIPE_QUANTITY_RE = new RegExp([
    `^`,
    `((?:\\d+\\s?)?[\\d${FRACTIONS}⁄-]+)`,
    `\\s*`,
    `(${QUANTITIES.join('|')})?\\.?`,
    `\\s*`,
    `(.*)`,
    `$`
].join(''), 'i');

// Keys that should have `sanitizeString` run against them.
const KEYS_TO_CLEAN = [
    'name',
    'description',
    'ingredients',
    'instructionText',
    'instructionList',
];

browser.pageAction.onClicked.addListener((tab) => {
    const recipe = EPHEMERAL_TAB_MAP[tab.id];

    // We delay storing the recipe until the user actually wants it.
    saveToStorage(recipe).then(recipeId => {
        TAB_RECIPE_MAP[tab.id] = recipeId;

        browser.tabs.update({
            url: `views/recipe.html?recipeId=${encodeURI(recipeId)}`
        }).catch(e => {
            console.error('FAILED to inject script:', e);
        });
    });
});


// Clean up after ourselves.
browser.tabs.onRemoved.addListener((tabId) => {
    delete EPHEMERAL_TAB_MAP[tabId];
    delete TAB_RECIPE_MAP[tabId];
});


function sanitizeString(str) {
    // Strip out HTML entities
    str = he.decode(str);

    // Sometimes HTML tags end up in the text. This is a quick way to parse
    // them out.
    // TODO: What happens if it's bad HTML?
    if (/<\/(a|p|ol|li|ul|div|span|b|i|em)>/.test(str)) {
        const div = document.createElement('div');
        div.innerHTML = str;
        str = div.innerText;
    }

    // Convert fractions into their unicode equivalent, falling back
    // to the FRACTION character (U+2044).
    str = str.replace(/(\d+)\/(\d+)/g, (m, n, d) => FRACT_MAP[m] || `${n}⁄${d}`);

    // Clean up temperatures
    str = str.replace(/(\d+) degree(?:s)? ([CF])/g, (_, n, d) => `${n}° ${d}`);

    // Junk that appears on some sites
    str = str.replace(/Save \$/, '');

    return str;
}


function normalizeRecipe(tab, recipe) {
    console.log('recipe dirty', recipe);

    // Deprecated, redundant, and still used :(
    if (recipe['@context'].includes('data-vocabulary.org')) {
        recipe = {
            name: recipe.name,
            ingredients: recipe.ingredient,
            description: recipe.summary,
            recipeInstructions: recipe.instructions,
        };
    }

    let image = recipe.image;
    if (Array.isArray(image)) {
        image = image.length > 0 ? image[0] : null;
    }

    if (image && image.url) {
        image = image.url;
    }

    let author = recipe.author;
    if (Array.isArray(author)) {
        author = author.length > 0 ? author[0] : null;
    }

    // Sometimes a string, sometimes {"name": "..."}
    author = (author && author.name) ? author.name : author;

    if (author) {
        author = author
            .trim()
            .replace('/contributors/', '');
    }

    let yield_ = recipe.recipeYield;
    if (yield_) {
        yield_ = yield_
            .trim()
            .replace(/^serves /i, '')
            .toLowerCase();
    }

    // Very simplified parsing of ISO8601 duration.
    // TODO: should use momentJS here and humanize
    let time = recipe.totalTime;
    if (time) {
        const match = time.match(/PT(?:(\d+)H)?(\d+)M(?:\d+S)?/);
        if (match !== null) {
            let [_match, hours, minutes] = match;
            time = '';

            if (hours && hours !== '0') {
                time += `${hours} hour${hours === '1' ? '' : 's'}`;
            }

            if (minutes && minutes !== '0') {
                time += `${minutes} minutes`;
            }
        }
    }

    let clean = {
        name: recipe.name || 'An untitled recipe',
        description: recipe.description,
        ingredients: recipe.recipeIngredient || recipe.ingredients || [],
        image: image,
        author: author,
        yield: yield_,
        url: tab.url,
        time: time,
        original: recipe,
    };

    if (typeof recipe.recipeInstructions === 'string') {
        clean.instructionText = recipe.recipeInstructions
            .trim()
            .replace(/^preparation/i, '');

        // Sometimes the text block is actually a list in disguise.
        if (clean.instructionText.startsWith('1.')) {
            clean.instructionList = clean.instructionText.split(/\d+\./);
            clean.instructionText = null;
        } else if (clean.instructionText.includes('\n')) {
            clean.instructionList = clean.instructionText.split(/\r?\n/);
            clean.instructionText = null;
        }

    }

    if (Array.isArray(recipe.recipeInstructions)) {
        clean.instructionList = recipe.recipeInstructions
            .map((inst, idx) => {
                // Sometimes the instruction list includes a number
                // prefix, strip that out.
                return inst.replace(/^(\d+)\.?\s*/, (orig, num) => {
                    return +num === idx + 1 ? '' : orig;
                });
            });
    }

    // Remove the junk from the strings.
    KEYS_TO_CLEAN.forEach(k => {
            if (typeof clean[k] === 'string') {
                clean[k] = sanitizeString(clean[k]);
            } else if (Array.isArray(clean[k])) {
                // Seems relatively common to have blank items in the list
                clean[k] = clean[k]
                    .map(v => sanitizeString(v))
                    .map(i => i.trim())
                    .filter(i => i !== "");
            }
        });

    // Try to map ingredients from text to [{quantity, ingredient, unit}]
    clean.ingredients = clean.ingredients.map(ingredient => {
        const match = ingredient.match(RECIPE_QUANTITY_RE);

        if (match === null) {
            return {ingredient};
        }

        return {
            quantity: match[1],
            unit: match[2],
            ingredient: match[3]
        };
    });

    console.log('recipe cleaned:', clean);

    return clean;
}


// TODO: Clean up old recipes after a while.
function saveToStorage(recipe) {
    let cleanName = recipe.name
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');

    let id = `${Date.now()}-${cleanName}`;

    console.log('Saving recipe as', id);

    return browser.storage.local.set({[id]: recipe}).then(() => id);
}


browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    function setRecipeData(data) {
        let recipe = normalizeRecipe(sender.tab, data);

        EPHEMERAL_TAB_MAP[sender.tab.id] = recipe;
        browser.pageAction.show(sender.tab.id);
    }

    switch (msg.kind) {
    case 'try-extract-recipe':
        let scraper = WAE();
        let result = null;

        try {
            const data = scraper.parse(msg.data);

            if (data.jsonld.Recipe) {
                result = data.jsonld.Recipe[0];
            } else if (data.microdata.Recipe) {
                result = data.microdata.Recipe[0];
            } else if (data.rdfa.Recipe) {
                result = data.rdfa.Recipe[0];
            }
        } catch (e) {
            console.error('Failed to parse microdata:', e);
        }

        if (result === null) {
            break;
        }

        setRecipeData(result);
        break;

    case 'recipe-detected':
        setRecipeData(msg.data[0]);
        break;

    default:
        console.log('Unknown message kind:', msg.kind);
        break;
    }
});
