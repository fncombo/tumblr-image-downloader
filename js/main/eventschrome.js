'use strict';

/* globals TID, chrome, $, $$ */

/**
 * Initialize all Chrome storage event listeners
 */
TID.events.initStorageListener = function () {
    console.log('Initializing Chrome storage listeners');

    chrome.storage.onChanged.addListener(function (changes) {

        // If the save directories were modified
        if (changes.hasOwnProperty('saveDirectories')) {
            TID.directories.list = changes.saveDirectories.newValue;
            TID.directories.html = TID.directories.format();

            // Update all the lists' HTML
            $$('.' + TID.classes.list).forEach(function (el) {
                TID.images.exists(el.parentNode.dataset.imageId, function (exists, directories) {
                    var directoriesEl = TID.directories.clone(directories);
                    el.parentNode.replaceChild(directoriesEl, el);
                });
            });

            return;
        }

        // Check if any settings were updated
        Object.keys(TID.settings.list).forEach(function (setting) {
            if (changes.hasOwnProperty(setting)) {
                TID.settings.list[setting].set(changes[setting].newValue);
            }
        });
    });
};

/**
 * Initialize all Chrome message event listeners
 */
TID.events.initMessageListener = function () {
    console.log('Initializing Chrome message listeners');

    chrome.runtime.onMessage.addListener(function (request) {
        switch (request.message) {
        case 'not_image':
            TID.images.remove(request.imageId);
            TID.ticks.remove(request.imageId);

            var title = TID.msg('whoa');
            var message = TID.msg('linkNotImage');
            var buttons = [TID.msg('downloadFromTumblr'), TID.msg('openLinkInNewTab'), TID.msg('cancel')];

            TID.ui.showDialog(title, message, buttons, function (i) {
                switch (i) {
                case '0':
                    var button = $('.' + TID.classes.download + '[data-image-id="' + request.imageId + '"]');
                    TID.images.download(button.nextElementSibling.src, request.imageId, request.directory);
                    break;

                case '1':
                    TID.sendMessage({
                        message: 'open_tab',
                        url: request.url
                    });
                    break;
                }
            });
            break;

        case 'image_downloaded':
            if (typeof request.data.directory === 'string') {
                TID.ticks.add(request.data.imageId, [request.data.directory]);
            } else {
                TID.ticks.add(request.data.imageId);
            }
            break;

        case 'image_removed':
            TID.ticks.remove(request.data.imageId);
            break;

        case 'storage_cleared':
            TID.ticks.removeAll();
            break;
        }
    });
};
