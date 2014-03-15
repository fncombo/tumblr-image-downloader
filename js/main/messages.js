'use strict';

/* globals TID, chrome, $$ */

/**
 * Get a local message value
 * @param  {string}              name   Message's key
 * @param  {string|array|object} values Values to be used for replacing placeholders in the message
 * @return {string}                     Message value
 */
TID.msg = function (name, values) {
    return chrome.i18n.getMessage(name, values);
};

/**
 * Processes all tags on the page with the "msg-content" attribute and replaces their HTML with text accordingly
 */
TID.processHTMLMessages = function () {
    $$('[msg-content]').forEach(function (el) {
        el.innerHTML = TID.msg(el.getAttribute('msg-content'));
    });
};
