/*!
 * Add download links to images on tumblr.
 * @author Eugene
*/

(function () {

    'use strict';

        // Use Chrome's local storage
    var storage = chrome.storage.local,
        // Whether or not to confirm downloading again
        confirmDownload,
        // Regular expression to match the size of the image
        matchSize = new RegExp('\\d+(?=\\.(jpe?g|png|gif)$)', 'g');

    // Send a message to the background page
    function msg(action) {
        chrome.runtime.sendMessage({action: action});
    }

    // Check if a HD version of the image is available
    function isHd(img) {

        if (img.parentNode.classList.contains('high_res_link')) {

            return img.parentNode.href.match(/tumblr\.com\/image/g) ? 1 : false;

        } else if (img.parentNode.nodeName === 'A' && img.parentNode.href.match(/(jpe?g|png|gif)$/g)) {

            var linkSize = img.parentNode.href.match(matchSize)[0],
                imgSize = img.src.match(matchSize)[0];

            return parseInt(linkSize, 10) > parseInt(imgSize, 10) ? 2 : false;

        }

        return false;

    }

    // Get tumblr image ID
    function getImageId(imageSrc) {
        return imageSrc.match(/tumblr_(\w+)(?=_\d+\.{1}(jpe?g|png|gif)$)/)[1];
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

    // Add download buttons to image posts
    function addButtons(downloadedImages) {

        downloadedImages = downloadedImages || [];

        // Get each image post
        Array.prototype.slice.call(document.querySelectorAll('.post.photo .post_content img:not(.__ignore)')).forEach(function (el) {

            // Add a class to the image so we don't add a button to it again
            el.classList.add('__ignore');

                // Create the download button
            var save = document.createElement('span'),
                // Check if the image has a HD version
                hd = isHd(el);

            save.innerHTML = 'Download' + (hd ? ' <strong>HD</strong>' : '');
            save.classList.add('__download');

            // If the image has already been downloaded
            if (downloadedImages.indexOf(getImageId(el.src)) !== -1) {
                el.classList.add('__downloaded');
            }

            // Download the image on click
            save.onclick = function () {

                    // Create the download link
                var link = document.createElement('a'),
                    // Create the click event
                    event = document.createEvent('Event'),
                    // Original event of the parent tag
                    originalEvent = el.parentNode.onclick;

                // Suppress the click on the link
                el.parentNode.onclick = function () {
                    return false;
                };

                // Restore the click event
                setTimeout(function () {
                    el.parentNode.onclick = originalEvent;
                }, 100);

                // If the image has already been downloaded and confirmation is enabled
                if (el.classList.contains('__downloaded') && confirmDownload) {
                    var sure = confirm('You\'ve already downloaded this image before.\n\nAre you sure you want to download it again?');
                    if (!sure) {
                        return;
                    }
                }

                // If a HD version is available, then replace the download URL with the one for high resolution image
                if (hd && hd === 1) {
                    link.href = el.src.replace(matchSize, '1280');
                } else if (hd && hd === 2) {
                    link.href = el.parentNode.href;
                } else {
                    link.href = el.src;
                }

                // Extract the image file name from the link
                link.download = link.href.match(/tumblr_\w+\.(jpe?g|png|gif)$/g);

                // Configure & tirgger the click event
                event.initEvent('click', true, true);
                link.dispatchEvent(event);

                // Free some memory or something
                window.URL.revokeObjectURL(link.href);

                // Remember that this image has been downloaded
                rememberImage(getImageId(el.src));

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

    // Get array of downloaded images before placing the buttons
    function addDownloadedButtons() {

        storage.get({confirm: false}, function (object) {

            confirmDownload = object.confirm;

            storage.get({images: []}, function (object) {
                addButtons(object.images);
            });

        });

        msg(['Added Download Buttons', 'Added']);

    }

    // Add buttons to initially loaded images
    addDownloadedButtons();

    // If #pagination is hidden, check if new posts have been added with each scroll
    if (document.getElementById('pagination').classList.contains('hidden')) {

        var previousHeight = document.height;

        document.onscroll = function () {

            // If the document increased in height while scrolling, assume new posts have been loaded
            if (previousHeight < document.height) {
                previousHeight = document.height;
                addDownloadedButtons();
            }

        };

        msg(['Infinite Scroll', 'Enabled']);

    } else {

        msg(['Infinite Scroll', 'Disabled']);

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
            Array.prototype.slice.call(document.querySelectorAll('.__downloaded')).forEach(function (el) {
                el.classList.remove('__downloaded');
            });
            return;
        }

            // Get the element of the image with the last ID added to the array
        var changedImage = document.querySelector('img[src*="' + changes.images.newValue.pop() + '"]');

        if (changedImage) {

            // Add the tick and downloaded class to the image
            changedImage.classList.add('__downloaded');

        }

    });

}());
