'use strict';

/* globals TID, $ */

// Misc extension global variables
TID.vars = {};

// Store all downloaded images' IDs - always up-to-date
TID.downloadedImages = [];

// Store list of download directories - always up-to-date
TID.directories = [];
TID.formattedDirectories = '';

// List of all settings and things they should do
TID.settings = {

    confirm: {
        default: true,
        onLoad: function (object) {
            TID.confirm = object.confirm;
        },
        onUpdate: function (changes) {
            TID.confirm = changes.confirm.newValue;
        }
    },

    showTicks: {
        default: true,
        onLoad: function (object) {
            TID.showTicks = object.showTicks;
            TID.showDownloadedTicks(object.showTicks);
        },
        onUpdate: function (changes) {
            TID.showTicks = changes.showTicks.newValue;
            TID.showDownloadedTicks(changes.showTicks.newValue);
        }
    },

    enableLocations: {
        default: true,
        onLoad: function (object) {
            TID.toggleLocations(object.enableLocations);
        },
        onUpdate: function (changes) {
            TID.toggleLocations(changes.enableLocations.newValue);
        }
    }

};

// Check if the current page is a Tumblelog's archive page
TID.isArchivePage = !!window.location.pathname.match(/\/archive(?:\/|$)/i);

// Check whether infinite scrolling is on or off
TID.isInfiniteScrolling = $('#pagination') ? !$('#pagination').clientHeight : false;

// List of all the classes used
TID.classes = {
    tempContainer: '__TID_temp_container',
    showTicks: '__TID_show_ticks',
    hideLocations: '__TID_hide_locations',
    ignore: '__TID_ignore',
    download: '__TID_download',
    downloaded: '__TID_downloaded',
    downloadDiv: '__TID_download_div',
    list: '__TID_list',
    help: '__TID_help',
    parent: '__TID_parent',
    photoset: '__TID_photoset',
    highlight: '__TID_highlight',
    overlay: '__TID_overlay',
    dialog: '__TID_dialog',
    dialogMessage: '__TID_dialog_message',
    dialogButton: '__TID_dialog_button'
};

// List of all the selectors used - dynamically generated based on page
TID.selectors = {

    images: function () {

        if (!TID.isArchivePage) {
            return '.post.is_photo .post_content img:not(.' + TID.classes.ignore + '), ' +
                   '.post.is_photoset .post_content img:not(.' + TID.classes.ignore + ')';
        } else {
            return '.post.post_micro.is_photo ' +
                   '.post_thumbnail_container.has_imageurl:not(.' + TID.classes.ignore + ')';
        }

    }

};

// List of regular expressions - so we don't initiate them each time they are used
TID.match = {
    imageSize: new RegExp('\\d+(?=\\.(?:jpe?g|png|gif)$)', 'i'),
    imageName: new RegExp('tumblr_(\\w+)(?=_\\d+\\.(?:jpe?g|png|gif)$)', 'i'),
    imageFileName: new RegExp('([^/]+)\\.(?:jpe?g|png|gif)', 'i'),
    imageExt: new RegExp('(jpe?g|png|gif)$', 'i'),
    image1280: new RegExp('_1280\\.(?:jpe?g|png|gif)$', 'i'),
    tumblrDomain: new RegExp('tumblr\\.com', 'i'),
    tumblrImgRes: new RegExp('(_\\d+\\.)')
};
