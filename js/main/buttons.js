'use strict';

/* globals TID, $, $$ */

/**
 * Buttons functions
 * @type {Object}
 */
TID.buttons = {};

/**
 * Add download buttons to all images on the page
 */
TID.buttons.add = function () {
    console.log('Adding buttons');

    $$(TID.selectors.images).forEach(function (el) {
        // Don't add buttons to this image anymore
        el.classList.add(TID.classes.ignore);

        if (TID.isArchivePage) {
            var data = {
                imageId: TID.images.getID(el.dataset.imageurl),
                isHD: false,
                HDType: TID.HDTypes.none,
                url: el.dataset.imageurl
            };

            TID.buttons.create(data, function (button) {
                el.closest('.post').prependChild(button);
            });
        } else {
            TID.buttons.create(TID.images.getData(el), function (button) {
                if (TID.isSinglePage) {
                    $('#nav_image').appendChild(button);
                } else {
                    var parent = el.parentNode;

                    parent.classList.add(TID.classes.parent);
                    parent.prependChild(button);
                }
            });
        }
    });

    TID.trackEvent('Download Buttons', 'Added');
};

/**
 * Create a new download button based on the given parameters
 * @param  {Object}   imageData An object containing all the image data form TID.images.getData
 * @param  {Function} callback  Callback when the button has been created
 * @return {Element}            The element node for the constructed button
 */
TID.buttons.create = function (imageData, callback) {
    console.log('Creating a button for', imageData);

    var div = document.createElement('div');

    // Core container
    var el = div.cloneNode(false);
    el.classList.add(TID.classes.download);
    el.dataset.imageId = imageData.imageId;
    el.dataset.isHd = imageData.isHD;
    el.dataset.hdType = imageData.HDType;
    el.dataset.url = imageData.url;

    // Check if the image has already been downloaded
    TID.images.exists(imageData.imageId, function (exists, directories) {
        if (exists) {
            el.classList.add(TID.classes.downloaded);
        }

        // Main download button
        var download = div.cloneNode(false);
        download.classList.add(TID.classes.downloadDiv);
        download.innerHTML = imageData.isHD ? TID.msg('downloadHD') : TID.msg('download');

        // If HD is from an external site, add an arrow and a tooltip
        if (imageData.HDType === TID.HDTypes.externalHighRes) {
            download.innerHTML += '&#10138;';
            download.title = TID.msg('extenalHDImageTitle');

            var imageDomain = imageData.url.match(TID.regex.imageDomain);
            if (imageDomain && imageDomain.length === 2) {
                download.title += '\n' + imageDomain[1];
            }
        }

        el.appendChild(download);

        // Directories drop-down
        var directoriesEl = TID.directories.clone(directories);
        el.appendChild(directoriesEl);

        // Button hover events
        el.onmouseover = el.onmouseout = function (event) {
            var action = event.type === 'mouseover' ? 'add' : 'remove';

            if (TID.isArchivePage) {
                el.parentNode.classList[action](TID.classes.highlight);
            } else if (el.ancestor(2).classList.contains('photoset_row')) {
                el.ancestor(2).classList[action](TID.classes.photoset);
            }
        };

        callback(el);
    });
};
