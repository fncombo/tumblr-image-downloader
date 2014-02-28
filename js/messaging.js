'use strict';

/* globals TID, chrome */

/**
 * Send a message to the background page
 * @param  {Object}   message  Object containing the message and any other information
 * @param  {Function} callback If specified, the callback function to be executed
 */
TID.sendMessage = function (message, callback) {

    if (typeof message !== 'object' || message instanceof Array) {
        message = {message: message};
    }

    if (callback) {
        chrome.runtime.sendMessage(message, callback);
    } else {
        chrome.runtime.sendMessage(message);
    }

};
