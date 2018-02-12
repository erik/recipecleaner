function getItemType (node) {
    const attributes = node.attributes;

    if (!attributes.itemtype) {
        return null;
    }

    const schemaType = new URL(attributes.itemtype.value);
    return {
        '@context': schemaType.origin,
        '@type': schemaType.pathname.replace('/', '')
    };
}


function getPropValue (node) {
    const itemprop = node.attributes.itemprop.value;
    const tag = node.tagName.toLowerCase();

    if (node.attributes.itemtype) {
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

// Recurisively walk through DOM tree, building up microdata in place.
function walkDOM(node, microdata) {
    let next = node.firstChild;

    while (next) {
        const attributes = next.attributes || {};

        // Schema'd thing.
        if (attributes.itemscope) {
            const type = getItemType(next);

            if (type !== null) {
                const key = attributes.itemprop.value;
                const data = walkDOM(next, {});

                microdata[key] = microdata[key] || [];
                microdata[key].push(data);
            }

        } else if (attributes.itemprop) {
            const key = attributes.itemprop.value;
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
