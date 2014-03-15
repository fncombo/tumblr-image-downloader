'use strict';

/* globals TID, chrome, $, $$ */

TID.events = { };

/**
 * Event to download an image from a download button
 * @param {Event} event The event
 */
TID.events.buttonImageDownload = function (event) {

    var parent = event.target.parentNode;
    var imageID = parent.dataset.imageId;
    var url = parent.dataset.url;
    var isHD = parent.dataset.hd === 'true' ? true : false;
    var hasDownloaded = TID.images.exists(imageID);

    // If don't care about confirmation or not downloaded yet, download
    if (!TID.settings.confirm || (TID.settings.confirm && !hasDownloaded)) {

        TID.images.download(url, imageID);

        if (TID.isArchivePage) {
            TID.sendMessage(['Downloaded Image', 'Archive']);
        } else {
            TID.sendMessage(['Downloaded Image', isHD ? 'HD' : 'SD']);
        }

    // Otherwise ask for confirmation
    } else if (hasDownloaded) {

        TID.ui.confirmDialog(function (accept) {
            if (accept) {

                TID.images.download(url, imageID);

                if (TID.isArchivePage) {
                    TID.sendMessage(['Downloaded Image', 'Archive']);
                } else {
                    TID.sendMessage(['Downloaded Image', isHD ? 'HD' : 'SD']);
                }

            }
        });

    }

};

/**
 * Event to download an image from a directory button
 * @param {Event} event The event
 */
TID.events.directoryImageDownload = function (event) {

    var parent = event.target.ancestor(3);
    var imageID = parent.dataset.imageId;
    var url = parent.dataset.url;
    var directory = event.target.dataset.directory;
    var hasDownloaded = TID.images.exists(imageID);

    // If don't care about confirmation or not downloaded yet, download
    if (!TID.settings.confirm || (TID.settings.confirm && !hasDownloaded)) {

        TID.images.download(url, imageID, directory);
        TID.sendMessage(['Downloaded Image', 'To Directory']);

    // Otherwise ask for confirmation
    } else if (hasDownloaded) {

        TID.ui.confirmDialog(function (accept) {
            if (accept) {
                TID.images.download(url, imageID, directory);
                TID.sendMessage(['Downloaded Image', 'To Directory']);
            }
        });

    }

};

/**
 * Initialise all document event listeners
 */
TID.events.initDocumentEvents = function () {

    // Download list events
    document.addEventListener('click', function (event) {

        var el = event.target;

        // Set up downloading via normal download button
        if (el.matchesSelector('.' + TID.classes.downloadDiv)) {

            event.stopPropagation();
            event.preventDefault();

            TID.events.buttonImageDownload(event);

            return;

        }

        // Set up downloading via directory list buttons
        if (el.matchesSelector('.' + TID.classes.list + ' li:not(.' + TID.classes.help + ')')) {

            event.stopPropagation();
            event.preventDefault();

            TID.events.directoryImageDownload(event, event.target.dataset.directory);

            return;

        }

        // Set up link to the options page
        if (el.matchesSelector('.' + TID.classes.help)) {

            event.stopPropagation();
            event.preventDefault();

            TID.sendMessage('open_settings');

            return;

        }

    }, true);

};

/**
 * Initialize all Chrome storage event listeners
 */
TID.events.initStorageListener = function () {

    chrome.storage.onChanged.addListener(function (changes) {

        // A new image was downloaded
        if (changes.hasOwnProperty('images')) {

            // Update the downloaded images array
            TID.images.downloaded = changes.images.newValue || [];

            // If the new value is empty, all images have been cleared, remove all ticks
            if (!changes.images.hasOwnProperty('newValue')) {

                TID.ticks.removeAll();

            // New image has been added, get the last ID and add a tick to it
            } else {

                var imageID = changes.images.newValue[changes.images.newValue.length - 1];
                TID.ticks.add(imageID);

            }

            return;

        }

        // If the save directories were modified
        if (changes.hasOwnProperty('saveDirectories')) {

            TID.directories.list = changes.saveDirectories.newValue;
            TID.directories.html = TID.directories.format();

            // Update all the lists' HTML
            $$('.' + TID.classes.list + ' ul').forEach(function (el) {
                el.outerHTML = TID.directories.html;
            });

            return;

        }

        // Check if any settings were updated
        Object.keys(TID.settings.list).forEach(function (setting) {
            if (changes.hasOwnProperty(setting)) {
                TID.settings.list[setting].set(changes[setting].newValue);
            }
        });

    });

};

