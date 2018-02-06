import { h, app } from 'hyperapp';
import browser from 'webextension-polyfill';

const actions = {};

function view(recipe) {
    return (
        <div id="wrapper">
            { viewHeader(recipe) }

            <main>
                <div className="grid">
                    { viewIngredients(recipe) }
                    { viewInstructions(recipe) }
                </div>
            </main>
        </div>
    );
}

function viewHeader(recipe) {
    const image = recipe.image ? <img src={recipe.image} /> : null;
    const hostname = (new URL(recipe.url)).hostname;

    const bylineParts = [
        recipe.author && (<span> By { recipe.author } </span>),
        recipe.yield && (<span> Yields { recipe.yield } </span>),
        recipe.time && (<span> { recipe.time } </span>),
        <span>Via <a href={ recipe.url }>{ hostname }</a></span>
    ].filter(e => e);

    let byline = [];
    bylineParts.forEach((e, i) => {
        byline.push(e);
        if (i !== bylineParts.length - 1) {
            byline.push(<span> | </span>);
        }
    });

    return (
        <header>
            <h1>{ recipe.name }</h1>
            <div id="byline"> { byline }</div>

            <section id="meta">
                { image }
                <p id="description">
                    { recipe.description }
                </p>
            </section>
        </header>
    );
}

function viewIngredients(recipe) {
    let ingredients = recipe.ingredients.map(i => {
        let quantity = i.quantity ?
            <b className="quantity">{ i.quantity } { i.unit || '' }</b>
            : null;

        return <li> { quantity } { i.ingredient } </li>;
    });

    return (
        <section id="ingredients">
            <h2>Ingredients</h2>
            <ul> { ingredients } </ul>
        </section>
    );
}

function viewInstructions(recipe) {
    let instructionElem;

    if (recipe.instructionText) {
        instructionElem = <p> { recipe.instructionText } </p>;
    } else if (recipe.instructionList) {
        let instructions = recipe.instructionList.map(i => (
            <li className="instruction"> { i } </li>
        ));

        instructionElem = <ol> { instructions } </ol>;
    } else {
        instructionElem = (
            <div>
                <p> Sorry, seems this recipe did not include any instructions. </p>
                <p> The recipe you tried to view was not properly formatted. </p>
            </div>
        );
    }

    return (
        <section id="instructions">
            <h2>Instructions</h2>
            { instructionElem }
        </section>
    );
}

const params = new URLSearchParams(window.location.search);
const recipeId = decodeURI(params.get('recipeId') || 'no id');

browser.storage.local.get(recipeId).then(recipes => {
    const recipe = recipes[recipeId];

    if (recipe !== null) {
        console.log('Recipe -> ', recipe);
        document.title = `${recipe.name} :: Recipe Thing`;
        app(recipe, actions, view, document.body);
    } else {
        app({}, {}, () => (<h1>Sorry, I could not find that recipe!</h1>), document.body);
    }
});
