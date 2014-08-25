'use strict';

/* globals TID, chrome, ga */

function sendToAllTabs (message) {
    chrome.tabs.query({
        url: '*://*.tumblr.com/*'
    }, function (tabs) {
        tabs.forEach(function (tab) {
            chrome.tabs.sendMessage(tab.id, message);
        });
    });
}

function activateAnalytics() {
    console.log('Enabling analytics');

    window['ga-disable-' + TID.trackingId] = false;

    /**
     * Google Analytics (analytics.js) script
     * http://goo.gl/7wc0Ff
     * Slightly modified the punctuation and order of variables
     * in order to to please JSHint
     */
    (function (i, s, o, r) {
        i.GoogleAnalyticsObject = r; // Acts as a pointer to support renaming.

        // Creates an initial ga() function.
        // The queued commands will be executed once analytics.js loads.
        i[r] = i[r] || function() {
            (i[r].q = i[r].q || []).push(arguments);
        };

        // Sets the time (as an integer) this tag was executed.
        // Used for timing hits.
        i[r].l = Date.now();

        // Insert the script tag asynchronously.
        // Inserts above current tag to prevent blocking in
        // addition to using the async attribute.
        var a = s.createElement(o);
        var m = s.getElementsByTagName(o)[0];
        a.async = 1;
        a.src = 'https://www.google-analytics.com/analytics.js';
        m.parentNode.insertBefore(a, m);
    }(window, document, 'script', 'ga'));

    ga('create', TID.trackingId, 'auto');
    ga('set', 'checkProtocolTask', function () {});
    ga('require', 'displayfeatures');
    ga('send', 'pageview');
}

function deactivateAnalytics() {
    console.log('Disabling analytics');

    window['ga-disable-UA-' + TID.trackingId] = true;

    document.querySelector('script[src*="google-analytics"]').remove();

    delete window.ga;
    delete window.gaplugins;
    delete window.gaGlobal;
}

// Only add analytics if they haven't disabled it
chrome.storage.sync.get({
    enableAnalytics: true
}, function (object) {
    if (object.enableAnalytics) {
        activateAnalytics();
    }
});

// When the extension is first installed, updated, or when Chrome is updated
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
    if (downloadItem.byExtensionId !== TID.msg('@@extension_id')) {
        return;
    }

    console.log('Downloading item', downloadItem);

    // If a valid image
    if (
        downloadItem.danger === 'safe' &&
        (
            downloadItem.filename.match(/\.(?:jpe?g|png|gif)$/, 'i') ||
            downloadItem.mime.match(/image/)
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

        // Save the image
        TID.storage.saveImage({
            imageId: TID.vars.lastImageId,
            imageUrl: TID.vars.lastImageUrl,
            pageUrl: TID.vars.lastPageUrl,
            directory: directory
        });

        // Send message to all open tabs that the image was downloaded
        sendToAllTabs({
            message: 'image_downloaded',
            data: {
                imageId: TID.vars.lastImageId
            }
        });
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
    console.log('Recieved request', request, 'from', sender);

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
            activateAnalytics();
        } else {
            deactivateAnalytics();
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
            sendToAllTabs({
                message: 'image_removed',
                data: {
                    imageId: request.data.imageId
                }
            });
            break;

        case 'clear':
            TID.storage.clear();

            // Send message to all open tabs that all images have been removed
            sendToAllTabs({
                message: 'storage_cleared'
            });
            break;

        case 'count':
            ret = true;

            TID.storage.count(sendResponse);
            break;
        }
        break;

    default:
        if (window.hasOwnProperty('ga') && typeof ga === 'function') {
            ga('send', 'event', request.message[0], request.message[1]);
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
