'use strict';

/* globals TID, chrome */

// Add Google Analytics
window._gaq = window._gaq || [];
window._gaq.push(['_setAccount', 'UA-40682860-1']);
window._gaq.push(['_trackPageview']);

var ga = document.createElement('script');
ga.type = 'text/javascript';
ga.async = true;
ga.src = 'https://ssl.google-analytics.com/ga.js';
var s = document.getElementsByTagName('script')[0];
s.parentNode.insertBefore(ga, s);

// When the extension is first installed, updated, or when Chrome is updated
chrome.runtime.onInstalled.addListener(function (details) {

    switch (details.reason) {

    case 'install':
        chrome.tabs.create({
            url: 'html/options.html'
        });
        break;

    case 'update':
        TID.notifications.showUpdate();
        break;

    }

});

// Override file names by adding the user's directory of choice
chrome.downloads.onDeterminingFilename.addListener(function (downloadItem, suggest) {

    if (downloadItem.byExtensionId !== TID.msg('@@extension_id')) {
        return;
    }

    // If a valid image
    if (
        downloadItem.danger === 'safe' &&
        (downloadItem.filename.match(/\.(?:jpe?g|png|gif)$/, 'i') || downloadItem.mime.match(/image/))
    ) {

        if (TID.vars.saveDirectory) {
            suggest({
                filename: TID.vars.saveDirectory + '/' + downloadItem.filename
            });
        } else if (TID.vars.defaultDirectory) {
            suggest({
                filename: TID.vars.defaultDirectory + '/' + downloadItem.filename
            });
        } else {
            suggest({
                filename: downloadItem.filename
            });
        }

        chrome.storage.local.get({images: []}, function (object) {

            // Only add the ID if it doesn't already exist
            if (object.images.indexOf(TID.vars.lastImageID) === -1) {
                object.images.push(TID.vars.lastImageID);
                chrome.storage.local.set(object);
            }

        });

    // If the link does not appear to link to an image
    } else {

        // Cancel the download
        chrome.downloads.cancel(downloadItem.id);

        // Prompt the user
        chrome.tabs.sendMessage(TID.vars.lastTabID, {
            message: 'not_image',
            imageID: TID.vars.lastImageID,
            directory: TID.vars.saveDirectory,
            url: downloadItem.url
        });

    }

});

// Listen to messages from other scripts
chrome.runtime.onMessage.addListener(function (request, sender) {

    switch (request.message) {

    case 'show_page_action':
        chrome.pageAction.show(sender.tab.id);
        break;

    case 'download':

        TID.vars.saveDirectory = request.directory;
        TID.vars.lastTabID = sender.tab.id;
        TID.vars.lastImageID = request.imageID;

        chrome.downloads.download({
            url: request.url
        });

        break;

    case 'open_settings':
        chrome.tabs.create({
            url: 'html/options.html'
        });
        break;

    case 'open_tab':
        chrome.tabs.create({
            url: request.url
        });
        break;

    default:
        window._gaq.push(['_trackEvent', request.message[0], request.message[1]]);
        break;

    }

});

// Get default save directory
chrome.storage.sync.get({defaultDirectory: false}, function (object) {
    TID.vars.defaultDirectory = object.defaultDirectory;
});

// Keep default directory updated
chrome.storage.onChanged.addListener(function (changes) {
    if (changes.hasOwnProperty('defaultDirectory')) {

        if (changes.defaultDirectory.hasOwnProperty('newValue')) {
            TID.vars.defaultDirectory = changes.defaultDirectory.newValue;
        } else {
            TID.vars.defaultDirectory = false;
        }

    }
});
