'use strict';

/* globals TID, chrome */

// Populate the version value
document.querySelector('#version').innerText = chrome.runtime.getManifest().version;

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
