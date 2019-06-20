const Bible = require('./bible');
const BibleVerse = require('./bible-verse');

const exports = {
  Bible,
  BibleVerse,
};

Object.assign(window, exports);

module.exports = exports;
