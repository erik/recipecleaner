import browser from 'webextension-polyfill';

const THEMES = {
    DEFAULT: {},
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


// Mapping of selector => click handler
const CLICK_HANDLERS = {
    '#options--toggle': () => {
        const pane = document.querySelector('#options--pane');
        pane.classList.toggle('expanded');
    },
    '#options--pane .theme':  (e) => {
        console.log('--->'
                    , e);
        const theme = e.target.dataset['theme'];
        console.log('theme is', theme);
        applyTheme(THEMES[theme]);
    }
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


function renderOptionsPane () {
    const options = Object.keys(THEMES)
          .map(el => `<li class="theme" data-theme="${el}">${el}</li>`)
          .join('\n');

    return `<ul> ${ options } </ul>`;
}


function render() {
    return `
        <div>
            <div id="options--toggle"> OPTIONS </div>
            <div id="options--pane">
                ${ renderOptionsPane() }

                <hr />

                <a target="_blank" href="https://goo.gl/forms/bsr8RJJoeiXDKJqo2">
                  Report a bug.
                </a>
            </div>
        </div>
    `;
}



getSavedOptions().then(opts => {
    applyTheme(opts['options.theme']);

    const node = document.querySelector('#options');
    node.innerHTML = view();

    for (let selector in CLICK_HANDLERS) {
        let handler = CLICK_HANDLERS[selector];

        console.log('installing selector: ', selector);

        for (let node of document.querySelectorAll(selector)) {
            node.addEventListener('click', handler);
        }
    }
});
