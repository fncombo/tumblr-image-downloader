'use strict';

/* globals TID, indexedDB */

/**
 * Object to keep everything database-related in one place
 * @type {Object}
 */
TID.storage = {};

/**
 * Database details
 * @type {String|Number}
 */
TID.storage.name = 'TID';
TID.storage.version = 1;
TID.storage.store = 'images';

/**
 * Open the database
 */
TID.storage.request = indexedDB.open(TID.storage.name, TID.storage.version);

/**
 * Successfully opened the database
 */
TID.storage.request.onsuccess = function () {
    console.log('Opened IndexedDB');

    TID.storage.db = this.result;
};

/**
 * Database needs to be upgraded because the version has been increased
 * @param {Event} event The upgrade event
 */
TID.storage.request.onupgradeneeded = function (event) {
    console.log('IndexedDB upgrade needed');

    var db = event.currentTarget.result;

    // To delete the database completely
    // if (db.objectStoreNames.contains(TID.storage.store)) {
    //     db.deleteObjectStore(TID.storage.store);
    // }

    // Primary key
    var store = db.createObjectStore(TID.storage.store, {
        keyPath: 'imageId',
        autoIncrement: false
    });

    store.createIndex('imageId', 'imageId', {
        unique: true
    });

    // Create non-unique indexes
    [
        'time', 'imageUrl', 'pageUrl'
    ].forEach(function (index) {
        store.createIndex(index, index, {
            unique: false
        });
    });
};

/**
 * Error opening the database
 * @param {Event} event The failure event
 */
TID.storage.request.onerror = function (event) {
    console.error('Could not open IndexedDB. Error code:', event.target.errorCode);
};

/**
 * Get the main object store of the database
 * @param  {String} mode Transacation mode, either 'readonly' or 'readwrite'
 * @return {Object}      The object store to work with
 */
TID.storage.getObjectStore = function (mode) {
    return TID.storage.db.transaction(TID.storage.store, mode || 'readonly').objectStore(TID.storage.store);
};

/**
 * Save an image that has been downloaded
 * @param {Object} data All the data about the downloaded image
 */
TID.storage.saveImage = function (data) {
    var store = TID.storage.getObjectStore('readwrite');

    if (!data.hasOwnProperty('time')) {
        data.time = Date.now();
    }

    console.log('Saving image', data);

    store.add(data);
};

TID.storage.removeImage = function (imageId) {
    console.log('Removing imageID from the database', imageId);

    TID.storage.getObjectStore('readwrite').delete(imageId);
};

TID.storage.imageExists = function (imageId, callback) {
    console.log('Checking if image exists', imageId);

    var store = TID.storage.getObjectStore();
    var request = store.get(imageId);

    request.onsuccess = function (event) {
        if (event.target.result) {
            callback(true);
        } else {
            callback(false);
        }
    };

    request.onerror = function () {
        callback(false);
    };
};

/**
 * Clear everything stored in the database
 */
TID.storage.clear = function () {
    console.log('Clearing database storage');

    TID.storage.getObjectStore('readwrite').clear();
};

/**
 * Get the number of stored images
 * @param {Function} callback Callback
 */
TID.storage.count = function (callback) {
    var count = TID.storage.getObjectStore().count();

    count.onsuccess = function (event) {
        callback(event.target.result);
    };

    count.onerror = function () {
        callback(0);
    };
};
