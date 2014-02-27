'use strict';

/* globals TID */

/**
 * Show a download confirmation dialog
 * @return {Boolean} Whether or not the user agreed
 */
TID.confirmDialog = function () {
    return confirm('You\'ve already downloaded this image before.\n\n' +
                   'Are you sure you want to download it again?');
};

/**
 * Format the list of download directories
 * @return {String} A string containing HTML for the list of directories
 */
TID.formatDirectories = function () {

    if (TID.directories.length) {

        var list = '';

        TID.directories.forEach(function (directory) {

            var name = directory.replace(/(.+\/)/, '<span>$1</span>')
                                .replace(/\/(?!\w+>)/g, '<strong>&#8260;</strong>');

            list += '<li title="Download inside: ' + directory + '" data-directory="' + directory + '">';
            list += name;
            list += '</li>';

        });

        return list;

    } else {

        return '<li class="' + TID.classes.help + '">' +
               'You can specify custom download\nlocations in the settings.\n' +
               'Click to configure.</li>';

    }

};

TID.toggleLocations = function (show) {
    $('body').classList[show ? 'remove' : 'add'](TID.classes.hideLocations);
};
