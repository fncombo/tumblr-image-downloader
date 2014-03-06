'use strict';

/* globals TID, $, $$ */

// Object to store all the directory events
TID.directoryEvents = {};

/**
 * Clicking on the button to move an input
 * @param  {Object}  event The triggered event
 * @param  {Element} el    The element event was triggered on
 */
TID.directoryEvents.mousedown = function (event, el) {

    event.preventDefault();
    event.stopPropagation();

    TID.vars.currentItem = el.parentNode;

    if (TID.vars.currentItem.classList.contains('blank')) {
        return;
    }

    TID.addFakeDirectory(TID.vars.currentItem);

    TID.vars.currentItem.classList.add('moving');
    TID.vars.currentItem.style.position = 'absolute';
    TID.vars.currentItem.style.top = (event.clientY + window.pageYOffset) + 'px';

    TID.vars.moveDirection = false;
    TID.vars.moveDirectionLast = 0;
    TID.vars.offsetX = event.clientX;

    window.addEventListener('mousemove', TID.directoryEvents.mousemove, false);

};

/**
 * Event handler for moving a directory input with the mouse
 * @param  {Object} event The triggered event
 */
TID.directoryEvents.mousemove = function (event) {

    // true = up, false = down
    TID.vars.moveDirection = event.clientY - TID.vars.moveDirectionLast < 0 ? true : false;
    TID.vars.moveDirectionLast = event.clientY;

    var li = document.elementFromPoint(TID.vars.offsetX, event.clientY).closest('li');

    if (li && !li.classList.contains('fake') && !li.classList.contains('blank')) {
        TID.addFakeDirectory(TID.vars.moveDirection ? li : li.nextSibling);
    }

    TID.vars.currentItem.style.top = (event.clientY + window.pageYOffset) + 'px';

};

TID.directoryEvents.mouseup = function () {

    if (TID.vars.currentItem) {

        var fakeEl = $('#download-directories .fake');
        fakeEl.parentNode.replaceChild(TID.vars.currentItem, fakeEl);

        TID.vars.currentItem.style.position = 'relative';
        TID.vars.currentItem.style.top = '0px';
        TID.vars.currentItem.classList.remove('moving');
        TID.vars.currentItem = false;

        window.removeEventListener('mousemove', TID.directoryEvents.mousemove, false);

    }

};

/**
 * Moving directories with Ctrl and arrow keys
 * @param  {Object} event The triggered event
 * @param  {[type]} el    The element event was triggered on
 */
TID.directoryEvents.keyup = function (event, el) {

    if (TID.vars.ctrlKey) {

        var parent = el.parentNode;
        var toMove;

        if (parent.classList.contains('blank')) {
            return;
        }

        if (event.keyCode === 38 && parent.previousElementSibling) {
            toMove = parent.previousElementSibling;
            parent.parentNode.insertBefore(toMove.cloneNode(true), parent.nextElementSibling);
            parent.parentNode.removeChild(toMove);
        } else if (event.keyCode === 40 && !parent.nextElementSibling.classList.contains('blank')) {
            toMove = parent.nextElementSibling;
            if (!toMove.classList.contains('blank')) {
                parent.parentNode.insertBefore(toMove.cloneNode(true), parent);
                parent.parentNode.removeChild(toMove);
            }
        }

    } else {

        try {
            if (event.keyCode === 38) {
                el.parentNode.previousElementSibling.querySelector('input').focus();
            } else if (event.keyCode === 40) {
                el.parentNode.nextElementSibling.querySelector('input').focus();
            }
        } catch (e) {}

    }

};

/**
 * Adds and removes blank fields as needed when inputs change
 * @param  {Object}  event The triggered event
 * @param  {Element} el    The element event was triggered on
 */
TID.directoryEvents.input = function (event, el) {

    if (!el.value.length) {

        el.parentNode.classList.add('blank');
        $$('#download-directories .blank').slice(0, -1).forEach(function (el) {
            el.remove();
        });

    } else {
        el.parentNode.classList.remove('blank');
    }

    if (!$$('#download-directories .blank').length) {
        TID.addBlankDirectory();
    }

};
