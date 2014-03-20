'use strict';

/* globals TID, $, $$ */

TID.ui = { };

/**
 * Displays a dialog with a custom message, buttons, and events for those buttons
 * @param {string}   message  Message of the dialog
 * @param {Array}    options  Array of buttons
 * @param {Function} callback The callback to call when a button is clicked
 */
TID.ui.showDialog = function (message, options, callback) {

    if (!(options instanceof Array)) {
        options = [options];
    }

    var html = '';

    html += '<div class="' + TID.classes.overlay + '">';
    html += '<div class="' + TID.classes.dialog + '">';
    html += '<div class="' + TID.classes.dialogMessage + '">' + message + '</div>';

    options.forEach(function (option, i) {
        html += '<div class="' + TID.classes.dialogButton + '" data-i="' + i + '">';
        html += option;
        html += '</div>';
    });

    html += '</div>';
    html += '</div>';

    // Create a new element using DOM functions and append to that
    // as appending straight to the body unbinds events...
    var tempContainer = $('.' + TID.classes.tempContainer);

    if (tempContainer) {
        tempContainer.remove();
    }

    tempContainer = document.createElement('div');
    tempContainer.classList.add(TID.classes.tempContainer);
    tempContainer.innerHTML = html;
    document.body.appendChild(tempContainer);

    function listener(event) {

        callback.call(event, event.target.dataset.i);

        $$('.' + TID.classes.dialogButton).forEach(function (el) {
            el.removeEventListener('click', listener, true);
        });

        $('.' + TID.classes.overlay).remove();

    }

    $$('.' + TID.classes.dialogButton).forEach(function (el) {
        el.addEventListener('click', listener, true);
    });

};

/**
 * Show a download confirmation dialog
 * @param {Function} callback The callback to call once the user answers
 */
TID.ui.confirmDialog = function (callback) {

    var message = TID.msg('confirmDuplicateDownload');
    var buttons = [TID.msg('yes'), TID.msg('no')];

    function buttonsCallback (i) {
        callback.call(undefined, i === '0' ? true : false);
    }

    TID.ui.showDialog(message, buttons, buttonsCallback);

};
