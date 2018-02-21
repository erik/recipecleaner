import browser from 'webextension-polyfill';

import sanitize from './sanitize';


// Mapping of tab id -> recipe (not persisted to storage)
const EPHEMERAL_TAB_MAP = {};


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
        console.group();
        console.log('detected recipe. original:', msg.data);

        const recipe = sanitize.recipe(sender.tab.url, msg.data);

        console.log('cleaned recipe:', recipe);
        console.groupEnd();

        EPHEMERAL_TAB_MAP[sender.tab.id] = recipe;

        // Some weird bug in chrome...
        if (typeof chrome !== 'undefined') {
            chrome.pageAction.setIcon({
                path: 'icons/icon-detected-32.png',
                tabId: sender.tab.id
            });
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
