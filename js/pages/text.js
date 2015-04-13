'use strict';

/* globals TID, chrome, $ */

/**
 * Text
 */

// Process all tags on the page with text
TID.processHTMLMessages();

// Insert correct links to the extension store page
if ($('#installMessage') && $('#supportMessage')) {
    var installMessage = $('#installMessage a');
    installMessage.href = 'https://chrome.google.com/webstore/detail/image-downloader-for-tumblr/' + chrome.runtime.id;
    installMessage.target = '_blank';

    var supportMessage = $('#supportMessage a');
    supportMessage.href = 'https://chrome.google.com/webstore/support/' + chrome.runtime.id + '#bug';
    supportMessage.target = '_blank';
}
