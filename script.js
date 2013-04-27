/*!
 * Add download links to images on tumblr.
 * @author Eugene
 * @version 0.2
*/

// Get each image post
Array.prototype.slice.call(document.querySelectorAll('.post.photo img')).forEach(function (el) {

    'use strict';

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
        }

    };

    // Remove the highlight when not hovering
    save.onmouseout = function () {

        if (hd) {
            this.parentNode.classList.remove('__highlight');
        } else {
            this.previousSibling.classList.remove('__highlight');
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
