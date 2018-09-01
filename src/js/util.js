export function addClickHandlers (handlers) {
  for (const selector in handlers) {
    const handler = handlers[selector];

    for (const node of document.querySelectorAll(selector)) {
      node.addEventListener('click', handler);
    }
  }
}

export const createNode = (function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  impl.div = (children=[]) =>
    impl('div', {}, children);

  impl.p = (children=[]) =>
    impl('p', {}, children);

  impl.span = (children=[]) =>
    impl('span', {}, children);

  impl.svg = (props, path) =>
    impl('svg',
      {...props, xmlns: SVG_NS},
      impl('path', {...path, xmlns: SVG_NS}));

  function impl (tag, props, children=[]) {
    const ns = props.xmlns || 'http://www.w3.org/1999/xhtml';
    const node = document.createElementNS(ns, tag);

    Object.entries(props).forEach(([k, v]) => {
      switch (k) {
      case 'className':
        node.classList.add(...v.split(' '));
        break;
      case 'onClick':
        node.addEventListener('click', v);
        break;
      default:
        node.setAttribute(k, v);
      }
    });

    (Array.isArray(children) ? children : [children])
      .map(ch => (typeof ch === 'string') ? document.createTextNode(ch) : ch)
      .forEach(n => node.appendChild(n));

    return node;
  }

  return impl;
})();

export default {
  addClickHandlers,
  createNode
};
