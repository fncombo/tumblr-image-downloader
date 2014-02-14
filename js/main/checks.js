'use strict';

/* globals TID */

/**
 * Check if the image has already been downloaded and prompt the user if needed
 * @param  {String}  imageID ID of the image to check for in storage
 * @return {Boolean}         Whether or not the user wants to download the image again
 */
TID.hasDownloaded = function (imageID) {
    return TID.confirm && TID.downloadedImages.indexOf(imageID) !== -1 && !TID.confirmDialog();
};
