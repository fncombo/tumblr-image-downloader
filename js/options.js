'use strict';

/* globals chrome */

(function () {

    /**
     * Send a message to the background page
     */
    function sendMessage(message) {
        chrome.runtime.sendMessage({message: message});
    }

    /**
     * Adjust the confrim settings HTML
     */
    function adjustConfirmSettings(value) {
        if (value) {
            document.querySelector('#confirm').innerText = 'Disable';
            document.querySelector('#current-status').innerText = 'enabled';
        } else {
            document.querySelector('#current-status').innerText = 'disabled';
            document.querySelector('#confirm').innerText = 'Enable';
        }
    }


    /**
     * Clear list of downloaded images from options
     */
    document.querySelector('#clear').onclick = function () {

        if (!confirm('Are you absolutely sure? This cannot be undone!')) {
            return;
        }

        chrome.storage.local.remove('images');
        document.querySelector('#image-count').innerText = '0';
        alert('List of downloaded images has been cleared successfully.');
        sendMessage(['Cleared Storage', 'Cleared Images']);

    };

    /**
     * Get current settings for confirmation
     */
    chrome.storage.local.get({confirm: false}, function (object) {
        adjustConfirmSettings(object.confirm);
    });

    /**
     * Change confirmation settings
     */
    document.querySelector('#confirm').onclick = function () {

        var newSetting = this.innerText === 'Enable' ? true : false;
        this.innerText = newSetting ? 'Disable' : 'Enable';
        document.querySelector('#current-status').innerText = newSetting ? 'enabled' : 'disabled';
        chrome.storage.local.set({confirm: newSetting});

        sendMessage(['Download Confirmation', newSetting ? 'Enabled' : 'Disabled']);

    };

    /**
     * Get number of remembered images
     */
    chrome.storage.local.get({images: []}, function (object) {
        document.querySelector('#image-count').innerText = object.images.length;
    });

    /**
     * Adjust number of remembered images when new ones are added, and keep other settings up-to-date
     */
    chrome.storage.onChanged.addListener(function (changes) {
        if (changes.confirm) {
            adjustConfirmSettings(changes.confirm.newValue);
        } else if (changes.images) {
            document.querySelector('#image-count').innerText = changes.images.newValue.length;
        }
    });

}());
