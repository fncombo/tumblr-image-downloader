'use strict';

/* globals TID */

/**
 * Check if the image has already been downloaded
 * @param  {String}  imageID ID of the image to check for in storage
 * @return {Boolean}         Whether or not the user wants to download the image again
 */
TID.hasDownloaded = function (imageID) {
    return TID.downloadedImages.indexOf(imageID) !== -1 ? true : false;
};

/**
 * Show a download confirmation dialog
 * @param  {Function} callback The callback to call once the user answers
 */
TID.confirmDuplicateDownload = function (callback) {

    var message = 'You\'ve already downloaded this image before.<br>Are you sure you want to download it again?';
    var buttons = ['Yes', 'No'];

    function buttonsCallback (i) {
        callback.call(undefined, i === '0' ? true : false);
    }

    TID.showDialog(message, buttons, buttonsCallback);

};
