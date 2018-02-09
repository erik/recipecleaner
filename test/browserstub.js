// Laziness.
browser = chrome = {
    pageAction: {
        onClicked: { addListener () {} }
    },

    runtime: {
        onMessage: { addListener () {} },
        onInstalled: { addListener () {} }
    },

    tabs: {
        onRemoved: { addListener () {} },
        update () { }
    },

    storage: {
        local: { get () {}, set () {} }
    }
};
