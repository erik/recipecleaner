import extension from '/js/extension.js';
import { createNode } from '/js/util.js';

/*
 * The code in this file implements a bare-bones redux / MVC pattern.
 *
 * The browser local storage serves as the redux store / model.
 * All updates round-trip through the redux store.
 * All updates re-rendere the entire dom subtree.
 * No dom-diffing is done.
 *
 * While theoretically less efficient than a proper vdom, in practice
 * this works fine for the size of the datasets this plugin is
 * expected to handle.
 *
 * This code might be more easily understood if read from
 * bottom-to-top, as control flows "upwards" in this file, from the
 * module entry point at the very bottom.
*/


/*
 * This class handles all user input.
 *
 * We can pass a single `actions` instance down to each component
 * function, whose methods return appropriate event handlers that can
 * be bound via addEventListner.
 */
class Actions {
  constructor(state) {
    this.state = state;
    this.searchQueryCallback = null;
  }

  // private methods, don't call these.

  setLocal(property, value) {
    return browser.storage.local.set({[property]: value});
  }

  setSearchOption(option, value) {
    return this.setLocal("filters", {...this.state.filters, [option]: value});
  }

  // a kludges for interactive search

  onSearchQueryInput(callback) {
    this.searchQueryCallback = callback;
  }

  // these methods return event handler callback functions

  // Add the given recipe to the user selection
  selectRecipe(id) {
    const that = this;
    return (e) => {
      that.setLocal("selection", {
	...that.state.selection,
	[id]: !!e.target.checked
      });
    };
  }

  // Toggle the given search option to its opposite state.
  toggleSearchOption(id) {
    const that = this;
    return (e) => {
      e.preventDefault();
      // work around a weird issue where the local storage doesn't
      setTimeout(() => that.setSearchOption(id, !e.target.checked), 0);
    };
  }

  // Handle full update of search query, triggering MVC roundtrip.
  get commitSearchQuery() {
    const that = this;
    return (e) => that.setSearchOption("query", e.target.value);
  }

  // Handle interactive update of search query, refresh the recipe list only.
  get updateSearchQuery() {
    const that = this;
    return (e) => {
      that.searchQueryCallback && that.searchQueryCallback(e.target.value);
    }
  }

  // Save the selected recipes to a file.
  get saveRecipes() {
    const that = this;
    return () => {
      // XXX: only save selected items when selection is non empty
      const blob = new Blob([JSON.stringify(that.state.recipes, null, 2)]);
      const url = URL.createObjectURL(blob);
      browser.downloads.download({url, filename: "recipes.json", saveAs: true});
    };
  }
}

// Returns true if the search query is a substring of the given string.
//
// Matching is not case sensitive.
function matchQuery(string, query) {
  const lcased = string.toLowerCase();
  if (lcased.indexOf(query) != -1) {
    return true;
  }
  return false;
}

// Returns true if any ingredient in the recipe matches the query.
//
// Matching is not case sensitive.
function matchIngredients(ingredients, query) {
  if (ingredients) {
    for (const ingredient of ingredients) {
      if (matchQuery(ingredient.ingredient, query)) {
	return true;
      }
    }
  }
  return false;
}

// Returns true if the given list item matches the given filters.
//
// This is a case-insensitive comparison across any subset of name,
// description, or ingredients.
function matches(value, {name, description, ingredients, query}) {
  if (query) {
    return (
      (name        && matchQuery(value.name,              query)) ||
      (description && matchQuery(value.description,       query)) ||
      (ingredients && matchIngredients(value.ingredients, query))
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
      // keep values matching the current search query
      if (value.name && matches(value, filters)) {
	const selected = !!selection[id]
	ret.push({id, value, selected});
      }
    }
  }

  return ret;
}

// Get the state of the sidebar UI from local storage.
//
// This function assumes we are on the current version of the local
// storage schema.
async function getState() {
  const storage = await browser.storage.local.get();
  const filters = storage.filters || {
    name: true,
    description: true,
    ingredients: true,
    query: null
  };
  return {
    filters: filters,
    recipes: getRecipeList(storage, filters),
    selection: storage.selection || {}
  };
}

// Render a single item in the recipe list
const renderRecipeListItem = actions => ({id, value}) => {
  const url = `/html/recipe.html?recipeId=${id}`;
  const select = createNode("input", {"type": "checkbox"});
  const image = createNode("img", {"src": value.image});
  const name = createNode("h1", {}, createNode.text(value.name));
  const description = createNode.p(createNode.text(value.description));
  const label = createNode.div([name, description]);

  // changing the checkbox selects the given recipe
  select.addEventListener("change", actions.selectRecipe(id));

  // clicking the recipe image loads its cleaned page
  image.addEventListener("click", () => {
    extension.tabs.create(url);
  });

  return createNode("li", {id}, [select, image, label]);
};

