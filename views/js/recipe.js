import { h, app } from 'hyperapp';

const actions = {};

function view(recipe) {
    return (
        <main>
          <section>
            { viewMeta(recipe) }
          </section>

          <div className="grid">
            <section className="column">
              <h2>Ingredients</h2>
              { viewIngredients(recipe) }
            </section>

            <section className="column">
              <h2>Instructions</h2>
              { viewInstructions(recipe) }
            </section>
          </div>
        </main>
    );
}

function viewMeta(recipe) {
    let image = recipe.image ? <img src={recipe.image} /> : null;

    return (
        <header>
          <h1>{ recipe.name }</h1>
          <section id="meta">
            { image }
            <span id="description"> { recipe.description } </span>
          </section>
        </header>
    );
}

function viewIngredients(recipe) {
    let ingredients = recipe.ingredients.map(i => <li> { i } </li>);

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
