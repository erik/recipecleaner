const webpackConfig = require('./webpack.config.js');


module.exports = function(config) {
    config.set({
        frameworks: ['mocha'],
        browsers: ['Firefox', 'ChromeHeadless'],

        files: [
            {pattern: 'test/*.js', watched: false},
            {pattern: 'test/**/*.js', watched: false}
        ],

        preprocessors: {
            'test/*.js': ['webpack', 'sourcemap'],
            'test/**/*.js': ['webpack', 'sourcemap']
        },

        webpack: webpackConfig,

        reporters: ['mocha']
    });
};
