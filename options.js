(function () {

    'use strict';

    // Clear list of downloaded images from options
    document.querySelector('#clear').onclick = function () {

        var sure = confirm('Are you absolutely sure? This cannot be undone!');

        if (!sure) {
            return;
        }

        chrome.storage.local.remove('images');

        alert('List of downloaded images has been cleared successfully.');

    };

}());
