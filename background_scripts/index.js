import WAE from 'web-auto-extractor';

const TAB_RECIPE_MAP = {};


browser.pageAction.onClicked.addListener((e) => {
    browser.tabs.executeScript({file: 'build/view_recipe.js'})
        .catch(e => {
            console.error('FAILED to inject script:', e);
        });
});

browser.tabs.onRemoved.addListener((tabId) => {
    delete TAB_RECIPE_MAP[tabId];
});

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log('sender.tab->', sender.tab);

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

        msg.data = [result];
        console.log('GOT RECIPE', result);
        // fall through here

    case 'recipe-detected':
        TAB_RECIPE_MAP[sender.tab.id] = msg.data[0];

        browser.pageAction.show(sender.tab.id);
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
