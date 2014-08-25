'use strict';

/* globals TID, chrome */

/**
 * Send a message to the background page
 * @param {Object}   message  Object containing the message and/or any other information
 * @param {Function} callback The callback function to be executed, if any
 */
TID.sendMessage = function (message, callback) {
    if (typeof message !== 'object' || message instanceof Array) {
        message = {message: message};
    }

    console.log('Sending message to background page', message);

    chrome.runtime.sendMessage(message, callback || null);
};
