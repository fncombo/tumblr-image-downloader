'use strict';

/* globals TID, chrome */

TID.images = { };

// Storage of all the downloaded images
TID.images.downloaded = [];

/**
 * Update the current page's image storage array
 */
TID.images.update = function (callback) {

    chrome.storage.local.get({images: []}, function (object) {

        TID.images.downloaded = object.images;

        if (callback) {
            callback.call(undefined);
        }

    });

};

/**
 * Get the image's Tumblr ID or the whole URL
 * @param  {string} url The URL to search for the ID in
 * @return {string}     The found ID or the whole URL
 */
TID.images.getID = function (url) {

    // Try to match the image ID
    var imageID = url.match(TID.regex.imageID);

    // If the ID was found, return it, otherwise the whole URL
    if (imageID) {

        if (imageID[1]) {
            return imageID[1];
        } else {
            return imageID[2];
        }

    } else {
        return url;
    }

};

/**
 * Add an imageID or URL to storage
 * @param {string} imageID ID or URL of the image to add
 */
/*
TID.images.add = function (imageID) {

    chrome.storage.local.get({images: []}, function (object) {

        // Only add the ID if it doesn't already exist
        if (object.images.indexOf(imageID) === -1) {
            object.images.push(imageID);
            chrome.storage.local.set(object);
        }

    });

};
*/

/**
 * Remove an imageID or URL from storage
 * @param {string} imageID ID or URL of the image to remove
 */
TID.images.remove = function (imageID) {

    chrome.storage.local.get({images: []}, function (object) {

        // Only remove the ID if it exists
        if (object.images.indexOf(imageID) !== -1) {

            var index = object.images.indexOf(imageID);

            object.images.splice(index, 1);
            chrome.storage.local.set(object);

        }

    });

};

/**
 * Check whether an image exists in storage
 * @param  {string}  imageID ID or URL of the image to search for
 * @return {boolean}         Whether or not the image exists
 */
TID.images.exists = function (imageID) {
    return TID.images.downloaded.indexOf(imageID) !== -1 ? true : false;
};

/**
 * Replace the image size in a URL
 * @param  {string}         url     A valid Tumblr image URL
 * @param  {string|integer} newSize New newSize
 * @return {string}                 URL with the new image size
 */
TID.images.replaceSize = function (url, newSize) {
    return url.replace(TID.regex.imageSize, '$1' + newSize + '$3');
};

/**
 * Get the image size from a URL
 * @param  {string}          url A valid Tumblr image URL
 * @return {integer|boolean}     The found image size, or false
 */
TID.images.getSize = function (url) {

    // Try to match the image size
    var imageSize = url.match(TID.regex.imageSize);

    // If the size was found, return it, otherwise false
    return imageSize ? parseInt(imageSize[2], 10) : false;

};

/**
 * Get data about an image from its element
 * @param  {Element} el The image element to get information for
 * @return {object}     An object containing various data about the image
 */
TID.images.getData = function (el) {

    var data = {
        imageID: TID.images.getID(el.src),
        isHD: false,
        HDType: TID.HDTypes.none,
        url: el.src
    };

    if (TID.isSinglePage) {

        data.isHD = TID.regex.image1280.test(data.url);
        if (data.isHD) {
            data.HDType = TID.HDTypes.tumblrHighRes;
        }

        return data;

    }

    // Try to get the high resolution link
    var highResLink = el.closest('.high_res_link', 5);

    // Try to get the wrapping link tag
    var wrapLink = highResLink.nodeName === 'A' ? highResLink : el.closest('a', 5);

    if (highResLink) {

        data.isHD = true;
        data.url = highResLink.href;

        // If the high resolution link is from Tumblr
        if (TID.regex.tumblrDomain.test(highResLink.href)) {

            data.HDType = TID.HDTypes.tumblrHighRes;

            // If the link is not to an image, it must be to the fancy
            // preview page, so just get the 1280 link manually
            if (!TID.regex.imageExt.test(highResLink.href)) {
                data.url = TID.images.replaceSize(el.src, '1280');
            }

        // If it's a straight up link to an image, it's probably external
        } else {

            data.HDType = TID.HDTypes.externalHighRes;

        }

    } else if (wrapLink && TID.regex.imageExt.test(wrapLink.href)) {

        // Get the image's size and the link's image's size
        var originalImageSize = TID.images.getSize(el.src);
        var linkImageSize = TID.images.getSize(wrapLink.href);

        // If the link's image size is bigger, a HD version is available
        if (linkImageSize > originalImageSize) {
            data.isHD = true;
            data.HDType = TID.HDTypes.tumblrHighRes;
            data.url = wrapLink.href;
        }

    }

    return data;

};
/**
* Check if a Tumblr HD version of an image is available by trying to load different resolutions
* @param {string}   url             A Tumblr URL of an image to check for
* @param {Function} callbackSuccess Callback function if a bigger image was found
* @param {Function} callbackError   Callback function if no bigger image was found
*/
TID.images.checkHD = function (url, callbackSuccess, callbackError) {

    var initialResolution = TID.images.getSize(url);
    var image = new Image();
    var resolutions = [1280, 500, 400, 250, 100];
    var curentResolutionOffset = 0;

    image.onload = function () {

        // Double check if a valid image was loaded - http://stackoverflow.com/a/1977898
        if (!image.naturalWidth || !image.naturalHeight) {
            image.onerror();
        } else {
            callbackSuccess.call(undefined, image.src);
        }

    };

    image.onerror = function () {

        curentResolutionOffset += 1;

        // Keep loading next biggest resolution until an image is loaded
        if (curentResolutionOffset < initialResolution || curentResolutionOffset !== resolutions.length - 1) {

            // http://stackoverflow.com/a/17656617
            setTimeout(function () {
                image.src = TID.images.replaceSize(url, resolutions[curentResolutionOffset]);
            }, 0);

        } else {

            // No better resolution was found
            callbackError.call(undefined, url);

        }

    };

    // Try to load the biggest resolution first
    image.src = TID.images.replaceSize(url, resolutions[curentResolutionOffset]);

};

/**
 * Download an image from a URL to a directory (if any)
 * @param {string} url       The URL of the image to download
 * @param {string} imageID   ID or URL of the image to remember
 * @param {string} directory The firectory to download to, if any
 */
TID.images.download = function (url, imageID, directory) {

    directory = directory || false;

    function sendMessage(url) {
        TID.sendMessage({
            message: 'download',
            url: url,
            directory: directory,
            imageID: imageID
        });
    }

    if (TID.isArchivePage) {

        TID.images.checkHD(url, function (url) {
            sendMessage(url);
        }, function (url) {
            sendMessage(url);
        });

    } else {

        sendMessage(url);

    }

};
