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
 * An `actions` instance is passed to each render function, along with
 * state.
 */
class Actions {
  constructor(state) {
    this.state = state;
    this.searchQueryCallback = null;
  }

  /* private methods */

  setLocal(property, value) {
    return browser.storage.local.set({[property]: value});
  }

  setSearchOption(option, value) {
    return this.setLocal("filters", {...this.state.filters, [option]: value});
  }

  /* callbacks */

  // kludge for interactive search filter updates
  onSearchQueryInput(callback) {
    this.searchQueryCallback = callback;
  }

  /* these methods return event handler callback functions */

  // Add the given recipe to the user selection
  selectRecipe(id) {
    const that = this;
    return (e) => {
      e.preventDefault();
      that.setLocal("selection", {
	...that.state.selection,
	[id]: !that.state.selection[id]
      });
    };
  }

  downloadData(data, filename, saveAs) {
    return async () => {
      const blob = new Blob([JSON.stringify(data, null, 2)]);
      const url = URL.createObjectURL(blob);
      await browser.downloads.download({url, filename, saveAs});
    }
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

  // Get the currently-selected recipes for export
  get selectedRecipes() {
    const storage = this.state.storage;
    return Object
      .keys(this.state.selection)
      .filter(id => !!this.state.selection[id])
      .map(id => storage[id]);
  }

  // Export entire local storage contents to JSON.
  get exportDatabase() {
    return this.downloadData(this.state.storage, "recipe_db.json");
  }

  // Export selected recipes to JSON.
  get saveSelectedRecipes() {
    return this.downloadData(this.selectedRecipes, "selected_recipes.json");
  }

  // Clear the current selection set
  get clearSelection() {
    return async () => {
      await browser.storage.local.set({selection: {}});
    };
  }

  // Delete the currently-selected objects
  get deleteSelected() {
    const that = this;
    return async () => {
      const selected = Object.keys(that.state.selection);
      if (window.confirm(`Delete ${selected.length} recipes?`)) {
	await browser.storage.local.remove(selected);
	await that.clearSelection();
      }
    };
  }
}

// Find the portion of the string which matches the given query.
//
// Matching is not case sensitive.
//
// If the query string matches, returns an object describing the
// match. Returns null otherwise.
function matchQuery(string, query) {
  const lcased = string.toLowerCase();
  const index = lcased.indexOf(query);
  if (index != -1) {
    const matchEnd = index + query.length;
    const head = string.substr(0, index);
    const match = string.substr(index, query.length);
    const tail = string.substr(matchEnd);
    return {head, match, tail};
  }
  return null;
}

// Returns true if any ingredient in the recipe matches the query.
function matchIngredients(ingredients, query) {
  if (ingredients) {
    for (const ingredient of ingredients) {
      const match = matchQuery(ingredient.ingredient, query);
      if (match) {
	return {
	  head: `${ingredient.quantity} ${ingredient.unit} ${match.head}`,
	  match: match.match,
	  tail: match.tail
	};
      }
    }
  }
  return null;
}

// Returns true if the given list item matches the given filters.
//
// This is a case-insensitive comparison across any subset of name,
// description, or ingredients.
function matches(value, {name, description, ingredients, query}) {
  const normalized = query.trim().toLowerCase();
  const ret = (
    (name        && matchQuery(value.name,              normalized)) ||
    (description && matchQuery(value.description,       normalized)) ||
    (ingredients && matchIngredients(value.ingredients, normalized))
  );
  return ret;
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
      const selected = !!selection[id]
      if (filters.query) {
	const match = matches(value, filters);
	if (value.name && match) {
	  ret.push({id, value, selected, match});
	}
      } else {
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
    storage: storage,
    filters: filters,
    recipes: getRecipeList(storage, filters),
    selection: storage.selection || {}
  };
}

// render the recipe's label
function renderRecipeDetails({value, match}) {
  if (match) {
    return createNode.p([
      createNode.text(match.head),
      createNode("b", {}, createNode.text(match.match)),
      createNode.text(match.tail)
    ]);
  } else {
    return createNode.p(createNode.text(value.description));
  }
}

// Render a single item in the recipe list
const renderRecipeListItem = actions => ({id, value, selected, match}) => {
  const url = `/html/recipe.html?recipeId=${id}`;
  const select = createNode("input", {"type": "checkbox"});
  const image = createNode("img", {"src": value.image});
  const name = createNode("h1", {}, createNode.text(value.name));
  const label = createNode.div([name, renderRecipeDetails({value,match})]);

  if (selected) select.setAttribute("checked", true);
  select.addEventListener("change", actions.selectRecipe(id));

  // clicking the recipe image loads its cleaned page
  image.addEventListener("click", () => {
    extension.tabs.create(url);
  });

  return createNode("li", {id}, [select, image, label]);
};

// Render the recipe list
function renderRecipeList({storage, recipes, filters}, actions) {
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
    const recipes = getRecipeList(storage, {...filters, query});
    const newDom = render(recipes);
    ret.replaceWith(newDom);
    ret = newDom;
  });

  return ret = render(recipes);
}

// Render the export button
function renderExportButton(recipes, actions) {
  const ret = createNode("button", {id: "export"}, createNode.text("Export..."));
  ret.addEventListener("click", actions.exportDatabase);
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

// Render component which provides feedback about the selection
function renderSelectionWidget(state, actions) {
  const selected = actions.selectedRecipes;
  if (selected.length) {
    const label = createNode.text(`Selected: ${selected.length}`);
    const save = createNode(
      "button",
      {id: "saveSelection"},
      createNode.text("Save...")
    );
    const deselect = createNode(
      "button",
      {id: "clearSelection"},
      createNode.text("\u2716")
    );
    const del = createNode(
      "button",
      {id: "deleteSelection"},
      createNode.text("Delete")
    );
    save.addEventListener("click", actions.saveSelectedRecipes);
    deselect.addEventListener("click", actions.clearSelection);
    del.addEventListener("click", actions.deleteSelected);
    return createNode("form", {id: "selection"}, [label, save, del, deselect]);
  } else {
    return null;
  }
}

// Render the sidebar from the given state and actions
function render(state, actions) {
  return createNode("div", {id: "root"}, [
    renderTools(state.recipes, actions),
    renderSearchBar(state.filters, actions),
    renderRecipeList(state, actions),
    renderSelectionWidget(state, actions)
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
