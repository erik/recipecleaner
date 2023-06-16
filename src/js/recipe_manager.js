import extension from '/js/extension.js';

import { createNode, addClickHandlers } from '/js/util.js';
import { renderRecipe, renderError } from '/js/render_recipe.js';

// Get the list of recipes in the database.
async function getRecipeList() {
  const ret = [];
  const storage = await browser.storage.local.get();
  for (const id of Object.keys(storage)) {
    const value = storage[id];
    if (value.name) {
      ret.push({id, value});
    }
  }
  return ret;
}

function renderRecipeListItem({key, value}) {
  return createNode(
    "li",
    {"id": key},
    createNode.text(value.name)
  );
}

// Render the recipe list DOM
async function renderRecipeList(recipes) {
  if (recipes.length) {
    return createNode(
      "ul",
      {"id": "recipes"},
      recipes.map(renderRecipeListItem)
    );
  } else {
    return createNode(
      "h1",
      {"id": "recipes"},
      createNode.text("There are no saved recipes")
    );
  }
}

(async function () {
  // Initial Render
  let recipes = await renderRecipeList(await getRecipeList());
  document.body.appendChild(recipes);

  // Handle updates to DB by re-rendering recipe list
  browser.storage.local.onChanged.addListener(async () => {
    const updated = await renderRecipeList(await getRecipeList());
    recipes.replaceWith(updated);
    recipes = updated;
  });
})();
