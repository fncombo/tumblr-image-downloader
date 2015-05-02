'use strict';

/* globals TID, $, $$ */

/**
 * Object of functions for different mutation observations
 * @type {Object}
 */
TID.observeMutations = {};

/**
 * Object of all mutation observers
 * @type {Object}
 */
TID.mutationObservers = {};

/**
 * Initialize all DOM mutation observers
 */
TID.events.initMutationObservers = function () {
    console.log('Initializing DOM mutation observers');

    if (!TID.isArchivePage) {
        TID.observeMutations.lightbox();
        TID.observeMutations.inlineImages();
        TID.observeMutations.posts();
    }
};

/**
 * Observe the lightbox and the center image within it
 */
TID.observeMutations.lightbox = function () {
    function appendButton (el, button) {
        // Give the button correct offsets
        button.style.position = 'relative';
        button.style.top = el.style.top;
        button.style.left = el.style.left;

        // Remove any existing buttons
        $$('.' + TID.classes.download, el.parentNode).forEach(function (el) {
            el.remove();
        });

        // Append the button
        el.parentNode.appendChild(button);
    }

    // Create a DOM mutation observer for the lightbox middle image
    if (!TID.mutationObservers.centerImage) {
        TID.mutationObservers.centerImage = new MutationObserver(function (mutations) {
            console.log('Center image mutation observer fired', mutations);

            mutations.forEach(function (mutation) {
                var el = mutation.target;
                var imageId = TID.images.getID(el.src);

                // If the button already exists on the page, use that
                var existingButton = $('.' + TID.classes.download + '[data-image-id="' + imageId + '"]');
                if (existingButton) {
                    appendButton(el, existingButton.cloneNode(true));
                    return;
                }

                var isHD = TID.regex.image1280.test(el.src);
                var data = {
                    imageId: imageId,
                    isHD: isHD,
                    HDType: isHD ? TID.HDTypes.tumblrHighRes : TID.HDTypes.none,
                    url: el.src,
                };

                TID.buttons.create(data, function (button) {
                    appendButton(el, button);
                });
            });
        });
    }

    // Create a DOM mutation observer for the body
    if (!TID.mutationObservers.lightbox) {
        TID.mutationObservers.lightbox = new MutationObserver(function (mutations) {
            console.log('Lightbox mutation observer fired', mutations);

            mutations.forEach(function (el) {
                for (var i = 0, l = el.addedNodes.length; i < l; i += 1) {
                    if (el.addedNodes[i].id === 'tumblr_lightbox') {
                        TID.mutationObservers.centerImage.observe($(TID.selectors.lightboxCenterImage), {
                            attributes: true,
                            attributeFilter: [
                                'src',
                            ],
                        });

                        break;
                    }
                }
            });
        });
    }

    // Start observing
    TID.mutationObservers.lightbox.observe(document.body, {
        childList: true,
    });
};

/**
 * Observer for changed in inline post images
 */
TID.observeMutations.inlineImages = function () {
    // Create a DOM mutation observer for inline post images
    if (!TID.mutationObservers.inlineImage) {
        TID.mutationObservers.inlineImage = new MutationObserver(function (mutations) {
            console.log('Inline image mutation observer fired', mutations);

            mutations.forEach(function (mutation) {
                var el = mutation.target;
                var blockEl = [];

                TID.selectors.post.split(', ').forEach(function (selector) {
                    blockEl.push('p, div:not(' + selector + ')');
                });

                blockEl = blockEl.join(', ');
                blockEl = el.closest(blockEl);

                if (
                    (
                        !el.classList.contains('inline_external_image') &&
                        !el.classList.contains('inline_image')
                    ) ||
                    (
                        el.classList.contains('inline_external_image') &&
                        el.classList.contains('enlarged')
                    )
                ) {
                    var isExternal = !!el.classList.contains('inline_external_image');
                    var data = {
                        imageId: TID.images.getID(el.src),
                        isHD: false,
                        HDType: isExternal ? TID.HDTypes.externalHighRes : TID.HDTypes.none,
                        url: el.src,
                    };

                    TID.buttons.create(data, function (button) {
                        // Remove any existing buttons
                        $$('.' + TID.classes.download, el.parentNode).forEach(function (el) {
                            el.remove();
                        });

                        // Append the button
                        blockEl.classList.add(TID.classes.parent);
                        blockEl.insertBefore(button, el);
                    });
                } else {
                    // Remove any buttons
                    $$('.' + TID.classes.download, blockEl).forEach(function (el) {
                        el.remove();
                    });
                }
            });
        });
    }

    // Observe each inline image
    $$(TID.selectors.inlineImages).forEach(function (el) {
        TID.mutationObservers.inlineImage.observe(el, {
            attributes: true,
            attributeFilter: [
                'src',
                'class',
            ],
        });
    });
};

/**
 * Observe for new posts
 */
TID.observeMutations.posts = function () {
    // Create a DOM mutation observer for new posts
    if (!TID.mutationObservers.posts) {
        TID.mutationObservers.posts = new MutationObserver(function (mutations) {
            console.log('Posts mutation observer fired', mutations);

            // Assume a post has been added or removed,
            // so try to add button to any new images
            TID.buttons.add();

            // Observe any new inline images
            TID.observeMutations.inlineImages();
        });
    }

    var toObserve = $(TID.selectors.posts);

    // Observe the posts container for new posts
    if (toObserve) {
        TID.mutationObservers.posts.observe(toObserve, {
            childList: true,
        });
    }
};
