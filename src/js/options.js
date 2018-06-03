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
        '--font-stack': 'Avenir, Helvetica Neue, Helvetica, Arial, sans-serif',
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

const COG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 512 512"><path d="M444.788 291.1l42.616 24.599c4.867 2.809 7.126 8.618 5.459 13.985-11.07 35.642-29.97 67.842-54.689 94.586a12.016 12.016 0 0 1-14.832 2.254l-42.584-24.595a191.577 191.577 0 0 1-60.759 35.13v49.182a12.01 12.01 0 0 1-9.377 11.718c-34.956 7.85-72.499 8.256-109.219.007-5.49-1.233-9.403-6.096-9.403-11.723v-49.184a191.555 191.555 0 0 1-60.759-35.13l-42.584 24.595a12.016 12.016 0 0 1-14.832-2.254c-24.718-26.744-43.619-58.944-54.689-94.586-1.667-5.366.592-11.175 5.459-13.985L67.212 291.1a193.48 193.48 0 0 1 0-70.199l-42.616-24.599c-4.867-2.809-7.126-8.618-5.459-13.985 11.07-35.642 29.97-67.842 54.689-94.586a12.016 12.016 0 0 1 14.832-2.254l42.584 24.595a191.577 191.577 0 0 1 60.759-35.13V25.759a12.01 12.01 0 0 1 9.377-11.718c34.956-7.85 72.499-8.256 109.219-.007 5.49 1.233 9.403 6.096 9.403 11.723v49.184a191.555 191.555 0 0 1 60.759 35.13l42.584-24.595a12.016 12.016 0 0 1 14.832 2.254c24.718 26.744 43.619 58.944 54.689 94.586 1.667 5.366-.592 11.175-5.459 13.985L444.788 220.9a193.485 193.485 0 0 1 0 70.2zM336 256c0-44.112-35.888-80-80-80s-80 35.888-80 80 35.888 80 80 80 80-35.888 80-80z"/></svg>`;


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
            <div id="options--toggle">${ COG_SVG }</div>
            <div id="options--pane">
                ${ renderOptionsList() }
                <a class="bug" target="_blank" href="${ BUG_REPORT_LINK }">Send feedback</a>
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
