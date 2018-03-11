import { h, app } from 'hyperapp'; // eslint-disable-line no-unused-vars
import browser from 'webextension-polyfill';

const actions = {};

// Callback for ingredient onclick events.
function toggleStrikethrough () {
    this.classList.toggle('strikethrough');
}

// Callback from instruction onclick events.
function toggleHighlight () {
    // If it's currently highlighted, just disable it
    if (this.classList.contains('highlight')) {
        this.classList.remove('highlight');
    } else {
        // otherwise remove the attribute from anything else that had it.
        for (const i of document.querySelectorAll('.instruction')) {
            if (i === this) {
                i.classList.add('highlight');
            } else {
                i.classList.remove('highlight');
            }
        }
    }
}

function view (recipe) {
    return (
        <div id="wrapper">
            <main>
                <div className="grid">
                    { viewLeftColumn(recipe) }
                    { viewRightColumn(recipe) }
                </div>
            </main>

            <script type="application/ld+json">
                { JSON.stringify(recipe.original) }
            </script>
        </div>
    );
}

// Image and ingredients
function viewLeftColumn (recipe) {
    const image = recipe.image ? <img src={recipe.image} /> : null;

    return (
        <div id="left">
            { image }
            { viewIngredients(recipe) }
        </div>
    );
}

function viewRightColumn (recipe) {
    return (
        <div id="right">
            { viewHeader(recipe) }
            { viewInstructions(recipe) }
        </div>
    );
}

function viewHeader (recipe) {
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

    let description = <div id="spacer" />;
    if (recipe.description) {
        // Since we're using a decorative quote, strip out leading
        // quotes from the description if they exist.
        const stripped = recipe.description.replace(/^"/, '');

        description = (
            <div id="description">
                <span id="quote"></span>
                <p> { stripped } </p>
            </div>
        );
    }

    return (
        <header>
            <h1>{ recipe.name }</h1>
            <div id="byline"> { byline }</div>

            { description }
        </header>
    );
}

function viewIngredients (recipe) {
    let ingredients = recipe.ingredients.map(i => {
        let quantity = i.quantity ?
            <b className="quantity">{ i.quantity } { i.unit || '' }</b>
            : null;

        return (
            <li className="ingredient"
                onclick={toggleStrikethrough}>
                { quantity } { i.ingredient }
            </li>
        );
    });

    return (
        <section id="ingredients">
            <ul> { ingredients } </ul>
        </section>
    );
}

function viewInstructions (recipe) {
    let instructionElem;

    if (recipe.instructionText) {
        instructionElem = <p> { recipe.instructionText } </p>;
    } else if (recipe.instructionList) {
        let instructions = recipe.instructionList.map(i => (
            <li className="instruction"
                onclick={toggleHighlight}>
                { i }
            </li>
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
            { instructionElem }
        </section>
    );
}

function viewError () {
    return (
        <div id="wrapper">
            <h1>I could not find that recipe!</h1>

            <p>
              Sorry about that, something went wrong.
            </p>

            <p>
              Please report a bug so that this issue can be fixed.
            </p>
        </div>
    );
}

const params = new URLSearchParams(window.location.search);
const recipeId = decodeURI(params.get('recipeId') || 'no id');

browser.storage.local.get(recipeId).then(recipes => {
    const recipe = recipes[recipeId];
    const node = document.querySelector('#hyperapp');

    console.log('Recipe -> ', recipe);

    if (recipe) {
        document.title = `${recipe.name} :: RecipeThing`;
        app(recipe, actions, view, node);
    } else {
        app({}, {}, viewError, node);
    }
});
