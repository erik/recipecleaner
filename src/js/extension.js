/* Pretty basic wrappers around the browser / chrome object.
 * Not strictly necessary but keeps everything contained in one file.
 */

export const storage = {
  getLocal: (key, _default=null) => {
    return browser.storage.local
      .get({[key]: _default})
      .then(obj => obj[key]);
  },
  setLocal: (key, val) => browser.storage.local.set({[key]: val}),
};

export const runtime = {
  sendMessage: (msg) => browser.runtime.sendMessage(msg),
  onInstalled: (cb)  => browser.runtime.onInstalled.addListener(cb),
  onMessage:   (cb)  => browser.runtime.onMessage.addListener(cb),
};

export const tabs = {
  create:    (url) => browser.tabs.create({url}),
  update:    (url) => browser.tabs.update({url}),
  onRemoved: (cb)  => browser.tabs.onRemoved.addListener(cb),
};

export const pageAction = {
  show: (tabId) => {
    // Some weird bug in chrome...
    const target = typeof chrome === 'undefined' ? browser : chrome;
    return target.pageAction.show(tabId);
  },
  onClicked: (cb) => browser.pageAction.onClicked.addListener(cb),
};


export default { storage, runtime, tabs, pageAction };
