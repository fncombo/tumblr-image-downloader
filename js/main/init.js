'use strict';

/* globals TID, $ */

// Global extension settings
TID.settings = { };

// Defaults for the settings, and callbacks for when they are loaded or changed
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

// All the regular expressions used in the extension
TID.regex = {
    imageSize: /(_)(\d+)(\.(?:jpe?g|png|gif)$)/,
    imageID: /\/tumblr_(?:inline_)?(?:(\w+)_\d+|(\w+))(?=\.(?:jpe?g|png|gif)$)/,
    imageExt: /(jpe?g|png|gif)$/,
    image1280: /_1280\.(?:jpe?g|png|gif)$/,
    tumblrDomain: /tumblr\.com\//
};

// Enumeration of types of HD images
TID.HDTypes = {
    none: 0,
    tumblrHighRes: 1,
    externalHighRes: 2
};

// CSS classes
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
    dialogButton: 'TID-dialog-button'
};

// Check if the current page is a Tumblelog's archive page
TID.isArchivePage = !!window.location.pathname.match(/\/archive(?:\/|$)/i);

// Check if the current page is a single image view
TID.isSinglePage = document.body.classList.contains('single_image');

// Check whether infinite scrolling is on or off
TID.isInfiniteScrolling = $('#pagination') ? !$('#pagination').clientHeight : false;

// Selectors for HTML elements based on the current page
TID.selectors = { };

// Selectors for all images on a page
if (TID.isArchivePage) {
    TID.selectors.images = '.post.post_micro.is_photo ' +
        '.post_thumbnail_container.has_imageurl:not(.' + TID.classes.ignore + ')';
} else if (TID.isSinglePage) {
    TID.selectors.images = '#content-image';
} else {
    TID.selectors.images = '.post.is_photo .post_content img:not(.' + TID.classes.ignore + '), ' +
        '.post.is_photoset .post_content img:not(.' + TID.classes.ignore + ')';
}
