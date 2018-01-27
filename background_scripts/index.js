import WAE from 'web-auto-extractor';
import he from 'he';

const TAB_RECIPE_MAP = {};

// Mapping of ASCII encoded fraction to unicode.
const FRACT_MAP = {
    '1/2': '½',
    '1/3': '⅓',
    '2/3': '⅔',
    '1/4': '¼',
    '3/4': '¾',
    // TODO: Finish this list later...
};

browser.pageAction.onClicked.addListener((e) => {
    browser.tabs.update({
        url: 'build/views/recipe.html'
    }).catch(e => {
        console.error('FAILED to inject script:', e);
    });
});


// TODO: should we persist data rather than making everything ephemeral?
browser.tabs.onRemoved.addListener((tabId) => {
    delete TAB_RECIPE_MAP[tabId];
});


function sanitizeString(str) {
    // Strip out HTML entities
    str = he.decode(str);

    // Sometimes HTML tags end up in the text.
    str = str.replace(/<(\/)?(p|div|span|b|i|em)>/g, '');

    // Convert fractions into their unicode equivalent, falling back
    // to the FRACTION character (U+2044).
    str = str.replace(/(\d+)\/(\d+)/g, (m, n, d) => FRACT_MAP[m] || `${n}⁄${d}`);

    return str;
}


function normalizeRecipe(recipe) {
    console.log('recipe dirty', recipe);

    let clean = {
        name: recipe.name || 'An untitled recipe',
        description: recipe.description,
        ingredients: recipe.recipeIngredient || recipe.ingredients || [],
        full: recipe
    };

    // Seems relatively common to have blank items in the list;
    clean.ingredients = clean.ingredients
        .map(i => i.trim())
        .filter(i => i !== "");

    if (typeof recipe.recipeInstructions === 'string') {
        clean.instructionText = recipe.recipeInstructions;
    }

    if (Array.isArray(recipe.recipeInstructions)) {
        clean.instructionList = recipe.recipeInstructions.map((inst, idx) => {
            // Sometimes the instruction list includes a number
            // prefix, strip that out.

            return inst.replace(/^(\d+)\.?\s*/, (match, num) => {
                if (num === idx + 1) return '';

                return match;
            });
        });
    }

    // Remove the junk from the strings.
    Object.keys(clean).forEach(k => {
        if (typeof clean[k] === 'string') {
            clean[k] = sanitizeString(clean[k]);
        } else if (Array.isArray(clean[k])) {
            clean[k] = clean[k].map(v => sanitizeString(v));
        }
    });

    console.log('recipe cleaned:', clean);

    return clean;
}


browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log('sender.tab->', sender.tab);

    function setRecipeData(data) {
        TAB_RECIPE_MAP[sender.tab.id] = normalizeRecipe(data);
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

        console.log('GOT RECIPE', result);
        setRecipeData(result);
        break;

    case 'recipe-detected':
        setRecipeData(msg.data[0]);
        break;

    case 'request-recipe':
        const recipe = TAB_RECIPE_MAP[sender.tab.id];
        if (recipe !== null) {
            sendResponse(recipe);
        }

        break;

    default:
        console.log('Unknown message kind:', msg.kind);
        break;
    }
});
