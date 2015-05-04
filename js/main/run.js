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

    // Aggregate all the settings that need to be updated, and their default values
    var settingsToUpdate = {};
    Object.keys(TID.settings.list).forEach(function (setting) {
        settingsToUpdate[setting] = TID.settings.list[setting].default;
    });

    // Update all the settings at once
    chrome.storage.sync.get(settingsToUpdate, function (settings) {
        Object.keys(settings).forEach(function (setting) {
            TID.settings.list[setting].set(settings[setting]);
        });

        // Generate directories HTML after all settings have been updated
        TID.directories.format();

        // Add buttons after all settings have been updated
        TID.buttons.add();
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