/**
 * Initialize all Chrome message event listeners
 */
TID.events.initMessageListener = function () {

    chrome.runtime.onMessage.addListener(function (request) {

        switch (request.message) {

        case 'not_image':

            if (!TID.images.exists(request.imageID)) {
                TID.images.remove(request.imageID);
                TID.ticks.remove(request.imageID);
            }

            var message = TID.msg('linkNotImage');
            var buttons = [TID.msg('downloadFromTumblr'), TID.msg('openLinkInNewTab'), TID.msg('cancel')];

            TID.ui.showDialog(message, buttons, function (i) {

                switch (i) {

                case '0':
                    var button = $('.' + TID.classes.download + '[data-image-id="' + request.imageID + '"]');
                    TID.images.download(button.nextElementSibling.src, request.imageID, request.directory);
                    break;

                case '1':
                    TID.sendMessage({
                        message: 'open_tab',
                        url: request.url
                    });
                    break;

                }

            });

            break;

        }

    });

};

/**
 * Initialize all DOM mutation observers
 */
TID.events.initMutationObservers = function () {

    // Create a DOM mutation observer for the lightbox middle image
    var centerImageObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {

            var imageID = TID.images.getID(mutation.target.src);

            // Get the button of the image with that ID from the page
            var button = $('.' + TID.classes.download + '[data-image-id="' + imageID + '"]');

            if (button) {

                button = button.cloneNode(true);

            // If the button doesn't exist because we're not on the dashboard, make one
            // Use the "src" attribute from the image because Tumblr will automatically give us the largest one
            } else {

                var isHD = TID.regex.image1280.test(mutation.target.src);
                var data = {
                    imageID: imageID,
                    isHD: isHD,
                    HDType: isHD ? TID.HDTypes.tumblrHighRes : TID.HDTypes.none,
                    url: mutation.target.src
                };
                button = TID.buttons.create(data);

            }

            // Give the button correct offsets
            button.style.position = 'relative';
            button.style.top = mutation.target.style.top;
            button.style.left = mutation.target.style.left;

            // Remove any existing buttons
            $$('.' + TID.classes.download, mutation.target.parentNode).forEach(function (el) {
                el.remove();
            });

            // Append the button
            mutation.target.parentNode.appendChild(button);

        });
    });

    // Create a DOM mutation observer for the body
    var lightboxObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (el) {

            for (var i = 0, l = el.addedNodes.length; i < l; i += 1) {

                if (el.addedNodes[i].id === 'tumblr_lightbox') {

                    centerImageObserver.observe($('#tumblr_lightbox_center_image'), {
                        attributes: true,
                        attributeFilter: ['src']
                    });

                    break;

                }

            }

        });
    });

    // Start observing
    lightboxObserver.observe(document.body, {
        childList: true
    });

    // Create a DOM mutation observer for inline post images
    var inlineImageObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {

            var blockEl;

            if (
                (
                    !mutation.target.classList.contains('inline_external_image') &&
                    !mutation.target.classList.contains('inline_image')
                ) ||
                (
                    mutation.target.classList.contains('inline_external_image') &&
                    mutation.target.classList.contains('enlarged')
                )
            ) {

                var isExternal = !!mutation.target.classList.contains('inline_external_image');
                var data = {
                    imageID: TID.images.getID(mutation.target.src),
                    isHD: false,
                    HDType: isExternal ? TID.HDTypes.externalHighRes : TID.HDTypes.none,
                    url: mutation.target.src
                };
                var button = TID.buttons.create(data);

                // Remove any existing butons
                $$('.' + TID.classes.download, mutation.target.parentNode).forEach(function (el) {
                    el.remove();
                });

                // Append the button
                blockEl = mutation.target.closest('p, div:not(.post_container)');
                blockEl.classList.add(TID.classes.parent);
                blockEl.insertBefore(button, mutation.target);

            } else {

                // Remove any buttons
                blockEl = mutation.target.closest('p, div:not(.post_container)');
                $$('.' + TID.classes.download, blockEl).forEach(function (el) {
                    el.remove();
                });

            }

        });
    });

    // Observe each inline image
    $$('.inline_image, .inline_external_image').forEach(function (el) {
        inlineImageObserver.observe(el, {
            attributes: true,
            attributeFilter: ['src', 'class']
        });
    });

};
