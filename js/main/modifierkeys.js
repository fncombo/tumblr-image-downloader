'use strict';

/* globals TID, $$ */

/**
 * Modifier key functions
 * @type {Object}
 */
TID.modifierKeys = {};

/**
 * Check for any modifier keys while clicking on a download button or download directory
 * @param  {Event}            event     The click event
 * @param  {Element}          button    The main download button
 * @param  {String}           imageId   ID of the image being clicked on
 * @param  {String|undefined} directory Directory, if any, being clicked on
 * @return {Boolean}                    Whether or not any modifier keys were active
 */
TID.modifierKeys.checkAll = function (event, button, imageId, directory) {
    var keys = ['ctrl', 'alt', 'shift'];
    var result = false;

    keys.forEach(function (key) {
        if (event[key + 'Key']) {
            TID.modifierKeys['trigger' + key.capitalize()](event, button, imageId, directory);
            result = true;
        }
    });

    return result;
};

/**
 * Trigger the download with the Ctrl key modifier
 * This will remove the image from the database if it has been downloaded
 * @param  {Event}            event     The click event
 * @param  {Element}          button    The main download button
 * @param  {String}           imageId   ID of the image being clicked on
 * @param  {String|undefined} directory Directory, if any, being clicked on
 * @return {Boolean}                    Whether or not any modifier keys were active
 */
TID.modifierKeys.triggerCtrl = function (event, button, imageId, directory) {
    console.log('Pressed with CTRL key', event, button, imageId, directory);
    TID.trackEvent('Modified Click', 'Ctrl');

    var title = TID.msg('modifierKeysCtrlClickTitle');

    // Image has been downloaded, it can be removed
    if (button.classList.contains(TID.classes.downloaded)) {
        // If the confirm message is turned off, just do it
        if (!TID.settings.ctrlClickConfirm) {
            TID.images.remove(imageId);
            return;
        }

        var message = TID.msg('ctrlKeyClick');
        var buttons = [TID.msg('yes'), TID.msg('no')];

        // Otherwise show a dialog
        TID.ui.showDialog(title, message, buttons, function (i) {
            switch (i) {
            case '0':
                TID.images.remove(imageId);
                break;
            }
        });
    // Image has not been downloaded, inform them about it
    } else {
        TID.ui.showDialog(title, TID.msg('ctrlKeyClickWarning'), TID.msg('okay'));
    }
};

/**
 * Trigger the download with the Alt key modifier
 * This will attempt to reveal the image in the file browser
 * @param  {Event}            event     The click event
 * @param  {Element}          button    The main download button
 * @param  {String}           imageId   ID of the image being clicked on
 * @param  {String|undefined} directory Directory, if any, being clicked on
 * @return {Boolean}                    Whether or not any modifier keys were active
 */
TID.modifierKeys.triggerAlt = function (event, button, imageId, directory) {
    console.log('Pressed with ALT key', event, button, imageId, directory);
    TID.trackEvent('Modified Click', 'Alt');

    // Image has been downloaded, try to reveal it
    if (button.classList.contains(TID.classes.downloaded)) {
        // Get image data first as we cannot access all of it on the archive page
        if (TID.isArchivePage) {
            TID.sendMessage({
                message: 'storage',
                action: 'get_image',
                data: {
                    imageId: button.dataset.imageId
                }
            }, function (image) {
                TID.ui.revealImage(image.imageUrl);
            });
        } else {
            TID.ui.revealImage(button.dataset.url);
        }
    // Image has not been downloaded, inform them about it
    } else {
        TID.ui.showDialog(TID.msg('modifierKeysAltClickTitle'), TID.msg('altKeyClickWarning'), TID.msg('okay'));
    }
};

/**
 * Trigger the download with the Shift key modifier
 * This will download all the images in a post (to the specified directory, if any)
 * @param  {Event}            event     The click event
 * @param  {Element}          button    The main download button
 * @param  {String}           imageId   ID of the image being clicked on
 * @param  {String|undefined} directory Directory, if any, being clicked on
 * @return {Boolean}                    Whether or not any modifier keys were active
 */
TID.modifierKeys.triggerShift = function (event, button, imageId, directory) {
    console.log('Pressed with SHIFT key', event, button, imageId, directory);
    TID.trackEvent('Modified Click', 'Shift');

    var title = TID.msg('modifierKeysShiftClickTitle');
    var post = button.closest(TID.selectors.post);

    function run () {
        // Trigger a click event on all the buttons in that post
        $$(selector, post).forEach(function (downloadButton, i) {
            // Keep downloads apart form each other so that IndexedDB can keep up
            setTimeout(function () {
                downloadButton.click();
            }, 100 * i);
        });
    }

    // If we can find the post for this image
    if (post) {
        // If the confirm message is turned off, just do it
        if (!TID.settings.shiftClickConfirm) {
            run();
            return;
        }

        var message;
        var selector;
        var buttons = [TID.msg('yes'), TID.msg('no')];

        if (directory) {
            message = TID.msg('shiftKeyClickWithDirectory', directory);
            selector = '.' + TID.classes.list + ' li[data-directory="' + directory + '"]';
        } else {
            message = TID.msg('shiftKeyClickWithoutDirectory');
            selector = '.' + TID.classes.downloadDiv;
        }

        // Otherwise show a dialog
        TID.ui.showDialog(title, message, buttons, function (i) {
            switch (i) {
            case '0':
                run();
                break;
            }
        });
    // If we can't find the post for this image
    } else {
        TID.ui.showDialog(title, TID.msg('shiftKeyClickWarning'), TID.msg('okay'));
    }
};
