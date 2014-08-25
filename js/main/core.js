'use strict';

/*jshint unused:false, plusplus:false */

/**
 * Select a single element by a query selector
 * @param  {String}       selector A selector
 * @param  {Element|null} context  The context in which to search for, defaults to document
 * @return {Element|null}          The found element, or null if not found
 */
function $(selector, context) {
    return (context || document).querySelector(selector);
}

/**
 * Select all elements by a query selector
 * @param  {String}       selector A selector
 * @param  {Element|null} context  The context in which to search for, defaults to document
 * @return {Array}                 Array of found elements, will be empty if nothing found
 */
function $$(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
}

/**
 * Check if an element matches a selector using either the standard matches function, or webkitMatchesSelector
 * @param  {String}  selector The selector to check against
 * @return {Boolean}          Whether or not the element matched the selector
 */
Element.prototype.matchesSelector = function (selector) {
    return Element.prototype.hasOwnProperty('matches') ? this.matches(selector) : this.webkitMatchesSelector(selector);
};

/**
 * Get an element up the DOM tree
 * @param  {Number}          depth How far to go up the current tree
 * @return {Element|Boolean}       Returns the found element, or false if one wasn't found
 */
Element.prototype.ancestor = function (depth) {
    var ancestor = this.parentElement;

    while (--depth) {
        ancestor = ancestor.parentElement || false;
    }

    return ancestor;
};

/**
 * Get the closest element up the DOM tree that matches a selector, limited by a threshold
 * @param  {String}          selector  The selector to check against
 * @param  {Number}          threshold Maximum number of times to go up the DOM tree before returning false
 * @return {Element|Boolean}           Returns the found element, or false if one wasn't found
 */
Element.prototype.closest = function (selector, threshold) {
    threshold = threshold || 1000;
    var parent = this.parentElement;

    while (parent && --threshold) {
        if (parent.matchesSelector(selector)) {
            return parent;
        }

        parent = parent.parentElement;
    }

    return false;
};

/**
 * Insert an element as the first child of the current element
 * @param {Element} el The element to insert
 */
Element.prototype.prependChild = function (el) {
    this.insertBefore(el, this.firstChild);
};

/**
 * Listen for an event on an element
 * @param {String}   event    Name of the event
 * @param {String}   selector Element selector
 * @param {Function} listener The event listener
 */
function listen(event, selector, listener) {
    document.addEventListener(event, function (event) {
        if (event.target.matchesSelector(selector)) {
            listener(event, event.target);
        }
    }, false);
}
