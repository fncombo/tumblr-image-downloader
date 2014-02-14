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
                        src: ['js/core.js', 'js/main/*.js'],
                        dest: 'extension/js/main.js'
                    },
                    {
                        src: ['js/core.js', 'js/misc/background.js'],
                        dest: 'extension/js/background.js'
                    },
                    {
                        src: ['js/core.js', 'js/misc/options.js'],
                        dest: 'extension/js/options.js'
                    },
                    {
                        src: ['js/core.js', 'js/misc/updates.js'],
                        dest: 'extension/js/updates.js'
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
                sourceMap: true,
                wrap: false,
                preserveComments: false
            },
            build: {
                files: [
                    {
                        expand: true,
                        src: [
                            'extension/js/*.js',
                            '!extension/js/*.min.js'
                        ],
                        ext: '.min.js'
                    }
                ]
            }
        },

        sass: {
            options: {
                style: 'expanded',
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
                pretty: true
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
                tasks: 'default'
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
                            'manifest.json'
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

    grunt.registerTask('default', [
        'concat',
        'uglify',
        'sass',
        'slim',
        'copy'
    ]);

};
