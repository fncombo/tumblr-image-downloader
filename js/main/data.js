'use strict';

/* globals TID, chrome */

/**
 * Get the list of all user-defined directories
 */
TID.getDirectories = function (callback) {

    chrome.storage.sync.get({saveDirectories: []}, function (object) {

        if (object.saveDirectories.length) {
            TID.directories = object.saveDirectories;
        }

        callback.call(this);

    });

};


/**
 * Get the current document height
 */
TID.getDocumentHeight = function () {
    return document.documentElement.scrollHeight;
};
