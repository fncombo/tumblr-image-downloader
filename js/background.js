'use strict';

/* globals chrome */

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-40682860-1']);
_gaq.push(['_trackPageview']);

(function () {

    /**
     * Preferred save directory
     */
    var defaultDirectory;
    var saveDirectory;

    /**
     * Analytics code
     */
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);

    /**
     * Show an update notification
     */
    function updateNotification() {

        var notificationID;

        // Get JSON with all update messages
        var request = new XMLHttpRequest();

        request.onload = function () {

            // Get the update messages
            var message = JSON.parse(request.responseText);
            message = message[message.length - 1];

            message = '• ' + message.join('\n• ');

            // Create a notification
            chrome.notifications.create('', {
                type: 'basic',
                title: 'Tumblr Image Downloader Update',
                message: message,
                iconUrl: '../img/icon80.png',
                buttons: [
                    {title: 'Rate this extension if you find it useful :)'},
                    {title: 'Updates history'}
                ]
            }, function (id) {
                notificationID = id;
            });

        };

        request.open('GET', 'js/updates.json', true);
        request.send();

        // Respond to button clicks
        chrome.notifications.onButtonClicked.addListener(function (notificationID, buttonIndex) {
            if (notificationID === notificationID) {
                switch (buttonIndex) {
                case 0:
                    chrome.tabs.create({url: 'https://chrome.google.com/webstore/detail/tumblr-image-downloader/ipocoligdfkbgncimgfaffpaglmedpop/reviews'});
                    break;
                case 1:
                    chrome.tabs.create({url: 'html/updates.html'});
                    break;
                }
            }
        });

    }

    /**
     * When the extension is first installed, updated, or when Chrome is updated
     */
    chrome.runtime.onInstalled.addListener(function (details) {

        switch (details.reason) {
        case 'install':
            chrome.tabs.create({url: 'html/options.html'});
            break;
        case 'update':

            updateNotification();

            // Move the confirmation setting to synced storage
            chrome.storage.local.get({confirm: false}, function (object) {
                chrome.storage.sync.set(object);
            });

            break;
        }

    });

    /**
     * Override file names by adding the user's directory of choice
     */
    chrome.downloads.onDeterminingFilename.addListener(function (downloadItem, suggest) {

        if (downloadItem.byExtensionId !== chrome.i18n.getMessage("@@extension_id")) {
            return;
        }

        if (saveDirectory) {
            suggest({filename: saveDirectory + '/' + downloadItem.filename});
        } else if (defaultDirectory) {
            suggest({filename: defaultDirectory + '/' + downloadItem.filename});
        } else {
            suggest({filename: downloadItem.filename});
        }

    });

    /**
     * Listen to messages from other scripts
     */
    chrome.runtime.onMessage.addListener(function (request, sender) {

        switch (request.message) {

        case 'show_page_action':
            chrome.pageAction.show(sender.tab.id);
            break;

        case 'download':
            saveDirectory = request.directory ? request.directory : false;
            chrome.downloads.download({
                url: request.url
            });
            break;

        case 'open_settings':
            chrome.tabs.create({url: 'html/options.html'});
            break;

        default:
            _gaq.push(['_trackEvent', request.message[0], request.message[1]]);
            break;

        }

    });

    /**
     * Clicking on page action button
     */
    chrome.pageAction.onClicked.addListener(function () {
        chrome.tabs.create({url: 'html/options.html'});
    });

    /**
     * Get default save directory
     */
    chrome.storage.sync.get({defaultDirectory: false}, function (object) {
        defaultDirectory = object.defaultDirectory;
    });

    /**
     * Keep default directory updated
     */
    chrome.storage.onChanged.addListener(function (changes) {
        if (changes.defaultDirectory) {
            defaultDirectory = changes.defaultDirectory.newValue;
        }
    });

}());
