'use strict';

/* globals TID, chrome, $ */

/**
 * Initialize all Chrome storage event listeners
 */
TID.events.initStorageListener = function () {
    console.log('Initializing Chrome storage listeners');

    chrome.storage.onChanged.addListener(function (changes) {
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
        console.log('Recieved message', request);

        var title;
        var message;
        var buttons;

        switch (request.message) {
        case 'not_image':
            TID.images.remove(request.imageId);
            TID.ticks.remove(request.imageId);

            title = TID.msg('whoa');
            message = TID.msg('linkNotImage');
            buttons = [TID.msg('downloadFromTumblr'), TID.msg('openLinkInNewTab'), TID.msg('cancel')];

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

        case 'download_failed':
            title = TID.msg('downloadFailedTitle');
            message = TID.msg('downloadFailedMessage', request.error);
            buttons = TID.msg('okay');
            var imageEl = $('img[src*="' + request.activeDownload.imageId + '"]');
            var imageUrl = imageEl ? imageEl.src : false;

            TID.ui.showDialog(title, message, buttons, false, imageUrl);
            break;
        }
    });
};
