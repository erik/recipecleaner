import assert from 'assert';

import * as sanitize from '../src/js/sanitize.js';


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
});
