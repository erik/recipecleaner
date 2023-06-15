module.exports = function(config) {
  config.set({
    frameworks: ['mocha'],
    browsers: ['Firefox', 'ChromeHeadless'],
    files: [
      {pattern: 'node_modules/chai/chai.js', type: 'js'},
      {pattern: 'src/js/*.js', included: false},
      {pattern: 'test/*.test.js', type: "module"}
    ],
    proxies: {
      '/js/': '/base/src/js/',
    },
    reporters: ['mocha'],
    client: {
      mocha: {
        reporter: 'html'
      }
    }
  });
};
