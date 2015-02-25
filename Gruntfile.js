module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-istanbul-coverage');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
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
        configFile: 'karma.conf.js'
      }
    },
    coverage: {
      options: {
        thresholds: {
          statements: 100,
          functions: 100,
          branches: 100,
          lines: 100
        },
        dir: 'coverage'
      }
    },
    uglify: {
      all: {
        options: {
          sourceMap: true
        },
        files: {
          'dist/mm-route.min.js': [
            'src/mm-route.js',
            'src/mm-role-resolver.js'
          ]
        }
      }
    },
    concat: {
      dist: {
        src: 'src/*js',
        dest: 'dist/mm-route.js'
      }
    }
  });

  grunt.registerTask('default', [
    'jshint',
    'karma',
    'coverage',
    'uglify',
    'concat'
  ]);

  grunt.registerTask('test', [
    'karma',
    'coverage'
  ]);
};
