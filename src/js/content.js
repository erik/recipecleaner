/* Detect whether recipe is present on page */

import browser from 'webextension-polyfill';
import microdata from './microdata';

// JSON LD blocks
const JSON_LD_SEL = 'script[type="application/ld+json"]';

// Recipe microdata
const MICRODATA_SEL = '*[itemtype$="/Recipe"]';


(function detectRecipeMicrodata () {
    // First try to pull JSON LD format, because it's cleaner / faster
    for (const node of document.querySelectorAll(JSON_LD_SEL)) {
        let json;

        try {
            json = JSON.parse(node.innerText);
        } catch (e) {
            console.error('Failed to parse JSON: ', e);
            continue;
        }

        // Generally, it's not a list, but since it can be, normalize to that.
        if (!Array.isArray(json)) {
            json = [json];
        }

        for (const microdata of json) {
            // Right now, only take the first recipe we see.
            if (microdata['@type'] === 'Recipe') {
                console.log('recipe-detected', microdata);

                browser.runtime.sendMessage({
                    kind: 'recipe-detected',
                    data: microdata
                });

                return;
            }
        }
    }

    // Then fall back to microdata if available
    for (const node of document.querySelectorAll(MICRODATA_SEL)) {
        console.log('HTML trying recipe!', node);

        const extracted = microdata.extractRecipe(node);
        if (extracted !== null) {
            console.log('extracted recipe ->', extracted);

            browser.runtime.sendMessage({
                kind: 'recipe-detected',
                data: extracted
            });

            return;
        }
    }
})();
