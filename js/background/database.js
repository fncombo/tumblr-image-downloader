'use strict';

/* globals TID, chrome, indexedDB */

/**
 * Storage functions
 * @type {Object}
 */
TID.storage = {};

/**
 * Database details
 * @type {String|Number}
 */
TID.storage.name = 'TID';
TID.storage.version = 7;
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

    // Insert all images previously stored locally if haven't already done so
    chrome.storage.local.get({
        localstorageToDatabaseMigrationComplete: false
    }, function (object) {
        // Migration already complete
        if (object.localstorageToDatabaseMigrationComplete) {
            return;
        }

        // Get this separately after checking the above to not bloat the memory
        chrome.storage.local.get({
            images: []
        }, function (object) {
            if (!object.images.length) {
                return;
            }

            object.images.forEach(function (image) {
                TID.storage.saveImage({
                    imageId: image
                });
            });
        });

        // Mark migration as complete
        chrome.storage.local.set({
            localstorageToDatabaseMigrationComplete: true
        });
    });
};

/**
 * Database needs to be upgraded because the version has been increased
 * @param {Event} event The upgrade event
 */
TID.storage.request.onupgradeneeded = function (event) {
    console.log('IndexedDB upgrade needed');

    var db = event.currentTarget.result;
    var store;
    var request;

    /**
     * Version 1 - 2
     * Initial versions
     */

    // First time running, create the store
    if (!db.objectStoreNames.contains(TID.storage.store)) {
        store = db.createObjectStore(TID.storage.store, {
            keyPath: 'imageId',
            autoIncrement: false
        });
    // Use the existing store
    } else {
        store = event.currentTarget.transaction.objectStore(TID.storage.store);
    }

    // Create the primary key
    if (!store.indexNames.contains('imageId')) {
        store.createIndex('imageId', 'imageId', {
            unique: true
        });
    }

    // Create non-unique indexes
    [
        'time', 'imageUrl', 'pageUrl', 'directory'
    ].forEach(function (index) {
        // Don't add indexes that already exist
        if (store.indexNames.contains(index)) {
            return;
        }

        store.createIndex(index, index, {
            unique: false
        });
    });

    /**
     * Version 3 - 5
     * Move from "directory" (String) to "directories" (Array)
     * and transfer all existing recorded directories into the array
     */

    // Delete the "directory" index if "directories" exists
    if (store.indexNames.contains('directories') && store.indexNames.contains('directories')) {
        store.deleteIndex('directory');
    }

    // Create the "directories" index if it doesn't exist
    if (!store.indexNames.contains('directories')) {
        // Create the new index for directories which will be an array
        store.createIndex('directories', 'directories', {
            unique: false,
            multiEntry: true
        });

        // Open a cursor to traverse through all the entries
        // in order to migrate the data
        request = store.openCursor();

        request.onsuccess = function (event) {
            var cursor = event.target.result;

            if (cursor) {
                // Update each entry's value
                var data = cursor.value;

                // Move "directory" into "directories"
                data.directories = [];
                // Make sure it's not false
                if (data.directory) {
                    data.directories.push(data.directory);
                }
                // Remove "directory"
                delete data.directory;

                store.put(data);

                cursor.continue();
            } else {
                // End of all entries, delete the "directory" index
                if (store.indexNames.contains('directory')) {
                    store.deleteIndex('directory');
                }
            }
        };
    }

    /**
     * Version 6
     * Create an index for downloadId
     */

    if (!store.indexNames.contains('chromeDownloadId')) {
        store.createIndex('chromeDownloadId', 'chromeDownloadId', {
            unique: false
        });
    }

    /**
     * Version 7
     * Remove chromeDownloadId from the database
     */

    // Remove the chromeDownloadId value from all the entries
    if (store.indexNames.contains('chromeDownloadId')) {
        // Open a cursor to traverse through all the entries
        // in order to migrate the data
        request = store.openCursor();

        request.onsuccess = function (event) {
            var cursor = event.target.result;

            if (cursor) {
                // Update each entry's value
                var data = cursor.value;

                // Remove "chromeDownloadId"
                if (data.hasOwnProperty('chromeDownloadId')) {
                    delete data.chromeDownloadId;
                    store.put(data);
                }

                cursor.continue();
            } else {
                // End of all entries, delete the "chromeDownloadId" index
                if (store.indexNames.contains('chromeDownloadId')) {
                    store.deleteIndex('chromeDownloadId');
                }
            }
        };
    }

    if (store.indexNames.contains('chromeDownloadId')) {
        store.deleteIndex('chromeDownloadId');
    }
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
 * @param  {String} mode Transaction mode, either 'readonly' or 'readwrite'
 * @return {Object}      The object store to work with
 */
TID.storage.getObjectStore = function (mode) {
    return TID.storage.db.transaction(TID.storage.store, mode || 'readonly').objectStore(TID.storage.store);
};

/**
 * Save an image that has been downloaded
 * @param {Object}   data     All the data about the downloaded image
 * @param {Function} callback Callback
 */
TID.storage.saveImage = function (data, callback) {
    var store = TID.storage.getObjectStore('readwrite');

    if (!data.hasOwnProperty('time')) {
        data.time = Date.now();
    }

    var request = store.get(data.imageId);
    var insertRequest;

    function retry () {
        console.error('Request to save image failed, retrying...', data);

        setTimeout(function () {
            TID.storage.saveImage(data, callback);
        }, 100);
    }

    request.onsuccess = function () {
        var currentData = request.result;

        if (currentData) {
            // Make sure it exists and is not false
            if (data.hasOwnProperty('directory') && typeof data.directory === 'string') {
                // Create the array if it doesn't exist or is the wrong type
                if (!currentData.hasOwnProperty('directories') || !(currentData.directories instanceof Array)) {
                    currentData.directories = [];
                }

                // Make sure it's unique
                if (currentData.directories.indexOf(data.directory) === -1) {
                    currentData.directories.push(data.directory);
                }
            }

            console.log('Saving image (update)', currentData);

            insertRequest = store.put(currentData);
        } else {
            // Make sure it exists and is not false
            if (data.hasOwnProperty('directory') && typeof data.directory === 'string') {
                data.directories = [data.directory];
            }
            delete data.directory;

            console.log('Saving image (insert)', data);

            insertRequest = store.add(data);
        }

        // Saved/update successfully
        insertRequest.onsuccess = function () {
            console.log('Image saved successfully', data);

            if (callback) {
                callback();
            }
        };
        // Wait a little bit and try again
        insertRequest.onerror = retry;
    };

    // Wait a little bit and try again
    request.onerror = retry;
};

/**
 * Remove an image from storage by its ID
 * @param {String} imageId ID of the image to remove
 */
TID.storage.removeImage = function (imageId) {
    console.log('Removing imageID from the database', imageId);

    TID.storage.getObjectStore('readwrite').delete(imageId);
};

/**
 * Check whether an image exists in storage by its ID
 * @param {String}   imageId  ID of the image to look for
 * @param {Function} callback Callback
 */
TID.storage.imageExists = function (imageId, callback) {
    console.log('Checking if image exists', imageId);

    var store = TID.storage.getObjectStore();
    var request = store.get(imageId);
    var data = {
        found: false,
        directories: []
    };

    request.onsuccess = function () {
        if (request.result) {
            data.found = true;
            data.directories = request.result.directories || [];
        }

        if (callback) {
            callback(data);
        }
    };

    request.onerror = function () {
        callback(data);
    };
};

/**
 * Clear everything stored in the database
 * @param {Function} callback Callback
 */
TID.storage.clear = function (callback) {
    console.log('Clearing database storage');

    var request = TID.storage.getObjectStore('readwrite').clear();

    request.onsuccess = function () {
        if (callback) {
            callback();
        }
    };

    // Wait a little bit and try again
    request.onerror = function () {
        console.error('Request to clear storage failed, retrying...');

        setTimeout(function () {
            TID.storage.clear(callback);
        }, 100);
    };
};

/**
 * Get the number of stored images
 * @param {Function} callback Callback
 */
TID.storage.count = function (callback) {
    var request = TID.storage.getObjectStore().count();

    request.onsuccess = function (event) {
        if (callback) {
            callback(event.target.result);
        }
    };

    // Wait a little bit and try again
    request.onerror = function () {
        console.error('Request to get storage count failed, retrying...');

        setTimeout(function () {
            TID.storage.count(callback);
        }, 100);
    };
};
