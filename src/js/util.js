export function addClickHandlers (handlers) {
    for (const selector in handlers) {
        const handler = handlers[selector];

        for (const node of document.querySelectorAll(selector)) {
            node.addEventListener('click', handler);
        }
    }
}
