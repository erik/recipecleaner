const ENTRY_POINTS = [
    'background/background',
    'content_scripts/detect_recipe',
    'pages/options',
    'pages/recipe/page',
];

export default ENTRY_POINTS.map(name => ({
    input: `./src/js/${name}.js`,
    output: {
        file: `./addon/js/${name}.js`,
        format: 'iife',
        globals: ['chrome', 'browser'],
    }
}));
