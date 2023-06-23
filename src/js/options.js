import extension from '/js/extension.js';

import { createNode as h } from '/js/util.js';


const SERIF_STACK = 'Palatino, Charter, Optima, Georgia, serif';

const THEMES = {
  RESET: {
    '--base-text-color': '#333',
    '--base-text-size': '100%',
    '--info-text-color': 'hsl(0, 0%, 35%)',
    '--font-stack': SERIF_STACK,
    '--base-line-height': '1.6',
    '--background-color': 'white',

    '--accent-color': '#c82829',
    '--large-text-toggle': '0',
  },

  NORMAL_TEXT: {
    '--base-text-size': '100%',
    '--large-text-toggle': '0',
  },
  LARGE_TEXT: {
    '--base-text-size': '175%',
    '--large-text-toggle': '0.25',
  },

  SERIF: {
    '--font-stack': SERIF_STACK,
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

const COG_SVG = h.svg(
  {width: '16', height: '16', viewBox: '0 0 512 512'},
  {d: 'M444.788 291.1l42.616 24.599c4.867 2.809 7.126 8.618 5.459 13.985-11.07 35.642-29.97 67.842-54.689 94.586a12.016 12.016 0 0 1-14.832 2.254l-42.584-24.595a191.577 191.577 0 0 1-60.759 35.13v49.182a12.01 12.01 0 0 1-9.377 11.718c-34.956 7.85-72.499 8.256-109.219.007-5.49-1.233-9.403-6.096-9.403-11.723v-49.184a191.555 191.555 0 0 1-60.759-35.13l-42.584 24.595a12.016 12.016 0 0 1-14.832-2.254c-24.718-26.744-43.619-58.944-54.689-94.586-1.667-5.366.592-11.175 5.459-13.985L67.212 291.1a193.48 193.48 0 0 1 0-70.199l-42.616-24.599c-4.867-2.809-7.126-8.618-5.459-13.985 11.07-35.642 29.97-67.842 54.689-94.586a12.016 12.016 0 0 1 14.832-2.254l42.584 24.595a191.577 191.577 0 0 1 60.759-35.13V25.759a12.01 12.01 0 0 1 9.377-11.718c34.956-7.85 72.499-8.256 109.219-.007 5.49 1.233 9.403 6.096 9.403 11.723v49.184a191.555 191.555 0 0 1 60.759 35.13l42.584-24.595a12.016 12.016 0 0 1 14.832 2.254c24.718 26.744 43.619 58.944 54.689 94.586 1.667 5.366-.592 11.175-5.459 13.985L444.788 220.9a193.485 193.485 0 0 1 0 70.2zM336 256c0-44.112-35.888-80-80-80s-80 35.888-80 80 35.888 80 80 80 80-35.888 80-80z'}
);

const ZOOM_SVG = h.svg(
  {width: '32', height: '100%', viewBox: '0 0 512 512'},
  {d: 'M304 192v32c0 6.6-5.4 12-12 12h-56v56c0 6.6-5.4 12-12 12h-32c-6.6 0-12-5.4-12-12v-56h-56c-6.6 0-12-5.4-12-12v-32c0-6.6 5.4-12 12-12h56v-56c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v56h56c6.6 0 12 5.4 12 12zm201 284.7L476.7 505c-9.4 9.4-24.6 9.4-33.9 0L343 405.3c-4.5-4.5-7-10.6-7-17V372c-35.3 27.6-79.7 44-128 44C93.1 416 0 322.9 0 208S93.1 0 208 0s208 93.1 208 208c0 48.3-16.4 92.7-44 128h16.3c6.4 0 12.5 2.5 17 7l99.7 99.7c9.3 9.4 9.3 24.6 0 34zM344 208c0-75.2-60.8-136-136-136S72 132.8 72 208s60.8 136 136 136 136-60.8 136-136z'}
);


function getSavedOptions () {
  return extension.storage.getLocal(STORAGE_KEY, THEMES.RESET);
}

function saveOptions (options) {
  return getSavedOptions().then(saved => {
    return extension.storage.setLocal(
      STORAGE_KEY, {...saved, ...options});
  });
}

function applyOptions (theme) {
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
  const sizeToggle = h('div', {
    className: 'options--button options--size-toggle',
    onClick: () => {
      if (document.body.style.getPropertyValue('--base-text-size') ===
          THEMES.NORMAL_TEXT['--base-text-size']) {

        applyOptions(THEMES.LARGE_TEXT);
      } else {
        applyOptions(THEMES.NORMAL_TEXT);
      }
    }
  }, ZOOM_SVG);

  const fonts = ['SERIF', 'SANS_SERIF'].map(name => {
    const theme = THEMES[name];
    const style = ` font-family: ${ theme['--font-stack'] }; `;

    return h('div', {
      className: 'options--button',
      onClick: () => saveAndApplyOptions(theme),
      style,
    }, 'Aa');
  });

  const colors = ['DARK', 'LIGHT', 'SOLARIZED'].map(name => {
    const theme = THEMES[name];

    const style = `
color: ${ theme['--base-text-color'] };
background-color: ${ theme['--background-color'] };
border-bottom: 4px solid ${ theme['--accent-color'] };
`;

    return h('div', {
      className: 'options--button',
      onClick: () => saveAndApplyOptions(theme),
      style
    }, 'Aa');
  });



  return [fonts.concat([sizeToggle]), colors,]
    .map(row => h('div', {className: 'options--row'}, row));
}


function renderOptions () {
  return h.div([
    h('div', {
      id: 'options--toggle',
      onClick: () => {
        const pane = document.querySelector('#options--pane');
        pane.classList.toggle('expanded');
      }
    }, COG_SVG),
    h('div', {id: 'options--pane'}, [
      ...renderOptionsList(),
      h('a', {className: 'bug', target: '_blank', href: BUG_REPORT_LINK},
        'Send feedback')
    ])
  ]);
}

getSavedOptions()
  .then(opts => saveAndApplyOptions(opts))
  .then(() => {
    document.body.classList.add('theme-transition');

    const node = document.querySelector('#options');
    node.appendChild(renderOptions());
  });
