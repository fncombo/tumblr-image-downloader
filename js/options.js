'use strict';

(function () {

    // Use Chrome's local storage
    var storage = chrome.storage.local;

    // Send a message to the background page
    function msg(action) {
        chrome.runtime.sendMessage({action: action});
    }

    // Clear list of downloaded images from options
    document.querySelector('#clear').onclick = function () {

        var sure = confirm('Are you absolutely sure? This cannot be undone!');

        if (!sure) {
            return;
        }

        storage.remove('images');

        alert('List of downloaded images has been cleared successfully.');

        msg(['Cleared Storage', 'Cleared Images']);

    };

    // Get current settings for confirmation
    storage.get({confirm: false}, function (object) {

        if (object.confirm) {
            document.querySelector('#confirm').innerText = 'Disable';
        } else {
            document.querySelector('#confirm').innerText = 'Enable';
        }

    });

    // Change confirmation settings
    document.querySelector('#confirm').onclick = function () {

        var newSetting = this.innerText === 'Enable' ? true : false;
        this.innerText = newSetting ? 'Disable' : 'Enable';
        storage.set({confirm: newSetting});

        msg(['Download Confirmation', newSetting ? 'Enabled' : 'Disabled']);

    };

}());
