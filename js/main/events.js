'use strict';

/* globals TID, $$ */

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
    var isHd = parent.dataset.isHd === 'true' ? true : false;

    console.log('Downloading image from button', imageId);

    TID.images.exists(imageId, function (hasDownloaded) {

        // If don't care about confirmation or not downloaded yet, download
        if (!TID.settings.confirm || (TID.settings.confirm && !hasDownloaded)) {
            TID.images.download(url, imageId);

            if (TID.isArchivePage) {
                TID.trackEvent('Downloads', 'Downloaded Image', 'Archive', 1);
            } else {
                TID.trackEvent('Downloads', 'Downloaded Image', isHd ? 'HD' : 'SD', 1);
            }
        // Otherwise ask for confirmation
        } else if (hasDownloaded) {
            TID.ui.confirmDialog(function (accept) {
                if (accept) {
                    TID.images.download(url, imageId);

                    if (TID.isArchivePage) {
                        TID.trackEvent('Downloads', 'Downloaded Image', 'Archive', 1);
                    } else {
                        TID.trackEvent('Downloads', 'Downloaded Image', isHd ? 'HD' : 'SD', 1);
                    }
                }
            }, TID.isSinglePage ? false : url);
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
            TID.trackEvent('Downloads', 'Downloaded Image', 'Directory', 1);
        // Otherwise ask for confirmation
        } else if (hasDownloaded) {
            TID.ui.confirmDialog(function (accept) {
                if (accept) {
                    TID.images.download(url, imageId, directory);
                    TID.trackEvent('Downloads', 'Downloaded Image', 'Directory', 1);
                }
            }, TID.isSinglePage ? false : url);
        }
    }, true);
};

/**
 * Initialize all document event listeners
 */
TID.events.initDocumentEvents = function () {
    console.log('Initializing all document events');

    // Download list events
    document.addEventListener('click', function (event) {
        var el = event.target;
        var button;
        var imageId;
        var directory;

        if (!(el instanceof Element)) {
            console.error('Click event target was not an element', event, el);
            return;
        }

        // Set up downloading via normal download button
        if (el.matchesSelector('.' + TID.classes.downloadDiv)) {
            event.stopPropagation();
            event.preventDefault();

            button = event.target.parentNode;
            imageId = button.dataset.imageId;

            // Check for special actions via modifier keys
            if (TID.modifierKeys.checkAll(event, button, imageId)) {
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
            if (TID.modifierKeys.checkAll(event, button, imageId, directory)) {
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

        // Clicking on a link in a dialog to reveal an image
        if (el.matchesSelector('.' + TID.classes.revealImageLink)) {
            if (el.dataset.exists === 'false') {
                TID.ui.showDialog(TID.msg('whoa'), TID.msg('imageNotInDownloadFolder'), TID.msg('nevermind'));
                return;
            }

            TID.sendMessage({
                message: 'reveal_image',
                data: {
                    downloadId: el.dataset.downloadId,
                },
            });
        }
    }, true);
};
