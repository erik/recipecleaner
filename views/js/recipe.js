import { h, app } from 'hyperapp';

const state = {
    count: 0
};

const actions = {
    down: () => state => ({ count: state.count - 1 }),
    up: () => state => ({ count: state.count + 1 })
};

const view = (state, actions) =>
          h('main', {}, [
              h('h1', {}, [state.count]),
              h('div', {}, 'YOU DID IT')
          ]);

const main = app(state, actions, view, document.body);
