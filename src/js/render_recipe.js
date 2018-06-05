import { html, escapeHTML } from './util';


export function renderRecipe (recipe) {
    // FIXME: this might need some work
    const original = JSON.stringify(recipe.original)
        .replace(/<\/script/g, '<\\/script');

    return `
        <div id="wrapper">
            <main>
                <div class="grid">
                    ${ renderLeftColumn(recipe) }
                    ${ renderRightColumn(recipe) }
                </div>
            </main>

            <script type="application/ld+json">
                ${ original }
            </script>
        </div>`;
}

// Image and ingredients
function renderLeftColumn (recipe) {
    const image = recipe.image && html`<img src="${recipe.image}" />`;

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
    // SAFE: don't need to escape URL here because it will always come
    //       from a trusted source.
    const hostname = (new URL(recipe.url)).hostname.replace(/^www\./, '');

    const bylineParts = [
        recipe.author && html`<span> By ${ recipe.author } </span>`,
        recipe.yield  && html`<span> Yields ${ recipe.yield } </span>`,
        recipe.time   && html`<span> ${ recipe.time } </span>`,
        `<span>Via <a href="${ recipe.url }">${ hostname }</a></span>`
    ].filter(e => e);

    let byline = [];
    bylineParts.forEach((e, i) => {
        byline.push(e);
        if (i !== bylineParts.length - 1) {
            byline.push('<span> | </span>');
        }
    });

    let description = '<div id="spacer"></div>';
    if (recipe.description) {
        // Since we're using a decorative quote, strip out leading
        // quotes from the description if they exist.
        const stripped = recipe.description.replace(/^"/, '');

        description = html`
            <div id="description">
                <span id="quote"></span>
                <p> ${ stripped } </p>
            </div>
        `;
    }

    return `
        <header>
            <h1>${ escapeHTML(recipe.name) }</h1>
            <div id="byline"> ${ byline.join('\n') }</div>

            ${ description }
        </header>
    `;
}

function renderIngredients (recipe) {
    let ingredients = recipe.ingredients.map(i => {
        let quantity = i.quantity &&
            html`<b class="quantity">${ i.quantity } ${ i.unit || '' }</b>`;

        return `
            <li class="ingredient">${ quantity || '' }
                ${ escapeHTML(i.ingredient) }
            </li>`;
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
        instructionElem = html`<p> ${ recipe.instructionText } </p>`;
    } else if (recipe.instructionList) {
        let instructions = recipe.instructionList.map(text => html`
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

export function renderError () {
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
