import assert from 'assert-diff';

import util from '../src/js/util.js';

describe('utils', () => {
    describe('escapeHTML', () => {
        it('replaces scary characters', () => {
            let input = `<'&">`;

            assert.equal(util.escapeHTML(input),
                         '&lt;&apos;&amp;&quot;&gt;');
        });

        it('leaves the other characters alone', () => {
            let input = '1<2>3';
            assert.equal(util.escapeHTML(input),
                         '1&lt;2&gt;3');
        });
    });
});

describe('html tagged template', () => {
    it('has basic functionality', () => {
        const input = `'a>b && c < d"`;
        const expected = `a${util.escapeHTML(input)}b`;

        assert.equal(
            util.html`a${input}b`,
            expected);
    });

    it('leaves everything but arguments alone', () => {
        assert.equal(
            util.html`&${"&"}&`,
            '&&amp;&'
        );
    });

    it('handles different arg types', () => {
        const output = util.html `a${0}${"<"}${true}${undefined}`;
        const expected = 'a0&lt;trueundefined';

        assert.equal(output, expected);
    });
});
