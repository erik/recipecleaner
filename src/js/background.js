import browser from 'webextension-polyfill';

import sanitize from './sanitize';


// Mapping of tab id -> recipe (not persisted to storage)
const EPHEMERAL_TAB_MAP = {};


// Keys that should have `sanitize.common` run against them.
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
});


export function normalizeRecipe (tab, recipe) {
    console.group();
    console.log('original recipe:', recipe);

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
        name: sanitize.expectSingle(recipe.name || 'An untitled recipe'),
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
    for (const key of KEYS_TO_CLEAN) {
        clean[key] = sanitize.common(clean[key]);
    }

    // Try to map ingredients from text to [{quantity, ingredient, unit}]
    clean.ingredients = clean.ingredients.map(i => sanitize.ingredient(i));

    console.log('cleaned recipe:', clean);
    console.groupEnd();

    return clean;
}

// TODO: Clean up old recipes after a while.
function saveToStorage (recipe) {
    const cleanName = recipe.name
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');

    const id = `${Date.now()}-${cleanName}`;

    console.log('Saving recipe as', id);

    return browser.storage.local.set({[id]: recipe}).then(() => id);
}

browser.runtime.onMessage.addListener((msg, sender) => {
    if (msg.kind === 'recipe-detected') {
        const recipe = normalizeRecipe(sender.tab, msg.data);

        EPHEMERAL_TAB_MAP[sender.tab.id] = recipe;

        // Some weird bug in chrome...
        if (typeof chrome !== 'undefined') {
            chrome.pageAction.show(sender.tab.id);
        } else {
            browser.pageAction.show(sender.tab.id);
        }
    } else {
        console.error('Unknown message kind:', msg.kind);
    }
});

// First time user experience
browser.runtime.onInstalled.addListener(({reason}) => {
    // Don't do anything if this isn't a first time install
    // (e.g. extension update)
    if (reason !== 'install') {
        return;
    }

    browser.tabs.create({url: '/welcome.html'});
});
