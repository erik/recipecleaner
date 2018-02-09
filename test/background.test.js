import assert from 'assert';

import './browserstub.js';

import * as background from '../src/js/background.js';


describe('background script', () => {
    const BASIC_RECIPE = {
        '@context': 'http://schema.org/Recipe',
        name: 'waffles',
        description: 'pancakes&amp;waffles',
        author: {name: 'foobar'}
    };

    it('normalizes a simple recipe', () => {
        const expected = {
            name: 'waffles',
            url: 'foo',
            description: 'pancakes&waffles',
            author: 'foobar'
        };
        const cleaned = background.normalizeRecipe({url: 'foo'}, BASIC_RECIPE);

        for (const key in expected) {
            assert.equal(cleaned[key], expected[key]);
        }
    });

    describe('microdata', () => {
        const recipe = {
            '@context': 'http://schema.org/',
            '@type': 'Recipe',
            'name': 'banana bread',
            'author': 'John Smith',
            'description': 'banana bread',
            'image': 'bananabread.jpg',
            'recipeIngredient': [
                '1 egg',
                '1 banana'
            ],
            'recipeInstructions': 'Preheat the oven to 350 degrees.',
            'recipeYield': '1 loaf'
        };

        it('can handle data in jsonld format', () => {
            const tag = `<script type="application/ld+json">${JSON.stringify(recipe)}</script>`;

            const extracted = background.tryExtractRecipe(tag);
            assert.deepEqual(extracted, recipe);
        });

        it('can handle html microdata', () => {
            const html = `
    <div itemscope itemtype="http://schema.org/Recipe">
      <span itemprop="name">banana bread</span>
      By <span itemprop="author">John Smith</span>,
      <img itemprop="image" src="bananabread.jpg" />
      <span itemprop="description">banana bread</span>
      Yield: <span itemprop="recipeYield">1 loaf</span>
      Ingredients:
      - <span itemprop="recipeIngredient">1 egg</span>
      - <span itemprop="recipeIngredient">1 banana</span>
      Instructions:
      <span itemprop="recipeInstructions">Preheat the oven to 350 degrees.</span>
    </div>
`;

            const extracted = background.tryExtractRecipe(html);
            assert.deepEqual(extracted, recipe);
        });
    });
});
