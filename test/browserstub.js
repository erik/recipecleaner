// Laziness.
browser = chrome = {
    pageAction: {
        onClicked: { addListener () {} }
    },

    runtime: {
        onMessage: { addListener () {} }
    },

    tabs: {
        onRemoved: { addListener () {} },
        update () { }
    },

    storage: {
        local: { get () {}, set () {} }
    }
};
