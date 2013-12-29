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

    // Show an update notification
    function updateNotification() {

        // Notification's ID
        var notificationID;

        // Notification's message
        var message;

        // Get JSON with all update messages
        var request = new XMLHttpRequest();

        request.onreadystatechange = function () {
            if (request.readyState === 4 && request.status === 200) {

                // Get the update messages
                message = JSON.parse(request.responseText);
                message = message.updates;
                message = message[message.length - 1];

                message = '• ' + message.join('\n• ');

                // Create a notification
                chrome.notifications.create('', {
                    type: 'basic',
                    title: 'Tumblr Image Downloader Update',
                    message: message,
                    iconUrl: '../img/icon128.png',
                    buttons: [
                        {title: 'Rate this extension if you find it useful :)'},
                        {title: 'Report bugs or request features'}
                    ]
                }, function (id) {
                    notificationID = id;
                });

            }
        };

        request.open('GET', 'js/updates.json', true);
        request.send();

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

    }

    // When the extension is first installed, updated, or when Chrome is updated
    chrome.runtime.onInstalled.addListener(function (details) {

        switch (details.reason) {
        case 'install':
            chrome.tabs.create({url: 'html/options.html'});
            break;
        case 'update':
            updateNotification();
            break;
        case 'chrome_update':
            break;
        }

    });

}());

// Track an event with Analytics
chrome.runtime.onMessage.addListener(function (request) {

    _gaq.push(['_trackEvent', request.action[0], request.action[1]]);

});
