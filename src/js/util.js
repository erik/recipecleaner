export function addClickHandlers (handlers) {
    for (const selector in handlers) {
        const handler = handlers[selector];

        for (const node of document.querySelectorAll(selector)) {
            node.addEventListener('click', handler);
        }
    }
}


export function escapeHTML (string) {
    return string.replace(/[&<>"']/g, (c) => {
        switch (c) {
        case '&':
            return '&amp;';
        case '<':
            return '&lt;';
        case '>':
            return '&gt;';
        case '"':
            return '&quot;';
        case '\'':
            return '&apos;';
        }
    });
}

// Super simple tagged template string function to escape HTML of arguments
export function html (strings, ...args) {
    return strings.reduce((safe, part, idx) => {
        const escaped = escapeHTML(`${(args[idx - 1])}`);
        return `${safe}${escaped}${part}`;
    });
}

export default {
    addClickHandlers,
    html,
    escapeHTML
};
