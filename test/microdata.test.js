import assert from 'assert-diff';

import microdata from '../src/js/microdata.js';


// Helper function to convert from arbitrary markup in string to DOM tree.
function stringToNode (string) {
    const div = document.createElement('div');
    div.innerHTML = string.trim();
    return div.firstChild;
}

describe('microdata', () => {
    describe('getItemType', () => {
        it('identifies recipe schemas', () => {
            const node = stringToNode('<div itemtype="http://schema.org/Recipe"></div>');

            assert.deepEqual(microdata.getItemType(node), {
                '@type': 'Recipe',
                '@context': 'http://schema.org'
            });
        });
    });

    describe('getPropValue', () => {
        it('extracts simple strings', () => {
            const node = stringToNode('<div itemprop="name">FooBar</div>');
            assert.deepEqual(microdata.getPropValue(node), 'FooBar');
        });

        it('extracts images', () => {
            const node = stringToNode('<img itemprop="image" src="http://foo.com" />');
            assert.equal(microdata.getPropValue(node), 'http://foo.com');
        });

        it('extracts urls', () => {
            const node = stringToNode('<a itemprop="link" href="foobar.com">something</a>');
            assert.equal(microdata.getPropValue(node), 'foobar.com');
        });

        it('works with nested tags', () => {
            const node = stringToNode(`
<div itemprop="name">foo <span>bar</span> <a href="...">baz</a></div>`);
            assert.equal(microdata.getPropValue(node), 'foo bar baz');
        });
    });

    describe('extractRecipe', () => {
        it('handles blank recipe', () => {
            const html = stringToNode('<div itemscope itemtype="http://schema.org/Recipe">...</div>');

            const recipe = microdata.extractRecipe(html);
            assert.deepEqual(recipe, {
                '@context': 'http://schema.org',
                '@type': 'Recipe'
            });
        });

        it('handles basic recipes', () => {
            const node = stringToNode(`
    <div itemscope itemtype="http://schema.org/Recipe">
      <span itemprop="name">Mom's World Famous Banana Bread</span>
      By <span itemprop="author">John Smith</span>,
      <img itemprop="image" src="http://schema.org/favicon.ico"
           alt="Banana bread on a plate" />
      <span itemprop="description">food.</span>
      Prep Time: <meta itemprop="prepTime" content="PT15M">15 minutes
      Cook time: <meta itemprop="cookTime" content="PT1H">1 hour
      Yield: <span itemprop="recipeYield">1 loaf</span>
      Tags: <link itemprop="suitableForDiet" href="http://schema.org/LowFatDiet" />Low fat
      <div itemprop="nutrition"
        itemscope itemtype="http://schema.org/NutritionInformation">
        Nutrition facts:
        <span itemprop="calories">240 calories</span>,
        <span itemprop="fatContent">9 grams fat</span>
      </div>
      Ingredients:
      - <span itemprop="recipeIngredient">3 or 4 ripe bananas, smashed</span>
      - <span itemprop="recipeIngredient">1 egg</span>
      - <span itemprop="recipeIngredient">3/4 cup of sugar</span>
      ...
      Instructions:
      <span itemprop="recipeInstructions">cook it</span>
    </div>
`);
            const recipe = microdata.extractRecipe(node);
            assert.deepEqual(recipe, {
                '@context': 'http://schema.org',
                '@type': 'Recipe',
                name: 'Mom\'s World Famous Banana Bread',
                author: 'John Smith',
                image: 'http://schema.org/favicon.ico',
                description: 'food.',
                prepTime: 'PT15M',
                cookTime: 'PT1H',
                recipeYield: '1 loaf',
                nutrition: {
                    calories: '240 calories',
                    fatContent: '9 grams fat'
                },
                recipeIngredient: [
                    '3 or 4 ripe bananas, smashed',
                    '1 egg',
                    '3/4 cup of sugar',
                ],
                recipeInstructions: 'cook it',
                suitableForDiet: 'http://schema.org/LowFatDiet'
            });
        });
    });
});
