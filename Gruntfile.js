module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
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
          preprocessors: {
            'src/*.js': 'coverage'
          },
          frameworks: [
            'jasmine'
          ],
          reporters: [
            'coverage',
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
    },
    uglify: {
      all: {
        options: {
          sourceMap: true
        },
        files: {
          'dist/mm-route.min.js': [
            'src/mm-route.js'
          ]
        }
      }
    },
    copy: {
      all: {
        src: 'src/mm-route.js',
        dest: 'dist/',
        expand: true,
        flatten: true
      }
    }
  });

  grunt.registerTask('default', [
    'jshint',
    'karma',
    'uglify',
    'copy'
  ]);
};
