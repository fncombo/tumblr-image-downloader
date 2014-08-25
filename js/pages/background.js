'use strict';

/* globals TID, chrome, ga */

function activateAnalytics() {
    console.log('Enabling analytics');

    window['ga-disable-UA-52792308-1'] = false;

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

    ga('create', 'UA-52792308-1', 'auto');
    ga('set', 'checkProtocolTask', function () {});
    ga('require', 'displayfeatures');
    ga('send', 'pageview');
}

function deactivateAnalytics() {
    console.log('Disabling analytics');

    window['ga-disable-UA-40682860-1'] = true;

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
    console.log('Recieved request', request, 'from', sender);

    switch (request.message) {
    case 'show_page_action':
        chrome.pageAction.show(sender.tab.id);
        break;

    case 'download':

        TID.vars.saveDirectory = request.directory;
        TID.vars.lastTabID = sender.tab.id;
        TID.vars.lastImageID = request.imageID;

        chrome.downloads.download({
            url: request.url,
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

    default:
        if (window.hasOwnProperty('ga') && typeof ga === 'function') {
            ga('send', 'event', request.message[0], request.message[1]);
        }
        break;
    }
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
