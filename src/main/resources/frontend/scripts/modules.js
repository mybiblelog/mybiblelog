const Bible = require('./bible');
const Helpers = require('./helpers');

const exports = {
  Bible,
  Helpers,
};

Object.assign(window, exports);

module.exports = exports;
