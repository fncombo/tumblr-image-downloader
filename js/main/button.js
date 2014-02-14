'use strict';

/* globals TID, $$ */

/**
 * Add buttons to all downloadable images
 */
TID.addButtons = function () {

    TID.sendMessage(['Added Download Buttons', 'Added']);

    $$(TID.selectors.images()).forEach(function (el) {

        // Skip images that are not part of the actual post
        if (el.ancestor(2).classList.contains('caption') || el.ancestor(2).nodeName === 'BLOCKQUOTE') {
            return;
        }

        // Don't add buttons to this image anymore
        el.classList.add(TID.classes.ignore);

        var button;
        var container;

        if (!TID.isArchivePage) {

            var imageData = TID.getImageData(el);
            button = TID.createDownloadButton(TID.getImageID(el.src), imageData.isHD, imageData.url);

            // Append the button
            container = el.parentNode;
            container.classList.add(TID.classes.parent);
            container.insertBefore(button, container.firstChild);

        } else {

            var url = el.getAttribute('data-imageurl');
            button = TID.createDownloadButton(TID.getImageID(url), false, url);

            // Append the button
            container = el.closest('.post').querySelector('.post_micro_glass .hover_inner');
            container.insertBefore(button, container.firstChild);

        }

    });

};

/**
 * Create a download button
 * @param  {String}  imageID The ID of the image to create a button for
 * @param  {Boolean} isHD    Whether or not a HD version of the image is available
 * @param  {String}  url     The URL of the image to be used for downloading
 * @return {Element}         Final HTML element of the button
 */
TID.createDownloadButton = function (imageID, isHD, url) {

    // Core container
    var el = document.createElement('div');
    el.classList.add(TID.classes.download);
    el.setAttribute('data-download-url', url);
    el.setAttribute('data-image-id', imageID);
    el.setAttribute('data-hd', isHD);

    // Main download button
    var download = document.createElement('div');
    download.classList.add(TID.classes.downloadDiv);
    download.innerText = 'Download';
    el.appendChild(download);

    // Directories drop-down
    var directories = document.createElement('div');
    directories.classList.add(TID.classes.list);
    directories.innerHTML += '<span>&#9660;</span>';

    var list = document.createElement('ul');
    list.innerHTML = TID.formatDirectories();

    directories.appendChild(list);
    el.appendChild(directories);

    // Check if the image has already been downloaded
    if (TID.downloadedImages.indexOf(imageID) !== -1) {
        el.classList.add(TID.classes.downloaded);
    }

    // If any type of HD, add message
    if (isHD) {
        download.innerHTML += '&nbsp;<strong>HD</strong>';
    }

    // If HD is from an external site, add an arrow and a tooltip
    if (isHD === 'external_high_res') {
        download.innerHTML += '&#10138;';
        download.title = 'HD image is from an external site';
    }

    el.onmouseover = function () {

        if (!TID.isArchivePage) {

            if (el.ancestor(2).classList.contains('photoset_row')) {
                el.ancestor(2).classList.add(TID.classes.photoset);
            }

        } else {

            el.ancestor(3).classList.add(TID.classes.highlight);

        }

    };

    el.onmouseout = function () {

        if (!TID.isArchivePage) {

            if (el.ancestor(2).classList.contains('photoset_row')) {
                el.ancestor(2).classList.remove(TID.classes.photoset);
            }

        } else {

            el.ancestor(3).classList.remove(TID.classes.highlight);

        }

    };

    return el;

};
