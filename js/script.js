'use strict';

/* globals chrome, $, $$ */

(function () {

    var TID = {

        downloadedImages: [],
        directories: [],
        confirm: true,
        isArchivePage: !!window.location.pathname.match(/(archive)/i),
        isInfiniteScrolling: $('#pagination') ? $('#pagination').clientHeight : false,

        classes: {
            ignore: '__TID_ignore',
            download: '__TID_download',
            downloaded: '__TID_downloaded',
            downloadDiv: '__TID_download_div',
            list: '__TID_list',
            help: '__TID_help',
            parent: '__TID_parent',
            photoset: '__TID_photoset',
            highlight: '__TID_highlight'
        },

        selectors: {
            images: function () {

                if (!TID.isArchivePage) {
                    return '.post.is_photo .post_content img:not(.' + TID.classes.ignore + '), ' +
                           '.post.is_photoset .post_content img:not(.' + TID.classes.ignore + ')';
                } else {
                    return '.post.post_micro.is_photo ' +
                           '.post_thumbnail_container.has_imageurl:not(.' + TID.classes.ignore + ')';
                }

            }
        },

        match: {
            imageSize: new RegExp('\\d+(?=\\.(?:jpe?g|png|gif)$)', 'i'),
            imageName: new RegExp('tumblr_(\\w+)(?=_\\d+\\.(?:jpe?g|png|gif)$)', 'i'),
            imageExt: new RegExp('(jpe?g|png|gif)$', 'i'),
            image1280: new RegExp('_1280\\.(?:jpe?g|png|gif)$', 'i'),
            tumblrDomain: new RegExp('tumblr\\.com', 'i'),
            tumblrImgRes: new RegExp('(_\\d+\\.)')
        },

        run: function () {

            TID.sendMessage('show_page_action');

            // Monitor storage changes
            chrome.storage.onChanged.addListener(function (changes) {

                // If the download confirmation setting was changed, adjust the local setting
                if (changes.confirm) {

                    TID.confirm = changes.confirm.newValue;

                // If the images storage was updated
                } else if (changes.images) {

                    // Update the downloaded images array
                    TID.downloadedImages = changes.images.newValue || [];

                    // If the new value is empty, all images have been cleared, remove all ticks
                    if (!changes.images.newValue) {

                        TID.removeAllTicks();

                    // New image has been added, get the last ID and add a tick to it
                    } else {

                        var imageID = changes.images.newValue[changes.images.newValue.length - 1];
                        TID.addTick(imageID);

                    }

                // If the save directories were modified
                } else if (changes.saveDirectories) {

                    TID.directories = changes.saveDirectories.newValue;

                    var list = TID.formatDirectories();

                    $$('.' + TID.classes.list + ' ul').forEach(function (el) {
                        el.innerHTML = list;
                    });

                }

            });

            // Keep adding new buttons for pages with endless scrolling
            if (TID.isInfiniteScrolling || TID.isArchivePage) {

                var previousHeight = TID.getDocumentHeight();

                document.onscroll = function () {

                    // If the height has changed, try adding buttons to new images (if any)
                    if (previousHeight !== TID.getDocumentHeight()) {
                        previousHeight = TID.getDocumentHeight();
                        TID.addButtons();
                    }

                };

            }

            // Update the downloaded images array
            chrome.storage.local.get({images: []}, function (object) {

                TID.downloadedImages = object.images;

                // Get list of directories
                TID.getDirectories(function () {

                    TID.addButtons();

                });

            });

            // Get the confirmation settings
            chrome.storage.local.get({confirm: TID.confirm}, function (object) {
                TID.confirm = object.confirm;
            });

            // Download list events
            document.addEventListener('click', function (event) {

                var parent;
                var url;
                var imageID;
                var isHD;
                var directory;

                // Set up downloading via directory list buttons
                if (event.target.matchesSelector('.' + TID.classes.list + ' li:not(.' + TID.classes.help + ')')) {

                    event.stopPropagation();
                    event.preventDefault();

                    parent = event.target.ancestor(3);
                    imageID = parent.getAttribute('data-image-id');

                    if (TID.hasDownloaded(imageID)) {
                        return;
                    }

                    url = parent.getAttribute('data-download-url');
                    directory = event.target.getAttribute('data-directory');

                    TID.downloadImage(url, imageID, directory);

                    TID.sendMessage(['Downloaded Image', 'To Directory']);

                // Set up downloading via normal download button
                } else if (event.target.matchesSelector('.' + TID.classes.downloadDiv)) {

                    event.stopPropagation();
                    event.preventDefault();

                    parent = event.target.parentNode;
                    imageID = parent.getAttribute('data-image-id');

                    if (TID.hasDownloaded(imageID)) {
                        return;
                    }

                    url = parent.getAttribute('data-download-url');
                    isHD = parent.getAttribute('data-hd') === 'true' ? true : false;

                    TID.downloadImage(url, imageID);

                    if (!TID.isArchivePage) {
                        TID.sendMessage(['Downloaded Image', isHD ? 'HD' : 'SD']);
                    } else {
                        TID.sendMessage(['Downloaded Image', 'Archive']);
                    }

                // Set up link to the options page
                } else if (event.target.matchesSelector('.' + TID.classes.help)) {

                    event.stopPropagation();
                    event.preventDefault();

                    TID.sendMessage('open_settings');

                }

            }, true);

            // Create a DOM mutation observer for the lightbox middle image
            var centerImageObserver = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {

                    var imageID = TID.getImageID(mutation.target.src);

                    // Get the button of the image with that ID from the page
                    var button = $('.' + TID.classes.download + '[data-image-id=' + imageID + ']');

                    if (button) {

                        button = button.cloneNode(true);

                    // If the button doesn't exist because we're not on the dashboard, make one
                    // Use the "src" attribute from the image because Tumblr will automatically give us the largest one
                    } else {

                        var imageHDAvailable = mutation.target.src.match(TID.match.image1280) !== null ? true : false;
                        button = TID.createDownloadButton(imageID, imageHDAvailable, mutation.target.src);

                    }

                    // Get half the image's height and width
                    var top = Math.floor(mutation.target.clientHeight / 2);
                    var left = Math.floor(mutation.target.clientWidth / 2);

                    // Give the button correct offsets
                    button.style.position = 'relative';
                    button.style.top = '-' + top + 'px';
                    button.style.left = '-' + left + 'px';

                    // Remove any existing buttons
                    $$('.' + TID.classes.download, mutation.target.parentNode).forEach(function (el) {
                        el.remove();
                    });

                    // Append the button
                    mutation.target.parentNode.appendChild(button);

                });
            });

            // Create a DOM mutation observer for the body
            var lightboxObserver = new MutationObserver(function (mutations) {
                mutations.forEach(function (el) {

                    var i = 0;
                    var l = el.addedNodes.length;

                    for (; i < l; i += 1) {

                        if (el.addedNodes[i].id === 'tumblr_lightbox') {

                            centerImageObserver.observe($('#tumblr_lightbox_center_image'), {
                                attributes: true, attributeFilter: ['src']
                            });

                            break;

                        }

                    }

                });
            });

            // Start observing
            lightboxObserver.observe($('body'), {childList: true});

            // Listen to connections from the background script
            chrome.runtime.onMessage.addListener(function (request) {

                switch (request.message) {

                case 'not_image':

                    TID.forgetImage(request.imageID);
                    TID.removeTick(request.imageID);

                    var sure = confirm('Oops! The external link doesn\'t appear to be an image.\n\n' +
                                       'Would you like to download the normal image from Tumblr instead?');

                    if (sure) {

                        var button = $('.' + TID.classes.download + '[data-image-id="' + request.imageID + '"]');
                        var image = button.parentNode.querySelector('img');

                        TID.downloadImage(image.src, request.imageID, request.directory);

                    }

                    break;

                }

            });

        },

        /**
         * Get the list of all user-defined directories
         */
        getDirectories: function (callback) {

            chrome.storage.sync.get({saveDirectories: []}, function (object) {

                if (object.saveDirectories.length) {
                    TID.directories = object.saveDirectories;
                }

                callback.call(this);

            });

        },

        /**
         * Add buttons to all downloadable images
         */
        addButtons: function () {

            TID.sendMessage(['Added Download Buttons', 'Added']);

            $$(TID.selectors.images()).forEach(function (el) {

                // Skip images that are not part of the actual post
                if (el.ancestor(2).classList.contains('caption') || el.ancestor(2).nodeName === 'BLOCKQUOTE') {
                    return;
                }

                // Don't add buttons to this image anymore
                el.classList.add(TID.classes.ignore);

                var button;
                var container;

                if (!TID.isArchivePage) {

                    var imageData = TID.getImageData(el);
                    button = TID.createDownloadButton(TID.getImageID(el.src), imageData.isHD, imageData.url);

                    // Append the button
                    container = el.parentNode;
                    container.classList.add(TID.classes.parent);
                    container.insertBefore(button, container.firstChild);

                } else {

                    var url = el.getAttribute('data-imageurl');
                    button = TID.createDownloadButton(TID.getImageID(url), false, url);

                    // Append the button
                    container = el.closest('.post').querySelector('.post_micro_glass .hover_inner');
                    container.insertBefore(button, container.firstChild);

                }

            });

        },

        /**
         * Create the download button
         */
        createDownloadButton: function (imageID, isHD, url) {

            // Core container
            var el = document.createElement('div');
            el.classList.add(TID.classes.download);
            el.setAttribute('data-download-url', url);
            el.setAttribute('data-image-id', imageID);
            el.setAttribute('data-hd', isHD);

            // Main download button
            var download = document.createElement('div');
            download.classList.add(TID.classes.downloadDiv);
            download.innerText = 'Download';
            el.appendChild(download);

            // Directories drop-down
            var directories = document.createElement('div');
            directories.classList.add(TID.classes.list);
            directories.innerHTML += '<span>&#9660;</span>';

            var list = document.createElement('ul');
            list.innerHTML = TID.formatDirectories();

            directories.appendChild(list);
            el.appendChild(directories);

            // Check if the image has already been downloaded
            if (TID.downloadedImages.indexOf(imageID) !== -1) {
                el.classList.add(TID.classes.downloaded);
            }

            // If any type of HD, add message
            if (isHD) {
                download.innerHTML += '&nbsp;<strong>HD</strong>';
            }

            // If HD is from an external site, add an arrow and a tooltip
            if (isHD === 'external_high_res') {
                download.innerHTML += '&#10138;';
                download.title = 'HD image is from an external site';
            }

            el.onmouseover = function () {

                if (!TID.isArchivePage) {

                    if (el.ancestor(2).classList.contains('photoset_row')) {
                        el.ancestor(2).classList.add(TID.classes.photoset);
                    }

                } else {

                    el.ancestor(3).classList.add(TID.classes.highlight);

                }

            };

            el.onmouseout = function () {

                if (!TID.isArchivePage) {

                    if (el.ancestor(2).classList.contains('photoset_row')) {
                        el.ancestor(2).classList.remove(TID.classes.photoset);
                    }

                } else {

                    el.ancestor(3).classList.remove(TID.classes.highlight);

                }

            };

            return el;

        },

        /**
         * Get the current document height
         */
        getDocumentHeight: function () {
            return document.documentElement.scrollHeight;
        },

        /**
         * Get the Tumblr image ID from an image URL
         */
        getImageID: function (url) {

            var imageID = url.match(TID.match.imageName);

            // If matched correctly
            if (imageID && imageID.length === 2) {
                // Return the ID
                return imageID[1];
            }

            // Couldn't find an ID
            return false;

        },

        /**
         * Check if a HD version of the image is available using the markup
         */
        getImageData: function (imageEl) {

            var data = {};

            // If it has a dedicated high res link
            if (imageEl.closest('.high_res_link')) {

                data.url = imageEl.closest('.high_res_link').href;

                // If it has "tumblr.com" in the URL, it's probably from Tumblr
                if (imageEl.closest('.high_res_link').href.match(TID.match.tumblrDomain)) {

                    data.isHD = 'tumblr_high_res';

                    // If the link is not to an image, it must be to the fancy preview page
                    // So just get the 1280 link manually
                    if (!imageEl.closest('.high_res_link').href.match(TID.match.imageExt)) {
                        data.url = imageEl.src.replace(TID.match.tumblrImgRes, '_1280.');
                    }

                // If it's a straight up link to an image, it's probably external
                } else {

                    data.isHD = 'external_high_res';

                }

            // If it's a link to an image
            } else if (imageEl.closest('a') && imageEl.closest('a').href.match(TID.match.imageExt)) {

                // Get the link's image size and the current image's size
                var imageLinkSize = imageEl.closest('a').href.match(TID.match.imageSize)[0];
                var originalImageSize = imageEl.src.match(TID.match.imageSize)[0];

                // If the link's image size is bigger, HD is available
                if (parseInt(imageLinkSize, 10) > parseInt(originalImageSize, 10)) {

                    data = {
                        isHD: 'tumblr_high_res',
                        url: imageEl.closest('a').href
                    };

                }

            }

            // In case no HD or correct URL found
            if (!data.isHD) {
                data.isHD = false;
            }
            if (!data.url) {
                data.url = imageEl.src;
            }

            return data;

        },

        /**
         * Check if a HD version is available by trying to load different resolutions
         */
        availableHDImage: function (url, callbackSuccess, callbackError) {

            var image = new Image();
            var resolutions = ['_1280.', '_500.', '_400.', '_250.', '_100.'];
            var curentResolution = 0;

            image.onload = function () {

                // Double check if a valid image was loaded - http://stackoverflow.com/a/1977898
                if (!image.naturalWidth || !image.naturalHeight) {
                    image.onerror();
                } else {
                    callbackSuccess.call(this, image.src);
                }

            };

            image.onerror = function () {

                curentResolution += 1;

                // Keep loading next biggest resolution until an image is loaded
                if (curentResolution !== resolutions.length - 1) {

                    // http://stackoverflow.com/a/17656617
                    setTimeout(function () {
                        image.src = url.replace(TID.match.tumblrImgRes, resolutions[curentResolution]);
                    }, 0);

                } else {

                    // No better resolution was found
                    callbackError.call(this, url);

                }

            };

            // Try to load the biggest resolution first
            image.src = url.replace(TID.match.tumblrImgRes, resolutions[curentResolution]);

        },

        /**
         * Download an image using the native Chrome API
         */
        downloadImage: function (url, imageID, directory) {

            if (!directory) {
                directory = false;
            }

            function sendMessage(url) {
                TID.sendMessage({
                    message: 'download',
                    url: url,
                    directory: directory,
                    imageID: imageID
                });
            }

            if (!TID.isArchivePage) {

                sendMessage(url);

            } else {

                TID.availableHDImage(url, function (url) {
                    sendMessage(url);
                }, function (url) {
                    sendMessage(url);
                });

            }

            TID.rememberImage(imageID);

        },

        /**
         * Update local storage with the image's ID
         */
        rememberImage: function (imageID) {

            chrome.storage.local.get({images: []}, function (object) {

                if (object.images.indexOf(imageID) === -1) {
                    object.images.push(imageID);
                    chrome.storage.local.set(object);
                }

            });

        },

        /**
         * Remove the image's ID from local storage
         */
        forgetImage: function (imageID) {

            chrome.storage.local.get({images: []}, function (object) {

                if (object.images.indexOf(imageID) !== -1) {
                    var index = object.images.indexOf(imageID);
                    object.images.splice(index, 1);
                    chrome.storage.local.set(object);
                }

            });

        },

        /**
         * Send a message to the background page
         */
        sendMessage: function (message, callback) {

            if (typeof message !== 'object' || message instanceof Array) {
                message = {message: message};
            }

            if (callback) {
                chrome.runtime.sendMessage(message, callback);
            } else {
                chrome.runtime.sendMessage(message);
            }

        },

        /**
         * Add a tick to a button with a certain image ID
         */
        addTick: function (imageID) {
            $$('.' + TID.classes.download + '[data-image-id="' + imageID + '"]').forEach(function (el) {
                el.classList.add(TID.classes.downloaded);
            });
        },

        /**
         * Remove tick from a certain imageID
         */
        removeTick: function (imageID) {
            $$('.' + TID.classes.downloaded + '[data-image-id="' + imageID + '"]').forEach(function (el) {
                el.classList.remove(TID.classes.downloaded);
            });
        },

        /**
         * Remove all ticks from all buttons
         */
        removeAllTicks: function () {
            $$('.' + TID.classes.downloaded).forEach(function (el) {
                el.classList.remove(TID.classes.downloaded);
            });
        },

        /**
         * Show a download confirmation dialog
         */
        confirmDialog: function () {
            return confirm('You\'ve already downloaded this image before.\n\n' +
                           'Are you sure you want to download it again?');
        },

        /**
         * Format the list of download directories
         */
        formatDirectories: function () {

            if (TID.directories.length) {

                var list = '';

                TID.directories.forEach(function (directory) {
                    var name = directory.replace(/(.+\/)/, '<span>$1</span>').replace(/\/(?!\w+>)/g, '<strong>&#8260;</strong>');
                    list += '<li title="Download inside: ' + directory + '" data-directory="' + directory + '">' + name + '</li>';
                });

                return list;

            } else {

                return '<li class="' + TID.classes.help + '">You can specify custom download\nlocations in the settings.\nClick to configure.</li>';

            }

        },

        /**
         * Check if the image has already been downloaded and prompt the user if needed
         */
        hasDownloaded: function (imageID) {
            return TID.confirm && TID.downloadedImages.indexOf(imageID) !== -1 && !TID.confirmDialog();
        }

    };

    TID.run();

}());
