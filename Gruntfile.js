module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-karma');

  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: true
      },
      all: [
        'Gruntfile.js',
        'src/**/*.js',
        'test/**/*.js'
      ]
    },
    karma: {
      unit: {
        options: {
          frameworks: [
            'jasmine'
          ],
          reporters: [
            'progress'
          ],
          browsers: [
            'PhantomJS'
          ],
          files: [
            'bower_components/angular/angular.js',
            'bower_components/angular-route/angular-route.js',
            'bower_components/angular-mocks/angular-mocks.js',
            'src/mm-route.js',
            'test/*.js'
          ],
          singleRun: true
        }
      }
    }
  });

  grunt.registerTask('default', [
    'jshint',
    'karma'
  ]);
};
