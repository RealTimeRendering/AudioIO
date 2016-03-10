module.exports = function( grunt ) {
    grunt.initConfig( {
        sass: {
            dist: {
                options: {
                    style: 'expanded'
                },
                files: {
                    'res/css/main.css': 'res/sass/main.scss',
                    'res/css/knob.css': 'res/sass/knob.scss',
                    'res/css/keyboard.css': 'res/sass/keyboard.scss'
                }
            }
        },

        watch: {
            scripts: {
                files: [ '**/*.scss' ],
                tasks: [ 'sass' ]
            }
        }
    } );

    grunt.loadNpmTasks( 'grunt-contrib-sass' );
    grunt.loadNpmTasks( 'grunt-contrib-watch' );

    grunt.registerTask( 'default', [ "sass", "watch" ] );
};