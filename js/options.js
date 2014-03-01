'use strict';

/* globals TID, chrome, $, $$, listen */

/**
 * Checkboxes
 */

// Get current settings for all the checkboxes
$$('input[data-for]').forEach(TID.getCheckboxValue);

// Change checkbox settings
listen('click', 'input[type="checkbox"]', TID.checkboxChange);

// Get number of remembered images
chrome.storage.local.get({images: []}, function (object) {
    $('#image-count').innerText = object.images.length;
});

// Clear list of downloaded images from options
$('#clear').onclick = function () {

    var message = 'Are you sure you want to clear all remembered images?<br>This cannot be undone!';
    var buttons = ['Yes', 'No'];

    TID.showDialog(message, buttons, function (i) {

        switch (i) {

            case '0':
                chrome.storage.local.remove('images');
                $('#image-count').innerText = '0';
                TID.sendMessage(['Cleared Storage', 'Cleared Images']);
                break;

            case '1':
                break;

        }

    });

};

/**
 * Directories
 */

// Add existing directories into list and a blank one
chrome.storage.sync.get({saveDirectories: []}, function (object) {

    object.saveDirectories.forEach(function (directory) {
        $('#download-directories').innerHTML += TID.generateDirectoryInput(directory);
    });

    TID.addBlankDirectory();

});

// Get default save directory
chrome.storage.sync.get({defaultDirectory: false}, function (object) {
    $('#default-directory').setAttribute('placeholder', TID.randomPlaceholder());
    $('#default-directory').value = object.defaultDirectory ? object.defaultDirectory : '';
});

// Sanitize directory inputs on focusout
listen('focusout', '#download-directories input, #default-directory', function (event, el) {
    el.value = TID.sanitizeDirectory(el.value);
});

// Handle the addition and removal of the blank directory input
listen('input', '#download-directories input', TID.directoryEvents.input);

// Move directory inputs with ctrl + arrow keys
listen('keyup', '#download-directories input', TID.directoryEvents.keyup);

// Save the directories
$('#save-directories').onclick = TID.saveDirectories;

// Delete a directory
listen('click', '#download-directories .delete', function (event, el) {
    el.closest('li').remove();
});

/**
 * Moving directories
 */

// Start moving a directory
listen('mousedown', '#download-directories .move', TID.directoryEvents.mousedown);

// Stop moving a directory
window.addEventListener('mouseup', TID.directoryEvents.mouseup);

/**
 * Ctrl keys
 */

// Listen to ctrl key pressing down
document.addEventListener('keydown', function (event) {
    if (event.keyCode === 17) {
        TID.vars.ctrlKey = true;
    }
});

// Listen to ctrl key being released
document.addEventListener('keyup', function (event) {
    if (event.keyCode === 17) {
        TID.vars.ctrlKey = false;
    }
});

/**
 * Keep settings up-to-date across multiple options pages
 */
chrome.storage.onChanged.addListener(function (changes) {

    if (changes.hasOwnProperty('confirm')) {

        TID.adjustCheckbox('confirm', changes.confirm.newValue);

    } else if (changes.hasOwnProperty('showTicks')) {

        TID.adjustCheckbox('showTicks', changes.showTicks.newValue);

    } else if (changes.hasOwnProperty('enableLocations')) {

        TID.adjustCheckbox('enableLocations', changes.enableLocations.newValue);

    } else if (changes.hasOwnProperty('images')) {

        $('#image-count').innerText = changes.images.hasOwnProperty('newValue') ? changes.images.newValue.length : 0;

    } else if (changes.hasOwnProperty('saveDirectories')) {

        $('#download-directories').innerHTML = '';
        changes.saveDirectories.newValue.forEach(function (directory) {
            $('#download-directories').innerHTML += TID.generateDirectoryInput(directory);
        });
        TID.addBlankDirectory();

    } else if (changes.hasOwnProperty('defaultDirectory')) {

        $('#default-directory').value = changes.defaultDirectory.hasOwnProperty('newValue') ? changes.defaultDirectory.newValue : '';

    }

});
