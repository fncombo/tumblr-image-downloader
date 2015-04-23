'use strict';

/* globals TID, $, $$ */

/**
 * Events functions
 * @type {Object}
 */
TID.events = {};

/**
 * Clicking on the button to move an input
 * @param {Object}  event The triggered event
 * @param {Element} el    The element event was triggered on
 */
TID.events.mousedown = function (event, el) {
    event.preventDefault();
    event.stopPropagation();

    TID.vars.currentItem = el.parentNode;

    if (TID.vars.currentItem.classList.contains('blank')) {
        return;
    }

    TID.directories.addFake(TID.vars.currentItem);

    var elBoundingRect = TID.vars.currentItem.getBoundingClientRect();
    var elOffsetY = event.pageY + (elBoundingRect.height / 2) - 1; // -1 accounts for border
    elOffsetY -= elBoundingRect.height - (elBoundingRect.top - event.y);

    TID.vars.lastMouseY = event.pageY;

    TID.vars.currentItem.classList.add('moving');
    TID.vars.currentItem.style.position = 'absolute';
    TID.vars.currentItem.style.top = elOffsetY + 'px';

    TID.vars.moveDirection = false;
    TID.vars.moveDirectionLast = 0;
    TID.vars.offsetX = event.clientX;

    window.addEventListener('mousemove', TID.events.mousemove, false);
};

/**
 * Event handler for moving a directory input with the mouse
 * @param {Object} event The triggered event
 */
TID.events.mousemove = function (event) {
    // true = up, false = down
    TID.vars.moveDirection = event.clientY - TID.vars.moveDirectionLast < 0 ? true : false;
    TID.vars.moveDirectionLast = event.clientY;

    var li = document.elementFromPoint(TID.vars.offsetX, event.clientY).closest('li');

    if (li && !li.classList.contains('fake') && !li.classList.contains('blank')) {
        TID.directories.addFake(TID.vars.moveDirection ? li : li.nextSibling);
    }

    TID.vars.currentItem.style.top = parseInt(TID.vars.currentItem.style.top, 10) +
                                     (event.pageY - TID.vars.lastMouseY) + 'px';

    TID.vars.lastMouseY = event.pageY;
};

/**
 * Event handler for releasing a directory after dragging
 * @param {Object} event The triggered event
 */
TID.events.mouseup = function () {
    if (TID.vars.currentItem) {
        var fakeEl = $('#download-directories .fake');
        fakeEl.parentNode.replaceChild(TID.vars.currentItem, fakeEl);

        TID.vars.currentItem.style.position = 'relative';
        TID.vars.currentItem.style.top = '0px';
        TID.vars.currentItem.classList.remove('moving');
        TID.vars.currentItem = false;

        window.removeEventListener('mousemove', TID.events.mousemove, false);
    }
};

/**
 * Moving directories with Ctrl and arrow keys
 * @param {Object}  event The triggered event
 * @param {Element} el    The element event was triggered on
 */
TID.events.keyup = function (event, el) {
    var acceptedKeys = [38, 40];
    var keyCode = event.keyCode;

    // Skip keys that are not up/down arrows
    if (acceptedKeys.indexOf(keyCode) === -1) {
        return;
    }

    if (TID.vars.ctrlKey && !el.parentNode.classList.contains('blank')) {
        var parent = el.parentNode;
        var toMove;

        if (keyCode === 38 && parent.previousElementSibling) {
            toMove = parent.previousElementSibling;

            parent.parentNode.insertBefore(toMove.cloneNode(true), parent.nextElementSibling);
            toMove.remove();
        } else if (keyCode === 40 && !parent.nextElementSibling.classList.contains('blank')) {
            toMove = parent.nextElementSibling;

            if (!toMove.classList.contains('blank')) {
                parent.parentNode.insertBefore(toMove.cloneNode(true), parent);
                toMove.remove();
            }
        }
    } else if (!TID.vars.ctrlKey) {
        var toGo;

        if (keyCode === 38) {
            toGo = el.parentNode.previousElementSibling;
        } else if (keyCode === 40) {
            toGo = el.parentNode.nextElementSibling;
        }

        if (toGo) {
            toGo.querySelector('input').focus();
        }
    }
};

/**
 * Adds and removes blank fields as needed when inputs change
 * @param {Object}  event The triggered event
 * @param {Element} el    The element event was triggered on
 */
TID.events.input = function (event, el) {
    if (!el.value.length) {
        el.parentNode.classList.add('blank');

        $$('#download-directories .blank').slice(0, -1).forEach(function (el) {
            el.remove();
        });
    } else {
        el.parentNode.classList.remove('blank');
    }

    if (!$$('#download-directories .blank').length) {
        TID.directories.addBlank();
    }
};
