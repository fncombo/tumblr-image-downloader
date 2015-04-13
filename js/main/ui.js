'use strict';

/* globals TID, $, $$ */

/**
 * UI functions
 * @type {Object}
 */
TID.ui = {};

/**
 * Displays a dialog with a custom message, buttons, and events for those buttons
 * @param {String}   message  Message of the dialog
 * @param {Array}    options  Array of buttons
 * @param {Function} callback The callback to call when a button is clicked
 * @param {String}   imageUrl Optional URL of an image to display a thumbnail of
 */
TID.ui.showDialog = function (message, options, callback, imageUrl) {
    if (!(options instanceof Array)) {
        options = [options];
    }

    // Create a new element using DOM functions and append to that
    // as appending straight to the body unbinds events...
    var tempContainer = document.createElement('div');
    tempContainer.classList.add(TID.classes.tempContainer);

    var container = document.createElement('div');
    container.classList.add(TID.classes.tempContainer);
    tempContainer.appendChild(container);

    var overlay = document.createElement('div');
    overlay.classList.add(TID.classes.overlay);
    container.appendChild(overlay);

    var dialog = document.createElement('div');
    dialog.classList.add(TID.classes.dialog);
    overlay.appendChild(dialog);

    var dialogMessage = document.createElement('div');
    dialogMessage.classList.add(TID.classes.dialogMessage);

    if (imageUrl) {
        var dialogImage = document.createElement('div');
        dialogImage.classList.add(TID.classes.dialogImage);
        dialogImage.innerHTML = '<img src="' + imageUrl + '">';
        dialogMessage.appendChild(dialogImage);
    }

    dialogMessage.innerHTML += message;
    dialog.appendChild(dialogMessage);

    options.forEach(function (option, i) {
        var button = document.createElement('div');
        button.classList.add(TID.classes.dialogButton);
        button.dataset.i = i;
        button.innerHTML = option;

        button.onclick = function () {
            if (callback) {
                // i must be a string
                callback.call(event, button.dataset.i);
            }

            tempContainer.remove();
        };

        dialog.appendChild(button);
    });

    document.body.appendChild(tempContainer);
};

/**
 * Show a download confirmation dialog
 * @param {Function} callback The callback to call once the user answers
 * @param {String}   imageUrl Optional URL of an image to display a thumbnail of
 */
TID.ui.confirmDialog = function (callback, imageId) {
    var message = TID.msg('confirmDuplicateDownload');
    var buttons = [TID.msg('yes'), TID.msg('no')];

    function buttonsCallback (i) {
        callback(i === '0' ? true : false);
    }

    TID.ui.showDialog(message, buttons, buttonsCallback, imageId);
};
