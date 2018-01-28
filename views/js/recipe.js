import { h, app } from 'hyperapp';

const actions = {};

function view(recipe) {
    return h('main', {}, [
        h('section', {}, viewMeta(recipe)),
        h('div', {className: 'grid'}, [
            h('section', {className: 'column'}, [
                h('h2', {}, 'Ingredients'),
                viewIngredients(recipe)
            ]),
            h('section', {className: 'column'}, [
                h('h2', {}, 'Instructions'),
                viewInstructions(recipe)
            ])
        ])
    ]);
}

function viewMeta(recipe) {
    let image = recipe.image ? h('img', {src: recipe.image}) : null;

    return h('header', {}, [
        h('h1', {}, recipe.name),
        h('section', {id: 'meta'}, [
            image,
            h('span', {id: 'description'}, [
                recipe.description,
            ]),
        ])
    ]);
}

function viewIngredients(recipe) {
    return h('ul', {}, recipe.ingredients.map(i => {
        return h('li', {}, i);
    }));
}

function viewInstructions(recipe) {
    if (recipe.instructionText) {
        return h('p', {}, recipe.instructionText);
    }

    if (recipe.instructionList) {
        return h('ol', {}, recipe.instructionList.map(i => {
            return h('li', {className: 'instruction'}, i);
        }));
    }

    return h('p', {}, 'This recipe didn\'t include any instructions :(');
}


browser.runtime.sendMessage({kind: 'request-recipe'})
    .then(resp => {
        if (resp.recipe) {
            console.log('Recipe -> ', resp.recipe);
            document.title = `${resp.recipe.name} :: Recipe Thing`;
            const main = app(resp.recipe, actions, view, document.body);
        } else {
            const main = app({}, {}, () => {
                return h('h1', {}, 'Sorry, I couldn\'t find that recipe');
            }, document.body);
        }
    });
