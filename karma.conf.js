module.exports = function(config) {
    config.set({
        frameworks: ['mocha'],
        browsers: ['Firefox', 'ChromeHeadless'],

        files: [
            {pattern: 'test/*.js', watched: false}
        ],

        reporters: ['mocha'],

        client: {
            mocha: {
                reporter: 'html'
            }
        }
    });
};
