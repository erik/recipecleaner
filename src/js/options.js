import { h, app } from 'hyperapp'; // eslint-disable-line no-unused-vars
import browser from 'webextension-polyfill';

const THEMES = {
    'DEFAULT': {
        // '--main-text-color': '#333',
        // '--info-text-color': 'hsl(0, 0%, 35%)',
        // '--base-text-size': '150%',
        // '--font-stack': 'Comic Sans, Comic Sans MS',
        // '--base-line-height': '1.6',
    },
    SERIF: {
        '--font-stack': 'Charter, Optima, Georgia, serif',
    },
    SANS_SERIF: {
        '--font-stack': 'Avenir Next, Avenir, Helvetica, sans-serif'
    },
    DARK: {
        '--background-color': '#222',
        '--base-text-color': '#ccc',
        '--info-text-color': '#eee',
    },
    LIGHT: {
        '--background-color': '#FFF',
        '--base-text-color': '#333',
        '--info-text-color': '#222',
    }
};

const actions = {
    toggleExpanded: () => (state) => ({expanded: !state.expanded})
};

function getSavedOptions () {
    return browser.storage.local.get({
        'options.theme': THEMES['DEFAULT']
    });
}

function applyTheme (theme) {
    console.log('APPLY THEME', theme);
    for (let key in theme) {
        if (theme[key] !== null) {
            document.body.style.setProperty(key, theme[key]);
        }
    }
}


function viewOptionsPane () {
    const options = Object.keys(THEMES)
        .map(theme => ({
            text: theme,
            click: () => applyTheme(THEMES[theme])
        }))
        .map(el => (<li onclick={el.click}>{ el.text }</li>));

    return <ul> { options } </ul>;
}


function view (state, actions) {
    const className = state.expanded ? 'pane-visible' : '';

    return (
        <div>
            <div id="options--toggle"
                onclick={actions.toggleExpanded}>
            OPTIONS
            </div>
            <div id="options--pane" className={className}>
                { viewOptionsPane() }
                <hr />

                <a target="_blank"
                    href="https://goo.gl/forms/bsr8RJJoeiXDKJqo2">
              Report a bug.
                </a>
            </div>
        </div>
    );
}

function initialState () {
    return {
        expanded: false
    };
}

getSavedOptions().then(opts => {
    applyTheme(opts['options.theme']);

    const node = document.querySelector('#options');
    app(initialState(), actions, view, node);
});
