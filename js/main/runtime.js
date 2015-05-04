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

/**
 * Send a message to Google Analytics
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/events#overview
 */
TID.trackEvent = function (category, action, label, value) {
    var data = [];

    if (category) {
        data.push(category);
    }

    if (action) {
        data.push(action);
    }

    if (label) {
        data.push(label);
    }

    if (value) {
        data.push(value);
    }

    chrome.runtime.sendMessage({
        message: 'analytics',
        data: data,
    });
};
