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
});
