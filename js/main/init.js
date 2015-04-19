'use strict';

/* globals TID */

/**
 * Global extension settings
 * @type {Object}
 */
TID.settings = {};

/**
 * Defaults for the settings, and callbacks for when they are loaded or changed
 * @type {Object}
 */
TID.settings.list = {
    confirm: {
        default: true,
        set: function (value) {
            TID.settings.confirm = value;
        }
    },

    showTicks: {
        default: true,
        set: function (value) {
            TID.settings.showTicks = value;
            TID.ticks.setVisibility(value);
        }
    },

    enableLocations: {
        default: true,
        set: function (value) {
            TID.directories.setVisibility(value);
        }
    }
};

/**
 * All the regular expressions used in the extension
 * @type {Object}
 */
TID.regex = {
    imageSize: /(_)(\d+)(\.(?:jpe?g|png|gif)$)/,
    imageId: /\/tumblr_(?:inline_)?(?:(\w+)_\d+|(\w+))(?=\.(?:jpe?g|png|gif)$)/,
    imageExt: /(jpe?g|png|gif)$/,
    image1280: /_1280\.(?:jpe?g|png|gif)$/,
    imageDomain: /^https?:\/\/(?:www.)?([^\/]+)/,
    tumblrDomain: /tumblr\.com\//,
    https: /^https?:\/\//,
    globalForwardSlash: /\//g,
};

/**
 * Enumeration of types of HD images
 * @type {Object}
 */
TID.HDTypes = {
    none: 0,
    tumblrHighRes: 1,
    externalHighRes: 2
};

/**
 * CSS classes
 * @type {Object}
 */
TID.classes = {
    archivePage: 'TID-archive',
    tempContainer: 'TID-temp-container',
    showTicks: 'TID-show-ticks',
    hideLocations: 'TID-hide-locations',
    ignore: 'TID-ignore',
    download: 'TID-download',
    downloaded: 'TID-downloaded',
    downloadDiv: 'TID-download-div',
    list: 'TID-list',
    help: 'TID-help',
    parent: 'TID-parent',
    photoset: 'TID-photoset',
    highlight: 'TID-highlight',
    overlay: 'TID-overlay',
    dialog: 'TID-dialog',
    dialogMessage: 'TID-dialog-message',
    dialogImage: 'TID-dialog-image',
    dialogButton: 'TID-dialog-button',
    dialogAlignText: 'TID-dialog-align-text',
    revealImageLink: 'TID-reveal-image-link',
};

/**
 * Check if the current page is a Tumblelog's archive page
 * @type {Boolean}
 */
TID.isArchivePage = /\/archive(?:\/|$)/.test(window.location.pathname);

/**
 * Check if the current page is a single image view
 * @type {Boolean}
 */
TID.isSinglePage = document.body.classList.contains('single_image');

/**
 * Selectors for HTML elements based on the current page
 * @type {Object}
 */
TID.selectors = {
    post: '.post_container',
    postFullImage: '.tmblr-full',
    lightboxCenterImage: '#tumblr_lightbox_center_image'
};

if (TID.isArchivePage) {
    TID.selectors.images = '.post.post_micro.is_photo ' +
        '.post_thumbnail_container.has_imageurl:not(.' + TID.classes.ignore + ')';
} else if (TID.isSinglePage) {
    TID.selectors.images = '#content-image';
} else {
    TID.selectors.images = '.post.is_photo .post_content img:not(.' + TID.classes.ignore + '), ' +
        '.post.is_photoset .post_content img:not(.' + TID.classes.ignore + '), '+
        '.post_body figure img:not(.' + TID.classes.ignore + ')';
}
