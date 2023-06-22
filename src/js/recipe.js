import extension from '/js/extension.js';
import { addClickHandlers } from '/js/util.js';
import { renderRecipe, renderError } from '/js/render_recipe.js';

// Capture the page's HTML.
//
// Save page as is broken here, since it saves the page source, but
// not the dynamic content.
async function onSaveClicked() {
  // create a data URL with the page content.
  const blob = new Blob([document.documentElement.outerHTML]);
  const url = URL.createObjectURL(blob);
  browser.downloads.download({url, saveAs: true});
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

extension.storage.getLocal(recipeId).then(recipe => {
  const node = document.querySelector('#recipe');

  console.log('Recipe -> ', recipe);

  if (recipe) {
    document.title = `${recipe.name} :: RecipeCleaner`;
    node.appendChild(renderRecipe(recipe));

    addClickHandlers(CLICK_HANDLERS);
  } else {
    node.appendChild(renderError());
  }
});
