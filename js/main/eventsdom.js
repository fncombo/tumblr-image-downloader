'use strict';

/* globals TID, $, $$ */

/**
 * Initialize all DOM mutation observers
 */
TID.events.initMutationObservers = function () {
    console.log('Initializing DOM mutation observers');

    var toObserve;
    var postsObserver;

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
    var centerImageObserver = new MutationObserver(function (mutations) {
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
                url: el.src
            };

            TID.buttons.create(data, function (button) {
                appendButton(el, button);
            });
        });
    });

    // Create a DOM mutation observer for the body
    var lightboxObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (el) {
            for (var i = 0, l = el.addedNodes.length; i < l; i += 1) {
                if (el.addedNodes[i].id === 'tumblr_lightbox') {
                    centerImageObserver.observe($(TID.selectors.lightboxCenterImage), {
                        attributes: true,
                        attributeFilter: ['src']
                    });

                    break;
                }
            }
        });
    });

    // Start observing
    lightboxObserver.observe(document.body, {
        childList: true
    });

    // Create a DOM mutation observer for inline post images
    var inlineImageObserver = new MutationObserver(function (mutations) {
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
                    url: el.src
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

    // Observe each inline image
    $$('.inline_image, .inline_external_image').forEach(function (el) {
        inlineImageObserver.observe(el, {
            attributes: true,
            attributeFilter: ['src', 'class']
        });
    });

    if (!TID.isArchivePage) {
        // Create a DOM mutation observer for new posts
        postsObserver = new MutationObserver(function () {
            // Assume a post has been added or removed,
            // so try to add button to any new images
            TID.buttons.add();
        });

        toObserve = $(TID.selectors.posts);

        // Observe the posts container for new posts
        if (toObserve) {
            postsObserver.observe(toObserve, {
                childList: true,
            });
        }
    }
};
