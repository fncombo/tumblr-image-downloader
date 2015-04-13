'use strict';

/* globals TID, chrome, $, $$ */

/**
 * Events functions
 * @type {Object}
 */
TID.events = {};

/**
 * Event to download an image from a download button
 * @param {Event} event The event
 */
TID.events.buttonImageDownload = function (event) {
    var parent = event.target.parentNode;
    var imageId = parent.dataset.imageId;
    var url = parent.dataset.url;
    var isHD = parent.dataset.hd === 'true' ? true : false;

    console.log('Downloading image from button', imageId);

    TID.images.exists(imageId, function (hasDownloaded) {

        // If don't care about confirmation or not downloaded yet, download
        if (!TID.settings.confirm || (TID.settings.confirm && !hasDownloaded)) {
            TID.images.download(url, imageId);

            if (TID.isArchivePage) {
                TID.trackEvent('Downloaded Image', 'Archive');
            } else {
                TID.trackEvent('Downloaded Image', isHD ? 'HD' : 'SD');
            }
        // Otherwise ask for confirmation
        } else if (hasDownloaded) {
            TID.ui.confirmDialog(function (accept) {
                if (accept) {
                    TID.images.download(url, imageId);

                    if (TID.isArchivePage) {
                        TID.trackEvent('Downloaded Image', 'Archive');
                    } else {
                        TID.trackEvent('Downloaded Image', isHD ? 'HD' : 'SD');
                    }
                }
            }, url);
        }
    }, true);
};

/**
 * Event to download an image from a directory button
 * @param {Event} event The event
 */
TID.events.directoryImageDownload = function (event) {
    var parent = event.target.closest('.' + TID.classes.download);
    var imageId = parent.dataset.imageId;
    var url = parent.dataset.url;
    var directory = event.target.dataset.directory;

    console.log('Downloading image from dropdown', imageId);

    TID.images.exists(imageId, function (hasDownloaded) {
        // If don't care about confirmation or not downloaded yet, download
        if (!TID.settings.confirm || (TID.settings.confirm && !hasDownloaded)) {
            TID.images.download(url, imageId, directory);
            TID.trackEvent('Downloaded Image', 'To Directory');
        // Otherwise ask for confirmation
        } else if (hasDownloaded) {
            TID.ui.confirmDialog(function (accept) {
                if (accept) {
                    TID.images.download(url, imageId, directory);
                    TID.trackEvent('Downloaded Image', 'To Directory');
                }
            }, url);
        }
    }, true);
};

/**
 * Initialise all document event listeners
 */
TID.events.initDocumentEvents = function () {
    console.log('Initializing all document events');

    // Download list events
    document.addEventListener('click', function (event) {
        var el = event.target;
        var button;
        var imageId;
        var directory;

        // Set up downloading via normal download button
        if (el.matchesSelector('.' + TID.classes.downloadDiv)) {
            event.stopPropagation();
            event.preventDefault();

            button = event.target.parentNode;
            imageId = button.dataset.imageId;

            // Check for special actions via modifier keys
            if (TID.events.modifierKeys(event, button, imageId)) {
                return;
            }

            TID.events.buttonImageDownload(event);

            return;
        }

        // Set up downloading via directory list buttons
        if (el.matchesSelector('.' + TID.classes.list + ' li:not(.' + TID.classes.help + ')')) {
            event.stopPropagation();
            event.preventDefault();

            button = event.target.closest('.' + TID.classes.download);
            imageId = button.dataset.imageId;
            directory = event.target.dataset.directory;

            // Check for special actions via modifier keys
            if (TID.events.modifierKeys(event, button, imageId, directory)) {
                return;
            }

            TID.events.directoryImageDownload(event, directory);

            return;
        }

        // Set up link to the options page
        if (el.matchesSelector('.' + TID.classes.help)) {
            event.stopPropagation();
            event.preventDefault();

            TID.sendMessage('open_settings');

            return;
        }

        // Clicking on the overlay should cancel the dialog
        if (el.matchesSelector('.' + TID.classes.overlay)) {
            $$('.' + TID.classes.dialogButton).pop().click();
        }
    }, true);
};

/**
 * Check for any modifier keys while clicking on a download button or download directroy
 * @param  {Event}            event     The click event
 * @param  {Element}          button    The main download button
 * @param  {String}           imageId   ID of the image being clicked on
 * @param  {String|undefined} directory Directory, if any, being clicked on
 * @return {Boolean}                    Whether or not any modifier keys were active
 */
