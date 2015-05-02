'use strict';

/* globals TID, chrome, $ */

/**
 * Directories functions
 * @type {Object}
 */
TID.directories = {};

/**
 * Available directories
 * @type {Array}
 */
TID.directories.list = [];

/**
 * HTML of all the directories
 * @type {String}
 */
TID.directories.html = '';

/**
 * Update the list of download directories
 * @param {Function} callback Optional callback to call when the update is done
 */
TID.directories.update = function (callback) {
    console.log('Directories have been updated');

    chrome.storage.sync.get({saveDirectories: []}, function (object) {
        if (object.saveDirectories.length) {
            TID.directories.list = object.saveDirectories;
        }

        TID.directories.html = TID.directories.format();

        if (callback) {
            callback();
        }
    });
};

/**
 * Generate HTML for the list of current directories
 * @return {String} The formatted HTML for the download directories
 */
TID.directories.format = function () {
    console.log('Generating HTML for the directories list');

    if (!TID.directories.list.length) {
        return '<ul><li class="' + TID.classes.help + '">' + TID.msg('noConfiguredDirectories') + '</li></ul>';
    }

    var list = '<ul>';

    TID.directories.list.forEach(function (directory) {
        var name = directory.replace(TID.regex.directoryToLastSlash, '<span>$1</span>')
                            .replace(TID.regex.directoryNonTagSlashes, '<span>/</span>');

        list += '<li title="' + TID.msg('downloadDirectoryTitle', directory) + '" data-directory="' + directory + '">';
        list += name;
        list += '</li>';
    });

    list += '</ul>';

    return list;
};

/**
 * Toggle whether or not to display the directories dropdowns on the page
 * @param {Boolean} setting Whether or not to show the directories
 */
TID.directories.setVisibility = function (setting) {
    console.log('Directories visibility toggled to', !!setting);

    document.body.classList[setting ? 'remove' : 'add'](TID.classes.hideLocations);
};

/**
 * Create HTML for the directories for a specific download button, ticking the required directories
 * @param  {Array} directoriesToTick Array of which directories should be ticked
 * @return {Element}                 HTML Element of the generated directory list
 */
TID.directories.clone = function (directoriesToTick) {
    var el = document.createElement('div');
    el.classList.add(TID.classes.list);
    el.innerHTML = '<span>&#9660;</span>' + TID.directories.html;

    // Tick any directories that should be ticked (that thios images has been downloaded to)
    if (directoriesToTick) {
        directoriesToTick.forEach(function (directory) {
            var listEl = $('li[data-directory="' + directory + '"]', el);
            if (listEl) {
                listEl.classList.add(TID.classes.downloaded);
            }
        });
    }

    return el;
};
