'use strict';

/* globals TID */

/**
 * Initialize Google Analytics on the current page
 */
TID.addAnalytics = function () {

    // TODO: Update all Analytics code to the newer version

    window._gaq = window._gaq || [];
    window._gaq.push(['_setAccount', 'UA-40682860-1']);
    window._gaq.push(['_trackPageview']);

    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);

};
