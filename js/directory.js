'use strict';

/* globals TID, chrome, $, $$ */

/**
 * Get a random placeholder value for directories
 * @return {String} A random sample directory
 */
TID.randomPlaceholder = function () {

    var placeholders = [
        'Tumblr Images/Funny',
        'Tumblr Images/Animals/Cats',
        'Tumblr/Fanart',
        'Tumblr GIFs',
        'Animals/Cats',
        'Animals/Dogs',
        'GIFs/Cats',
        'GIFs',
        'Cats',
        'Nature Pictures',
        'Hi-res images',
        'Low-res images'
    ];

    var randomIndex = Math.floor(Math.random() * placeholders.length);
    return placeholders[randomIndex];

};

/**
 * Sanitizes a directory input
 * @param  {String} directory The directory to sanitize
 * @return {String}           The sanitizes directory string
 */
TID.sanitizeDirectory = function (directory) {
    return directory.trim()
                    .replace(/(^\/+|\/+$|\\|:|\*|\?|"|<|>|\|)+/g, '')
                    .replace(/\/{2,}/, '/');
};

/**
 * Generate a directory input
 * @param  {String}  value  The value of the input
 * @param  {Boolean} skipLi Whether or not to skip the <li> tag
 * @return {String}         Return the HTML for the directory input
 */
TID.generateDirectoryInput = function (value, skipLi) {
    var html = '';
    html += skipLi ? '' : '<li>';
    html += '<span class="move">&#9776;</span>';
    html += '<input type="text" placeholder="' + TID.randomPlaceholder() + '" value="' + (value ? value : '') + '">';
    html += '<span class="delete" tabindex="0">&cross;</span>';
    html += skipLi ? '' : '</li>';
    return html;
};

/**
 * Adds a fake invisible input
 * @param {Element} where Which element to add the input before
 */
TID.addFakeDirectory = function (where) {

    $$('#download-directories .fake').forEach(function (el) {
        el.remove();
    });

    var li = document.createElement('li');
    li.classList.add('fake');
    li.innerHTML = '<input type="text">';
    where.parentNode.insertBefore(li, where);

};

/**
 * Add a blank directory input to the list
 */
TID.addBlankDirectory = function () {
    var li = document.createElement('li');
    li.classList.add('blank');
    li.innerHTML = TID.generateDirectoryInput(false, true);
    $('#download-directories').appendChild(li);
};

/**
 * Save all directories to chrome storage
 */
TID.saveDirectories = function () {

    var directories = [];
    var defaultDirectory = TID.sanitizeDirectory($('#default-directory').value);

    $$('#download-directories li:not(.blank):not(.fake) input').forEach(function (el) {
        if (el.value.length) {
            directories.push(TID.sanitizeDirectory(el.value));
        }
    });

    // Only unique values
    directories = directories.filter(function (value, index, self) {
        return self.indexOf(value) === index;
    });

    chrome.storage.sync.set({saveDirectories: directories});

    if (defaultDirectory.length) {
        chrome.storage.sync.set({defaultDirectory: defaultDirectory});
    } else {
        chrome.storage.sync.remove('defaultDirectory');
    }

};
