const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const globals = require('rollup-plugin-node-globals');
const builtins = require('rollup-plugin-node-builtins');


module.exports = function(config) {
    config.set({
        frameworks: ['mocha'],
        browsers: ['Firefox', 'ChromeHeadless'],

        files: [
            {pattern: 'test/*.js', watched: false}
        ],

        preprocessors: {
            'test/*.js': ['rollup']
        },

        rollupPreprocessor: {
            output: {
                format: 'es',
                name: 'recipecleaner',
                sourcemap: 'inline',
                globals: ['chrome', 'browser'],
            },
            plugins: [
                resolve({
                    preferBuiltins: true,
                    module: true,
                    browser: true,
                }),
                commonjs({
                    include: 'node_modules/**'
                }),
                globals(),
                builtins(),
            ]
        },

        reporters: ['mocha'],

        client: {
            mocha: {
                reporter: 'html'
            }
        }
    });
};
