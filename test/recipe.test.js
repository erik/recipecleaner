import assert from 'assert-diff';

import { escapeHTML } from '../src/js/util.js';
import { renderRecipe } from '../src/js/render_recipe.js';



describe('renderRecipe', () => {
    it('escapes all HTML', () => {
        const stringKeys = [
            'name', 'description', 'author', 'image', 'original'
        ];

        const recipe = {
            // This is trusted, set by extension itself
            url: 'http://foo.com'
        };

        for (let k of stringKeys) {
            recipe[k] = '<&>';
        }

        recipe['ingredients'] = [
            {quantity: '<&>', unit: '<&>', ingredient: '<&>'}
        ];
        recipe['instructionList'] = ['<&>'];
        recipe['original'] = {foo: '</script foo>'};

        let rendered = renderRecipe(recipe);
        assert.equal(rendered.includes('<&>'), false);
        assert.equal(rendered.includes('</script foo>'), false);
    });
});
