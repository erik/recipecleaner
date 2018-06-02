import browser from 'webextension-polyfill';

import { addClickHandlers } from './util.js';


const THEMES = {
    DEFAULT: {},
    SERIF: {
        '--font-stack': 'Charter, Optima, Georgia, serif',
    },
    SANS_SERIF: {
        '--font-stack': 'Avenir Next, Avenir, Helvetica, sans-serif',
    },
    DARK: {
        '--background-color': '#222',
        '--base-text-color': '#ccc',
        '--info-text-color': '#eee',
    },
    LIGHT: {
        '--background-color': '#fff',
        '--base-text-color': '#333',
        '--info-text-color': '#222',
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

    '#options--pane .theme': (e) => {
        const theme = e.target.dataset['theme'];
        saveAndApplyOptions(THEMES[theme]);
    }
};


function getSavedOptions () {
    return browser.storage.local
        .get({[STORAGE_KEY]: THEMES['DEFAULT']})
        .then(obj => obj[STORAGE_KEY]);
}

function saveOptions (options) {
    return getSavedOptions()
        .then(saved => browser.storage.local.set({
            [STORAGE_KEY]: Object.assign(saved, options)
        }));
}

function saveAndApplyOptions (theme) {
    console.log('APPLY THEME', theme);
    for (let key in theme) {
        if (theme[key] !== null) {
            document.body.style.setProperty(key, theme[key]);
        }
    }

    return saveOptions(theme);
}


function renderOptionsList () {
    const options = Object.keys(THEMES)
        .map(el => `<li class="theme" data-theme="${el}">${el}</li>`)
        .join('\n');

    return `<ul> ${ options } </ul>`;
}


function renderOptions () {
    return `
        <div>
            <div id="options--toggle"> OPTIONS </div>
            <div id="options--pane">
                ${ renderOptionsList() }
                <hr />
                <a target="_blank" href="${BUG_REPORT_LINK}">Report a bug.</a>
            </div>
        </div>
    `;
}

getSavedOptions()
    .then(opts => saveAndApplyOptions(opts))
    .then(() => {
        const node = document.querySelector('#options');
        node.innerHTML = renderOptions();

        addClickHandlers(CLICK_HANDLERS);
    });