TID.events.modifierKeys = function (event, button, imageId, directory) {
    var buttons;

    // Ctrl-click on downloaded image should ask whether the user wants to remove it
    if (event.ctrlKey) {
        console.log('Pressed with CTRL key', event, button, imageId, directory);
        TID.trackEvent('Modified Click', 'Ctrl');

        // Image has been downloaded, it can be removed
        if (button.classList.contains(TID.classes.downloaded)) {
            buttons = [TID.msg('yes'), TID.msg('no')];

            TID.ui.showDialog(TID.msg('ctrlKeyClick'), buttons, function (i) {
                switch (i) {
                case '0':
                    TID.images.remove(imageId);
                    break;
                }
            });
        // Image has not been downloaded, inform them about it
        } else {
            TID.ui.showDialog(TID.msg('ctrlKeyClickWarning'), TID.msg('okay'));
        }

        return true;
    // Alt-click on an image should try to reveal it
    } else if (event.altKey) {
        console.log('Pressed with ALT key', event, button, imageId, directory);
        TID.trackEvent('Modified Click', 'Alt');

        // Image has been downloaded, try to reveal it
        if (button.classList.contains(TID.classes.downloaded)) {
            TID.sendMessage({
                message: 'storage',
                action: 'reveal_image',
                data: {
                    imageId: imageId
                }
            });
        // Image has not been downloaded, inform them about it
        } else {
            TID.ui.showDialog(TID.msg('altKeyClickWarning'), TID.msg('okay'));
        }

        return true;
    // Shift-clicking should try to download all images in a post
    } else if (event.shiftKey) {
        console.log('Pressed with SHIFT key', event, button, imageId, directory);
        TID.trackEvent('Modified Click', 'Shift');

        var post = button.closest(TID.selectors.post);

        // If we can find the post for this image
        if (post) {
            var message;
            if (directory) {
                message = TID.msg('shiftKeyClickWithDirectory', directory);
            } else {
                message = TID.msg('shiftKeyClickWithoutDirectory');
            }

            buttons = [TID.msg('yes'), TID.msg('no')];

            TID.ui.showDialog(message, buttons, function (i) {
                switch (i) {
                case '0':
                    var selector;
                    if (directory) {
                        selector = '.' + TID.classes.list + ' li[data-directory="' + directory + '"]';
                    } else {
                        selector = '.' + TID.classes.downloadDiv;
                    }

                    // Trigger a click event on all the buttons in that post
                    $$(selector, post).forEach(function (downloadButton, i) {
                        // Keep downloads apart form eachother so that IndexedDB can keep up
                        setTimeout(function () {
                            downloadButton.click();
                        }, 500 * i);
                    });
                    break;
                }
            });
        // If we can't find the post for this image
        } else {
            TID.ui.showDialog(TID.msg('shiftKeyClickWarning'), TID.msg('okay'));
        }

        return true;
    }

    return false;
};

/**
 * Initialize all Chrome storage event listeners
 */
TID.events.initStorageListener = function () {
    console.log('Initializing Chrome storage listeners');

    chrome.storage.onChanged.addListener(function (changes) {

        // If the save directories were modified
        if (changes.hasOwnProperty('saveDirectories')) {
            TID.directories.list = changes.saveDirectories.newValue;
            TID.directories.html = TID.directories.format();

            // Update all the lists' HTML
            $$('.' + TID.classes.list).forEach(function (el) {
                TID.images.exists(el.parentNode.dataset.imageId, function (exists, directories) {
                    var directoriesEl = TID.directories.clone(directories);
                    el.parentNode.replaceChild(directoriesEl, el);
                });
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
    console.log('Initializing Chrome message listeners');

    chrome.runtime.onMessage.addListener(function (request) {
        switch (request.message) {
        case 'not_image':
            TID.images.remove(request.imageId);
            TID.ticks.remove(request.imageId);

            var message = TID.msg('linkNotImage');
            var buttons = [TID.msg('downloadFromTumblr'), TID.msg('openLinkInNewTab'), TID.msg('cancel')];

            TID.ui.showDialog(message, buttons, function (i) {
                switch (i) {
                case '0':
                    var button = $('.' + TID.classes.download + '[data-image-id="' + request.imageId + '"]');
                    TID.images.download(button.nextElementSibling.src, request.imageId, request.directory);
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

        case 'image_downloaded':
            if (typeof request.data.directory === 'string') {
                TID.ticks.add(request.data.imageId, [request.data.directory]);
            } else {
                TID.ticks.add(request.data.imageId);
            }
            break;

        case 'image_removed':
            TID.ticks.remove(request.data.imageId);
            break;

        case 'storage_cleared':
            TID.ticks.removeAll();
            break;
        }
    });
};

/**
 * Initialize all DOM mutation observers
 */
TID.events.initMutationObservers = function () {
    console.log('Initializing DOM mutation observers');

    // Create a DOM mutation observer for the lightbox middle image
    var centerImageObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            var el = mutation.target;
            var imageId = TID.images.getID(el.src);
            var isHD = TID.regex.image1280.test(el.src);
            var data = {
                imageId: imageId,
                isHD: isHD,
                HDType: isHD ? TID.HDTypes.tumblrHighRes : TID.HDTypes.none,
                url: el.src
            };

            TID.buttons.create(data, function (button) {
                // Give the button correct offsets
                button.style.position = 'relative';
                button.style.top = el.style.top;
                button.style.left = el.style.left;

                // Remove any existing buttons
                $$('.' + TID.classes.download, el.parentNode).forEach(function (el) {
                    el.remove();
                });

                // Append the button
                el.parentNode.appendChild(button);
            });
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
            var el = mutation.target;
            var blockEl;

            if (
                (
                    !el.classList.contains('inline_external_image') &&
                    !el.classList.contains('inline_image')
                ) ||
                (
                    el.classList.contains('inline_external_image') &&
                    el.classList.contains('enlarged')
                )
            ) {
                var isExternal = !!el.classList.contains('inline_external_image');
                var data = {
                    imageId: TID.images.getID(el.src),
                    isHD: false,
                    HDType: isExternal ? TID.HDTypes.externalHighRes : TID.HDTypes.none,
                    url: el.src
                };

                TID.buttons.create(data, function (button) {
                    // Remove any existing butons
                    $$('.' + TID.classes.download, el.parentNode).forEach(function (el) {
                        el.remove();
                    });

                    // Append the button
                    blockEl = el.closest('p, div:not(.post_container)');
                    blockEl.classList.add(TID.classes.parent);
                    blockEl.insertBefore(button, el);
                });
            } else {
                // Remove any buttons
                blockEl = el.closest('p, div:not(.post_container)');
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
