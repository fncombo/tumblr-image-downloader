'use strict';

/* globals TID, chrome */

/**
 * Downloading images
 * @type {Object}
 */
TID.downloadingImages = {};

// Override file names by adding the user's directory of choice
chrome.downloads.onDeterminingFilename.addListener(function (downloadItem, suggest) {
    // Ignore files not by the extension
    if (downloadItem.byExtensionId !== chrome.runtime.id) {
        return;
    }

    var downloadingImage;

    if (TID.downloadingImages.hasOwnProperty(downloadItem.url)) {
        downloadingImage = TID.downloadingImages[downloadItem.url];
    } else {
        console.error('Downloading image URL does not seem to exist in downloading images object',
            downloadItem, TID.downloadingImages);

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

/**
 * Go through each downloading image and remove it if we've used it
 */
TID.cleanupDownloadingImages = function () {
    Object.keys(TID.downloadingImages).forEach(function (key) {
        if (
            TID.downloadingImages[key].hasOwnProperty('filenameDetermined') &&
            TID.downloadingImages[key].filenameDetermined
        ) {
            delete TID.downloadingImages[key];
        }
    });
};

/**
 * Download an image and save in the databse if the user enabled that option
 * @param  {String} url URL of the image to download
 */
TID.downloadImage = function (url) {
    chrome.downloads.download({
        url: url,
        saveAs: false,
    }, function (downloadId) {
        chrome.downloads.search({
            id: downloadId,
        }, function (results) {
            if (!results || !results.length) {
                console.log('Image downloaded by not found in download history', downloadId);
            }

            var downloadItem = results[0];

            console.log('Download finished', downloadItem);

            // Do not save to the database if the setting is turned off
            if (!TID.vars.rememberImages) {
                TID.cleanupDownloadingImages();
                return;
            }

            var downloadingImage = TID.downloadingImages[downloadItem.url];
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

                TID.cleanupDownloadingImages();
            });
        });
    });
};
