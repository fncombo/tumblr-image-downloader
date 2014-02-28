'use strict';

/* globals TID, chrome */

/**
 * Adjust the controls that belong to a checkbox
 * @param  {String} key The checkbox data-for attribute
 */
TID.adjustControls = function (key) {

    var el = $('input[data-for="' + key + '"]');
    var controls = el.getAttribute('data-controls');

    if (controls) {
        $('#' + controls +'-on').classList[el.checked ? 'remove' : 'add']('hide');
        $('#' + controls + '-off').classList[!el.checked ? 'remove' : 'add']('hide');
    }

};

/**
 * Manually trigger a checkbox
 * @param  {String}  key   The data-for attribute
 * @param  {Boolean} value Whether or not the checkbox should be checked
 */
TID.adjustCheckbox = function (key, value) {
    $('input[data-for="' + key + '"]').checked = value;
    TID.adjustControls(key);
};

/**
 * Get a checkbox's value from storage and set it
 * @param  {Element} el The checkbox element to work with
 */
TID.getCheckboxValue = function (el) {

    var object = {};
    var key = el.getAttribute('data-for');
    object[key] = el.getAttribute('data-default') === 'true' ? true : false;

    chrome.storage.sync.get(object, function (object) {
        TID.adjustCheckbox(key, object[key]);
    });

};

/**
 * Update storage when a checkbox is changed
 * @param  {Object}  event The triggered event
 * @param  {Element} el    The element event was triggered
 */
TID.checkboxChange = function (event, el) {

    var object = {};
    var key = el.getAttribute('data-for');
    object[key] = el.checked;

    chrome.storage.sync.set(object);

    TID.sendMessage([el.getAttribute('data-message'), el.checked ? 'Enabled' : 'Disabled']);
    TID.adjustControls(key);

};
