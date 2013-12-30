'use strict';

(function () {

    // Get JSON with all update messages
    var request = new XMLHttpRequest();

    request.onload = function () {

        var updates = JSON.parse(request.responseText);

        updates.reverse().forEach(function (update, index) {

            var parent = document.querySelector('#previous');

            if (!index) {
                parent = document.querySelector('#current');
            }

            var ul = document.createElement('ul');
            var hr = document.createElement('hr');

            update.forEach(function (text) {
                var el = document.createElement('li');
                el.innerText = text;
                ul.appendChild(el);
            });

            parent.appendChild(ul);

            if (index !== updates.length - 1) {
                parent.appendChild(hr);
            }

        });

    };

    request.open('GET', '../js/updates.json', true);
    request.send();

}());
