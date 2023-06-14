/* Normalize / extract data from JSON-LD blocks. */

// Clean up the weird edge cases for how JSON gets represented.
// Return parsed JSON object, or null.
export function parseNode (node) {
  try {
    // Sometimes bad systems bake literal newlines into the JSON,
    // breaking strings, so just join all lines.
    const text = node.innerText.replace(/\n/g, ' ');

    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse JSON: ', e);
    return null;
  }
}

// The JSON-LD spec allows A LOT of flexibility in how data is
// passed. This doesn't cover every case, but should hit a pretty
// decent chunk of what is actually used in the wild.
//
// Return a list of objects that should at least have a `@type` key.
export function normalize (data) {
  let normalized = [];

  // Generally, it's not a list, but since it can be, normalize to that.
  if (!Array.isArray(data)) {
    data = [data];
  }

  for (const el of data) {
    if (typeof el !== 'object') {
      continue;
    } else if ('@graph' in el) {
      normalized = normalized.concat(el['@graph']);
    } else if (el['@type'] === 'WebPage' && el['mainEntity']) {
      normalized.push(el['mainEntity']);
    } else {
      normalized.push(el);
    }
  }

  return normalized;
}

export function extractRecipe (node) {
  const json = parseNode(node);
  if (json === null) {
    return null;
  }

  const data = normalize(json);

  // Only take the first recipe we see.
  return data
    .find((it) => {
      const type = it['@type'];
      return Array.isArray(type)
        ? type.includes('Recipe')
        : type === 'Recipe';
    });
}
