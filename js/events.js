'use strict';

/* globals TID */

/**
 * Download an image from a directory button
 * @param  {Object} event The event
 */
TID.downloadFromDirectory = function (event) {

    var parent = event.target.ancestor(3);
    var imageID = parent.dataset.imageId;
    var url = parent.dataset.downloadUrl;
    var directory = event.target.dataset.directory;

    // If don't care about confirmation or not downloaded yet, download
    if (!TID.confirm || (TID.confirm && !TID.hasDownloaded(imageID))) {

        TID.downloadImage(url, imageID, directory);
        TID.sendMessage(['Downloaded Image', 'To Directory']);

    // Otherwise ask for confirmation
    } else if (TID.hasDownloaded(imageID)) {

        TID.confirmDuplicateDownload(function (accept) {
            if (accept) {
                TID.downloadImage(url, imageID, directory);
                TID.sendMessage(['Downloaded Image', 'To Directory']);
            }
        });

    }

};

/**
 * Download an image from the normal button
 * @param  {Object} event The event
 */
TID.downloadFromButton = function (event) {

    var parent = event.target.parentNode;
    var imageID = parent.dataset.imageId;
    var url = parent.dataset.downloadUrl;
    var isHD = parent.dataset.hd === 'true' ? true : false;

    // If don't care about confirmation or not downloaded yet, download
    if (!TID.confirm || (TID.confirm && !TID.hasDownloaded(imageID))) {

        TID.downloadImage(url, imageID);

        if (!TID.isArchivePage) {
            TID.sendMessage(['Downloaded Image', isHD ? 'HD' : 'SD']);
        } else {
            TID.sendMessage(['Downloaded Image', 'Archive']);
        }

    // Otherwise ask for confirmation
    } else if (TID.hasDownloaded(imageID)) {

        TID.confirmDuplicateDownload(function (accept) {
            if (accept) {

                TID.downloadImage(url, imageID);

                if (!TID.isArchivePage) {
                    TID.sendMessage(['Downloaded Image', isHD ? 'HD' : 'SD']);
                } else {
                    TID.sendMessage(['Downloaded Image', 'Archive']);
                }

            }
        });

    }

};
