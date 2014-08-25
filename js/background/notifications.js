'use strict';

/* globals TID, chrome */

TID.notifications = { };

/**
 * Create and show a notification
 * @param {string} icon    Name of the icon in the images folder
 * @param {string} title   Title of the notification
 * @param {string} message Message of the notification
 * @param {Array}  buttons Array of objects with the button title, and lick callback
 */
TID.notifications.show = function (icon, title, message, buttons) {
    var thisNotificationID;
    var notificationButtons = [];

    buttons.forEach(function (button) {
        notificationButtons.push({
            title: button.title
        });
    });

    // Create a notification
    chrome.notifications.create('', {
        type: 'basic',
        title: title,
        message: message,
        iconUrl: '../img/' + icon,
        buttons: notificationButtons
    }, function (id) {
        thisNotificationID = id;
    });

    // Respond to button clicks
    chrome.notifications.onButtonClicked.addListener(function (notificationID, buttonIndex) {
        if (notificationID === thisNotificationID) {
            buttons[buttonIndex].callback.call(undefined);
        }
    });
};

/**
 * Shows an update notification containing the last update message
 */
TID.notifications.showUpdate = function () {
    var url = 'https://chrome.google.com/webstore/detail/image-downloader-for-tumblr/' + chrome.runtime.id + '/reviews';
    TID.getUpdates(function (updates) {
        var lastUpdate = updates[updates.length - 1];
        var message = '\u2022 ' + lastUpdate.join('\n\u2022 ');

        // Buttons
        var buttons = [
            {
                title: TID.msg('notificationRateButton'),
                callback: function () {
                    chrome.tabs.create({
                        url: url
                    });
                }
            },
            {
                title: TID.msg('notificationUpdateHistoryButton'),
                callback: function () {
                    chrome.tabs.create({
                        url: 'html/updates.html'
                    });
                }
            }
        ];

        // Create a notification
        TID.notifications.show(
            'icon80.png',
            TID.msg('notificationUpdateTitle'),
            message,
            buttons
        );
    });
};
