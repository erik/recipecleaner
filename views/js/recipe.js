import { h, app } from 'hyperapp';

const actions = {};

function view(recipe) {
    return h('main', {}, [
        h('section', {}, viewMeta(recipe)),
        h('section', {}, viewIngredients(recipe)),
        h('section', {}, viewInstructions(recipe))
    ]);
}

function viewMeta(recipe) {
    return h('header', {}, [
        h('h1', {}, recipe.name),
        h('span', {}, recipe.description)
    ]);
}

function viewIngredients(recipe) {
    const ingredients = (recipe.recipeIngredient || recipe.ingredients);
    return h('ul', {}, ingredients.map(i => {
        return h('li', {}, i);
    }));
}

function viewInstructions(recipe) {
    if (typeof recipe.recipeInstructions === 'string') {
        return h('p', {}, recipe.recipeInstructions);
    }

    return h('ol', {}, (recipe.recipeInstructions || []).map(i => {
        return h('li', {className: 'instructions'}, i);
    }));
}


browser.runtime.sendMessage({kind: 'request-recipe'})
    .then(recipe => {
        console.log('Recipe -> ', recipe);
        const main = app(recipe, actions, view, document.body);
    });
