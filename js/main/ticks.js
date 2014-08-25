'use strict';

/* globals TID, $$ */

TID.ticks = { };

/**
 * Add a tick to a button
 * @param {string} imageID ID of the button to add a tick to
 */
TID.ticks.add = function (imageID) {
    $$('.' + TID.classes.download + '[data-image-id="' + imageID + '"]').forEach(function (el) {
        el.classList.add(TID.classes.downloaded);
    });
};

/**
 * Remove a tck from a button
 * @param {string} imageID ID of the button to remove a tick from
 */
TID.ticks.remove = function (imageID) {
    $$('.' + TID.classes.download + '[data-image-id="' + imageID + '"]').forEach(function (el) {
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
 * @param {boolean} setting Whether or not to show the ticks
 */
TID.ticks.setVisibility = function (setting) {
    document.body.classList[setting ? 'add' : 'remove'](TID.classes.showTicks);
};
