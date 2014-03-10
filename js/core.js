'use strict';

/*jshint unused:false */

// Get a single element
function $(selector, context) {
    return (context || document).querySelector(selector);
}

// Get all elements
function $$(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
}

// Check if an element matches a selector (future-proof)
Element.prototype.matchesSelector = function (selector) {
    return 'matches' in Element ? this.matches(selector) : this.webkitMatchesSelector(selector);
};

// Get the closest parent element by a selector
Element.prototype.closest = function (selector) {
    var parent = this.parentNode;
    if (parent.nodeType !== 1) {
        return false;
    }
    if (parent.matchesSelector(selector)) {
        return parent;
    }
    return parent.closest(selector);
};

// Get a specific ancestor element
Element.prototype.ancestor = function (depth) {
    var ancestor = this;
    while (depth) {
        depth -= 1;
        ancestor = ancestor.parentNode;
    }
    return ancestor;
};

/**
 * Listen for an event on an element
 */
function listen(event, selector, listener) {
    document.addEventListener(event, function (event) {
        if (event.target.matchesSelector(selector)) {
            listener.call(undefined, event, event.target);
        }
    }, false);
}
