'use strict';

/* globals module */

module.exports = function(grunt) {

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        concat: {
            options: {
                stripBanners: false,
                banner: "/*!\n" +
                        " * Built on\n" +
                        " * <%= grunt.template.today('yyyy-mm-dd') %>\n" +
                        " */\n\n" +
                        "'use strict';\n\n" +
                        "/* globals TID, chrome, $, $$ */\n\n" +
                        "window.TID = {};\n\n",
                process: function (src) {
                    return src.split('\n').splice(4).join('\n');
                }
            },
            build: {
                files: [
                    {
                        src: [
                            'js/core.js',
                            'js/i18n.js',
                            'js/vars.js',
                            'js/button.js',
                            'js/checks.js',
                            'js/data.js',
                            'js/image.js',
                            'js/messaging.js',
                            'js/ticks.js',
                            'js/ui.js',
                            'js/init.js',
                            'js/run.js'
                        ],
                        dest: 'extension/js/extension.js'
                    },
                    {
                        src: [
                            'js/core.js',
                            'js/i18n.js',
                            'js/vars.js',
                            'js/messaging.js',
                            'js/data.js',
                            'js/ui.js',
                            'js/directoryEvents.js',
                            'js/directory.js',
                            'js/checkbox.js'
                        ],
                        dest: 'extension/js/support.js'
                    },
                    {
                        src: [
                            'js/i18n.js',
                            'js/analytics.js',
                            'js/data.js',
                            'js/notifications.js',
                            'js/background.js'
                        ],
                        dest: 'extension/js/background.js'
                    }
                ]
            }
        },

        uglify: {
            options: {
                mangle: true,
                compress: true,
                beautify: false,
                report: false,
                sourceMap: false,
                wrap: false,
                preserveComments: false
            },
            build: {
                files: [
                    {
                        expand: true,
                        src: [
                            'extension/js/*.js'
                        ],
                        ext: '.js'
                    }
                ]
            }
        },

        sass: {
            options: {
                style: 'compressed',
                precision: 3,
                noCache: true
            },
            build: {
                files: [
                    {
                        expand: true,
                        src: [
                            'sass/*.scss',
                            '!sass/normalize.scss'
                        ],
                        flatten: true,
                        dest: 'extension/css/',
                        ext: '.css'
                    }
                ]
            }
        },

        slim :{
            options: {
                pretty: false
            },
            build: {
                files: [
                    {
                        expand: true,
                        src: ['slim/*.slim'],
                        flatten: true,
                        dest: 'extension/html/',
                        ext: '.html'
                    }
                ]
            }
        },

        watch: {
            options: {
                spawn: false
            },
            all: {
                files: [
                    '*',
                    '**/*'
                ],
                tasks: 'development'
            }
        },

        copy: {
            buildExtension: {
                files: [
                    {
                        expand: true,
                        src: [
                            'img/icon*.png',
                            'js/*.json',
                            '_locales/*/*',
                            'manifest.json'
                        ],
                        dest: 'extension/',
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        src: [
                            'js/options.js',
                            'js/updates.js'
                        ],
                        dest: 'extension/',
                        filter: 'isFile'
                    }
                ]
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-slim');

    grunt.registerTask('development', [
        'concat',
        'sass',
        'slim',
        'copy'
    ]);

    grunt.registerTask('production', [
        'concat',
        'sass',
        'slim',
        'copy',
        'uglify'
    ]);

};
