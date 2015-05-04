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
            url: 'html/options.html',
        });

        TID.trackEvent('Extension', 'Installed');
        break;

    case 'update':
        TID.notifications.showUpdate();

        TID.trackEvent('Extension', 'Updated');
        break;
    }
});

// Listen to messages from other scripts
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('Received request', request, 'from', sender);

    // Set to true to keep the messaging channel open for async requests
    var keepChannelOpen = false;

    switch (request.message) {
    case 'show_page_action':
        chrome.pageAction.show(sender.tab.id);
        break;

    case 'download':
        TID.downloads.activeDownloads[request.data.url] = {
            directory: request.data.directory,
            tabId: sender.tab.id,
            imageId: request.data.imageId,
            imageUrl: request.data.url,
            pageUrl: request.data.pageUrl,
        };

        TID.downloads.downloadImage(request.data.url);
        break;

    case 'open_settings':
        chrome.tabs.create({
            url: 'html/options.html',
        });
        break;

    case 'open_tab':
        chrome.tabs.create({
            url: request.url,
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
        keepChannelOpen = true;

        chrome.downloads.search(request.data, sendResponse);
        break;

    case 'reveal_image':
        console.log('Attempting to reveal image', request.data.downloadId);
        chrome.downloads.show(parseInt(request.data.downloadId, 10));
        break;

    case 'storage':
        switch (request.action) {
        case 'get_image':
            keepChannelOpen = true;

            TID.storage.getImage(request.data.imageId, sendResponse);
            break;

        case 'image_exists':
            keepChannelOpen = true;

            TID.storage.imageExists(request.data.imageId, sendResponse);
            break;

        case 'remove_image':
            TID.storage.removeImage(request.data.imageId, function () {
                // Send message to all open tabs that the image has been removed
                TID.sendToAllTabs('*://*.tumblr.com/*', {
                    message: 'image_removed',
                    data: {
                        imageId: request.data.imageId,
                    },
                });
            });
            break;

        case 'clear':
            keepChannelOpen = true;

            TID.storage.clear(function () {
                // Send message to all open tabs that all images have been removed
                TID.sendToAllTabs('*://*.tumblr.com/*', {
                    message: 'storage_cleared',
                });

                // Callback
                sendResponse();
            });
            break;

        case 'count':
            keepChannelOpen = true;

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

    return keepChannelOpen;
});

// Get default save directory and download rememberer settings
chrome.storage.sync.get({
    defaultDirectory: false,
    rememberImages: true,
    nestInsideDefaultDirectory: false,
}, function (object) {
    TID.vars.defaultDirectory = object.defaultDirectory;
    TID.vars.rememberImages = object.rememberImages;
    TID.vars.nestInsideDefaultDirectory = object.nestInsideDefaultDirectory;
});

// Keep default directory updated
chrome.storage.onChanged.addListener(function (changes) {
    var keys = [
        'defaultDirectory',
        'rememberImages',
        'nestInsideDefaultDirectory',
    ];

    keys.forEach(function (key) {
        if (changes.hasOwnProperty(key)) {
            if (changes[key].hasOwnProperty('newValue')) {
                TID.vars[key] = changes[key].newValue;
            } else {
                TID.vars[key] = false;
            }
        }
    });
});
