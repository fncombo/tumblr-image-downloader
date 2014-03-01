'use strict';

/* globals TID, chrome, $$ */

/**
 * Get an i18n message
 * @param  {String} name   Message key name
 * @param  {Array}  values Optional values to replace placeholders
 */
TID.i18n = function (name, values) {
    return chrome.i18n.getMessage(name, values);
};

/**
 * Processes all tags on the page with the "i18n-content" attribute and replaces their HTML with text accordingly
 */
TID.i18nize = function () {
    $$('[i18n-content]').forEach(function (el) {
        el.innerHTML = TID.i18n(el.getAttribute('i18n-content'));
    });
};
