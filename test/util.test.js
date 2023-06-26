import {createNode} from '/js/util.js';

const assert = chai.assert;

describe('utils', () => {
  describe('createNode', () => {
    it('registers click handlers correctly', () => {
      let clickCount = 0;
      const node = createNode('div', {onClick: () => clickCount += 1}, []);

      node.click();

      assert.equal(clickCount, 1);
    });

    it('applies css classnames', () => {
      const node = createNode('div', {className: 'foo bar baz'}, []);

      assert.deepEqual(Array.from(node.classList), ['foo', 'bar', 'baz']);
    });
  });
});
