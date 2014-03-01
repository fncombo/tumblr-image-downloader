'use strict';

/* globals TID */

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

/**
 * Toggle whether or not to show the dropdown for download locaitons
 * @param  {Boolean} show Whether or not to show the dropdown
 */
TID.toggleLocations = function (show) {
    document.body.classList[show ? 'remove' : 'add'](TID.classes.hideLocations);
};

/**
 * Displays a dialog with a custom message, buttons, and events for those buttons
 * @param  {String}   message  Message of the dialog
 * @param  {Array}    options  Array of buttons
 * @param  {Function} callback The callback to call when a button is clicked
 */
TID.showDialog = function (message, options, callback) {

    if (!(options instanceof Array)) {
        options = [options];
    }

    var i = 0;
    var l = options.length;
    var html = '';

    html += '<div class="' + TID.classes.overlay + '">';
    html += '<div class="' + TID.classes.dialog + '">';
    html += '<div class="' + TID.classes.dialogMessage + '">' + message + '</div>';

    options.forEach(function (option, i) {
        html += '<div class="' + TID.classes.dialogButton + '" id="' + TID.classes.dialogButton + '-' + i + '" data-i="' + i + '">';
        html += option;
        html += '</div>';
    });

    html += '</div>';
    html += '</div>';

    // Create a new element using DOM functions and append to that
    // as appending straight to the body unbinds events...
    var tempContainer = $('.' + TID.classes.tempContainer);

    if (tempContainer) {

        tempContainer.innerHTML = html;

    } else {

        tempContainer = document.createElement('div');
        tempContainer.classList.add(TID.classes.tempContainer);
        tempContainer.innerHTML = html;
        document.body.appendChild(tempContainer);

    }

    function removeListeners() {
        for (i = 0, l = options.lenth; i < l; i += 1) {
            $('#' + TID.classes.dialogButton + '-' + i).removeEventListener('click', listener, true);
        }
    }

    function listener(event) {
        callback.call(event, event.target.dataset.i);
        removeListeners();
        $('.' + TID.classes.overlay).remove();
    }

    for (; i < l; i += 1) {
        $('#' + TID.classes.dialogButton + '-' + i).addEventListener('click', listener, true);
    }

};
