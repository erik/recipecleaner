import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

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
    },
    plugins: [
        resolve({
            browser: true,
            module: true,
            preferBuiltins: false
        }),
        commonjs({})
    ]
}));
