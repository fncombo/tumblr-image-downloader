'use strict';

/* globals TID, ga */

/**
 * Add Google Analytics to the page
 */
TID.activateAnalytics = function () {
    console.log('Enabling analytics');

    window['ga-disable-' + TID.trackingId] = false;

    /**
     * Google Analytics (analytics.js) script
     * http://goo.gl/7wc0Ff
     * Slightly modified the punctuation and order of variables
     * in order to to please JSHint
     */
    (function (i, s, o, r) {
        i.GoogleAnalyticsObject = r; // Acts as a pointer to support renaming.

        // Creates an initial ga() function.
        // The queued commands will be executed once analytics.js loads.
        i[r] = i[r] || function() {
            (i[r].q = i[r].q || []).push(arguments);
        };

        // Sets the time (as an integer) this tag was executed.
        // Used for timing hits.
        i[r].l = Date.now();

        // Insert the script tag asynchronously.
        // Inserts above current tag to prevent blocking in
        // addition to using the async attribute.
        var a = s.createElement(o);
        var m = s.getElementsByTagName(o)[0];
        a.async = 1;
        a.src = 'https://www.google-analytics.com/analytics.js';
        m.parentNode.insertBefore(a, m);
    }(window, document, 'script', 'ga'));

    ga('create', TID.trackingId, 'auto');
    ga('set', 'checkProtocolTask', function () {});
    ga('require', 'displayfeatures');
    ga('send', 'pageview');

    TID.trackEvent('Extension', 'Enabled Option', 'Analytics', 1);
};

/**
 * Remove Google Analytics from the page and prevent all requests
 */
TID.deactivateAnalytics = function () {
    console.log('Disabling analytics');

    TID.trackEvent('Extension', 'Disabled Option', 'Analytics', 1);

    setTimeout(function () {
        window['ga-disable-' + TID.trackingId] = true;

        document.querySelector('script[src*="google-analytics"]').remove();

        delete window.ga;
        delete window.gaplugins;
        delete window.gaGlobal;
        delete window.GoogleAnalyticsObject;
    }, 1000);
};
