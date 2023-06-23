import extension from '/js/extension.js';
import { addClickHandlers } from '/js/util.js';
import { renderRecipe, renderError } from '/js/render_recipe.js';

// Capture the recipe in the given format.
function getSaveData(format) {
  switch (format) {
    case "HTML": return document.documentElement.outerHTML;
    case "JSON": return JSON.stringify(gRecipe, null, 2);
    case "Text": return document.documentElement.outerText;
  }
  throw new Error(`Invalid format: ${format}`);
}

// Handle user clicking the save button.
function onSaveClicked() {
  // create a data URL with the page content.
  const format = document.getElementById("format").value;
  const blob = new Blob([getSaveData(format)]);
  const url = URL.createObjectURL(blob);
  browser.downloads.download({
    url,
    filename: `${gRecipe.name}.${format.toLowerCase()}`,
    saveAs: true
  });
}

// Mapping of selector => click handler
const CLICK_HANDLERS = {
  '#save': onSaveClicked,
  '#recipe-image': (e) => {
    e.currentTarget.classList.toggle('lightbox');
    e.stopPropagation();
  },
  '#recipe .ingredient': (e) => {
    e.target.classList.toggle('strikethrough');
  },
  '#recipe .instruction': (e) => {
    const elem = e.target;

    // If it's currently highlighted, just disable it
    if (elem.classList.contains('highlight')) {
      elem.classList.remove('highlight');
    } else {
      // otherwise remove the attribute from anything else that had it.
      for (const i of document.querySelectorAll('.instruction')) {
        if (i === elem) {
          i.classList.add('highlight');
        } else {
          i.classList.remove('highlight');
        }
      }
    }
  }
};


const params = new URLSearchParams(window.location.search);
const recipeId = decodeURI(params.get('recipeId') || 'no id');
let gRecipe = null;

extension.storage.getLocal(recipeId).then(recipe => {
  const node = document.querySelector('#recipe');
  console.log('Recipe -> ', recipe);
  if (recipe) {
    // cache recipe in a global so it can be saved later
    gRecipe = recipe;
    document.title = `${recipe.name} :: RecipeCleaner`;
    node.appendChild(renderRecipe(recipe));
    addClickHandlers(CLICK_HANDLERS);
  } else {
    node.appendChild(renderError());
  }
});
