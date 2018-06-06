/* Detect whether recipe is present on page */

import extension from './extension.js';
import microdata from './microdata.js';

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

        for (const data of json) {
            // Right now, only take the first recipe we see.
            if (data['@type'] === 'Recipe') {
                console.log('recipe-detected', data);

                extension.runtime.sendMessage({kind: 'recipe-detected', data});
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

            extension.runtime.sendMessage({
                kind: 'recipe-detected',
                data: extracted
            });

            return;
        }
    }
})();