// Render the recipe list
function renderRecipeList({recipes, filters}, actions) {
  let ret = null;

  function render(recipes) {
    if (recipes.length) {
      return createNode(
	"ul",
	{"id": "recipes"},
	recipes.map(renderRecipeListItem(actions))
      );
    } else {
      return createNode(
	"h1",
	{"id": "recipes"},
	createNode.text(
          filters.query
            ? "No recipes match the given query."
            : "There are no saved recipes."
	)
      );
    }
  }

  // register callback to refresh recipe list while the user is typing a search query.
  actions.onSearchQueryInput(async query => {
    console.log("got here");
    // XXX: refactor this into the state object
    const storage = await browser.storage.local.get();
    const recipes = getRecipeList(storage, {...filters, query});

    // trigger dom replacement
    const newDom = render(recipes);
    ret.replaceWith(newDom);
    ret = newDom;
  });

  return ret = render(recipes);
}

// Render the export button
function renderExportButton(recipes, actions) {
  const ret = createNode("button", {id: "export"}, createNode.text("Export..."));
  ret.addEventListener("click", actions.saveRecipes);
  return ret;
}

// Render the sidebar tool strip
function renderTools(recipes, actions) {
  return createNode("form", {id: "tools"}, [
    renderExportButton(recipes, actions),
    createNode("label", {"for": "import"}, createNode.text("Import...")),
    createNode("input", {id: "import", name: "import", type: "file", accept: ".json"})
  ]);
}

// Renders a checkbox that controls which recipes fields are searched.
//
// Returns a tuple of [checkbox, label]
function renderSearchOption(id, text, filters, actions) {
  const checked = !!filters[id];
  const ret = createNode("input", {type: "checkbox", "name": id});
  const label = createNode("label", {"for": id}, createNode.text(text));
  const callback = actions.toggleSearchOption(id);

  // checkboxes look for presence of "checked", not the value.
  // only set this attribute when checked is true.
  if (checked) ret.setAttribute("checked", true);

  ret.addEventListener("click", callback);
  label.addEventListener("click", callback);
  return [ret, label]
}

// Render the recipe search bar and associated controls
function renderSearchBar(filters, actions) {
  // create the toggles for searching in the different recipe fields.
  const searchOptions = createNode("div", {id: "searchOptions"}, [
    ...renderSearchOption("name",        "Name",        filters, actions),
    ...renderSearchOption("description", "Description", filters, actions),
    ...renderSearchOption("ingredients", "Ingredients", filters, actions)
  ]);

  // create the query string input field
  const searchFilter = createNode("input", {
    id: "searchFilter",
    type: "text",
    placeholder: "Enter search query...",
    value: filters.query || ""
  });

  // update state when search query changes
  searchFilter.addEventListener("change", actions.commitSearchQuery);
  searchFilter.addEventListener("input", actions.updateSearchQuery);

  // Hack: ensure that the filter input box is focused. the timeout is
  // required so that it will fire after the dom node is attached.
  // this is a consequence of replacing the entire dom subtree on each
  // update.
  setTimeout(() => searchFilter.focus(), 0);

  return createNode("form", {id: "searchbar"}, [
    searchFilter,
    searchOptions
  ]);
}

// Render the sidebar from the given state and actions
function render(state, actions) {
  return createNode("div", {id: "root"}, [
    renderTools(state.recipes, actions),
    renderSearchBar(state.filters, actions),
    renderRecipeList(state, actions),
  ]);
}

// Initialize the sidebar
//
// This sidebar is MVC, using the local storage area as the model.
// All user interactions must round-trip through local storage.
//
// In modern parlance, this is doing redux, using
// browser.local.storage as the redux store.
//
// XXX: should really migrate the local storage schema on load or on
// install. In particular, nest recipes under their own field,
// rather than store them as top-level keys.
(async function () {
  // always points to the current sidebar dom subtree
  let root = document.getElementById("root");

  // render the complete dom subtree from the current state
  async function update() {
    const state = await getState();
    const actions = new Actions(state);
    const rendered = render(state, actions);
    console.log("update", state);
    root.replaceWith(rendered);
    root = rendered;
  }

  // update sidebar whenever local storage changes
  browser.storage.local.onChanged.addListener(update);

  // do the initial render when the sidebar loads
  update();
})();
