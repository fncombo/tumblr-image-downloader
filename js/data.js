'use strict';

/* globals TID, chrome */

/**
 * Get the list of all user-defined directories
 * @param  {Function} callback Callback function
 */
TID.getDirectories = function (callback) {

    chrome.storage.sync.get({saveDirectories: []}, function (object) {

        if (object.saveDirectories.length) {
            TID.directories = object.saveDirectories;
        }

        TID.formattedDirectories = TID.formatDirectories();

        callback.call(undefined);

    });

};

/**
 * Get the current document height
 * @return {Integer} Current height of the document
 */
TID.getDocumentHeight = function () {
    return document.documentElement.scrollHeight;
};

/**
 * Get updates history from the JSON file and trigger the updates notification
 * @param  {Function} callback Callback to call once got the messages
 */
TID.getUpdates = function (callback) {

    var request = new XMLHttpRequest();

    request.onload = function () {
        var messages = JSON.parse(request.responseText);
        callback.call(undefined, messages);
    };

    request.open('GET', '/js/updates.json', true);
    request.send();

};
