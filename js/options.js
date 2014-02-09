'use strict';

/* globals chrome, $, $$, listen */

(function () {

    var currentItem;
    var offsetX = 0;
    var moveDirection = false;
    var moveDirectionLast = 0;
    var directoryPlaceholders = [
        'Tumblr Images/Animals/Cats',
        'GIFs/Cats',
        'Cats',
        'Tumblr/Fanart',
        'Animals/Cats',
        'Animals/Dogs',
        'Tumblr Images/Funny',
        'Tumblr GIFs',
        'Nature Pictures',
        'GIFs',
        'Hi-res images',
        'Low-res images'
    ];

    /**
     * Send a message to the background page
     */
    function sendMessage(message) {
        chrome.runtime.sendMessage({message: message});
    }

    /**
     * Adjust the confrim settings HTML
     */
    function adjustConfirmSettings(value) {
        if (value) {
            $('#confirm').innerText = 'Disable';
            $('#current-status').innerText = 'enabled';
        } else {
            $('#current-status').innerText = 'disabled';
            $('#confirm').innerText = 'Enable';
        }
    }

    /**
     * Sanitize the directory string
     */
    function sanitizeDirectory(directory) {
        return directory.trim().replace(/(^\/+|\/+$|\\|:|\*|\?|"|<|>|\|)+/g, '').replace(/\/{2,}/, '/');
    }

    /**
     * Generate a directory input list item
     */
    function generateDirectoryInput(value, skipLi) {
        var html = '';
        html += skipLi ? '' : '<li>';
        html += '<span class="move">&#9776;</span>';
        html += '<input type="text" placeholder="' + directoryPlaceholders[Math.floor(Math.random() * directoryPlaceholders.length)] + '" value="' + (value ? value : '') + '">';
        html += '<span class="delete">&cross;</span>';
        html += skipLi ? '' : '</li>';
        return html;
    }

    /**
     * Save directories
     */
    function saveDirectories() {

        var directories = [];
        var defaultDirectory = sanitizeDirectory($('#default-directory').value);

        $$('#download-directories li:not(.blank):not(.fake) input').forEach(function (el) {
            if (el.value.length) {
                directories.push(sanitizeDirectory(el.value));
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

    }

    /**
     * Moving an input
     */
    function moving(event) {

        moveDirection = event.clientY - moveDirectionLast < 0 ? true : false; // true = up, false = down
        moveDirectionLast = event.clientY;

        var li = document.elementFromPoint(offsetX, event.clientY).closest('li');

        if (li && !li.classList.contains('fake') && !li.classList.contains('blank')) {
            addFake(moveDirection ? li : li.nextSibling);
        }

        currentItem.style.top = (event.clientY + window.pageYOffset) + 'px';

    }

    /**
     * Insert download directory empty input
     */
    function addBlank() {
        var li = document.createElement('li');
        li.classList.add('blank');
        li.innerHTML = generateDirectoryInput(false, true);
        $('#download-directories').appendChild(li);
    }

    /**
     * Insert a fake placeholder input
     */
    function addFake(where) {

        $$('#download-directories .fake').forEach(function (el) {
            el.remove();
        });

        var li = document.createElement('li');
        li.classList.add('fake');
        li.innerHTML = '<input type="text">';
        where.parentNode.insertBefore(li, where);

    }

    /**
     * Clear list of downloaded images from options
     */
    $('#clear').onclick = function () {
        if (confirm('Are you absolutely sure? This cannot be undone!')) {
            chrome.storage.local.remove('images');
            $('#image-count').innerText = '0';
            alert('List of downloaded images has been cleared successfully.');
            sendMessage(['Cleared Storage', 'Cleared Images']);
        }
    };

    /**
     * Change confirmation settings
     */
    $('#confirm').onclick = function () {

        var newSetting = this.innerText === 'Enable' ? true : false;
        this.innerText = newSetting ? 'Disable' : 'Enable';
        $('#current-status').innerText = newSetting ? 'enabled' : 'disabled';
        chrome.storage.sync.set({confirm: newSetting});

        sendMessage(['Download Confirmation', newSetting ? 'Enabled' : 'Disabled']);

    };

    /**
     * Remove unneeded slahes at the start and at the end
     */
    listen('focusout', '#download-directories input', function (event, el) {
        el.value = sanitizeDirectory(el.value);
    });

    /**
     * Make sure there is always at least one blank input
     */
    listen('keyup', '#download-directories input', function (event, el) {

        if (event.keyCode === 38) { // up arrow
            el.parentNode.previousSibling.querySelector('input').focus();
        } else if (event.keyCode === 40) { // down arrow
            el.parentNode.nextSibling.querySelector('input').focus();
        }

        if (!el.value.length) {

            el.parentNode.classList.add('blank');
            $$('#download-directories .blank').slice(0, -1).forEach(function (el) {
                el.remove();
            });

        } else {
            el.parentNode.classList.remove('blank');
        }

        if (!$$('#download-directories .blank').length) {
            addBlank();
        }

    });

    /**
     * Save directories button
     */
    $('#save-directories').onclick = saveDirectories;

    /**
     * Delete a directory input
     */
    listen('click', '#download-directories .delete', function (event, el) {
        el.closest('li').remove();
    });

    /**
     * Initiate moving an input
     */
    listen('mousedown', '#download-directories .move', function (event, el) {

        event.preventDefault();
        event.stopPropagation();

        currentItem = el.parentNode;

        if (currentItem.classList.contains('blank')) {
            return;
        }

        currentItem.classList.add('moving');
        currentItem.style.position = 'absolute';
        currentItem.style.top = (event.clientY + window.pageYOffset) + 'px';

        addFake(currentItem);

        moveDirection = false;
        moveDirectionLast = 0;
        offsetX = event.clientX;

        window.addEventListener('mousemove', moving, false);

    });

    /**
     * Stop moving an input
     */
    window.addEventListener('mouseup', function () {

        if (currentItem) {

            var fakeEl = $('#download-directories .fake');
            fakeEl.parentNode.replaceChild(currentItem, fakeEl);

            currentItem.style.position = 'relative';
            currentItem.style.top = '0px';
            currentItem.classList.remove('moving');

            window.removeEventListener('mousemove', moving, false);

        }

    });

    /**
     * Adjust number of remembered images when new ones are added, and keep other settings up-to-date
     */
    chrome.storage.onChanged.addListener(function (changes) {

        if (changes.confirm) {

            adjustConfirmSettings(changes.confirm.newValue);

        } else if (changes.images) {

            $('#image-count').innerText = 'newValue' in changes.images ? changes.images.newValue.length : 0;

        } else if (changes.saveDirectories) {

            $('#download-directories').innerHTML = '';
            changes.saveDirectories.newValue.forEach(function (directory) {
                $('#download-directories').innerHTML += generateDirectoryInput(directory);
            });
            addBlank();

        } else if (changes.defaultDirectory) {

            $('#default-directory').value = changes.defaultDirectory.newValue;

        }

    });

    /**
     * Get number of remembered images
     */
    chrome.storage.local.get({images: []}, function (object) {
        $('#image-count').innerText = object.images.length;
    });

    /**
     * Add existing directories into list and a blank one
     */
    chrome.storage.sync.get({saveDirectories: []}, function (object) {

        object.saveDirectories.forEach(function (directory) {
            $('#download-directories').innerHTML += generateDirectoryInput(directory);
        });

        addBlank();

    });

    /**
     * Get default save directory
     */
    chrome.storage.sync.get({defaultDirectory: false}, function (object) {
        $('#default-directory').setAttribute('placeholder', directoryPlaceholders[Math.floor(Math.random() * directoryPlaceholders.length)]);
        $('#default-directory').value = object.defaultDirectory ? object.defaultDirectory : '';
    });

    /**
     * Get current settings for confirmation
     */
    chrome.storage.sync.get({confirm: false}, function (object) {
        adjustConfirmSettings(object.confirm);
    });

}());
