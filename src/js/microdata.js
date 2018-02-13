// Return node's microdata schema type, or null if it doesn't have one.
function getItemType (node) {
    const attributes = node.attributes;

    if (!node.hasAttribute('itemtype')) {
        return null;
    }

    const schemaType = new URL(attributes.itemtype.value);
    return {
        '@context': schemaType.origin,
        '@type': schemaType.pathname.replace('/', '')
    };
}

// Return node's microdata property value, or null if it's a schema object.
function getPropValue (node) {
    const itemprop = node.attributes.itemprop.value;
    const tag = node.tagName.toLowerCase();

    if (node.hasAttribute('itemtype')) {
        return null;
    } else if ((tag === 'a' || tag === 'link') && node.attributes.href) {
        return node.attributes.href.value.trim();
    } else if (node.attributes.content) {
        return node.attributes.content.value.trim();
    } else if (itemprop === 'image' && node.attributes.src) {
        return node.attributes.src.value.trim();
    } else {
        return node.innerText;
    }
}

// Recursively walk through DOM tree, building up microdata in place.
function walkDOM (node, microdata) {
    let next = node.firstChild;

    while (next) {
        // Schema'd thing.
        if (next.attributes && next.hasAttribute('itemscope')) {
            const type = getItemType(next);

            // Only want to recurse if this is a named item. Otherwise
            // it could be something unrelated like an embedded
            // BreadcrumbList or such.
            if (type !== null && next.hasAttribute('itemprop')) {
                const key = next.getAttribute('itemprop');
                const data = walkDOM(next, {});

                microdata[key] = microdata[key] || [];
                microdata[key].push(data);
            }

        } else if (next.attributes && next.hasAttribute('itemprop')) {
            const key = next.getAttribute('itemprop');
            const value = getPropValue(next);

            microdata[key] = microdata[key] || [];
            microdata[key].push(value);
        } else {
            microdata = walkDOM(next, microdata);
        }

        next = next.nextSibling;
    }

    return microdata;
}


// Given an object of {k: [v, ...]}, extract values where list length === 1
function extractSingletons (obj) {
    for (const k in obj) {
        if (Array.isArray(obj[k]) && obj[k].length == 1) {
            obj[k] = obj[k][0];
        }

        if (typeof obj[k] === 'object') {
            obj[k] = extractSingletons(obj[k]);
        }
    }

    return obj;
}


function extractRecipe (node) {
    const microdata = getItemType(node);

    if (!microdata || microdata['@type'] !== 'Recipe') {
        return null;
    }

    walkDOM(node, microdata);
    return extractSingletons(microdata);
}

export default {
    walkDOM,
    extractRecipe,
    getItemType,
    getPropValue
};
