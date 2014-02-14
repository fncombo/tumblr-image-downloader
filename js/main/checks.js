'use strict';

/* globals TID */

/**
 * Check if the image has already been downloaded and prompt the user if needed
 */
TID.hasDownloaded = function (imageID) {
    return TID.confirm && TID.downloadedImages.indexOf(imageID) !== -1 && !TID.confirmDialog();
};
