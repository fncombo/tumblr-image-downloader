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

    // Show an update notification if the user's stored version is not the same as the updated one
    storage.get({version: '0'}, function (object) {


        var newVersion = chrome.app.getDetails().version;
        var oldVersion = object.version;

        // Don't display if versions match
        if (newVersion === oldVersion) {
            return;
        }

        // Update the user's version so we don't show the notification again
        storage.set({version: newVersion});

        // Notification's ID
        var notificationID;

        // Create a notification
        chrome.notifications.create('', {
            type: 'basic',
            title: 'Tumblr Image Downloader Update',
            message: '• Now works on your dashboard, likes page, and search pages!\n• Improved visual styling.\n• Improved options page.',
            iconUrl: '../img/icon128.png',
            buttons: [
                {title: 'Click here to rate this extension if you find it useful :)'},
                {title: 'Please report any bugs or file feature requests here'}
            ]
        }, function (id) {
            notificationID = id;
        });

        // Respond to buton clicks
        chrome.notifications.onButtonClicked.addListener(function (notificationID, buttonIndex) {
            if (notificationID === notificationID) {
                switch (buttonIndex) {
                case 0:
                    window.open('https://chrome.google.com/webstore/detail/tumblr-image-downloader/ipocoligdfkbgncimgfaffpaglmedpop/reviews');
                    break;
                case 1:
                    window.open('https://chrome.google.com/webstore/support/ipocoligdfkbgncimgfaffpaglmedpop#bug');
                    break;
                }
            }
        });

    });

}());

// Track an event with Analytics
chrome.runtime.onMessage.addListener(function (request) {

    _gaq.push(['_trackEvent', request.action[0], request.action[1]]);

});
