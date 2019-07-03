const Bible = require('./bible');
const Util = require('./util');

const exports = {
  Bible,
  Util,
};

Object.assign(window, exports);

module.exports = exports;
