import assert from 'assert-diff';

import linkedData from '../src/js/linked_data.js';

// Helper function to convert from arbitrary markup in string to DOM tree.
// TODO: Dedupe, used in microdata.test.js as well.
function stringToScriptNode (string) {
  const node = document.createElement('script');
  node.appendChild(document.createTextNode(string));
  return node;
}

describe('linkedData', () => {
  describe('parseNode', () => {
    it('parses bad newlines', () => {
      const input = `{"foo": "new
line"}`;

      const node = stringToScriptNode(input);
      assert.deepEqual(linkedData.parseNode(node), {foo: "new line"});
    });
  });

  describe('normalizeLinkedData', () => {
    it('handles @graph', () => {
      const data = {
        '@context': 'https://schema.org',
        '@graph': [
          'foo',
          'bar',
          'baz'
        ]
      };

      assert.deepEqual(linkedData.normalize(data), ['foo', 'bar', 'baz']);
    });

    it('handles simple cases', () => {
      const data = {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
      };

      assert.deepEqual(linkedData.normalize(data), [data]);
    });

    it('handles mixed up arrays', () => {
      const data = [
        {
          '@context': 'https://schema.org',
          '@graph': ['foo', 'bar', 'baz' ]
        },
        {
          '@context': 'https://schema.org',
          '@type': 'Recipe',
          'foo': 'bar'
        },
      ];

      assert.deepEqual(linkedData.normalize(data), [
        'foo',
        'bar',
        'baz',
        {
          '@context': 'https://schema.org',
          '@type': 'Recipe',
          'foo': 'bar'
        }
      ]);
    });

    it('doesn\'t throw on weird data', () => {
      const data = [
        {'@graph': 123},
        456,
        ['789']
      ];


      assert.deepEqual(linkedData.normalize(data), [
        123,
        ['789']
      ]);
    });

    it('handles WebPage objects', () => {
      const data = {
        '@type': 'WebPage',
        'mainEntity': {
          '@type': 'Recipe',
          foo: 'bar'
        }
      };

      assert.deepEqual(linkedData.normalize(data), [
        {'@type': 'Recipe', foo: 'bar'}
      ]);
    });
  });

  describe('extractRecipe', () => {
    it('takes the first recipe found', () => {
      const data = JSON.stringify([
        {'@type': 'Foo'},
        {'@type': 'Recipe', a: 'b'},
        {'@type': 'Recipe', b: 'c'},
      ]);

      const node = stringToScriptNode(data);

      assert.deepEqual(linkedData.extractRecipe(node), {
        '@type': 'Recipe',
        a: 'b'
      });
    });
  });
});
