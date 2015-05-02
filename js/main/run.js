'use strict';

/* globals TID, chrome */

/**
 * Get the current height of the document
 * @return {Number} Current height of the document
 */
TID.getDocumentHeight = function () {
    return document.documentElement.scrollHeight;
};

/**
 * Run the extension! Insert buttons, activate events, etc
 */
TID.run = function () {
    console.log('Running the extension');

    if (TID.isArchivePage) {
        document.body.classList.add(TID.classes.archivePage);
    }

    // Add buttons after updating directories list
    TID.directories.update(TID.buttons.add);

    // Update settings
    Object.keys(TID.settings.list).forEach(function (setting) {
        var object = {};
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
