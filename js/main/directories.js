'use strict';

/* globals TID, $, $$ */

/**
 * Directories functions
 * @type {Object}
 */
TID.directories = {};

/**
 * HTML of all the directories
 * @type {String}
 */
TID.directories.html = '';

/**
 * Generate HTML for the list of current directories
 * @return {String} The formatted HTML for the download directories
 */
TID.directories.format = function () {
    console.log('Generating HTML for the directories list');

    if (!TID.settings.saveDirectories.length) {
        TID.directories.html = '<ul><li class="' + TID.classes.help + '">';
        TID.directories.html += TID.msg('noConfiguredDirectories');
        TID.directories.html += '</li></ul>';
        return;
    }

    var list = '<ul>';

    TID.settings.saveDirectories.forEach(function (directory) {
        var name = directory.replace(TID.regex.subDirectories, '<span>$1</span>')
                            .replace(TID.regex.subDirectorySlashes, '><i></i>');

        if (TID.settings.nestInsideDefaultFolder && TID.settings.defaultDirectory) {
            directory = TID.settings.defaultDirectory + '/' + directory;
        }

        list += '<li title="' + TID.msg('downloadDirectoryTitle', directory) + '" ';
        list += 'data-directory="' + directory + '">';

        list += name;
        list += '</li>';
    });

    list += '</ul>';

    TID.directories.html = list;
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
    el.innerHTML = TID.directories.html;

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

/**
 * Update all the lists' HTML
 */
TID.directories.updatePageHtml = function () {
    $$('.' + TID.classes.list).forEach(function (el) {
        TID.images.exists(el.parentNode.dataset.imageId, function (exists, directories) {
            var directoriesEl = TID.directories.clone(directories);
            el.parentNode.replaceChild(directoriesEl, el);
        });
    });
};
