'use strict';

/* globals TID, chrome */
/* jshint maxparams:5 */

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
TID.ui.showDialog = function (title, message, options, callback, imageUrl) {
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

    var dialogTitle = document.createElement('div');
    dialogTitle.classList.add(TID.classes.dialogTitle);
    dialogTitle.classList.add(TID.classes.keyboardKey);
    dialogTitle.innerHTML = title;
    dialog.appendChild(dialogTitle);

    var dialogHr = document.createElement('hr');
    dialog.appendChild(dialogHr);

    if (imageUrl) {
        var dialogImage = document.createElement('div');
        dialogImage.classList.add(TID.classes.dialogImage);
        dialogImage.innerHTML = '<img src="' + imageUrl + '">';
        dialog.appendChild(dialogImage);
    }

    var dialogMessage = document.createElement('div');
    dialogMessage.classList.add(TID.classes.dialogMessage);

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
    var title = TID.msg('confirmDuplicateDownloadTitle');
    var message = TID.msg('confirmDuplicateDownloadMessage');
    var buttons = [TID.msg('yes'), TID.msg('no')];

    function buttonsCallback (i) {
        callback(i === '0' ? true : false);
    }

    TID.ui.showDialog(title, message, buttons, buttonsCallback, imageId);
};

TID.ui.revealImage = function (url) {
    TID.sendMessage({
        message: 'search_image',
        data: {
            query: [
                url.replace(TID.regex.https, '')
            ]
        }
    }, function (results) {
        var title = TID.msg('modifierKeysAltClickTitle');

        if (!results || !results.length || (results.length === 1 && !results[0].exists)) {
            console.log('No download items', results);

            TID.ui.showDialog(title, TID.msg('imageNotAtDownloadLocation'), TID.msg('nevermind'));
            return;
        } else if (results.length === 1) {
            console.log('Only one download item, attempting to reveal', results);

            TID.sendMessage({
                message: 'reveal_image',
                data: {
                    downloadId: results[0].id,
                },
            });
            return;
        }

        function list (download) {
            var downloadDirectory = false;
            var date = new Date(download.startTime);
            var locale = TID.msg('@@ui_locale').replace('_', '-');
            var dateOptions = {
                hour: 'numeric',
                minute: 'numeric',
                weekday: 'long',
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
            };

            TID.directories.list.forEach(function (directory) {
                if (
                    download.filename.indexOf(directory) !== -1 ||
                    download.filename.indexOf(directory.replace(TID.regex.globalForwardSlash, '\\')) !== -1
                ) {
                    downloadDirectory = directory;
                }
            });

            html += '<li>';
            html += '<a href="javascript:;" class="' + TID.classes.revealImageLink + '"';
            html += ' data-download-id="' + download.id + '"';
            html += ' data-exists="' + download.exists + '"';
            html += ' data-directory="' + !!downloadDirectory + '"';
            html += ' title="' + download.filename + '"';
            html += '>';
            html += downloadDirectory ? downloadDirectory : TID.msg('revealUnknownDirectory');
            html += '</a>';
            html += '<span> (' + date.toLocaleString(locale, dateOptions) + ')</span>';
            html += '</li>';
        }

        console.log('Listing download items:', results);

        var byExtension = [];
        var byOther = [];

        results.forEach(function (download) {
            if (download.byExtensionId === chrome.runtime.id) {
                byExtension.push(download);
            } else {
                byOther.push(download);
            }
        });

        var html = '<div class="' + TID.classes.dialogAlignText + '">';
        html += TID.msg('revealPlacesFound');

        if (byOther.length) {
            html += '<br><br><strong>' + TID.msg('revealPlacesByExtension') + '</strong><br>';
        }

        html += '<ul>';
        if (byExtension.length) {
            byExtension.forEach(list);
        } else {
            html += '<li>' + TID.msg('revealEmpty') + '</li>';
        }
        html += '</ul>';

        if (byOther.length) {
            html += '<br><strong>' + TID.msg('revealPlacesByOther') + '</strong><br>';
            html += '<ul>';
            byOther.forEach(list);
            html += '</ul>';
        }

        html += '</div>';

        TID.ui.showDialog(title, html, TID.msg('done'));
    });
};
