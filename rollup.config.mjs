const ENTRY_POINTS = [
    'background',
    'content',
    'options',
    'recipe',
];

export default ENTRY_POINTS.map(name => ({
    input: `./src/js/${name}.js`,
    output: {
        file: `./addon/js/${name}.js`,
        format: 'iife',
        globals: ['chrome', 'browser'],
    }
}));
