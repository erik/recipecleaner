import { h, app } from 'hyperapp';

const actions = {};

function view(recipe) {
    return (
        <div id="wrapper">
          { viewHeader(recipe) }

          <main>
            <div className="grid">
              <section id="ingredients">
                <h2>Ingredients</h2>
                { viewIngredients(recipe) }
              </section>

              <section id="instructions">
                <h2>Instructions</h2>
                { viewInstructions(recipe) }
              </section>
            </div>
          </main>
        </div>
    );
}

function viewHeader(recipe) {
    let image = recipe.image ? <img src={recipe.image} /> : null;

    let author = recipe.author ? <small> by { recipe.author } </small> : null;

    return (
        <header>
          <h1>{ recipe.name } { author }</h1>
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
        <ul> { ingredients } </ul>
    );
}

function viewInstructions(recipe) {
    if (recipe.instructionText) {
        return <p> { recipe.instructionText } </p>;
    }

    if (recipe.instructionList) {
        let instructions = recipe.instructionList.map(i => (
            <li className="instruction"> { i } </li>
        ));

        return (
            <ol> { instructions } </ol>
        );
    }

    return (
        <p>
          This recipe did not include any instructions :(
        </p>
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
