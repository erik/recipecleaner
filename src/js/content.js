/* Detect whether recipe is present on page */
async function load (url) {
  return await import(browser.runtime.getURL(url));
}

(async () => {
  const extension  = await load('/js/extension.js');
  const microdata  = await load('/js/microdata.js');
  const linkedData = await load('/js/linked_data.js');

  function recipeDetected (data) {
    console.log('recipe detected:', data);

    extension.runtime.sendMessage({
      kind: 'recipe-detected',
      data
    });

    return true;
  }

  function detectRecipeJSON () {
    // JSON LD blocks
    const JSON_LD_SEL = 'script[type="application/ld+json"]';

    for (const node of document.querySelectorAll(JSON_LD_SEL)) {
      const extracted = linkedData.extractRecipe(node);
      if (extracted) {
        return recipeDetected(extracted);
      }
    }

    return false;
  }

  function detectRecipeMicrodata () {
    // Recipe microdata
    const MICRODATA_SEL = '*[itemtype$="/Recipe"]';
    for (const node of document.querySelectorAll(MICRODATA_SEL)) {
      const extracted = microdata.extractRecipe(node);
      if (extracted) {
        return recipeDetected(extracted);
      }
    }

    return false;
  }

  // First try to pull JSON LD format, because it's cleaner / faster,
  // then fall back to microdata if available
  detectRecipeJSON() || detectRecipeMicrodata();
})();
