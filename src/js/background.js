import WAE from 'web-auto-extractor';
import browser from 'webextension-polyfill';

import sanitize from './sanitize';


// Mapping of tab id -> recipe id
const TAB_RECIPE_MAP = {};
// Mapping of tab id -> recipe that is not persisted to storage.
const EPHEMERAL_TAB_MAP = {};


// Keys that should have `common` run against them.
const KEYS_TO_CLEAN = [
    'name',
    'author',
    'time',
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
            url: `recipe.html?recipeId=${encodeURI(recipeId)}`
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


export function normalizeRecipe(tab, recipe) {
    console.log('recipe dirty', recipe);

    // Deprecated, redundant, and still used :(
    if ((recipe['@context'] || '').includes('data-vocabulary.org')) {
        recipe = {
            name: recipe.name,
            ingredients: recipe.ingredient,
            description: recipe.summary,
            recipeInstructions: recipe.instructions,
        };
    }

    const clean = {
        name: recipe.name || 'An untitled recipe',
        description: recipe.description,
        ingredients: recipe.recipeIngredient || recipe.ingredients || [],
        image: sanitize.image(recipe.image),
        author: sanitize.author(recipe.author),
        time: sanitize.time(recipe.totalTime),
        yield: sanitize.yield(recipe.recipeYield),
        url: tab.url,
        original: recipe,
    };

    // instructions isn't in the spec, but is sometimes used anyway.
    const instructions = recipe.recipeInstructions || recipe.instruction || [];

    if (typeof instructions === 'string') {
        const text = sanitize.common(instructions)
            .replace(/^preparation/i, '')
            .replace(/(\w)\.(\w)/g, (_match, w1, w2) => `${w1}.\n${w2}`);

        // Sometimes the text block is actually a list in disguise.
        if (text.startsWith('1.')) {
            clean.instructionList = text.split(/\d+\./);
        } else if (text.includes('\n')) {
            clean.instructionList = text.split(/\r?\n/);
        } else {
            clean.instructionText = text;
        }
    }

    if (Array.isArray(instructions)) {
        clean.instructionList = instructions.map((inst, idx) => {
            // Sometimes the instruction list includes a number
            // prefix, strip that out.
            return inst.replace(/^(\d+)\.?\s*/, (orig, num) => {
                return +num === idx + 1 ? '' : orig;
            });
        });
    }

    // Remove the junk from the strings.
    KEYS_TO_CLEAN.forEach(key => { clean[key] = sanitize.common(clean[key]); });

    // Try to map ingredients from text to [{quantity, ingredient, unit}]
    clean.ingredients = clean.ingredients.map(i => sanitize.ingredient(i));

    console.log('recipe cleaned:', clean);

    return clean;
}

// TODO: Clean up old recipes after a while.
function saveToStorage(recipe) {
    const cleanName = recipe.name
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');

    const id = `${Date.now()}-${cleanName}`;

    console.log('Saving recipe as', id);

    return browser.storage.local.set({[id]: recipe}).then(() => id);
}

function setRecipeData(tab, data) {
    const recipe = normalizeRecipe(tab, data);

    EPHEMERAL_TAB_MAP[tab.id] = recipe;

    // Some weird bug in chrome...
    if (typeof chrome !== 'undefined') {
        chrome.pageAction.show(tab.id);
    } else {
        browser.pageAction.show(tab.id);
    }
}

browser.runtime.onMessage.addListener((msg, sender) => {
    let result;

    if (msg.kind === 'try-extract-recipe') {
        const scraper = WAE();

        try {
            const data = scraper.parse(msg.data);
            const parsed = (data.jsonld.Recipe || data.microdata.Recipe || data.rdfa.Recipe);

            result = (parsed || [null])[0];
        } catch (e) {
            console.error('Failed to parse microdata:', e);
        }

    } else if (msg.kind === 'recipe-detected') {
        result = msg.data;
    } else {
        console.error('Unknown message kind:', msg.kind);
    }

    if (result) {
        setRecipeData(sender.tab, result);
    }
});
