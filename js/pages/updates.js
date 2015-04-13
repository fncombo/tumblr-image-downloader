'use strict';

/* globals TID, chrome */

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
