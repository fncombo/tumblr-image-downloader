'use strict';

/* globals TID, chrome, $ */

/**
 * Text
 */

TID.processHTMLMessages();

var installMessage = $('#installMessage a');
installMessage.href = 'https://chrome.google.com/webstore/detail/tumblr-image-downloader/ipocoligdfkbgncimgfaffpaglmedpop';
installMessage.target = '_blank';

var supportMessage = $('#supportMessage a');
supportMessage.href = 'https://chrome.google.com/webstore/support/ipocoligdfkbgncimgfaffpaglmedpop#bug';
supportMessage.target = '_blank';

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
