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

// Render a single item in the recipe list
function renderRecipeListItem({id, value}) {
  const url = `/html/recipe.html?recipeId=${id}`;
  const image = createNode("img", {"src": value.image});
  const label = createNode("p", {href: ""}, createNode.text(value.name));

  image.addEventListener("click", () => {
    extension.tabs.create(url);
  });

  return createNode(
    "li",
    {id},
    [
      createNode("input", {"type": "checkbox"}),
      image,
      label,
      createNode("p", createNode.text(value.description))
    ]
  );
}

// Render the recipe list DOM
function renderRecipeList(recipes) {
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

// Render the export button
function renderExportButton(recipes) {
  const ret = createNode("button", {id: "export"}, createNode.text("Export..."));
  
  function save() {
    const blob = new Blob([JSON.stringify(recipes, null, 2)]);
    const url = URL.createObjectURL(blob);
    browser.downloads.download({url, filename: "recipes.json", saveAs: true});
  }

  ret.addEventListener("click", save);
  return ret;
}

function renderTools(recipes) {
  return createNode("form", {id: "tools"}, [
    renderExportButton(recipes),
    createNode("label", {"for": "import"}, createNode.text("Import...")),
    createNode("input", {id: "import", name: "import", type: "file", accept: ".json"})
  ]);
}

function renderSearchBar(recipes) {
  const searchOptions = createNode("div", {id: "searchOptions"}, [
    createNode("input", {"id": "name", "type": "checkbox", "checked": true}),
    createNode("label", {"for": "name"}, createNode.text("Name")),
    createNode("input", {"id": "description", "type": "checkbox", "checked": true}),
    createNode("label", {"for": "description"}, createNode.text("Description")),
    createNode("input", {"id": "ingredient", "type": "checkbox", "checked": true}),
    createNode("label", {"for": "ingredient"}, createNode.text("Ingredient"))
  ]);

  const searchFilter = createNode(
    "input",
    {id: "searchFilter", type: "text", placeholder: "Enter search terms..."}
  );
  
  return createNode("form", {id: "searchbar"}, [
    searchFilter,
    searchOptions
  ])
}

// Render the entire sidebar
function render(recipes) {
  return createNode("div", {id: "root"}, [
    renderTools(recipes),
    renderSearchBar(recipes),
    renderRecipeList(recipes),
  ]);
}

(async function () {
  let root = document.getElementById("root");

  async function update(recipes) {
    const rendered = render(await getRecipeList());
    root.replaceWith(rendered);
    root = rendered;
  }

  browser.storage.local.onChanged.addListener(update);
  update();
})();
