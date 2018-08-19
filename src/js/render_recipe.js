import { createNode as h } from './util';


export function renderRecipe (recipe) {
    // FIXME: this might need some work
    const original = JSON.stringify(recipe.original)
        .replace(/<\/script/g, '<\\/script');

    return h('div', {id: 'wrapper'}, [
        h('main', {}, [
            h('div', {className: 'grid'}, [
                renderLeftColumn(recipe),
                renderRightColumn(recipe)
            ])
        ]),

        h('script', {type: 'application/ld+json'}, original)
    ]);
}

// Image and ingredients
function renderLeftColumn (recipe) {
    return h('div', {id: 'left'}, [
        recipe.image && h('img', {src: recipe.image}, []),
        renderIngredients(recipe)
    ]);
}

function renderRightColumn (recipe) {
    return h('div', {id: 'right'}, [
        renderHeader(recipe),
        renderInstructions(recipe)
    ]);
}

function renderHeader (recipe) {
    // Save a bit of space by not including 'www.'
    const hostname = (new URL(recipe.url)).hostname.replace(/^www\./, '');

    const bylineParts = [
        recipe.author && `By ${ recipe.author }`,
        recipe.yield  && `Yields ${ recipe.yield }`,
        recipe.time   && recipe.time
    ].filter(e => e).map(str => h.span(str));

    bylineParts.push(h.span(['Via ', h('a', {href: recipe.url}, [hostname])]));

    let byline = [];
    bylineParts.forEach((e, i) => {
        byline.push(e);
        if (i !== bylineParts.length - 1) {
            byline.push(h.span(' | '));
        }
    });

    let description = h('div', {id: 'spacer'}, []);
    if (recipe.description) {
        // Since we're using a decorative quote, strip out leading
        // quotes from the description if they exist.
        const stripped = recipe.description.replace(/^"/, '');

        description = h('div', {id: 'description'}, [
            h('span', {id: 'quote'}, []),
            h.p(stripped)
        ]);
    }

    return h('header', {}, [
        h('h1', {}, recipe.name),
        h('div', {id: 'byline'}, byline),
        description
    ]);
}

function renderIngredients (recipe) {
    let ingredients = recipe.ingredients.map(i => {
        const quantity = i.quantity && h('b', {className: 'quantity'}, [
            i.quantity, ' ', i.unit || ''
        ]);

        return h('li', {className: 'ingredient'}, [
            quantity || '', ' ', i.ingredient
        ]);
    });

    return h('section', {id: 'ingredients'}, [
        h('ul', {}, ingredients)
    ]);
}

function renderInstructions (recipe) {
    let instructionElem;

    if (recipe.instructionText) {
        instructionElem = h.p(recipe.instructionText);
    } else if (recipe.instructionList) {
        instructionElem = h('ol', {}, recipe.instructionList.map(text =>
            h('li', {className: 'instruction'}, text)
        ));
    } else {
        instructionElem = h.div([
            h.p('Sorry, seems this recipe did not include any instructions.'),
            h.p('The recipe you tried to view was not properly formatted.')
        ]);
    }

    return h('section', {id: 'instructions'}, [instructionElem]);
}

export function renderError () {
    return h('div', {id: 'wrapper'}, [
        h('h1', {}, 'I could not find that recipe!'),
        h.p('Sorry about that, something went wrong.'),
        h.p('Please report a bug so that this issue can be fixed.')
    ]);
}
