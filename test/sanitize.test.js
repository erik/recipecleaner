import assert from 'assert';

import sanitize from '../src/js/sanitize.js';


describe('sanitize', () => {
    describe('image', () => {
        it('handles undefined and null', () => {
            assert.equal(sanitize.image(null), null);
            assert.equal(sanitize.image(undefined), null);
        });

        it('handle simple strings', () => {
            assert.equal(sanitize.image('http://image.url'), 'http://image.url');
        });

        it('handles lists', () => {
            assert.equal(sanitize.image(['foo', 'bar']), 'foo');
        });

        it('handles microdata lists', () => {
            assert.equal(sanitize.image({'@list': ['foobar']}), 'foobar');
            assert.equal(sanitize.image({'@list': [{url: 'foobar'}]}), 'foobar');
        });
    });

    describe('author', () => {
        it('handles undefined and null', () => {
            assert.equal(sanitize.author(null), null);
            assert.equal(sanitize.author(undefined), null);
        });

        it('works with lists', () => {
            assert.equal(sanitize.author(['1', '2', '3']), '1');
        });

        it('handles empty names', () => {
            assert.equal(sanitize.author({name: ''}), null);
        });
    });

    describe('time', () => {
        it('returns null on bad data', () => {
            [null, 'not a duration', 'P7D4', 'P'].forEach(duration => {
                assert.equal(sanitize.time(duration), null);
            });
        });

        it('handles common formats', () => {
            assert.equal(sanitize.time('P20Y300M34DT12H34M56.0S'), '12 hr 34 min');
            assert.equal(sanitize.time('PT12H34M'), '12 hr 34 min');
            assert.equal(sanitize.time('PT12H'), '12 hr');
            assert.equal(sanitize.time('PT12M'), '12 min');
        });

        it('ignores hrs=0, min=0', () => {
            assert.equal(sanitize.time('PT0H12M'), '12 min');
            assert.equal(sanitize.time('PT12H0M'), '12 hr');
            assert.equal(sanitize.time('PT0H0M'), null);
        });
    });

    describe('ingredient', () => {
        it('does not mangle unknown formats', () => {
            ['abcd', 'bananas, 32 of them'].forEach(i => {
                assert.deepEqual(sanitize.ingredient(i), {ingredient: i});
            });
        });

        it('handles fractions', () => {
            assert.deepEqual(sanitize.ingredient('½ tsp potato'), {
                quantity: '½',
                unit: 'tsp',
                ingredient: 'potato'
            });

            assert.deepEqual(sanitize.ingredient('32 ½ cloves potato'), {
                quantity: '32 ½',
                unit: 'cloves',
                ingredient: 'potato'
            });

            assert.deepEqual(sanitize.ingredient('8⁄2 grams potato'), {
                quantity: '8⁄2',
                unit: 'grams',
                ingredient: 'potato'
            });
        });

        it('handles missing units', () => {
            assert.deepEqual(sanitize.ingredient('52 grapes'), {
                quantity: '52',
                unit: null,
                ingredient: 'grapes'
            });
        });
    });

    describe('common', () => {
        it('strips out leftover HTML tags', () => {
            assert.equal(sanitize.common('foo <a href="foobar.com">bar</a> baz'), 'foo bar baz');
            assert.equal(sanitize.common('foo <a href="unclosed string>bad</a>'), 'foo');
        });

        it('replaces fractions', () => {
            assert.equal(sanitize.common('1/2 1/3 1/4 55/99'), '½ ⅓ ¼ 55⁄99');
        });

        it('replaces encoded html entities', () => {
            assert.equal(sanitize.common('foo&amp;bar'), 'foo&bar');
        });
    });
});
