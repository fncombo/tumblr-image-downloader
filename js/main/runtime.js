'use strict';

/* globals TID, chrome */

/**
 * Send a message to the background page
 * @param {object}   message  Object containing the message and/or any other information
 * @param {Function} callback The callback function to be executed, if any
 */
TID.sendMessage = function (message, callback) {

    if (typeof message !== 'object' || message instanceof Array) {
        message = {message: message};
    }

    chrome.runtime.sendMessage(message, callback || null);

};
