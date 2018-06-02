import browser from 'webextension-polyfill';

import { addClickHandlers } from './util';


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


function renderRecipe (recipe) {
    return `
        <div id="wrapper">
            <main>
                <div class="grid">
                    ${ renderLeftColumn(recipe) }
                    ${ renderRightColumn(recipe) }
                </div>
            </main>

            <script type="application/ld+json">
                ${ JSON.stringify(recipe.original) }
            </script>
        </div>`;
}

// Image and ingredients
function renderLeftColumn (recipe) {
    const image = recipe.image && `<img src="${recipe.image}" />`;

    return `
        <div id="left">
            ${ image || '' }
            ${ renderIngredients(recipe) }
        </div>
    `;
}

function renderRightColumn (recipe) {
    return `
        <div id="right">
            ${ renderHeader(recipe) }
            ${ renderInstructions(recipe) }
        </div>
    `;
}

function renderHeader (recipe) {
    // Save a bit of space by not including 'www.'
    const hostname = (new URL(recipe.url)).hostname.replace(/^www\./, '');

    const bylineParts = [
        recipe.author && `<span> By ${ recipe.author } </span>`,
        recipe.yield && `<span> Yields ${ recipe.yield } </span>`,
        recipe.time && `<span> ${ recipe.time } </span>`,
        `<span>Via <a href="${ recipe.url }">${ hostname }</a></span>`
    ].filter(e => e);

    let byline = [];
    bylineParts.forEach((e, i) => {
        byline.push(e);
        if (i !== bylineParts.length - 1) {
            byline.push('<span> | </span>');
        }
    });

    let description = '<div id="spacer" />';
    if (recipe.description) {
        // Since we're using a decorative quote, strip out leading
        // quotes from the description if they exist.
        const stripped = recipe.description.replace(/^"/, '');

        description = `
            <div id="description">
                <span id="quote"></span>
                <p> ${ stripped } </p>
            </div>
        `;
    }

    return `
        <header>
            <h1>${ recipe.name }</h1>
            <div id="byline"> ${ byline.join('\n') }</div>

            ${ description }
        </header>
    `;
}

function renderIngredients (recipe) {
    let ingredients = recipe.ingredients.map(i => {
        let quantity = i.quantity &&
            `<b class="quantity">${ i.quantity } ${ i.unit || '' }</b>`;

        return `<li class="ingredient">${ quantity || '' } ${ i.ingredient }</li>`;
    }).join('\n');

    return `
        <section id="ingredients">
            <ul> ${ ingredients } </ul>
        </section>
    `;
}

function renderInstructions (recipe) {
    let instructionElem;

    if (recipe.instructionText) {
        instructionElem = `<p> ${ recipe.instructionText } </p>`;
    } else if (recipe.instructionList) {
        let instructions = recipe.instructionList.map(text => `
            <li class="instruction"> ${ text } </li>
        `).join('\n');

        instructionElem = `<ol> ${ instructions } </ol>`;
    } else {
        instructionElem = `
            <div>
                <p> Sorry, seems this recipe did not include any instructions. </p>
                <p> The recipe you tried to view was not properly formatted. </p>
            </div>
        `;
    }

    return `<section id="instructions">${ instructionElem }</section>`;
}

function renderError () {
    return `
        <div id="wrapper">
            <h1>I could not find that recipe!</h1>

            <p>
              Sorry about that, something went wrong.
            </p>

            <p>
              Please report a bug so that this issue can be fixed.
            </p>
        </div>
    `;
}


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
