'use strict';

/* globals TID, $$ */

TID.ticks = {};

/**
 * Add a tick to a button
 * @param {String} imageId ID of the button to add a tick to
 */
TID.ticks.add = function (imageId) {
    $$('.' + TID.classes.download + '[data-image-id="' + imageId + '"]').forEach(function (el) {
        el.classList.add(TID.classes.downloaded);
    });
};

/**
 * Remove a tck from a button
 * @param {String} imageId ID of the button to remove a tick from
 */
TID.ticks.remove = function (imageId) {
    $$('.' + TID.classes.download + '[data-image-id="' + imageId + '"]').forEach(function (el) {
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
