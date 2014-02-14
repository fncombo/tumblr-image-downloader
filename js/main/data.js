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

        callback.call(this);

    });

};


/**
 * Get the current document height
 * @return {Integer} Current height of the document
 */
TID.getDocumentHeight = function () {
    return document.documentElement.scrollHeight;
};
