'use strict';

/* globals TID, chrome */

/**
 * Send a message to the background page
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
