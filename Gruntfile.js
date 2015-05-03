'use strict';

/* globals module */

module.exports = function(grunt) {

    grunt.initConfig({

        paths: {
            extension: 'extension',
        },

        pkg: grunt.file.readJSON('package.json'),

        clean: [
            '<%= paths.extension %>/',
        ],

        concat: {
            options: {
                stripBanners: false,
                banner: '/*!\n' +
                        ' * Built on <%= grunt.template.today("yyyy-mm-dd") %>\n' +
                        ' */\n\n' +
                        '\'use strict\';\n\n',
                process: function (src) {
                    var newSrc = [];

                    src.split('\n').splice(4).forEach(function (line) {
                        newSrc.push(line);
                    });

                    return newSrc.join('\n');
                },
            },
            build: {
                files: [
                    {
                        src: [
                            'js/main/core.js',
                            'js/main/main.js',
                            'js/main/init.js',
                            'js/main/runtime.js',
                            'js/main/messages.js',
                            'js/main/directories.js',
                            'js/main/images.js',
                            'js/main/modifierkeys.js',
                            'js/main/events.js',
                            'js/main/eventschrome.js',
                            'js/main/eventsdom.js',
                            'js/main/buttons.js',
                            'js/main/ticks.js',
                            'js/main/ui.js',
                            'js/main/run.js',
                        ],
                        dest: '<%= paths.extension %>/js/extension.js',
                    },
                    {
                        src: [
                            'js/main/main.js',
                            'js/main/runtime.js',
                            'js/main/messages.js',
                            'js/background/analytics.js',
                            'js/background/updates.js',
                            'js/background/notifications.js',
                            'js/background/database.js',
                            'js/background/tabs.js',
                            'js/background/download.js',
                            'js/pages/background.js',
                        ],
                        dest: '<%= paths.extension %>/js/background.js',
                    },
                    {
                        src: [
                            'js/main/core.js',
                            'js/main/main.js',
                            'js/main/init.js',
                            'js/main/runtime.js',
                            'js/main/messages.js',
                            'js/main/ui.js',
                            'js/background/checkboxes.js',
                            'js/background/directories.js',
                            'js/background/events.js',
                            'js/pages/text.js',
                            'js/pages/options.js',
                        ],
                        dest: '<%= paths.extension %>/js/options.js',
                    },
                    {
                        src: [
                            'js/main/core.js',
                            'js/main/main.js',
                            'js/main/init.js',
                            'js/main/runtime.js',
                            'js/main/messages.js',
                            'js/background/updates.js',
                            'js/pages/text.js',
                            'js/pages/updates.js',
                        ],
                        dest: '<%= paths.extension %>/js/updates.js',
                    },
                ],
            },
        },

        uglify: {
            options: {
                banner: '/*! Built on <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                mangle: false,
                compress: {
                    sequences: false,
                    properties: false,
                    dead_code: true,
                    drop_debugger: true,
                    unsafe: false,
                    conditionals: false,
                    comparisons: false,
                    evaluate: false,
                    booleans: false,
                    loops: false,
                    unused: false,
                    hoist_funs: false,
                    hoist_vars: false,
                    if_return: false,
                    join_vars: true,
                    cascade: false,
                    warnings: false,
                    negate_iife: false,
                    pure_getters: false,
                    pure_funcs: false,
                    drop_console: true,
                    keep_fargs: true,
                },
                beautify: {
                    indent_level: 2,
                    indent_start: 0,
                    quote_keys: false,
                    space_colon: false,
                    ascii_only: true,
                    inline_script: false,
                    width: 80,
                    max_line_len: 120,
                    bracketize: true,
                    semicolons: true,
                    preamble: null,
                    quote_style: 3,
                },
                report: false,
                sourceMap: false,
                wrap: true,
                preserveComments: false,
                screwIE8: true,
                quoteStyle: 3,
            },
            build: {
                files: [
                    {
                        expand: true,
                        src: [
                            '<%= paths.extension %>/js/*.js'
                        ],
                        ext: '.js',
                    },
                ],
            },
        },

        'json-minify': {
            build: {
                files: '<%= paths.extension %>/**/*.json',
            },
        },

        sass: {
            production: {
                options: {
                    style: 'compressed',
                    precision: 3,
                    noCache: true,
                    sourcemap: 'none',
                },
                files: [
                    {
                        expand: true,
                        src: [
                            'sass/*.scss',
                            '!sass/_*vars.scss',
                        ],
                        flatten: true,
                        dest: '<%= paths.extension %>/css/',
                        ext: '.css',
                    },
                ],
            },
            development: {
                options: {
                    style: 'expanded',
                    precision: 3,
                    noCache: true,
                    sourcemap: 'none',
                },
                files: [
                    {
                        expand: true,
                        src: [
                            'sass/*.scss',
                            '!sass/_*vars.scss',
                        ],
                        flatten: true,
                        dest: '<%= paths.extension %>/css/',
                        ext: '.css',
                    },
                ],
            },
        },

        slim: {
            production: {
                options: {
                    pretty: false,
                },
                files: [
                    {
                        expand: true,
                        src: [
                            'slim/*.slim',
                            '!slim/*.include.slim'
                        ],
                        flatten: true,
                        dest: '<%= paths.extension %>/html/',
                        ext: '.html',
                    },
                ],
            },
            development: {
                options: {
                    pretty: true,
                },
                files: [
                    {
                        expand: true,
                        src: [
                            'slim/*.slim',
                            '!slim/*.include.slim',
                        ],
                        flatten: true,
                        dest: '<%= paths.extension %>/html/',
                        ext: '.html',
                    },
                ],
            },
        },

        copy: {
            misc: {
                files: [
                    {
                        expand: true,
                        src: [
                            'img/icon*.png',
                            '_locales/*/*',
                            'updates.json',
                            'manifest.json',
                        ],
                        dest: '<%= paths.extension %>/',
                        filter: 'isFile',
                    },
                ],
            },
        },

        watch: {
            options: {
                spawn: false,
            },
            all: {
                files: [
                    '*',
                    '**/*',
                ],
                tasks: 'development',
            },
            javascript: {
                files: [
                    'js/*.js',
                    'js/**/*.js',
                ],
                tasks: [
                    'concat',
                ],
            },
            sass: {
                files: [
                    '**/*.scss',
                ],
                tasks: 'sass:development',
            },
            javascriptSass: {
                files: [
                    'js/*.js',
                    'js/**/*.js',
                    '**/*.scss',
                ],
                tasks: [
                    'concat',
                    'sass:development',
                ],
            },
            slim: {
                files: [
                    '**/*.slim',
                ],
                tasks: 'slim:development'
            },
        },

    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-slim');
    grunt.loadNpmTasks('grunt-json-minify');

    grunt.registerTask('development', [
        'clean',
        'concat',
        'sass:development',
        'slim:development',
        'copy',
    ]);

    grunt.registerTask('production', [
        'clean',
        'concat',
        'sass:production',
        'slim:production',
        'copy',
        'json-minify',
        'uglify',
    ]);

};
