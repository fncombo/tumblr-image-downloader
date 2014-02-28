'use strict';

/* globals TID, chrome */

/**
 * Get the Tumblr image ID from an image URL
 * @param  {String}  url URL to extract an image ID from
 * @return {String}      Returns the ID of the image if one was found, otherwise the URL
 */
TID.getImageID = function (url) {

    var imageID = url.match(TID.match.imageName);

    // If matched correctly, return the Tumblr image ID
    if (imageID && imageID.length === 2) {
        return imageID[1];
    }

    // Return the whole URL
    return url;

};

/**
 * Check if a HD version of the image is available using the markup
 * @param  {Element} imageEl HTML element of the image <img>
 * @return {Object}          Object containing various information about the image
 */
TID.getImageData = function (imageEl) {

    var data = {};

    // If it has a dedicated high res link
    if (imageEl.closest('.high_res_link')) {

        data.url = imageEl.closest('.high_res_link').href;

        // If it has "tumblr.com" in the URL, it's probably from Tumblr
        if (imageEl.closest('.high_res_link').href.match(TID.match.tumblrDomain)) {

            data.isHD = 'tumblr_high_res';

            // If the link is not to an image, it must be to the fancy preview page
            // So just get the 1280 link manually
            if (!imageEl.closest('.high_res_link').href.match(TID.match.imageExt)) {
                data.url = imageEl.src.replace(TID.match.tumblrImgRes, '_1280.');
            }

        // If it's a straight up link to an image, it's probably external
        } else {

            data.isHD = 'external_high_res';

        }

    // If it's a link to an image
    } else if (imageEl.closest('a') && imageEl.closest('a').href.match(TID.match.imageExt)) {

        // Get the link's image size and the current image's size
        var imageLinkSize = imageEl.closest('a').href.match(TID.match.imageSize)[0];
        var originalImageSize = imageEl.src.match(TID.match.imageSize)[0];

        // If the link's image size is bigger, HD is available
        if (parseInt(imageLinkSize, 10) > parseInt(originalImageSize, 10)) {

            data = {
                isHD: 'tumblr_high_res',
                url: imageEl.closest('a').href
            };

        }

    }

    // In case no HD or correct URL found
    if (!data.isHD) {
        data.isHD = false;
    }
    if (!data.url) {
        data.url = imageEl.src;
    }

    return data;

};

/**
 * Check if a HD version is available by trying to load different resolutions
 * @param  {String}   url             A Tumblr URL of an image to check for
 * @param  {Function} callbackSuccess Callback function if a bigger image was found
 * @param  {Function} callbackError   Callback function if no bigger image was found
 */
TID.availableHDImage = function (url, callbackSuccess, callbackError) {

    var image = new Image();
    var resolutions = ['_1280.', '_500.', '_400.', '_250.', '_100.'];
    var curentResolution = 0;

    image.onload = function () {

        // Double check if a valid image was loaded - http://stackoverflow.com/a/1977898
        if (!image.naturalWidth || !image.naturalHeight) {
            image.onerror();
        } else {
            callbackSuccess.call(this, image.src);
        }

    };

    image.onerror = function () {

        curentResolution += 1;

        // Keep loading next biggest resolution until an image is loaded
        if (curentResolution !== resolutions.length - 1) {

            // http://stackoverflow.com/a/17656617
            setTimeout(function () {
                image.src = url.replace(TID.match.tumblrImgRes, resolutions[curentResolution]);
            }, 0);

        } else {

            // No better resolution was found
            callbackError.call(this, url);

        }

    };

    // Try to load the biggest resolution first
    image.src = url.replace(TID.match.tumblrImgRes, resolutions[curentResolution]);

};

/**
 * Download an image using the native Chrome API
 * @param  {String} url       URL of the image to download
 * @param  {String} imageID   ID of the image to remember
 * @param  {String} directory Directory to download to
 */
TID.downloadImage = function (url, imageID, directory) {

    if (!directory) {
        directory = false;
    }

    function sendMessage(url) {
        TID.sendMessage({
            message: 'download',
            url: url,
            directory: directory,
            imageID: imageID
        });
    }

    if (!TID.isArchivePage) {

        sendMessage(url);

    } else {

        TID.availableHDImage(url, function (url) {
            sendMessage(url);
        }, function (url) {
            sendMessage(url);
        });

    }

    TID.rememberImage(imageID);

};

/**
 * Update local storage with the image's ID
 * @param  {String} imageID ID of the image to remember
 */
TID.rememberImage = function (imageID) {

    chrome.storage.local.get({images: []}, function (object) {

        if (object.images.indexOf(imageID) === -1) {
            object.images.push(imageID);
            chrome.storage.local.set(object);
        }

    });

};

/**
 * Remove the image's ID from local storage
 * @param  {String} imageID ID of the image to remove
 */
TID.forgetImage = function (imageID) {

    chrome.storage.local.get({images: []}, function (object) {

        if (object.images.indexOf(imageID) !== -1) {
            var index = object.images.indexOf(imageID);
            object.images.splice(index, 1);
            chrome.storage.local.set(object);
        }

    });

};
