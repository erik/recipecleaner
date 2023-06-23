import extension from '/js/extension.js';

import { createNode, addClickHandlers } from '/js/util.js';
import { renderRecipe, renderError } from '/js/render_recipe.js';

// True if any search term is a substring of the given string
//
// Matching is not case sensitive.
function matchTerms(string, terms) {
  if (string) {
    const lcased = string.toLowerCase();
    for (const term of terms) {
      if (lcased.indexOf(term) != -1) {
	return true;
      }
    }
  }
  return false;
}

// True if any ingredient in the recipe matches any search term.
//
// Matching not case sensitive.
function matchIngredients(ingredients, terms) {
  for (const ingredient of ingredients) {
    if (matchTerms(ingredient.ingredient, terms)) {
      return true;
    }
  }
  return false;
}

// Returns true if the given list item matches the given filters.
//
// This is a case-insensitive comparison across any subset of name,
// description, or ingredients.
function matches(value, {name, description, ingredients, terms}) {
  if (terms) {
    let keywords = terms.split(' ').map(x => x.toLowerCase());
    return (
      (name && matchTerms(value.name, keywords)) ||
      (description && matchTerms(value.description, keywords)) ||
      (ingredients && value.ingredients && matchIngredients(value.ingredients, keywords))
    );
  } else {
    return true;
  }
}

// Extract and filter the recipes from local storage
function getRecipeList(storage, filters) {
  const ret = [];
  const selection = storage.selection || {};
  const skip = {filters: true, selection: true, options: true};

  // loop through all the keys in the local storage object
  for (const id of Object.keys(storage)) {
    // skip the special keys used for sidebar state
    if (!skip[id]) {
      const value = storage[id];
      // keep values matching the current search terms
      if (value.name && matches(value, filters)) {
	const selected = !!selection[id]
	ret.push({id, value, selected});
      }
    }
  }

  return ret;
}

// Get the state of the sidebar UI.
async function getState() {
  const storage = await browser.storage.local.get();
  const filters = storage.filters || {
    name: true,
    description: true,
    ingredients: true,
    terms: null
  };
  return {
    filters: filters,
    recipes: getRecipeList(storage, filters)
  };
}

// Render a single item in the recipe list
function renderRecipeListItem({id, value}) {
  const url = `/html/recipe.html?recipeId=${id}`;
  const image = createNode("img", {"src": value.image});
  const label = createNode("p", {href: ""}, createNode.text(value.name));

  // clicking the recipe image loads its cleaned page
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

// Render the recipe list
function renderRecipeList({recipes, filters}) {
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
      createNode.text(
	filters.terms
	  ? "No recipes match the given query"
	  : "There are no saved recipes"
      )
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

// Render the sidebar tool strip
function renderTools(recipes) {
  return createNode("form", {id: "tools"}, [
    renderExportButton(recipes),
    createNode("label", {"for": "import"}, createNode.text("Import...")),
    createNode("input", {id: "import", name: "import", type: "file", accept: ".json"})
  ]);
}

// Returns a callback which toggles the given filter setting
function toggleSearchOption(id, filters) {
  const checked = filters[id];
  return (e) => {
    e.preventDefault();
    const updated = {...filters, [id]: !checked};
    // work around a weird issue where the local storage change
    // notification doesn't fire if we call setLocal directly here.
    setTimeout(() => extension.storage.setLocal("filters", updated), 0);
  }
}

// Renders a checkbox that controls which recipes fields are searched.
//
// Returns a tuple of [checkbox, label]
function renderSearchOption(id, text, filters) {
  const checked = !!filters[id];
  const ret = createNode("input", {type: "checkbox", "name": id});
  const label = createNode("label", {"for": id}, createNode.text(text));
  const callback = toggleSearchOption(id, filters);

  // checkboxes look for presence of "checked", not the value.
  // only set this attribute when checked is true.
  if (checked) ret.setAttribute("checked", true);

  ret.addEventListener("click", callback);
  label.addEventListener("click", callback);
  return [ret, label]
}

// Render the recipe search bar and associated controls
function renderSearchBar(filters) {
  const searchOptions = createNode("div", {id: "searchOptions"}, [
    ...renderSearchOption("name",        "Name",        filters),
    ...renderSearchOption("description", "Description", filters),
    ...renderSearchOption("ingredients", "Ingredients", filters)
  ]);

  const searchFilter = createNode("input", {
    id: "searchFilter",
    type: "text",
    placeholder: "Enter search terms...",
    value: filters.terms || ""
  });

  searchFilter.addEventListener("change", (e) => {
    extension.storage.setLocal("filters", {...filters, terms: e.target.value});
  });

  setTimeout(() => searchFilter.focus(), 1);

  return createNode("form", {id: "searchbar"}, [
    searchFilter,
    searchOptions
  ]);
}

// Render the entire sidebar
function render(state) {
  return createNode("div", {id: "root"}, [
    renderTools(state.recipes),
    renderSearchBar(state.filters),
    renderRecipeList(state),
  ]);
}


// Initialize the sidebar
//
// This sidebar is MVC, using the local storage area as the model.
// All user interactions must round-trip through local storage.
//
// In modern parlance, this is doing redux, using
// browser.local.storage as the redux store.
(async function () {
  // always points to the current sidebar dom subtree
  let root = document.getElementById("root");

  // render the complete dom subtree from the current state
  async function update(recipes) {
    console.log("update");
    const rendered = render(await getState());
    root.replaceWith(rendered);
    root = rendered;
  }

  // update sidebar whenever local storage changes
  browser.storage.local.onChanged.addListener(update);

  // do the initial render when the sidebar loads
  update();
})();
