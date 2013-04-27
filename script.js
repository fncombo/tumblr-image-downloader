/*!
 * Add download links to images on tumblr.
 * @author Eugene
 * @version 0.2
*/

(function () {

    'use strict';

    // Add download buttons to image posts
    function addButtons() {

        // Get each image post
        Array.prototype.slice.call(document.querySelectorAll('.post.photo img:not(.__ignore)')).forEach(function (el) {

            // Add a class to the image so we don't add a button to it again
            el.classList.add('__ignore');

                // Create the download button
            var save = document.createElement('div'),
                // If the image is inside a link, then it means we can get a HD version
                hd = el.parentNode.classList.contains('high_res_link');

            save.innerHTML = 'Download' + (hd ? ' <strong>HD</strong>' : '');
            save.classList.add('__download');

            // Download the image on click
            save.onclick = function () {

                    // Create the download link
                var link = document.createElement('a'),
                    // Create the click event
                    event = document.createEvent('Event');

                // If a HD version is available, then replace the download URL with the one for high resolution image
                link.href = hd ? el.src.replace(/\d+(?=\.(jpe?g|png|gif)$)/g, '1280') : el.src;

                link.target = '_blank';

                // Extract the image file name from the link
                link.download = link.href.match(/tumblr_\w+\.(jpe?g|png|gif)$/g);

                // Configure the click event
                event.initEvent('click', true, true);

                // Trigger the click event on the link
                link.dispatchEvent(event);

                // Free some memory or something
                window.URL.revokeObjectURL(link.href);

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

                var parent = el.parentNode.parentNode;
                parent.classList.add('__download_parent');
                parent.insertBefore(save, parent.lastChild);

            } else {

                el.parentNode.classList.add('__download_parent');
                el.parentNode.insertBefore(save, el.nextSibling);

            }

        });

    }

    // Add buttons to initially loaded images
    addButtons();

    // If #pagination is hidden, check if new posts have been added with each scroll
    if (document.getElementById('pagination').classList.contains('hidden')) {

        var previousHeight = document.height;

        document.onscroll = function () {

            // If the document increased in height while scrolling, assume new posts have been loaded
            if (previousHeight < document.height) {
                previousHeight = document.height;
                addButtons();
            }

        };

    }

}());
