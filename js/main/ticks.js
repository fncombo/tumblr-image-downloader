'use strict';

/* globals TID, $$ */

/**
 * Add a tick to a button with a certain image ID
 */
TID.addTick = function (imageID) {
    $$('.' + TID.classes.download + '[data-image-id="' + imageID + '"]').forEach(function (el) {
        el.classList.add(TID.classes.downloaded);
    });
};

/**
 * Remove tick from a certain imageID
 */
TID.removeTick = function (imageID) {
    $$('.' + TID.classes.downloaded + '[data-image-id="' + imageID + '"]').forEach(function (el) {
        el.classList.remove(TID.classes.downloaded);
    });
};

/**
 * Remove all ticks from all buttons
 */
TID.removeAllTicks = function () {
    $$('.' + TID.classes.downloaded).forEach(function (el) {
        el.classList.remove(TID.classes.downloaded);
    });
};
