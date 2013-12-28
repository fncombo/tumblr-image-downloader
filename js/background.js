'use strict';

/* globals chrome */

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-40682860-1']);
_gaq.push(['_trackPageview']);

// Analytics code
(function () {

    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);

}());

(function () {

    // Use Chrome's local storage
    var storage = chrome.storage.local;

    // Clean up version numbers
    function getVersion(versionNumber) {
        versionNumber = versionNumber.toString();
        return parseFloat(versionNumber.match(/(\d\.){2}/g) !== null ? versionNumber.replace(/\.(?=\d$)/g, '') : versionNumber);
    }

    // Show an update notification if the user's stored version is smaller than the updated one
    storage.get({version: 0}, function (object) {

        // Don't show an update notification after first install
        if (!object.version) {
            return;
        }

        var newVersion = getVersion(chrome.app.getDetails().version);
        var oldVersion = getVersion(object.version);

        if (newVersion > oldVersion) {

            // Update the user's version so we don't show the notification again
            storage.set({version: newVersion});

            // Try to create a rich notification
            if ('notifications' in chrome) {

                var notification = chrome.notifications.create('', {
                        type: 'basic',
                        title: 'Tumblr Image Downloader Update',
                        message: 'Fixed a bug to do with endless scrolling.',
                        iconUrl: '../img/icon128.png'
                    }, function () {
                        // It really wants a callback
                    });

            } else {

                // Create the notification from the update.html file
                var notification = window.webkitNotifications.createHTMLNotification('../html/update.html');

            }

            // Show the notification
            notification.show();

        }

    });

}());

// Track an event with Analytics
chrome.runtime.onMessage.addListener(function (request) {

    _gaq.push(['_trackEvent', request.action[0], request.action[1]]);

});
