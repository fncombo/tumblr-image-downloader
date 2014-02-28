'use strict';

/* globals TID, chrome */

// Misc extension global variables
TID.vars = {};

// Add Google Analytics
TID.addAnalytics();

// When the extension is first installed, updated, or when Chrome is updated
chrome.runtime.onInstalled.addListener(function (details) {

    switch (details.reason) {

    case 'install':
        chrome.tabs.create({url: 'html/options.html'});
        break;

    case 'update':
        TID.showUpdateNotification();
        break;

    }

});

// Override file names by adding the user's directory of choice
chrome.downloads.onDeterminingFilename.addListener(function (downloadItem, suggest) {

    if (downloadItem.byExtensionId !== chrome.i18n.getMessage("@@extension_id")) {
        return;
    }

    // If a valid image
    if (
        downloadItem.danger === 'safe' &&
        (downloadItem.filename.match(/\.(?:jpe?g|png|gif)$/, 'i') || downloadItem.mime.match(/image/))
    ) {

        if (TID.vars.saveDirectory) {
            suggest({filename: TID.vars.saveDirectory + '/' + downloadItem.filename});
        } else if (TID.vars.defaultDirectory) {
            suggest({filename: TID.vars.defaultDirectory + '/' + downloadItem.filename});
        } else {
            suggest({filename: downloadItem.filename});
        }

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
        chrome.tabs.create({url: 'html/options.html'});
        break;

    case 'open_tab':
        chrome.tabs.create({url: request.url});
        break;

    default:
        window._gaq.push(['_trackEvent', request.message[0], request.message[1]]);
        break;

    }

});

// Clicking on page action button
chrome.pageAction.onClicked.addListener(function () {
    chrome.tabs.create({url: 'html/options.html'});
});

// Get default save directory
chrome.storage.sync.get({defaultDirectory: false}, function (object) {
    TID.vars.defaultDirectory = object.defaultDirectory;
});

// Keep default directory updated
chrome.storage.onChanged.addListener(function (changes) {
    if (changes.hasOwnProperty('defaultDirectory') && changes.defaultDirectory.hasOwnProperty('newValue')) {
        TID.vars.defaultDirectory = changes.defaultDirectory.newValue;
    }
});
