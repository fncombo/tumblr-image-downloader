/*!
 * Background script.
 * @author Eugene
*/

(function () {

    'use strict';

        // Use Chrome's local storage
    var storage = chrome.storage.local;

    // Clean up version numbers
    function getVersion(versionNumber) {
        versionNumber = versionNumber.toString();
        return parseFloat(versionNumber.match(/(\d\.){2}/g) !== null ? versionNumber.replace(/\.(?=\d$)/g, '') : versionNumber);
    }

    // Show an update notification if the user's stored version is smaller than the updated one
    storage.get({version: 0}, function (object) {

        var newVersion = getVersion(chrome.app.getDetails().version),
            oldVersion = getVersion(object.version);

        if (newVersion > oldVersion) {

            // Update the user's version so we don't show the notification again
            storage.set({version: newVersion});

            // Create the notification from the update.html file
            var notification = window.webkitNotifications.createHTMLNotification('update.html');

            // Show the notification
            notification.show();

        }

    });

}());
