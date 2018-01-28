/* Detect whether recipe is present on page */

// JSON LD blocks
const JSON_LD_SEL = 'script[type="application/ld+json"]';

// Recipe microdata
const MICRODATA_SEL = '*[itemtype$="/Recipe"]';


function detectRecipeMicrodata() {
    // First try to pull JSON LD format, because it's cleaner / faster
    const jsonNodes = Array.from(document.querySelectorAll(JSON_LD_SEL))
              .map(node => {
                  try {
                      return JSON.parse(node.innerText);
                  } catch (e) {
                      console.error('Failed to parse json: ', e);
                      return {};
                  }
              })
              .filter(json => json['@type'] === 'Recipe');

    if (jsonNodes.length > 0) {
        return jsonNodes;
    }

    // Then fall back to microdata if available
    Array.from(document.querySelectorAll(MICRODATA_SEL))
        .forEach(node => {
            console.log('trying recipe!', node);

            browser.runtime.sendMessage({
                kind: 'try-extract-recipe',
                data: node.outerHTML,
            });
        });

    return [];
}


const microdata = detectRecipeMicrodata();
if (microdata.length > 0) {
    console.log('recipe-detected', microdata);

    browser.runtime.sendMessage({
        kind: 'recipe-detected',
        data: microdata
    });
}
