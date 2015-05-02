'use strict';

/* globals TID, chrome */

/**
 * Downloads functions
 * @type {Object}
 */
TID.downloads = {};

/**
 * Object of currently active downloads by this extension
 * @type {Object}
 */
TID.downloads.activeDownloads = {};

/**
 * Object of functions to handle various download states
 * @type {Object}
 */
TID.downloads.handleDownloadState = {};

/**
 * Go through each downloading image and remove it if we've used it
 */
TID.downloads.cleanupActiveDownloads = function () {
    Object.keys(TID.downloads.activeDownloads).forEach(function (key) {
        if (
            TID.downloads.activeDownloads[key].hasOwnProperty('filenameDetermined') &&
            TID.downloads.activeDownloads[key].filenameDetermined
        ) {
            delete TID.downloads.activeDownloads[key];
        }
    });
};

/**
 * Download an image and save in the databse if the user enabled that option
 * @param  {String} url URL of the image to download
 */
TID.downloads.downloadImage = function (url) {
    chrome.downloads.download({
        url: url,
        saveAs: false,
    }, function (downloadId) {
        TID.downloads.activeDownloads[url].downloadId = downloadId;
    });
};

/**
 * Handler for when a download completes
 * @param  {Object} downloadingImage TID.downloads.activeDownloads object
 * @param  {Object} downloadItem     Chrome object
 */
TID.downloads.handleDownloadState.complete = function (downloadingImage, downloadItem) {
    console.log('Download finished', downloadItem);

    // Do not save to the database if the setting is turned off
    if (!TID.vars.rememberImages) {
        TID.downloads.cleanupActiveDownloads();
        return;
    }

    var directory;

    // Figure out which directory it was saved to
    if (downloadingImage.saveDirectory) {
        directory = downloadingImage.saveDirectory;
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

        TID.downloads.cleanupActiveDownloads();
    });
};

/**
 * Handler for when a download is interrupted
 * @param  {Object} downloadingImage TID.downloads.activeDownloads object
 * @param  {Object} downloadItem     Chrome object
 */
TID.downloads.handleDownloadState.interrupted = function (downloadingImage, downloadItem) {
    var error = 'UNKNOWN_ERROR';

    if (downloadItem.hasOwnProperty('error') && typeof downloadItem.error === 'string') {
        error = downloadItem.error;
    }

    console.warn('Download failed', downloadItem, downloadItem.state, error);

    TID.trackEvent('Download Failed', error);

    chrome.tabs.sendMessage(downloadingImage.tabId, {
        message: 'download_failed',
        error: error,
        downloadingImage: downloadingImage,
    });

    TID.downloads.cleanupActiveDownloads();
};

// Override file names by adding the user's directory of choice
chrome.downloads.onDeterminingFilename.addListener(function (downloadItem, suggest) {
    // Ignore files not by the extension
    if (downloadItem.byExtensionId !== chrome.runtime.id) {
        return;
    }

    var downloadingImage;

    if (TID.downloads.activeDownloads.hasOwnProperty(downloadItem.url)) {
        downloadingImage = TID.downloads.activeDownloads[downloadItem.url];
    } else {
        console.error('Downloading image URL does not seem to exist in downloading images object',
            downloadItem, TID.downloads.activeDownloads);

        return;
    }

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

    downloadingImage.filenameDetermined = true;
});

// Listen for changes to download items
chrome.downloads.onChanged.addListener(function (downloadDelta) {
    var downloadId = downloadDelta.id;

    chrome.downloads.search({
        id: downloadId
    }, function (results) {
        if (!results || !results.length) {
            console.log('Image downloaded but not found in download history', downloadId);
            return;
        }

        var downloadItem = results[0];

        console.log(downloadItem);

        if (downloadItem.byExtensionId !== chrome.runtime.id) {
            console.log('Download not by this extension, ignoring');
            return;
        }

        var downloadingImage = TID.downloads.activeDownloads[downloadItem.url];

        // Handle the current download state of the file
        switch (downloadItem.state) {
        case 'complete':
            TID.downloads.handleDownloadState.complete(downloadingImage, downloadItem);
            break;

        case 'interrupted':
            TID.downloads.handleDownloadState.interrupted(downloadingImage, downloadItem);
            break;
        }
    });
});
