'use strict';

/* globals TID, chrome, ga */

/**
 * Regular Expressions
 * @type {Object}
 */
TID.regex = TID.regex || {};

// Regular expression to match image files
TID.regex.imageFile = new RegExp('\\.(?:jpe?g|png|gif)$', 'i');

/**
 * Downloading images
 * @type {Object}
 */
TID.downloadingImages = {};

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

    var downloadingImage = TID.downloadingImages[downloadItem.url];

    console.log('Downloading item', downloadItem);

    // If a valid image
    if (
        downloadItem.danger === 'safe' &&
        (
            downloadItem.filename.match(TID.regex.imageFile) ||
            downloadItem.mime.indexOf('image') !== -1
        )
    ) {
        if (downloadingImage.saveDirectory) {
            suggest({
                filename: downloadingImage.saveDirectory + '/' + downloadItem.filename
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

    // If the link does not appear to link to an image
    } else {
        // Cancel the download
        chrome.downloads.cancel(downloadItem.id);

        // Prompt the user
        chrome.tabs.sendMessage(downloadingImage.tabId, {
            message: 'not_image',
            imageId: downloadingImage.imageId,
            directory: downloadingImage.saveDirectory,
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
        TID.downloadingImages[request.data.url] = {
            saveDirectory: request.data.directory,
            tabId: sender.tab.id,
            imageId: request.data.imageId,
            imageUrl: request.data.url,
            pageUrl: request.data.pageUrl,
        };

        chrome.downloads.download({
            url: request.data.url,
            saveAs: false,
        }, function (downloadId) {
            chrome.downloads.search({
                id: downloadId,
            }, function (results) {
                if (!results || !results.length) {
                    console.log('Image downloaded by not found in download history', downloadId);
                }

                var downloadItem = results[0];
                var downloadingImage = TID.downloadingImages[downloadItem.url];
                var directory;

                console.log('Download finished', downloadItem);

                // Figure out which directory it was saved to
                if (downloadingImage.saveDirectory) {
                    directory = TID.vars.saveDirectory;
                } else if (TID.vars.defaultDirectory) {
                    directory = TID.vars.defaultDirectory;
                } else {
                    directory = false;
                }

                // Save the image
                TID.storage.saveImage({
                    imageId: downloadingImage.imageId,
                    imageUrl: downloadingImage.imageUrl,
                    pageUrl: downloadingImage.pageUrl,
                    directory: directory,
                }, function () {
                    // Send message to all open tabs that the image was downloaded
                    TID.sendToAllTabs('*://*.tumblr.com/*', {
                        message: 'image_downloaded',
                        data: {
                            imageId: downloadingImage.imageId,
                            directory: directory
                        }
                    });

                    // Remove the downloading image data
                    delete TID.downloadingImages[downloadItem.url];
                });
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

    case 'search_image':
        ret = true;

        chrome.downloads.search(request.data, sendResponse);
        break;

    case 'reveal_image':
        console.log('Attempting to reveal image', request.data.downloadId);
        chrome.downloads.show(parseInt(request.data.downloadId, 10));
        break;

    case 'storage':
        switch (request.action) {
        case 'image_exists':
            // Keep the messaging channel open for async
            ret = true;
            TID.storage.imageExists(request.data.imageId, sendResponse);
            break;

        case 'remove_image':
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
