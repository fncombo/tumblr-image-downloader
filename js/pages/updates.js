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

/**
 * Updates
 */

// Populate the version value
var currentVersion = document.querySelector('#currentVersion');
currentVersion.innerHTML = currentVersion.innerHTML.replace('#', chrome.runtime.getManifest().version);

// Get the updates
TID.getUpdates(function (updates) {
    updates.reverse().forEach(function (update, index) {
        var parent = document.querySelector('#previous');

        if (!index) {
            parent = document.querySelector('#current');
        }

        var ul = document.createElement('ul');
        var hr = document.createElement('hr');

        update.forEach(function (text) {
            var el = document.createElement('li');
            el.innerHTML = text;
            ul.appendChild(el);
        });

        parent.appendChild(ul);

        if (index !== updates.length - 1) {
            parent.appendChild(hr);
        }
    });
});
