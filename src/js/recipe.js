import browser from 'webextension-polyfill';

import { addClickHandlers} from './util.js';
import { renderRecipe, renderError } from './render_recipe.js';


// Mapping of selector => click handler
const CLICK_HANDLERS = {
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

browser.storage.local.get(recipeId).then(recipes => {
    const recipe = recipes[recipeId];
    const node = document.querySelector('#recipe');

    console.log('Recipe -> ', recipe);

    if (recipe) {
        document.title = `${recipe.name} :: RecipeCleaner`;
        node.innerHTML = renderRecipe(recipe);

        addClickHandlers(CLICK_HANDLERS);
    } else {
        node.innerHTML = renderError();
    }
});
