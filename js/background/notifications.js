'use strict';

/* globals TID, chrome */

TID.notifications = { };

/**
 * Create and show a notification
 * @param {string}   icon            Name of the icon in the images folder
 * @param {string}   title           Title of the notification
 * @param {string}   message         Message of the notification
 * @param {Array}    buttons         Array of objects wit the button parameters
 * @param {Function} buttonCallbacks A function to handle the button clicks
 */
TID.notifications.show = function (icon, title, message, buttons, buttonCallbacks) {

    var thisNotificationID;

    // Create a notification
    chrome.notifications.create('', {
        type: 'basic',
        title: title,
        message: message,
        iconUrl: '../img/' + icon,
        buttons: buttons
    }, function (id) {
        thisNotificationID = id;
    });

    // Respond to button clicks
    if (buttons && buttonCallbacks) {
        chrome.notifications.onButtonClicked.addListener(function (notificationID, buttonIndex) {
            if (notificationID === thisNotificationID) {
                buttonCallbacks.call(undefined, buttonIndex);
            }
        });
    }

};

/**
 * Shows an update notification containing the last update message
 */
TID.notifications.showUpdate = function () {

    TID.getUpdates(function (updates) {

        var lastUpdate = updates[updates.length - 1];
        var message = '• ' + lastUpdate.join('\n• ');

        // Buttons
        var buttons = [
            {
                title: TID.msg('notificationRateButton')
            },
            {
                title: TID.msg('notificationUpdateHistoryButton')
            }
        ];

        // Callbacks
        var buttonCallbacks = function (buttonIndex) {
            switch (buttonIndex) {
            case 0:
                chrome.tabs.create({
                    url: 'https://chrome.google.com/webstore/detail/tumblr-image-downloader/ipocoligdfkbgncimgfaffpaglmedpop/reviews'
                });
                break;
            case 1:
                chrome.tabs.create({
                    url: 'html/updates.html'
                });
                break;
            }
        };

        // Create a notification
        TID.notifications.show(
            'icon80.png',
            TID.msg('notificationUpdateTitle'),
            message,
            buttons,
            buttonCallbacks
        );

    });

};
