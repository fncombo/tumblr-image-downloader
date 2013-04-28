/*!
 * Add download links to images on tumblr.
 * @author Eugene
 * @version 0.5.1
*/

(function () {

    'use strict';

        // Use Chrome's local storage
    var storage = chrome.storage.local;

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

    // Add download buttons to image posts
    function addButtons(downloadedImages) {

        downloadedImages = downloadedImages || [];

        // Get each image post
        Array.prototype.slice.call(document.querySelectorAll('.post.photo .post_content img:not(.__ignore)')).forEach(function (el) {

            // Add a class to the image so we don't add a button to it again
            el.classList.add('__ignore');

                // Create the download button
            var save = document.createElement('div'),
                // If the image is inside a link, then it means we can get a HD version
                hd = el.parentNode.classList.contains('high_res_link'),
                // Regular expression to match the size of the image
                matchSize = new RegExp('\\d+(?=\\.(jpe?g|png|gif)$)', 'g'),
                // Another type of HD image link
                softHd = el.parentNode.nodeName === 'A' && el.parentNode.href.match(matchSize) !== null ? true : false,
                // See if the soft HD image is bigger than the one displayed on the page
                softHdSize = softHd ? parseInt(el.src.match(matchSize)[0], 10) < parseInt(el.parentNode.href.match(matchSize)[0], 10) : false;

            save.innerHTML = 'Download' + (hd || softHdSize ? ' <strong>HD</strong>' : '');
            save.classList.add('__download');

            // If the image has already been downloaded
            if (downloadedImages.indexOf(getImageId(el.src)) !== -1) {

                save.innerHTML = '&#10003; ' + save.innerHTML;
                save.title = 'You\'ve already downloaded this image.';
                el.classList.add('__downloaded');

            }

            // Download the image on click
            save.onclick = function () {

                if (el.parentNode.nodeName === 'A') {

                    var originalEvent = el.parentNode.onclick;

                    // Suppress the click on the link
                    el.parentNode.onclick = function () {
                        return false;
                    };

                    // Restore the click event
                    setTimeout(function () {
                        el.parentNode.onclick = originalEvent;
                    }, 100);

                }

                // If the image has already been downloaded
                if (el.classList.contains('__downloaded')) {
                    var sure = confirm('You\'ve already downloaded this image before.\n\nAre you sure you want to download it again?');
                    if (!sure) {
                        return;
                    }
                }

                    // Create the download link
                var link = document.createElement('a'),
                    // Create the click event
                    event = document.createEvent('Event');

                // If a HD version is available, then replace the download URL with the one for high resolution image
                link.href = hd ? el.src.replace(matchSize, '1280') : el.src;

                // If another type of HD version is available, prefer that
                link.href = softHd ? el.parentNode.href : link.href;

                // Extract the image file name from the link
                link.download = link.href.match(/tumblr_\w+\.(jpe?g|png|gif)$/g);

                // Configure the click event
                event.initEvent('click', true, true);

                // Trigger the click event on the link
                link.dispatchEvent(event);

                // Free some memory or something
                window.URL.revokeObjectURL(link.href);

                // Remember that this image has been downloaded
                rememberImage(getImageId(el.src));

            };

            // Highlight the image when hovering over download link
            save.onmouseover = function () {

                if (hd) {
                    this.parentNode.classList.add('__highlight');
                } else {

                    this.previousSibling.classList.add('__highlight');

                    // If the image is in a photoset row, reveal the row to show the whole image
                    if (this.parentNode.parentNode.classList.contains('photoset_row')) {
                        this.parentNode.parentNode.classList.add('__show_photoset');
                    }

                }

            };

            // Remove the highlight when not hovering
            save.onmouseout = function () {

                if (hd) {
                    this.parentNode.classList.remove('__highlight');
                } else {

                    this.previousSibling.classList.remove('__highlight');

                    if (this.parentNode.parentNode.classList.contains('photoset_row')) {
                        this.parentNode.parentNode.classList.remove('__show_photoset');
                    }

                }

            };

            // Add a special class to the parent of the download button
            // Insert the download button
            if (hd) {

                // If HD image, go up another tag to avoid inserting the button into an anchor tag
                var parent = el.parentNode.parentNode;
                parent.classList.add('__download_parent');
                parent.insertBefore(save, parent.lastChild);

            } else {

                el.parentNode.classList.add('__download_parent');
                el.parentNode.insertBefore(save, el.nextSibling);

            }

        });

    }

    // Get array of downloaded images before placing the buttons
    function addDownloadedButtons() {

        storage.get({images: []}, function (object) {

            addButtons(object.images);

        });

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

    }

    // If an image has been saved (in this or another tab), reflect it in the page if the image exists here too
    chrome.storage.onChanged.addListener(function (changes) {

        // If the changes is empty, then the array has been cleared, so remove all ticks
        if (!changes.images.newValue) {
            Array.prototype.slice.call(document.querySelectorAll('.__downloaded')).forEach(function (el) {
                el.classList.remove('__downloaded');
                el.nextSibling.innerHTML = el.nextSibling.innerHTML.substr(2);
            });
            return;
        }

            // Get the element of the image with the last ID added to the array
        var changedImage = document.querySelector('img[src*="' + changes.images.newValue.pop() + '"]');

        if (changedImage) {

            // Add the tick and downloaded class to the image
            changedImage.nextSibling.innerHTML = '&#10003; ' + changedImage.nextSibling.innerHTML;
            changedImage.classList.add('__downloaded');

        }

    });

}());
