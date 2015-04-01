Image Downloader for Tumblr
=======================

[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)][grunt]
[![Code Climate](https://codeclimate.com/github/fncombo/tumblr-image-downloader.png)][codeclimate]
[![Dependency Status](https://gemnasium.com/fncombo/tumblr-image-downloader.svg)][gemnasium]


Image Downloader for Tumblr is a Google Chrome extension for Tumblr. It enables you to download images in a single click by putting a download button above every image on the page.

For the full description, please visit the [extension page][chromestore].

## Contributing
If you would like to contribute, simply fork this repository, make a new branch, work your magic, and submit a pull request. Remember to follow the current style of the code and comment and test it well.

You will need:
* Node.js
* Ruby
  * Sass gem
  * Slim gem

To install all the dependencies, simply run `npm install` in the repository, and you're good to go! Make sure you have Ruby installed, with the Sass and Slim gems.

You can use:
* `grunt watch` or `grunt watch:all` to automatically re-compile the extension every time you make a change to any file
* `grunt watch:javascript`, `grunt watch:sass` or `grunt watch:slim` to watch only specific types of files
* `grunt watch:javascriptSass` to watch both JavaScipt and Sass files

To manually build the extension, run `grunt development` or `grunt production`. The production build is the same as development, but it also minifies JavaScript.

To add the extension to Chrome, go to `Settings > Extensions`, and open the `extension` folder that is created after you run a Grunt build.

[grunt]: http://gruntjs.com
[codeclimate]: https://codeclimate.com/github/fncombo/tumblr-image-downloader
[chromestore]: https://chrome.google.com/webstore/detail/tumblr-image-saver/hbbiaibbddjmdacbifbnioekmiocclpc
[gemnasium]: https://gemnasium.com/fncombo/tumblr-image-downloader
