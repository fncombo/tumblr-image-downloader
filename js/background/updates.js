'use strict';

/* globals TID */

/**
 * Get updates history from updates.json
 * @param {Function} callback Callback to call once got the messages
 */
TID.getUpdates = function (callback) {
    var request = new XMLHttpRequest();

    request.onload = function () {
        var messages = JSON.parse(request.responseText);
        callback.call(undefined, messages);
    };

    request.open('GET', '/updates.json', true);
    request.send();
};
