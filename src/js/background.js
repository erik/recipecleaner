import extension from '/js/extension.js';
import sanitize  from '/js/sanitize.js';


// Mapping of tab id -> recipe (not persisted to storage)
const EPHEMERAL_TAB_MAP = {};
const encoder = new TextEncoder();

// create a sha256 hash of the given string, returned as a hex string
async function hash(string) {
  const data = encoder.encode(string);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// save recipe to local storage
//
// recipes are identified by the sha256 hash of their url. this
// ensures that a given recipe is only stored once in the database.
async function saveRecipe (recipe) {
  await extension.storage.setLocal(await hash(recipe.url), recipe);
}


// Show the cleaned recipe when the user clicks on the page action.
extension.pageAction.onClicked(async tab => {
  const id = await hash(EPHEMERAL_TAB_MAP[tab.id].url);
  const url = `/html/recipe.html?recipeId=${id}`;
  return extension.tabs.create(url);
});


// Clean up after ourselves.
extension.tabs.onRemoved((tabId) => { delete EPHEMERAL_TAB_MAP[tabId]; });

// handle messages from content scripts
extension.runtime.onMessage(async (msg, sender) => {
  if (msg.kind === 'recipe-detected') {
    console.group();
    console.log('detected recipe. original:', msg.data);

    const recipe = sanitize.recipe(sender.tab.url, msg.data);

    console.log('cleaned recipe:', recipe);
    console.groupEnd();

    EPHEMERAL_TAB_MAP[sender.tab.id] = recipe
    await saveRecipe(recipe);

    extension.pageAction.show(sender.tab.id);
  } else {
    console.error('Unknown message kind:', msg.kind);
  }
});

// First time user experience
extension.runtime.onInstalled(({reason}) => {
  // Don't do anything if this isn't a first time install
  // (e.g. extension update)
  if (reason !== 'install') {
    return;
  }

  extension.tabs.create('/html/welcome.html');
});
