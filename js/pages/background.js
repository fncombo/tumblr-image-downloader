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

// Listen to messages from other scripts
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('Received request', request, 'from', sender);

    // Set to true to keep the messaging channel open for async requests
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

        TID.downloadImage(request.data.url);
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
