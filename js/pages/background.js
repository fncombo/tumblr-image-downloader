'use strict';

/* globals TID, chrome, ga */

/**
 * Regular Expressions
 * @type {Object}
 */
TID.regex = TID.regex || {};

// Regular expression to match image files
TID.regex.imageFile = new RegExp('\\.(?:jpe?g|png|gif)$', 'i');

// Only add analytics if they haven't opted out
// Default to enabled
chrome.storage.sync.get({
    enableAnalytics: true
}, function (object) {
    if (object.enableAnalytics) {
        TID.activateAnalytics();
    }
});

// When the extension is first installed, updated, or when the browser is updated
chrome.runtime.onInstalled.addListener(function (details) {
    console.log('"onInstalled" triggered', details.reason);

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
    // Ignore files not by the extension
    if (downloadItem.byExtensionId !== chrome.runtime.id) {
        return;
    }

    console.log('Downloading item', downloadItem);

    // If a valid image
    if (
        downloadItem.danger === 'safe' &&
        (
            downloadItem.filename.match(TID.regex.imageFile) ||
            downloadItem.mime.indexOf('image') !== -1
        )
    ) {
        var directory;

        if (TID.vars.saveDirectory) {
            directory = TID.vars.saveDirectory;

            suggest({
                filename: TID.vars.saveDirectory + '/' + downloadItem.filename
            });
        } else if (TID.vars.defaultDirectory) {
            directory = TID.vars.defaultDirectory;

            suggest({
                filename: TID.vars.defaultDirectory + '/' + downloadItem.filename
            });
        } else {
            directory = false;

            suggest({
                filename: downloadItem.filename
            });
        }

        // Remember which directory the image was downlaoded to
        TID.vars.lastDownloadDirectory = directory;

    // If the link does not appear to link to an image
    } else {
        // Cancel the download
        chrome.downloads.cancel(downloadItem.id);

        // Prompt the user
        chrome.tabs.sendMessage(TID.vars.lastTabID, {
            message: 'not_image',
            imageId: TID.vars.lastImageId,
            directory: TID.vars.saveDirectory,
            url: downloadItem.url
        });
    }
});

// Listen to messages from other scripts
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('Received request', request, 'from', sender);

    var ret = false;

    switch (request.message) {
    case 'show_page_action':
        chrome.pageAction.show(sender.tab.id);
        break;

    case 'download':
        TID.vars.saveDirectory = request.data.directory;
        TID.vars.lastTabID = sender.tab.id;
        TID.vars.lastImageId = request.data.imageId;
        TID.vars.lastImageUrl = request.data.url;
        TID.vars.lastPageUrl = request.data.pageUrl;

        chrome.downloads.download({
            url: request.data.url,
            saveAs: false
        }, function (downloadId) {
            // Save the image
            TID.storage.saveImage({
                imageId: TID.vars.lastImageId,
                imageUrl: TID.vars.lastImageUrl,
                pageUrl: TID.vars.lastPageUrl,
                directory: TID.vars.lastDownloadDirectory,
                chromeDownloadId: downloadId
            });

            // Send message to all open tabs that the image was downloaded
            TID.sendToAllTabs('*://*.tumblr.com/*', {
                message: 'image_downloaded',
                data: {
                    imageId: TID.vars.lastImageId,
                    directory: TID.vars.lastDownloadDirectory
                }
            });

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

    case 'toggle_analytics':
        if (request.value) {
            TID.activateAnalytics();
        } else {
            TID.deactivateAnalytics();
        }
        break;

    case 'storage':
        switch (request.action) {
        case 'imageExists':
            // Keep the messaging channel open for async
            ret = true;
            TID.storage.imageExists(request.data.imageId, sendResponse);
            break;

        case 'removeImage':
            TID.storage.removeImage(request.data.imageId);

            // Send message to all open tabs that the image has been removed
            TID.sendToAllTabs('*://*.tumblr.com/*', {
                message: 'image_removed',
                data: {
                    imageId: request.data.imageId
                }
            });
            break;

        case 'clear':
            TID.storage.clear();

            // Send message to all open tabs that all images have been removed
            TID.sendToAllTabs('*://*.tumblr.com/*', {
                message: 'storage_cleared'
            });
            break;

        case 'count':
            ret = true;

            TID.storage.count(sendResponse);
            break;

        case 'reveal_image':
            TID.storage.revealImage(request.data.imageId);
            break;
        }
        break;

    case 'analytics':
        if (window.hasOwnProperty('ga') && typeof ga === 'function') {
            request.data.unshift('event');
            request.data.unshift('send');
            ga.apply(undefined, request.data);
        }
        break;
    }

    return ret;
});

// Get default save directory
chrome.storage.sync.get({
    defaultDirectory: false
}, function (object) {
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
