export function addClickHandlers (handlers) {
  for (const selector in handlers) {
    const handler = handlers[selector];

    for (const node of document.querySelectorAll(selector)) {
      node.addEventListener('click', handler);
    }
  }
}


export function createNode (tag, props, children) {
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

  children = children || [];
  (Array.isArray(children) ? children : [children])
    .map(ch => (typeof ch === 'string') ? document.createTextNode(ch) : ch)
    .forEach(n => node.appendChild(n));

  return node;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/* Convenience methods */
createNode.div  = (children) => createNode('div', {}, children);
createNode.p    = (children) => createNode('p', {}, children);
createNode.span = (children) => createNode('span', {}, children);
createNode.svg  = (props, path) => createNode('svg', {...props, xmlns: SVG_NS}, createNode('path', {...path, xmlns: SVG_NS}));

export default {
  addClickHandlers,
  createNode
};
