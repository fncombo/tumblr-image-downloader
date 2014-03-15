'use strict';

/* globals TID, chrome */

/**
 * Get the current height of the document
 * @return {integer} Current height of the document
 */
TID.getDocumentHeight = function () {
    return document.documentElement.scrollHeight;
};

TID.run = function () {

    if (TID.isArchivePage) {
        document.body.classList.add(TID.classes.archivePage);
    }

    // Add buttons after updating images storage and directories
    TID.images.update(function () {
        TID.directories.update(function () {
            TID.buttons.add();
        });
    });

    // Keep adding new buttons for pages with endless scrolling
    if (TID.isInfiniteScrolling || TID.isArchivePage) {

        var previousHeight = TID.getDocumentHeight();

        document.onscroll = function () {

            // If the height has changed, try adding buttons to new images (if any)
            if (previousHeight !== TID.getDocumentHeight()) {
                previousHeight = TID.getDocumentHeight();
                TID.buttons.add();
            }

        };

    }

    // Update settings
    Object.keys(TID.settings.list).forEach(function (setting) {

        var object = { };
        object[setting] = TID.settings.list[setting].default;

        chrome.storage.sync.get(object, function (object) {
            TID.settings.list[setting].set(object[setting]);
        });

    });

    // Init all the event listeners
    TID.events.initDocumentEvents();
    TID.events.initStorageListener();
    TID.events.initMessageListener();
    TID.events.initMutationObservers();

    // Show page action
    TID.sendMessage('show_page_action');

};

TID.run();
