'use strict';

/* globals TID, chrome, $, $$ */

/**
 * Populate the TID object with live data and initialize all events/listeners
 */
TID.run = function () {

    TID.sendMessage('show_page_action');

    // Keep adding new buttons for pages with endless scrolling
    if (TID.isInfiniteScrolling || TID.isArchivePage) {

        var previousHeight = TID.getDocumentHeight();

        document.onscroll = function () {

            // If the height has changed, try adding buttons to new images (if any)
            if (previousHeight !== TID.getDocumentHeight()) {
                previousHeight = TID.getDocumentHeight();
                TID.addButtons();
            }

        };

    }

    // Update the downloaded images array
    chrome.storage.local.get({images: []}, function (object) {

        TID.downloadedImages = object.images;

        // Get list of directories
        TID.getDirectories(function () {

            TID.addButtons();

        });

    });

    // Get all the settings
    for (var setting in TID.settings) {
        if (TID.settings.hasOwnProperty(setting)) {

            var object = {};
            object[setting] = TID.settings[setting].default;

            chrome.storage.sync.get(object, TID.settings[setting].onLoad);

        }
    }

    TID.initChromeListeners();
    TID.initMutationObservers();
    TID.initDOMEvents();

};

/**
 * Initialize all DOM events
 */
TID.initDOMEvents = function () {

    // Download list events
    document.addEventListener('click', function (event) {

        var parent;
        var url;
        var imageID;
        var isHD;
        var directory;

        // Set up downloading via directory list buttons
        if (event.target.matchesSelector('.' + TID.classes.list + ' li:not(.' + TID.classes.help + ')')) {

            event.stopPropagation();
            event.preventDefault();

            parent = event.target.ancestor(3);
            imageID = parent.dataset.imageId;
            url = parent.dataset.downloadUrl;
            directory = event.target.dataset.directory;

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

        // Set up downloading via normal download button
        } else if (event.target.matchesSelector('.' + TID.classes.downloadDiv)) {

            event.stopPropagation();
            event.preventDefault();

            parent = event.target.parentNode;
            imageID = parent.dataset.imageId;
            url = parent.dataset.downloadUrl;
            isHD = parent.dataset.hd === 'true' ? true : false;

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

        // Set up link to the options page
        } else if (event.target.matchesSelector('.' + TID.classes.help)) {

            event.stopPropagation();
            event.preventDefault();

            TID.sendMessage('open_settings');

        }

    }, true);

};

/**
 * Initialize all DOM mutation observers
 */
TID.initMutationObservers = function () {

    // Create a DOM mutation observer for the lightbox middle image
    var centerImageObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {

            var imageID = TID.getImageID(mutation.target.src);

            // Get the button of the image with that ID from the page
            var button = $('.' + TID.classes.download + '[data-image-id=' + imageID + ']');

            if (button) {

                button = button.cloneNode(true);

            // If the button doesn't exist because we're not on the dashboard, make one
            // Use the "src" attribute from the image because Tumblr will automatically give us the largest one
            } else {

                var imageHDAvailable = mutation.target.src.match(TID.match.image1280) !== null ? true : false;
                button = TID.createDownloadButton(imageID, imageHDAvailable, mutation.target.src);

            }

            // Get half the image's height and width
            var top = Math.floor(mutation.target.clientHeight / 2);
            var left = Math.floor(mutation.target.clientWidth / 2);

            // Give the button correct offsets
            button.style.position = 'relative';
            button.style.top = '-' + top + 'px';
            button.style.left = '-' + left + 'px';

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

            var i = 0;
            var l = el.addedNodes.length;

            for (; i < l; i += 1) {

                if (el.addedNodes[i].id === 'tumblr_lightbox') {

                    centerImageObserver.observe($('#tumblr_lightbox_center_image'), {
                        attributes: true, attributeFilter: ['src']
                    });

                    break;

                }

            }

        });
    });

    // Start observing
    lightboxObserver.observe(document.body, {childList: true});

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

                var url = mutation.target.src;
                var imageID = TID.getImageID(url);
                var isExternal = !!mutation.target.classList.contains('inline_external_image');
                var button = TID.createDownloadButton(imageID, false, url, isExternal);

                // Remove any existing butons
                $$('.' + TID.classes.download, mutation.target.parentNode).forEach(function (el) {
                    el.remove();
                });

                // Append the button
                blockEl = mutation.target.closest('p, div:not(.post_container)');
                blockEl.classList.add(TID.classes.parent);
                blockEl.appendChild(button);

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
            attributes: true, attributeFilter: ['src', 'class']
        });
    });

};

/**
 * Initialize all Chrome event listeners
 */
TID.initChromeListeners = function () {

    // Monitor storage changes
    chrome.storage.onChanged.addListener(function (changes) {

        // If the download confirmation setting was changed, adjust the local setting
        if (changes.hasOwnProperty('confirm')) {

            TID.settings.confirm.onUpdate(changes);

        // If the images storage was updated
        } else if (changes.hasOwnProperty('images')) {

            // Update the downloaded images array
            TID.downloadedImages = changes.images.newValue || [];

            // If the new value is empty, all images have been cleared, remove all ticks
            if (!changes.images.hasOwnProperty('newValue')) {

                TID.removeAllTicks();

            // New image has been added, get the last ID and add a tick to it
            } else {

                var imageID = changes.images.newValue[changes.images.newValue.length - 1];
                TID.addTick(imageID);

            }

        // If the save directories were modified
        } else if (changes.hasOwnProperty('saveDirectories')) {

            TID.directories = changes.saveDirectories.newValue;

            var list = TID.formatDirectories();

            $$('.' + TID.classes.list + ' ul').forEach(function (el) {
                el.innerHTML = list;
            });

        // If the tick setting was changed
        } else if (changes.hasOwnProperty('showTicks')) {

            TID.settings.showTicks.onUpdate(changes);

        } else if (changes.hasOwnProperty('enableLocations')) {

            TID.settings.enableLocations.onUpdate(changes);

        }

    });

    // Listen to connections from the background script
    chrome.runtime.onMessage.addListener(function (request) {

        switch (request.message) {

        case 'not_image':

            TID.forgetImage(request.imageID);
            TID.removeTick(request.imageID);

            var message = 'Oops! The external link doesn\'t appear to be an image.<br>What would you like to do?';
            var buttons = ['Download the image from Tumblr', 'Go the link in a new tab', 'Cancel'];


            TID.showDialog(message, buttons, function (i) {

                switch (i) {

                case '0':

                    var button = $('.' + TID.classes.download + '[data-image-id="' + request.imageID + '"]');
                    var image = button.parentNode.querySelector('img');
                    TID.downloadImage(image.src, request.imageID, request.directory);

                    break;

                case '1':
                    TID.sendMessage({
                        message: 'open_tab',
                        url: request.url
                    });
                    break;

                case '2':
                    break;

                }

            });

            break;

        }

    });

};
