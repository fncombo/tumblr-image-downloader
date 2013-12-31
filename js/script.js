'use strict';

/* globals chrome */

(function () {

    // Use Chrome's local storage
    var storage = chrome.storage.local;
    // Whether or not to confirm downloading again
    var confirmDownload;
    // Regular expression to match the size of the image
    var matchSize = new RegExp('\\d+(?=\\.(jpe?g|png|gif)$)', 'g');
    // Archive pages
    var IS_ARCHIVE = !!window.location.pathname.match(/(archive)/i);

    // Get a simgle element
    function $(selector) {
        return document.querySelector(selector);
    }

    // Get all elements
    function $$(selector) {
        return Array.prototype.slice.call(document.querySelectorAll(selector));
    }

    // Send a message to the background page
    function msg(action) {
        chrome.runtime.sendMessage({action: action});
    }

    // Check if a HD version of the image is available
    function isHd(img) {

        if (img.parentNode.classList.contains('high_res_link')) {

            if (img.parentNode.href.match(/\/image\/\d+/g)) {
                return 1;
            } else if (img.parentNode.href.match(/[^\/]+\.{1}(jpe?g|png|gif)$/g)) {
                return 3;
            }

        } else if (img.parentNode.nodeName === 'A' && img.parentNode.href.match(/(jpe?g|png|gif)$/g)) {

            var linkSize = img.parentNode.href.match(matchSize)[0];
            var imgSize = img.src.match(matchSize)[0];

            return parseInt(linkSize, 10) > parseInt(imgSize, 10) ? 2 : false;

        }

        return false;

    }

    // Get tumblr image ID
    function getImageId(imageSrc) {

        var imageId = imageSrc.match(/tumblr_(\w+)(?=_\d+\.{1}(jpe?g|png|gif)$)/);

        if (imageId !== null && imageId.length === 3) {

            return imageId[1];

        }

        return false;

    }

    // Update local storage
    function rememberImage(imageId) {

        // Get all currently set images, return an empty array if nothing has been set yet
        storage.get({images: []}, function (object) {

            // Make sure the image isn't already in the array
            if (object.images.indexOf(imageId) === -1) {

                // Add the new image ID
                object.images.push(imageId);

                // Set the updated array
                storage.set({images: object.images});

            }

        });

    }

    // When hovering over download button
    function mouseOver() {

        this.parentNode.classList.add('__highlight');

        // If the image is in a photoset row, reveal the row to show the whole image
        if (this.parentNode.parentNode.classList.contains('photoset_row')) {
            this.parentNode.parentNode.classList.add('__show_photoset');
        }

    }

    // When not hovering over download button
    function mouseOut() {

        this.parentNode.classList.remove('__highlight');

        if (this.parentNode.parentNode.classList.contains('photoset_row')) {
            this.parentNode.parentNode.classList.remove('__show_photoset');
        }

    }

    // When hovering over download button in archive
    function mouseOverArchive() {

        this.parentNode.parentNode.parentNode.classList.add('__highlight_archive');

    }

    // When not hovering over download button in archive
    function mouseOutArchive() {

        this.parentNode.parentNode.parentNode.classList.remove('__highlight_archive');

    }

    // Add download buttons to image posts
    function addButtons(downloadedImages) {

        downloadedImages = downloadedImages || [];

        // Get each image post
        $$('.post.is_photo .post_content img:not(.__ignore), .post.is_photoset .post_content img:not(.__ignore)').forEach(function (el) {

            // Skip images that are not part of the actual post
            if (el.parentNode.parentNode.classList.contains('caption')) {
                return;
            }

            // Add a class to the image so we don't add a button to it again
            el.classList.add('__ignore');

            // Create the download button
            var save = document.createElement('span');
            // Check if the image has a HD version
            var hd = isHd(el);
            // ID of the image
            var imageId = getImageId(el.src);

            // Skip the image if an ID for it couldn't be matched
            if (!imageId) {
                return;
            }

            save.innerHTML = 'Download' + (hd ? ' <strong>HD</strong>' : '');
            if (hd === 3) {
                save.innerHTML += '&#10138;';
                save.title = 'High-res image is from an external site.';
            }
            save.classList.add('__download');

            // If the image has already been downloaded
            if (downloadedImages.indexOf(imageId) !== -1) {
                el.classList.add('__downloaded');
            }

            // Download the image on click
            save.onclick = function (e) {

                e.stopPropagation();
                e.preventDefault();

                // Create the download link
                var link = document.createElement('a');
                // Create the click event
                var event = document.createEvent('Event');

                // If the image has already been downloaded and confirmation is enabled
                if (el.classList.contains('__downloaded') && confirmDownload) {
                    var sure = confirm('You\'ve already downloaded this image before.\n\nAre you sure you want to download it again?');
                    if (!sure) {
                        return;
                    }
                }

                // If a HD version is available, then replace the download URL with the one for high resolution image
                switch (hd) {
                case 1:
                    link.href = el.src.replace(matchSize, '1280');
                    break;
                case 2:
                case 3:
                    link.href = el.parentNode.href;
                    break;
                default:
                    link.href = el.src;
                    break;
                }

                // Extract the image file name from the link
                if (hd === 3) {
                    link.download = link.href.match(/[^\/]+\.{1}(jpe?g|png|gif)$/g);
                } else {
                    link.download = link.href.match(/tumblr_\w+\.(jpe?g|png|gif)$/g);
                }

                // Configure & tirgger the click event
                event.initEvent('click', true, true);
                link.dispatchEvent(event);

                // Free some memory or something
                window.URL.revokeObjectURL(link.href);

                // Remember that this image has been downloaded
                rememberImage(imageId);

                msg(['Downloaded Image', hd ? 'HD' : 'SD']);

            };

            // Highlight the image when hovering over download link
            save.onmouseover = mouseOver;
            save.onmouseout = mouseOut;

            // Insert the download button
            el.parentNode.classList.add('__download_parent');
            el.parentNode.insertBefore(save, el.nextSibling);

        });

    }

    // Add download buttons to image posts in the archive
    function addArchiveButtons(downloadedImages) {

        downloadedImages = downloadedImages || [];

        // Get each image post
        $$('.post.post_micro.is_photo .post_thumbnail_container.has_imageurl:not(.__ignore)').forEach(function (el) {

            var url = el.getAttribute('data-imageurl');
            var imageId = getImageId(url);

            // Save button
            var save = document.createElement('span');
            save.innerText = 'Download';
            save.classList.add('__download_archive');

            // If the image has already been downloaded
            if (downloadedImages.indexOf(imageId) !== -1) {
                save.classList.add('__downloaded_archive');
            }

            // Download the image on click
            save.onclick = function (e) {

                e.stopPropagation();
                e.preventDefault();

                // Create the download link
                var link = document.createElement('a');
                // Create the click event
                var event = document.createEvent('Event');

                // If the image has already been downloaded and confirmation is enabled
                if (save.classList.contains('__downloaded_archive') && confirmDownload) {
                    var sure = confirm('You\'ve already downloaded this image before.\n\nAre you sure you want to download it again?');
                    if (!sure) {
                        return;
                    }
                }

                // See if a HD image is available
                var checkHdImage = new Image();
                var hdAvailable = false;

                var checkDone = function () {

                    // Link to final download image
                    link.href = hdAvailable ? checkHdImage.src : url;

                    // File name
                    link.download = link.href.match(/tumblr_\w+\.(jpe?g|png|gif)$/g);

                    // Configure & tirgger the click event
                    event.initEvent('click', true, true);
                    link.dispatchEvent(event);

                    // Free some memory or something
                    window.URL.revokeObjectURL(link.href);

                    // Remember that this image has been downloaded
                    rememberImage(imageId);

                    msg(['Downloaded Image', 'Archive']);

                };

                checkHdImage.onload = function () {
                    hdAvailable = true;
                    checkDone();
                };

                checkHdImage.onerror = function () {
                    checkDone();
                };

                checkHdImage.src = url.replace('_500.', '_1280.');

            };

            // Highlight the image when hovering over download link
            save.onmouseover = mouseOverArchive;
            save.onmouseout = mouseOutArchive;

            // Insert the button
            var glass = el.parentNode.parentNode.parentNode.querySelector('.post_micro_glass .hover_inner');
            glass.insertBefore(save, glass.firstChild);

        });

    }

    // Get array of downloaded images before placing the buttons
    function addDownloadedButtons() {

        storage.get({confirm: false}, function (object) {

            confirmDownload = object.confirm;

            storage.get({images: []}, function (object) {
                if (IS_ARCHIVE) {
                    addArchiveButtons(object.images);
                } else {
                    addButtons(object.images);
                }
            });

        });

        msg(['Added Download Buttons', 'Added']);

    }

    // Add buttons to initially loaded images
    addDownloadedButtons();

    // If #pagination is hidden, check if new posts have been added with each scroll
    if (document.getElementById('pagination').classList.contains('hidden')) {

        var previousHeight = document.documentElement.scrollHeight;

        document.onscroll = function () {

            // If the document increased in height while scrolling, assume new posts have been loaded
            if (previousHeight < document.documentElement.scrollHeight) {
                previousHeight = document.documentElement.scrollHeight;
                addDownloadedButtons();
            }

        };

    }

    // If an image has been saved (in this or another tab), reflect it in the page if the image exists here too
    chrome.storage.onChanged.addListener(function (changes) {

        // If the download confirmation setting was changed
        if (changes.confirm) {
            confirmDownload = changes.confirm.newValue;
            return;
        }

        // If not the images object has been changed, return
        if (!changes.images) {
            return;
        }

        // If the changes is empty, then the array has been cleared, so remove all ticks
        if (!changes.images.newValue) {

            $$('.__downloaded').forEach(function (el) {
                el.classList.remove('__downloaded');
            });

            if (IS_ARCHIVE) {
                $$('.__downloaded_archive').forEach(function (el) {
                    el.classList.remove('__downloaded_archive');
                });
            }

            return;

        }

        // Get the element of the image with the last ID added to the array
        var changedImage;
        if (IS_ARCHIVE) {

            changedImage = $('.post_thumbnail_container.has_imageurl[data-imageurl*="' + changes.images.newValue.pop() + '"]');
            if (changedImage) {
                // Add the tick and downloaded class
                changedImage.parentNode.parentNode.parentNode.querySelector('.__download_archive').classList.add('__downloaded_archive');
            }

        } else {

            changedImage = $('img[src*="' + changes.images.newValue.pop() + '"]');
            if (changedImage) {
                // Add the tick and downloaded class to the image
                changedImage.classList.add('__downloaded');
            }

        }

    });

    // Add page action button
    msg('show_page_action');

}());
