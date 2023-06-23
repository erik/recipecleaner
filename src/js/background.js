import extension from '/js/extension.js';
import sanitize  from '/js/sanitize.js';


// Mapping of tab id -> recipe (not persisted to storage)
const EPHEMERAL_TAB_MAP = {};


// When the user clicks on the page action icon, we redirect to the
// cleaned up recipe.
//
// We delay storing the recipe until the user actually wants it.
extension.pageAction.onClicked((tab) => {
  const recipe = EPHEMERAL_TAB_MAP[tab.id];

  const cleanName = recipe.name
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');

  const id = `${Date.now()}-${cleanName}`;
  extension.storage.setLocal(id, recipe)
    .then(() => {
      const url = `/html/recipe.html?recipeId=${encodeURI(id)}`;
      return extension.tabs.update(url);
    }).catch(e => {
      console.error('Failed to inject script:', e);
    });
});


// Clean up after ourselves.
extension.tabs.onRemoved((tabId) => { delete EPHEMERAL_TAB_MAP[tabId]; });

extension.runtime.onMessage((msg, sender) => {
  if (msg.kind === 'recipe-detected') {
    console.group();
    console.log('detected recipe. original:', msg.data);

    const recipe = sanitize.recipe(sender.tab.url, msg.data);

    console.log('cleaned recipe:', recipe);
    console.groupEnd();

    EPHEMERAL_TAB_MAP[sender.tab.id] = recipe;

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
