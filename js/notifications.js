'use strict';

/* globals TID, chrome */

/**
 * Create and show a notification
 * @param  {String}   icon            Name of the icon in the images folder
 * @param  {String}   title           Title of the notification
 * @param  {String}   message         Message of the notification
 * @param  {Array}    buttons         Array of objects wit the button parameters
 * @param  {Function} buttonCallbacks A function to handle the button clicks
 */
TID.showNotification = function (icon, title, message, buttons, buttonCallbacks) {

    var notificationID;

    // Create a notification
    chrome.notifications.create('', {
        type: 'basic',
        title: title,
        message: message,
        iconUrl: '../img/' + icon,
        buttons: buttons
    }, function (id) {
        notificationID = id;
    });

    // Respond to button clicks
    if (buttons && buttonCallbacks) {
        chrome.notifications.onButtonClicked.addListener(function (notificationID, buttonIndex) {
            if (notificationID === notificationID) {
                buttonCallbacks.call(this, buttonIndex);
            }
        });
    }

};

/**
 * Shows an update notification containing the last update message
 */
TID.showUpdateNotification = function () {

    TID.getUpdates(function (updates) {

        var lastUpdate = updates[updates.length - 1];
        var message = '• ' + lastUpdate.join('\n• ');

        // Buttons
        var buttons = [
            {title: 'Rate this extension if you find it useful :)'},
            {title: 'Updates history'}
        ];

        // Callbacks
        var buttonCallbacks = function (buttonIndex) {
            switch (buttonIndex) {
            case 0:
                chrome.tabs.create({url: 'https://chrome.google.com/webstore/detail/tumblr-image-downloader/ipocoligdfkbgncimgfaffpaglmedpop/reviews'});
                break;
            case 1:
                chrome.tabs.create({url: 'html/updates.html'});
                break;
            }
        };

        // Create a notification
        TID.showNotification(
            'icon80.png',
            'Tumblr Image Downloader Update',
            message,
            buttons,
            buttonCallbacks
        );

    });

};
