import browser from 'webextension-polyfill';

import { addClickHandlers } from './util.js';


const THEMES = {
    NORMAL_TEXT: {
        '--base-text-size': '100%',
        '--large-text-toggle': '0',
    },
    LARGE_TEXT: {
        '--base-text-size': '175%',
        '--large-text-toggle': '0.25',
    },

    SERIF: {
        '--font-stack': 'Charter, Optima, Georgia, serif',
    },
    SANS_SERIF: {
        '--font-stack': 'Avenir Next, Avenir, Helvetica, sans-serif',
    },

    DARK: {
        '--background-color': '#1d1f21',
        '--base-text-color': '#c5c8c6',
        '--info-text-color': '#969896',
        '--accent-color': '#b294bb',
    },
    LIGHT: {
        '--background-color': '#fff',
        '--base-text-color': '#4d4d4c',
        '--info-text-color': '#8e908c',
        '--accent-color': '#c82829',
    },
    SOLARIZED: {
        '--background-color': '#fdf6e3',
        '--base-text-color': '#586e75',
        '--info-text-color': '#657b83',
        '--accent-color': '#2aa198',
    }
};


const BUG_REPORT_LINK = 'https://goo.gl/forms/bsr8RJJoeiXDKJqo2';
const STORAGE_KEY = 'options';


// Mapping of selector => click handler
const CLICK_HANDLERS = {
    '#options--toggle': () => {
        const pane = document.querySelector('#options--pane');
        pane.classList.toggle('expanded');
    },

    '[data-theme]': (e) => {
        const theme = e.target.dataset['theme'];
        saveAndApplyOptions(THEMES[theme]);
    },

    '.options--size-toggle': () => {
        const currentSize = document.body.style.getPropertyValue('--base-text-size') || '';

        if (currentSize === THEMES.NORMAL_TEXT['--base-text-size'] || currentSize === '') {
            applyOptions(THEMES.LARGE_TEXT);
        } else {
            applyOptions(THEMES.NORMAL_TEXT);
        }
    }
};


function getSavedOptions () {
    return browser.storage.local
        .get({[STORAGE_KEY]: {}})
        .then(obj => obj[STORAGE_KEY]);
}

function saveOptions (options) {
    return getSavedOptions()
        .then(saved => browser.storage.local.set({
            [STORAGE_KEY]: Object.assign(saved, options)
        }));
}

function applyOptions (theme) {
    console.log('APPLY THEME', theme);
    for (let key in theme) {
        if (theme[key] !== null) {
            document.body.style.setProperty(key, theme[key]);
        }
    }
}

function saveAndApplyOptions (theme) {
    applyOptions(theme);
    return saveOptions(theme);
}


function renderOptionsList () {
    const sizeToggle = '<div class="options--button options--size-toggle">🔍</div>';

    const fonts = ['SERIF', 'SANS_SERIF'].map(name => {
        const theme = THEMES[name];
        const style = ` font-family: ${ theme['--font-stack'] }; `;

        return `<div class="options--button" data-theme="${name}" style="${ style }">Aa</div>`;
    });

    const colors = ['DARK', 'LIGHT', 'SOLARIZED'].map(name => {
        const theme = THEMES[name];

        const style = `
color: ${ theme['--base-text-color'] };
background-color: ${ theme['--background-color'] };
border-bottom: 4px solid ${ theme['--accent-color'] };
`;

        return `<div class="options--button" data-theme="${name}" style="${ style }">Aa</div>`;
    });



    return [
        fonts.concat([sizeToggle]),
        colors,
    ].map(row => {
        return `<div class="options--row"> ${ row.join('\n') } </div>`;
    }).join('\n');
}


function renderOptions () {
    return `
        <div>
            <div id="options--toggle"> ⚙️ </div>
            <div id="options--pane">
                ${ renderOptionsList() }
                <hr />
                <a class="bug" target="_blank" href="${ BUG_REPORT_LINK }">Report a bug.</a>
            </div>
        </div>
    `;
}

getSavedOptions()
    .then(opts => saveAndApplyOptions(opts))
    .then(() => {
        document.body.classList.add('theme-transition');

        const node = document.querySelector('#options');
        node.innerHTML = renderOptions();

        addClickHandlers(CLICK_HANDLERS);
    });
