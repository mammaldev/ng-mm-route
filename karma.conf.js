module.exports = function(config) {
  config.set({
    preprocessors: {
      'src/*.js': 'coverage'
    },
    frameworks: [
      'jasmine'
    ],
    reporters: [
      'coverage',
      'mocha'
    ],
    browsers: [
      'PhantomJS'
    ],
    files: [
      'bower_components/angular/angular.js',
      'bower_components/angular-route/angular-route.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'src/*.js',
      'test/*.js'
    ],
    coverageReporter: {
      type: 'json',
      dir: 'coverage',
      subdir: '.'
    },
    singleRun: true
  });
};
