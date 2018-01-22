/* Detect whether recipe is present on page */

//import WAE from 'web-auto-extractor';

// JSON LD blocks
const JSON_LD_SEL = 'script[type="application/ld+json"]';

// Recipe microdata
const MICRODATA_SEL = '*[itemtype="http://schema.org/Recipe]';


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

    return [];
    /* FIXME: do this in background script, don't want to inject a big
    lib into every single page.

    const scraper = WAE();

    // Then fall back to microdata if available
    const nodes = Array.from(document.querySelectorAll(MICRODATA_SEL))
              .map(node => {
                  try {
                      const data = scraper.parse(node.innerHTML);

                      if (data.jsonld.Recipe) {
                          return data.jsonld.Recipe[0];
                      } else if (data.microdata.Recipe) {
                          return data.microdata.Recipe[0];
                      } else if (data.rdfa.Recipe) {
                          return data.rdfa.Recipe[0];
                      }
                  } catch (e) {
                      console.error('Failed to parse microdata:', e);
                  }

                  return null;
              })
              .filter(data => data !== null);

    return nodes;
     */
}


const microdata = detectRecipeMicrodata();
if (microdata.length > 0) {
    console.log('recipe-detected', microdata);

    browser.runtime.sendMessage({
        kind: 'recipe-detected',
        data: microdata
    });
}


browser.runtime.onMessage.addListener(msg => {
});
