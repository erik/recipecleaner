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
          This recipe didn't include any instructions :(
        </p>
    );
}


browser.runtime.sendMessage({kind: 'request-recipe'})
    .then(resp => {
        if (resp.recipe) {
            console.log('Recipe -> ', resp.recipe);
            document.title = `${resp.recipe.name} :: Recipe Thing`;
            const main = app(resp.recipe, actions, view, document.body);
        } else {
            const main = app({}, {}, () => (<h1>Sorry, I couldn't find that recipe</h1>),
    document.body);
        }
    });
