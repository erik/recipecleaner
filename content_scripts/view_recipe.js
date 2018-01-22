browser.runtime.sendMessage({kind: 'request-recipe'}).then(recipe => {

    console.log('THERECIPEIS', recipe);

    const ingredients = (recipe.ingredients || recipe.recipeIngredient || [])
              .map(i => `<li>${i}</li>`);
    const instructions = (recipe.recipeInstructions || [])
              .map(i => `<li>${i}</li>`);

    document.body.innerHTML = `
<style>
  * { font-family: 'Helvetica Neue', 'Helvetica'; font-size: 20px; color: #222 }
  body { background-color: beige; }
  main { margin: 0 auto; width: 900px; background-color: #fcfcfc; }
  h1 { text-align: center; }
</style>

<main>
   <h1>${recipe.name}</h1>

   <p>${recipe.description}</p>
   <ul>
     ${ingredients.join('')}
   </ul>

   <ol>${instructions.join('')}</ol>
</main> `;
});
