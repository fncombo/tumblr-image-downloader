Tumblr Image Downloader
=======================

[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)
[![Code Climate](https://codeclimate.com/github/fncombo/tumblr-image-downloader.png)](https://codeclimate.com/github/fncombo/tumblr-image-downloader)


Tumblr Image Downloader is a Google Chrome extension for Tumblr. It enables you to download images in a single click by putting a download button above every image on the page.

For the full description, please visit the [extension page][0].

## Contributing
If you would like to contribute, simply fork this repository, work your magic, and submit a pull request. Remember to follow the current style of the code and comment and test it well.

You will need:
* Node.js
* Ruby and Slim

To install all the dependencies, simply run `npm install` in the repository, and you're good to go! You can use `grunt watch` to automatically re-compile the extension every time you make a change, or run either `grunt development` or `grunt production` manually. (The production build is the same as development, except it also minifies all the JavaScript.)

To add the extension to Chrome, go to Settings > Extensions, and open the "extension" folder that is created after you run Grunt.

---

![Screenshot](http://i.imgur.com/EFzzGk3.jpg)

[0]: https://chrome.google.com/webstore/detail/tumblr-image-saver/ipocoligdfkbgncimgfaffpaglmedpop
