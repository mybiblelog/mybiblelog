const Bible = require('./bible');

/** Determines if the operating system is a mobile device (for opening links in apps). */
const isMobileOperatingSystem = () => {
  return /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Determine the mobile operating system.
 * This function returns one of 'iOS', 'Android', 'Windows Phone', or 'unknown'.
 *
 * @returns {String}
 */
const getMobileOperatingSystem = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // Windows Phone must come first because its UA also contains "Android"
  if (/windows phone/i.test(userAgent)) {
    return 'Windows Phone';
  }

  if (/android/i.test(userAgent)) {
    return 'Android';
  }

  // iOS detection from: http://stackoverflow.com/a/9039885/177710
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'iOS';
  }

  return 'unknown';
};

const OSIS = {
  'Judges':          'JDG',
  '1 Samuel':        '1SA',
  '2 Samuel':        '2SA',
  '1 Kings':         '1KI',
  '2 Kings':         '2KI',
  '1 Chronicles':    '1CH',
  '2 Chronicles':    '2CH',
  'Song of Solomon': 'SNG',
  'Ezekiel':         'EZK',
  'Joel':            'JOL',
  'Nahum':           'NAM',
  'Mark':            'MRK',
  'John':            'JHN',
  '1 Corinthians':   '1CO',
  '2 Corinthians':   '2CO',
  '1 Thessalonians': '1TH',
  '2 Thessalonians': '2TH',
  '1 Timothy':       '1TI',
  '2 Timothy':       '2TI',
  'Philippians':     'PHP',
  'Philemon':        'PHM',
  'James':           'JAS',
  '1 Peter':         '1PE',
  '2 Peter':         '2PE',
  '1 John':          '1JN',
  '2 John':          '2JN',
  '3 John':          '3JN',
};

/**
 * Use the OSIS abbreviation map for books whose OSIS codes do not follow the
 * pattern of using their three initial letters.
 * @param {string} bookName
 */
const getOsisCode = bookName => {
  if (OSIS[bookName]) return OSIS[bookName];
  return bookName.substr(0, 3).toLocaleUpperCase();
};

const version = 'NASB';
const getYouVersionChapterReadingURL = (bookIndex, chapterIndex) => {
  const bookName = Bible.getBookName(bookIndex);
  const bookOsisCode = getOsisCode(bookName);
  const url = `youversion://bible?reference=${bookOsisCode}.${chapterIndex}`;
  return url;
};

const getBibleGatewayChapterReadingURL = (bookIndex, chapterIndex) => {
  const bookName = Bible.getBookName(bookIndex);
  const chapterReference = `${bookName} ${chapterIndex}`;
  const url = encodeURI(`https://www.biblegateway.com/passage/?version=${version}&search=${chapterReference}`);
  return url;
};

const getReadingUrl = (bookIndex, chapterIndex) => {
  if (isMobileOperatingSystem() && getMobileOperatingSystem() === 'Android') {
    return getYouVersionChapterReadingURL(bookIndex, chapterIndex);
  }
  return getBibleGatewayChapterReadingURL(bookIndex, chapterIndex);
};


const BibleApps = {
  YOUVERSIONAPP:   'YOUVERSIONAPP',
  YOUVERSIONSITE:  'YOUVERSIONSITE',
  BIBLEGATEWAY:    'BIBLEGATEWAY',
  BLUELETTERBIBLE: 'BLUELETTERBIBLE',
};

module.exports = {
  getReadingUrl,
};
