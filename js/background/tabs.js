'use strict';

/* globals TID, chrome */

/**
 * Send a message to all tabs matching a URL
 * @param  {String}                      url     URL to match tabs by
 * @param  {String|Object|Array|Boolean} message The message content
 */
TID.sendToAllTabs = function (url, message) {
    chrome.tabs.query({
        url: url
    }, function (tabs) {
        tabs.forEach(function (tab) {
            chrome.tabs.sendMessage(tab.id, message);
        });
    });
};
