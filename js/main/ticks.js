'use strict';

/* globals TID, $, $$ */

/**
 * Ticks functions
 * @type {Object}
 */
TID.ticks = {};

/**
 * Add a tick to a button
 * @param {String} imageId           ID of the button to add a tick to
 * @param {Array}  directoriesToTick Array of directories to which the image was downloaded
 */
TID.ticks.add = function (imageId, directoriesToTick) {
    $$('.' + TID.classes.download + '[data-image-id="' + imageId + '"]').forEach(function (el) {
        el.classList.add(TID.classes.downloaded);

        // Tick any directories that should be ticked (that this images has been downloaded to)
        if (directoriesToTick) {
            directoriesToTick.forEach(function (directory) {
                var listEl = $('li[data-directory="' + directory + '"]', el);
                if (listEl) {
                    listEl.classList.add(TID.classes.downloaded);
                }
            });
        }
    });
};

/**
 * Remove a tick from a button
 * @param {String} imageId ID of the button to remove a tick from
 */
TID.ticks.remove = function (imageId) {
    var selector = '.' + TID.classes.download + '[data-image-id="' + imageId + '"]';
    $$(selector + ', ' + selector + ' li').forEach(function (el) {
        el.classList.remove(TID.classes.downloaded);
    });
};

/**
 * Remove ticks from all buttons
 */
TID.ticks.removeAll = function () {
    $$('.' + TID.classes.downloaded).forEach(function (el) {
        el.classList.remove(TID.classes.downloaded);
    });
};

/**
 * Toggle whether or not to display download ticks on the page
 * @param {Boolean} setting Whether or not to show the ticks
 */
TID.ticks.setVisibility = function (setting) {
    document.body.classList[setting ? 'add' : 'remove'](TID.classes.showTicks);
};
