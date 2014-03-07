'use strict';

/* globals TID, $$ */

/**
 * Add buttons to all downloadable images
 */
TID.addButtons = function () {

    TID.sendMessage(['Added Download Buttons', 'Added']);

    $$(TID.selectors.images()).forEach(function (el) {

        // Skip images that are not part of the actual post
        var ancestor = el.ancestor(2);
        if (ancestor.classList.contains('caption') || ancestor.nodeName === 'BLOCKQUOTE') {
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

            var url = el.dataset.imageurl;
            button = TID.createDownloadButton(TID.getImageID(url), false, url);

            // Append the button
            container = el.closest('.post').querySelector('.post_micro_glass .hover_inner');
            container.insertBefore(button, container.firstChild);

        }

    });

};

/**
 * Create a download button
 * @param  {String}  imageID    The ID of the image to create a button for
 * @param  {Boolean} isHD       Whether or not a HD version of the image is available
 * @param  {String}  url        The URL of the image to be used for downloading
 * @param  {Boolean} isExternal Whether to show a simple external arrow
 * @return {Element}            Final HTML element of the button
 */
TID.createDownloadButton = function (imageID, isHD, url, isExternal) {

    // Core container
    var el = document.createElement('div');
    el.classList.add(TID.classes.download);
    el.dataset.downloadUrl = url;
    el.dataset.imageId = imageID;
    el.dataset.hd = isHD;

    // Main download button
    var download = document.createElement('div');
    download.classList.add(TID.classes.downloadDiv);
    download.innerText = TID.i18n('download');
    el.appendChild(download);

    // Directories drop-down
    var directories = document.createElement('div');
    directories.classList.add(TID.classes.list);
    directories.innerHTML += '<span>&#9660;</span><ul>' + TID.formattedDirectories + '</ul>';

    el.appendChild(directories);

    // Check if the image has already been downloaded
    if (TID.hasDownloaded(imageID)) {
        el.classList.add(TID.classes.downloaded);
    }

    // If any type of HD, add message
    if (isHD) {
        download.innerHTML = TID.i18n('downloadHD');
    }

    // If HD is from an external site, add an arrow and a tooltip
    if (isHD === 'external_high_res') {

        download.innerHTML += '&#10138;';
        download.title = TID.i18n('extenalHDImageTitle');

    // If image is just from an external side (not necessarily HD)
    } else if (isExternal) {

        download.innerHTML += '&#10138;';
        download.title = TID.i18n('extenalImageTitle');

    }

    el.onmouseover = el.onmouseout = function (event) {

        var action = event.type === 'mouseover' ? 'add' : 'remove';

        if (!TID.isArchivePage) {

            var ancestor = el.ancestor(2);
            if (ancestor.classList.contains('photoset_row')) {
                ancestor.classList[action](TID.classes.photoset);
            }

        } else {

            el.ancestor(3).classList[action](TID.classes.highlight);

        }

    };

    return el;

};
