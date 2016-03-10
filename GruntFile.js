module.exports = function( grunt ) {
    grunt.initConfig( {
        browserify: {
            distES5: {
                options: {
                    browserifyOptions: {
                        debug: true
                    },
                    transform: [
                        [ 'babelify', {
                            loose: "all",
                            // plugins: [ "closure-elimination" ],
                            // optional: [
                            // "minification.constantFolding",
                            // "minification.deadCodeElimination",
                            // "minification.propertyLiterals"
                            // ]
                        } ]
                    ]
                },
                files: {
                    './build/AudioIO.js': [ './src/main.es6' ]
                }
            },

            distES6: {
                options: {
                    transform: [
                        [ 'babelify', {
                            loose: "all",
                            blacklist: [
                                'es6.classes'
                            ]
                        } ]
                    ]
                },
                files: {
                    './build/AudioIO.es6': [ './src/main.es6' ]
                }
            }
        },

        uglify: {
            options: {
                sourceMaps: true
            },
            distES5: {
                files: {
                    './build/AudioIO.min.js': [ './build/AudioIO.js' ]
                }
            },
            // distES6: {
            //     files: {
            //         './build/AudioIO.min.es6': [ './build/AudioIO.es6' ]
            //     }
            // }
        },

        watch: {
            scripts: {
                files: [ './src/**/*.es6' ],
                tasks: [ 'browserify:distES5' ]
            }
        }
    } );

    grunt.loadNpmTasks( 'grunt-browserify' );
    grunt.loadNpmTasks( 'grunt-contrib-watch' );
    grunt.loadNpmTasks( 'grunt-contrib-uglify' );

    grunt.registerTask( 'default', [ "browserify:distES5", "watch" ] );
    grunt.registerTask( 'build', [ "browserify", 'uglify' ] );
};