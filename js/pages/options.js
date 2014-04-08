'use strict';

/* globals TID, chrome, $, $$, listen */

/**
 * Text
 */

TID.processHTMLMessages();

if ($('#installMessage') && $('#supportMessage')) {

    var installMessage = $('#installMessage a');
    installMessage.href = 'https://chrome.google.com/webstore/detail/tumblr-image-downloader/ipocoligdfkbgncimgfaffpaglmedpop';
    installMessage.target = '_blank';

    var supportMessage = $('#supportMessage a');
    supportMessage.href = 'https://chrome.google.com/webstore/support/ipocoligdfkbgncimgfaffpaglmedpop#bug';
    supportMessage.target = '_blank';

}

/**
 * Remove the #static ID after a while to stop initial checkbox sliders from animating on load
 */
setTimeout(function () {
    $('#static').removeAttribute('id');
}, 100);

/**
 * Image count
 */

TID.adjustImageCount = function (amount) {
    var locale = TID.msg('@@ui_locale').replace('_', '-');
    var clear = $('#clear');
    amount = amount.toLocaleString(locale);
    clear.innerHTML = clear.innerHTML.replace(/(?:\d+|#)/, amount);
};

// Get number of remembered images
chrome.storage.local.get({images: []}, function (object) {
    TID.adjustImageCount(object.images.length);
});

/**
 * Checkboxes
 */

// Get current settings for all the checkboxes
$$('input[data-for]').forEach(TID.checkboxes.getValue);

// Change checkbox settings
listen('click', 'input[type="checkbox"]', TID.checkboxes.onChange);

// Clear list of downloaded images from options
$('#clear').onclick = function () {

    var message = TID.msg('rememberedImagesClearConfirmation');
    var buttons = [TID.msg('yes'), TID.msg('no')];

    TID.ui.showDialog(message, buttons, function (i) {

        switch (i) {

            case '0':
                chrome.storage.local.remove('images');
                TID.adjustImageCount(0);
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
        $('#download-directories').innerHTML += TID.directories.generateInput(directory);
    });

    TID.directories.addBlank();

});

// Get default save directory
chrome.storage.sync.get({defaultDirectory: false}, function (object) {
    $('#default-directory').setAttribute('placeholder', TID.directories.getPlaceholder());
    $('#default-directory').value = object.defaultDirectory ? object.defaultDirectory : '';
});

// Sanitize directory inputs on focusout
listen('focusout', '#download-directories input, #default-directory', function (event, el) {
    el.value = TID.directories.sanitize(el.value);
});

// Handle the addition and removal of the blank directory input
listen('input', '#download-directories input', TID.events.input);

// Move directory inputs with ctrl + arrow keys
listen('keyup', '#download-directories input', TID.events.keyup);

// Delete a directory
listen('click', '#download-directories .delete', function (event, el) {
    el.closest('li').remove();
});

/**
 * Saving directories
 */
$('#default-directory').onkeyup = TID.directories.saveDefault;
$('#default-directory').onchange = TID.directories.saveDefault;
$('#save-directories').onclick = TID.directories.saveMore;

/**
 * Moving directories
 */

// Start moving a directory
listen('mousedown', '#download-directories .move', TID.events.mousedown);

// Stop moving a directory
window.addEventListener('mouseup', TID.events.mouseup);

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

        TID.checkboxes.setValue('confirm', changes.confirm.newValue);

    } else if (changes.hasOwnProperty('showTicks')) {

        TID.checkboxes.setValue('showTicks', changes.showTicks.newValue);

    } else if (changes.hasOwnProperty('enableLocations')) {

        TID.checkboxes.setValue('enableLocations', changes.enableLocations.newValue);

    } else if (changes.hasOwnProperty('images')) {

        TID.adjustImageCount(changes.images.hasOwnProperty('newValue') ? changes.images.newValue.length : 0);

    } else if (changes.hasOwnProperty('saveDirectories')) {

        $('#download-directories').innerHTML = '';
        changes.saveDirectories.newValue.forEach(function (directory) {
            $('#download-directories').innerHTML += TID.directories.generateInput(directory);
        });
        TID.directories.addBlank();

    } else if (changes.hasOwnProperty('defaultDirectory')) {

        var newValue = changes.defaultDirectory.hasOwnProperty('newValue') ? changes.defaultDirectory.newValue : '';
        $('#default-directory').value = newValue;

    }

});
