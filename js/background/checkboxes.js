'use strict';

/* globals TID, chrome, $ */

TID.checkboxes = { };

/**
 * Adjust the controls that belong to a checkbox
 * @param {string} key The checkbox data-for attribute
 */
TID.checkboxes.adjustControls = function (key) {

    var el = $('input[data-for="' + key + '"]');
    var controls = el.dataset.controls;

    if (controls) {
        $('#' + controls + '-on').classList[el.checked ? 'remove' : 'add']('hide');
        $('#' + controls + '-off').classList[!el.checked ? 'remove' : 'add']('hide');
    }

};

/**
 * Manually set the value of a checkbox
 * @param {string}  key   The data-for attribute
 * @param {boolean} value Whether or not the checkbox should be checked
 */
TID.checkboxes.setValue = function (key, value) {
    $('input[data-for="' + key + '"]').checked = value;
    TID.checkboxes.adjustControls(key);
};

/**
 * Get a checkbox's value from storage and set it
 * @param {Element} el The checkbox element to work with
 */
TID.checkboxes.getValue = function (el) {

    var object = {};
    var key = el.dataset.for;
    object[key] = el.dataset.default === 'true' ? true : false;

    chrome.storage.sync.get(object, function (object) {
        TID.checkboxes.setValue(key, object[key]);
    });

};

/**
 * Update storage when a checkbox is changed
 * @param {object}  event The triggered event
 * @param {Element} el    The element event was triggered
 */
TID.checkboxes.onChange = function (event, el) {

    var object = {};
    var key = el.dataset.for;
    object[key] = el.checked;

    chrome.storage.sync.set(object);

    TID.sendMessage([el.dataset.message, el.checked ? 'Enabled' : 'Disabled']);
    TID.checkboxes.adjustControls(key);

};
