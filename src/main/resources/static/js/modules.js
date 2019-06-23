var Modules = (function (exports) {
  'use strict';

  var bibleBooks = [
    {
      'name':           'Genesis',
      'testamentOrder': 1,
      'bibleOrder':     1,
      'newTestament':   false,
      'chapterCount':   50,
      'abbreviations':  [
        'Gen',
        'Ge',
        'Gn',
      ],
    },
    {
      'name':           'Exodus',
      'testamentOrder': 2,
      'bibleOrder':     2,
      'newTestament':   false,
      'chapterCount':   40,
      'abbreviations':  [
        'Ex',
        'Exod',
      ],
    },
    {
      'name':           'Leviticus',
      'testamentOrder': 3,
      'bibleOrder':     3,
      'newTestament':   false,
      'chapterCount':   27,
      'abbreviations':  [
        'Lev',
        'Le',
        'Lv',
      ],
    },
    {
      'name':           'Numbers',
      'testamentOrder': 4,
      'bibleOrder':     4,
      'newTestament':   false,
      'chapterCount':   36,
      'abbreviations':  [
        'Num',
        'Nu',
        'Nm',
        'Nb',
      ],
    },
    {
      'name':           'Deuteronomy',
      'testamentOrder': 5,
      'bibleOrder':     5,
      'newTestament':   false,
      'chapterCount':   34,
      'abbreviations':  [
        'Deut',
        'De',
        'Dt',
      ],
    },
    {
      'name':           'Joshua',
      'testamentOrder': 6,
      'bibleOrder':     6,
      'newTestament':   false,
      'chapterCount':   24,
      'abbreviations':  [
        'Josh',
        'Jos',
        'Jsh',
      ],
    },
    {
      'name':           'Judges',
      'testamentOrder': 7,
      'bibleOrder':     7,
      'newTestament':   false,
      'chapterCount':   21,
      'abbreviations':  [
        'Judg',
        'Jdg',
        'Jg',
        'Jdgs',
      ],
    },
    {
      'name':           'Ruth',
      'testamentOrder': 8,
      'bibleOrder':     8,
      'newTestament':   false,
      'chapterCount':   4,
      'abbreviations':  [
        'Ruth',
        'Rth',
        'Ru',
      ],
    },
    {
      'name':           '1 Samuel',
      'testamentOrder': 9,
      'bibleOrder':     9,
      'newTestament':   false,
      'chapterCount':   31,
      'abbreviations':  [
        '1 Sam',
        '1 Sm',
        '1 Sa',
        '1 S',
      ],
    },
    {
      'name':           '2 Samuel',
      'testamentOrder': 10,
      'bibleOrder':     10,
      'newTestament':   false,
      'chapterCount':   24,
      'abbreviations':  [
        '2 Sam',
        '2 Sm',
        '2 Sa',
        '2 S',
      ],
    },
    {
      'name':           '1 Kings',
      'testamentOrder': 11,
      'bibleOrder':     11,
      'newTestament':   false,
      'chapterCount':   22,
      'abbreviations':  [
        '1 Kings',
        '1 Kgs',
        '1 Kin',
        '1 Ki',
        '1K',
      ],
    },
    {
      'name':           '2 Kings',
      'testamentOrder': 12,
      'bibleOrder':     12,
      'newTestament':   false,
      'chapterCount':   25,
      'abbreviations':  [
        '2 Kings',
        '2 Kgs',
        '2 Kin',
        '2 Ki',
      ],
    },
    {
      'name':           '1 Chronicles',
      'testamentOrder': 13,
      'bibleOrder':     13,
      'newTestament':   false,
      'chapterCount':   29,
      'abbreviations':  [
        '1 Chr',
        '1 Chr',
        '1 Ch',
      ],
    },
    {
      'name':           '2 Chronicles',
      'testamentOrder': 14,
      'bibleOrder':     14,
      'newTestament':   false,
      'chapterCount':   36,
      'abbreviations':  [
        '2 Chr',
        '2 Ch',
        '2 Chron',
      ],
    },
    {
      'name':           'Ezra',
      'testamentOrder': 15,
      'bibleOrder':     15,
      'newTestament':   false,
      'chapterCount':   10,
      'abbreviations':  [
        'Ezra',
        'Ezr',
      ],
    },
    {
      'name':           'Nehemiah',
      'testamentOrder': 16,
      'bibleOrder':     16,
      'newTestament':   false,
      'chapterCount':   13,
      'abbreviations':  [
        'Neh',
        'Ne',
      ],
    },
    {
      'name':           'Esther',
      'testamentOrder': 17,
      'bibleOrder':     17,
      'newTestament':   false,
      'chapterCount':   10,
      'abbreviations':  [
        'Esth 1',
        'Est',
        'Es',
      ],
    },
    {
      'name':           'Job',
      'testamentOrder': 18,
      'bibleOrder':     18,
      'newTestament':   false,
      'chapterCount':   42,
      'abbreviations':  [
        'Job',
        'Jb',
      ],
    },
    {
      'name':           'Psalm',
      'testamentOrder': 19,
      'bibleOrder':     19,
      'newTestament':   false,
      'chapterCount':   150,
      'abbreviations':  [
        'Ps',
        'Psalm',
        'Pslm',
        'Psa',
        'Psm',
      ],
    },
    {
      'name':           'Proverbs',
      'testamentOrder': 20,
      'bibleOrder':     20,
      'newTestament':   false,
      'chapterCount':   31,
      'abbreviations':  [
        'Prov',
        'Pro',
        'Prv',
        'Pr',
      ],
    },
    {
      'name':           'Ecclesiastes',
      'testamentOrder': 21,
      'bibleOrder':     21,
      'newTestament':   false,
      'chapterCount':   12,
      'abbreviations':  [
        'Ecc1',
        'Eccles',
        'Eccle',
        'Ecc',
        'Ec',
      ],
    },
    {
      'name':           'Song of Songs',
      'testamentOrder': 22,
      'bibleOrder':     22,
      'newTestament':   false,
      'chapterCount':   8,
      'abbreviations':  [],
    },
    {
      'name':           'Isaiah',
      'testamentOrder': 23,
      'bibleOrder':     23,
      'newTestament':   false,
      'chapterCount':   66,
      'abbreviations':  [
        'Isa',
        'Is',
      ],
    },
    {
      'name':           'Jeremiah',
      'testamentOrder': 24,
      'bibleOrder':     24,
      'newTestament':   false,
      'chapterCount':   52,
      'abbreviations':  [
        'Jer',
        'Je',
        'Jr',
      ],
    },
    {
      'name':           'Lamentations',
      'testamentOrder': 25,
      'bibleOrder':     25,
      'newTestament':   false,
      'chapterCount':   5,
      'abbreviations':  [
        'Lam',
        'La',
      ],
    },
    {
      'name':           'Ezekiel',
      'testamentOrder': 26,
      'bibleOrder':     26,
      'newTestament':   false,
      'chapterCount':   48,
      'abbreviations':  [
        'Ezek',
        'Eze',
        'Ezk',
      ],
    },
    {
      'name':           'Daniel',
      'testamentOrder': 27,
      'bibleOrder':     27,
      'newTestament':   false,
      'chapterCount':   12,
      'abbreviations':  [
        'Dan',
        'Da',
        'Dn',
      ],
    },
    {
      'name':           'Hosea',
      'testamentOrder': 28,
      'bibleOrder':     28,
      'newTestament':   false,
      'chapterCount':   14,
      'abbreviations':  [
        'Hos',
        'Ho',
      ],
    },
    {
      'name':           'Joel',
      'testamentOrder': 29,
      'bibleOrder':     29,
      'newTestament':   false,
      'chapterCount':   3,
      'abbreviations':  [
        'Joel',
        'Jl',
      ],
    },
    {
      'name':           'Amos',
      'testamentOrder': 30,
      'bibleOrder':     30,
      'newTestament':   false,
      'chapterCount':   9,
      'abbreviations':  [
        'Am',
      ],
    },
    {
      'name':           'Obadiah',
      'testamentOrder': 31,
      'bibleOrder':     31,
      'newTestament':   false,
      'chapterCount':   1,
      'abbreviations':  [
        'Obad',
      ],
    },
    {
      'name':           'Jonah',
      'testamentOrder': 32,
      'bibleOrder':     32,
      'newTestament':   false,
      'chapterCount':   4,
      'abbreviations':  [
        'Jon',
        'Jnh',
      ],
    },
    {
      'name':           'Micah',
      'testamentOrder': 33,
      'bibleOrder':     33,
      'newTestament':   false,
      'chapterCount':   7,
      'abbreviations':  [
        'Mic',
        'Mc',
      ],
    },
    {
      'name':           'Nahum',
      'testamentOrder': 34,
      'bibleOrder':     34,
      'newTestament':   false,
      'chapterCount':   3,
      'abbreviations':  [
        'Nah',
        'Na',
      ],
    },
    {
      'name':           'Habakkuk',
      'testamentOrder': 35,
      'bibleOrder':     35,
      'newTestament':   false,
      'chapterCount':   3,
      'abbreviations':  [
        'Hab',
        'Hb',
      ],
    },
    {
      'name':           'Zephaniah',
      'testamentOrder': 36,
      'bibleOrder':     36,
      'newTestament':   false,
      'chapterCount':   3,
      'abbreviations':  [
        'Zeph',
        'Zep',
        'Zp',
      ],
    },
    {
      'name':           'Haggai',
      'testamentOrder': 37,
      'bibleOrder':     37,
      'newTestament':   false,
      'chapterCount':   2,
      'abbreviations':  [
        'Hag',
        'Hg',
      ],
    },
    {
      'name':           'Zechariah',
      'testamentOrder': 38,
      'bibleOrder':     38,
      'newTestament':   false,
      'chapterCount':   14,
      'abbreviations':  [
        'Zech',
        'Zec',
        'Zc',
      ],
    },
    {
      'name':           'Malachi',
      'testamentOrder': 39,
      'bibleOrder':     39,
      'newTestament':   false,
      'chapterCount':   4,
      'abbreviations':  [
        'Mal',
        'Ml',
      ],
    },
    {
      'name':           'Matthew',
      'testamentOrder': 1,
      'bibleOrder':     40,
      'newTestament':   true,
      'chapterCount':   28,
      'abbreviations':  [
        'Mt',
        'Matt',
      ],
    },
    {
      'name':           'Mark',
      'testamentOrder': 2,
      'bibleOrder':     41,
      'newTestament':   true,
      'chapterCount':   16,
      'abbreviations':  [
        'Mk',
        'Mrk',
      ],
    },
    {
      'name':           'Luke',
      'testamentOrder': 3,
      'bibleOrder':     42,
      'newTestament':   true,
      'chapterCount':   24,
      'abbreviations':  [
        'Lk',
        'Luk',
      ],
    },
    {
      'name':           'John',
      'testamentOrder': 4,
      'bibleOrder':     43,
      'newTestament':   true,
      'chapterCount':   21,
      'abbreviations':  [
        'Jn',
        'Jhn',
      ],
    },
    {
      'name':           'Acts',
      'testamentOrder': 5,
      'bibleOrder':     44,
      'newTestament':   true,
      'chapterCount':   28,
      'abbreviations':  [],
    },
    {
      'name':           'Romans',
      'testamentOrder': 6,
      'bibleOrder':     45,
      'newTestament':   true,
      'chapterCount':   16,
      'abbreviations':  [
        'Rom',
        'Ro',
        'Rm',
      ],
    },
    {
      'name':           '1 Corinthians',
      'testamentOrder': 7,
      'bibleOrder':     46,
      'newTestament':   true,
      'chapterCount':   16,
      'abbreviations':  [
        '1 Cor',
        '1 Co',
      ],
    },
    {
      'name':           '2 Corinthians',
      'testamentOrder': 8,
      'bibleOrder':     47,
      'newTestament':   true,
      'chapterCount':   13,
      'abbreviations':  [
        '2 Cor',
        '2 Co',
      ],
    },
    {
      'name':           'Galatians',
      'testamentOrder': 9,
      'bibleOrder':     48,
      'newTestament':   true,
      'chapterCount':   6,
      'abbreviations':  [
        'Gal',
        'Ga',
      ],
    },
    {
      'name':           'Ephesians',
      'testamentOrder': 10,
      'bibleOrder':     49,
      'newTestament':   true,
      'chapterCount':   6,
      'abbreviations':  [
        'Eph',
        'Ephes',
      ],
    },
    {
      'name':           'Philippians',
      'testamentOrder': 11,
      'bibleOrder':     50,
      'newTestament':   true,
      'chapterCount':   4,
      'abbreviations':  [
        'Phil',
        'Php',
        'Pp',
      ],
    },
    {
      'name':           'Colossians',
      'testamentOrder': 12,
      'bibleOrder':     51,
      'newTestament':   true,
      'chapterCount':   4,
      'abbreviations':  [
        'Col',
      ],
    },
    {
      'name':           '1 Thessalonians',
      'testamentOrder': 13,
      'bibleOrder':     52,
      'newTestament':   true,
      'chapterCount':   5,
      'abbreviations':  [
        '1 Thess',
        '1 Thes',
        '1 Th',
      ],
    },
    {
      'name':           '2 Thessalonians',
      'testamentOrder': 14,
      'bibleOrder':     53,
      'newTestament':   true,
      'chapterCount':   3,
      'abbreviations':  [
        '2 Thess',
        '2 Thes',
        '2 Th',
      ],
    },
    {
      'name':           '1 Timothy',
      'testamentOrder': 15,
      'bibleOrder':     54,
      'newTestament':   true,
      'chapterCount':   6,
      'abbreviations':  [
        '1 Tim',
        '1 Ti',
      ],
    },
    {
      'name':           '2 Timothy',
      'testamentOrder': 16,
      'bibleOrder':     55,
      'newTestament':   true,
      'chapterCount':   4,
      'abbreviations':  [
        '2 Tim',
        '2 Ti',
      ],
    },
    {
      'name':           'Titus',
      'testamentOrder': 17,
      'bibleOrder':     56,
      'newTestament':   true,
      'chapterCount':   3,
      'abbreviations':  [
        'Titus',
        'Tit',
        'Ti',
      ],
    },
    {
      'name':           'Philemon',
      'testamentOrder': 18,
      'bibleOrder':     57,
      'newTestament':   true,
      'chapterCount':   1,
      'abbreviations':  [
        'Philemon',
        'Philem',
        'Phlm',
        'Phm',
        'Pm',
      ],
    },
    {
      'name':           'Hebrews',
      'testamentOrder': 19,
      'bibleOrder':     58,
      'newTestament':   true,
      'chapterCount':   13,
      'abbreviations':  [
        'Heb',
      ],
    },
    {
      'name':           'James',
      'testamentOrder': 20,
      'bibleOrder':     59,
      'newTestament':   true,
      'chapterCount':   5,
      'abbreviations':  [
        'Jas',
        'Jm',
      ],
    },
    {
      'name':           '1 Peter',
      'testamentOrder': 21,
      'bibleOrder':     60,
      'newTestament':   true,
      'chapterCount':   5,
      'abbreviations':  [
        '1 Pet',
        '1 Pe',
        '1 Pt',
        '1 P',
      ],
    },
    {
      'name':           '2 Peter',
      'testamentOrder': 22,
      'bibleOrder':     61,
      'newTestament':   true,
      'chapterCount':   3,
      'abbreviations':  [
        '2 Pet',
        '2 Pe',
        '2 Pt',
        '2 P',
      ],
    },
    {
      'name':           '1 John',
      'testamentOrder': 23,
      'bibleOrder':     62,
      'newTestament':   true,
      'chapterCount':   5,
      'abbreviations':  [
        '1 Jn',
        '1 Jhn',
        '1 J',
      ],
    },
    {
      'name':           '2 John',
      'testamentOrder': 24,
      'bibleOrder':     63,
      'newTestament':   true,
      'chapterCount':   1,
      'abbreviations':  [
        '2 Jn',
        '2 Jhn',
        '2 J',
      ],
    },
    {
      'name':           '3 John',
      'testamentOrder': 25,
      'bibleOrder':     64,
      'newTestament':   true,
      'chapterCount':   1,
      'abbreviations':  [
        '3 Jn',
        '3 Jhn',
        '3 J',
      ],
    },
    {
      'name':           'Jude',
      'testamentOrder': 26,
      'bibleOrder':     65,
      'newTestament':   true,
      'chapterCount':   1,
      'abbreviations':  [
        'Jude',
        'Jud',
        'Jd',
      ],
    },
    {
      'name':           'Revelation',
      'testamentOrder': 27,
      'bibleOrder':     66,
      'newTestament':   true,
      'chapterCount':   22,
      'abbreviations':  [
        'Rev',
      ],
    },
  ];

  var chapterVerses = [
    {
      'chapterId':  101001000,
      'verseCount': 31,
    },
    {
      'chapterId':  101002000,
      'verseCount': 25,
    },
    {
      'chapterId':  101003000,
      'verseCount': 24,
    },
    {
      'chapterId':  101004000,
      'verseCount': 26,
    },
    {
      'chapterId':  101005000,
      'verseCount': 32,
    },
    {
      'chapterId':  101006000,
      'verseCount': 22,
    },
    {
      'chapterId':  101007000,
      'verseCount': 24,
    },
    {
      'chapterId':  101008000,
      'verseCount': 22,
    },
    {
      'chapterId':  101009000,
      'verseCount': 29,
    },
    {
      'chapterId':  101010000,
      'verseCount': 32,
    },
    {
      'chapterId':  101011000,
      'verseCount': 32,
    },
    {
      'chapterId':  101012000,
      'verseCount': 20,
    },
    {
      'chapterId':  101013000,
      'verseCount': 18,
    },
    {
      'chapterId':  101014000,
      'verseCount': 24,
    },
    {
      'chapterId':  101015000,
      'verseCount': 21,
    },
    {
      'chapterId':  101016000,
      'verseCount': 16,
    },
    {
      'chapterId':  101017000,
      'verseCount': 27,
    },
    {
      'chapterId':  101018000,
      'verseCount': 33,
    },
    {
      'chapterId':  101019000,
      'verseCount': 38,
    },
    {
      'chapterId':  101020000,
      'verseCount': 18,
    },
    {
      'chapterId':  101021000,
      'verseCount': 34,
    },
    {
      'chapterId':  101022000,
      'verseCount': 24,
    },
    {
      'chapterId':  101023000,
      'verseCount': 20,
    },
    {
      'chapterId':  101024000,
      'verseCount': 67,
    },
    {
      'chapterId':  101025000,
      'verseCount': 34,
    },
    {
      'chapterId':  101026000,
      'verseCount': 35,
    },
    {
      'chapterId':  101027000,
      'verseCount': 46,
    },
    {
      'chapterId':  101028000,
      'verseCount': 22,
    },
    {
      'chapterId':  101029000,
      'verseCount': 35,
    },
    {
      'chapterId':  101030000,
      'verseCount': 43,
    },
    {
      'chapterId':  101031000,
      'verseCount': 55,
    },
    {
      'chapterId':  101032000,
      'verseCount': 32,
    },
    {
      'chapterId':  101033000,
      'verseCount': 20,
    },
    {
      'chapterId':  101034000,
      'verseCount': 31,
    },
    {
      'chapterId':  101035000,
      'verseCount': 29,
    },
    {
      'chapterId':  101036000,
      'verseCount': 43,
    },
    {
      'chapterId':  101037000,
      'verseCount': 36,
    },
    {
      'chapterId':  101038000,
      'verseCount': 30,
    },
    {
      'chapterId':  101039000,
      'verseCount': 23,
    },
    {
      'chapterId':  101040000,
      'verseCount': 23,
    },
    {
      'chapterId':  101041000,
      'verseCount': 57,
    },
    {
      'chapterId':  101042000,
      'verseCount': 38,
    },
    {
      'chapterId':  101043000,
      'verseCount': 34,
    },
    {
      'chapterId':  101044000,
      'verseCount': 34,
    },
    {
      'chapterId':  101045000,
      'verseCount': 28,
    },
    {
      'chapterId':  101046000,
      'verseCount': 34,
    },
    {
      'chapterId':  101047000,
      'verseCount': 31,
    },
    {
      'chapterId':  101048000,
      'verseCount': 22,
    },
    {
      'chapterId':  101049000,
      'verseCount': 33,
    },
    {
      'chapterId':  101050000,
      'verseCount': 26,
    },
    {
      'chapterId':  102001000,
      'verseCount': 22,
    },
    {
      'chapterId':  102002000,
      'verseCount': 25,
    },
    {
      'chapterId':  102003000,
      'verseCount': 22,
    },
    {
      'chapterId':  102004000,
      'verseCount': 31,
    },
    {
      'chapterId':  102005000,
      'verseCount': 23,
    },
    {
      'chapterId':  102006000,
      'verseCount': 30,
    },
    {
      'chapterId':  102007000,
      'verseCount': 25,
    },
    {
      'chapterId':  102008000,
      'verseCount': 32,
    },
    {
      'chapterId':  102009000,
      'verseCount': 35,
    },
    {
      'chapterId':  102010000,
      'verseCount': 29,
    },
    {
      'chapterId':  102011000,
      'verseCount': 10,
    },
    {
      'chapterId':  102012000,
      'verseCount': 51,
    },
    {
      'chapterId':  102013000,
      'verseCount': 22,
    },
    {
      'chapterId':  102014000,
      'verseCount': 31,
    },
    {
      'chapterId':  102015000,
      'verseCount': 27,
    },
    {
      'chapterId':  102016000,
      'verseCount': 36,
    },
    {
      'chapterId':  102017000,
      'verseCount': 16,
    },
    {
      'chapterId':  102018000,
      'verseCount': 27,
    },
    {
      'chapterId':  102019000,
      'verseCount': 25,
    },
    {
      'chapterId':  102020000,
      'verseCount': 26,
    },
    {
      'chapterId':  102021000,
      'verseCount': 36,
    },
    {
      'chapterId':  102022000,
      'verseCount': 31,
    },
    {
      'chapterId':  102023000,
      'verseCount': 33,
    },
    {
      'chapterId':  102024000,
      'verseCount': 18,
    },
    {
      'chapterId':  102025000,
      'verseCount': 40,
    },
    {
      'chapterId':  102026000,
      'verseCount': 37,
    },
    {
      'chapterId':  102027000,
      'verseCount': 21,
    },
    {
      'chapterId':  102028000,
      'verseCount': 43,
    },
    {
      'chapterId':  102029000,
      'verseCount': 46,
    },
    {
      'chapterId':  102030000,
      'verseCount': 38,
    },
    {
      'chapterId':  102031000,
      'verseCount': 18,
    },
    {
      'chapterId':  102032000,
      'verseCount': 35,
    },
    {
      'chapterId':  102033000,
      'verseCount': 23,
    },
    {
      'chapterId':  102034000,
      'verseCount': 35,
    },
    {
      'chapterId':  102035000,
      'verseCount': 35,
    },
    {
      'chapterId':  102036000,
      'verseCount': 38,
    },
    {
      'chapterId':  102037000,
      'verseCount': 29,
    },
    {
      'chapterId':  102038000,
      'verseCount': 31,
    },
    {
      'chapterId':  102039000,
      'verseCount': 43,
    },
    {
      'chapterId':  102040000,
      'verseCount': 38,
    },
    {
      'chapterId':  103001000,
      'verseCount': 17,
    },
    {
      'chapterId':  103002000,
      'verseCount': 16,
    },
    {
      'chapterId':  103003000,
      'verseCount': 17,
    },
    {
      'chapterId':  103004000,
      'verseCount': 35,
    },
    {
      'chapterId':  103005000,
      'verseCount': 19,
    },
    {
      'chapterId':  103006000,
      'verseCount': 30,
    },
    {
      'chapterId':  103007000,
      'verseCount': 38,
    },
    {
      'chapterId':  103008000,
      'verseCount': 36,
    },
    {
      'chapterId':  103009000,
      'verseCount': 24,
    },
    {
      'chapterId':  103010000,
      'verseCount': 20,
    },
    {
      'chapterId':  103011000,
      'verseCount': 47,
    },
    {
      'chapterId':  103012000,
      'verseCount': 8,
    },
    {
      'chapterId':  103013000,
      'verseCount': 59,
    },
    {
      'chapterId':  103014000,
      'verseCount': 57,
    },
    {
      'chapterId':  103015000,
      'verseCount': 33,
    },
    {
      'chapterId':  103016000,
      'verseCount': 34,
    },
    {
      'chapterId':  103017000,
      'verseCount': 16,
    },
    {
      'chapterId':  103018000,
      'verseCount': 30,
    },
    {
      'chapterId':  103019000,
      'verseCount': 37,
    },
    {
      'chapterId':  103020000,
      'verseCount': 27,
    },
    {
      'chapterId':  103021000,
      'verseCount': 24,
    },
    {
      'chapterId':  103022000,
      'verseCount': 33,
    },
    {
      'chapterId':  103023000,
      'verseCount': 44,
    },
    {
      'chapterId':  103024000,
      'verseCount': 23,
    },
    {
      'chapterId':  103025000,
      'verseCount': 55,
    },
    {
      'chapterId':  103026000,
      'verseCount': 46,
    },
    {
      'chapterId':  103027000,
      'verseCount': 34,
    },
    {
      'chapterId':  104001000,
      'verseCount': 54,
    },
    {
      'chapterId':  104002000,
      'verseCount': 34,
    },
    {
      'chapterId':  104003000,
      'verseCount': 51,
    },
    {
      'chapterId':  104004000,
      'verseCount': 49,
    },
    {
      'chapterId':  104005000,
      'verseCount': 31,
    },
    {
      'chapterId':  104006000,
      'verseCount': 27,
    },
    {
      'chapterId':  104007000,
      'verseCount': 89,
    },
    {
      'chapterId':  104008000,
      'verseCount': 26,
    },
    {
      'chapterId':  104009000,
      'verseCount': 23,
    },
    {
      'chapterId':  104010000,
      'verseCount': 36,
    },
    {
      'chapterId':  104011000,
      'verseCount': 35,
    },
    {
      'chapterId':  104012000,
      'verseCount': 16,
    },
    {
      'chapterId':  104013000,
      'verseCount': 33,
    },
    {
      'chapterId':  104014000,
      'verseCount': 45,
    },
    {
      'chapterId':  104015000,
      'verseCount': 41,
    },
    {
      'chapterId':  104016000,
      'verseCount': 50,
    },
    {
      'chapterId':  104017000,
      'verseCount': 13,
    },
    {
      'chapterId':  104018000,
      'verseCount': 32,
    },
    {
      'chapterId':  104019000,
      'verseCount': 22,
    },
    {
      'chapterId':  104020000,
      'verseCount': 29,
    },
    {
      'chapterId':  104021000,
      'verseCount': 35,
    },
    {
      'chapterId':  104022000,
      'verseCount': 41,
    },
    {
      'chapterId':  104023000,
      'verseCount': 30,
    },
    {
      'chapterId':  104024000,
      'verseCount': 25,
    },
    {
      'chapterId':  104025000,
      'verseCount': 18,
    },
    {
      'chapterId':  104026000,
      'verseCount': 65,
    },
    {
      'chapterId':  104027000,
      'verseCount': 23,
    },
    {
      'chapterId':  104028000,
      'verseCount': 31,
    },
    {
      'chapterId':  104029000,
      'verseCount': 40,
    },
    {
      'chapterId':  104030000,
      'verseCount': 16,
    },
    {
      'chapterId':  104031000,
      'verseCount': 54,
    },
    {
      'chapterId':  104032000,
      'verseCount': 42,
    },
    {
      'chapterId':  104033000,
      'verseCount': 56,
    },
    {
      'chapterId':  104034000,
      'verseCount': 29,
    },
    {
      'chapterId':  104035000,
      'verseCount': 34,
    },
    {
      'chapterId':  104036000,
      'verseCount': 13,
    },
    {
      'chapterId':  105001000,
      'verseCount': 46,
    },
    {
      'chapterId':  105002000,
      'verseCount': 37,
    },
    {
      'chapterId':  105003000,
      'verseCount': 29,
    },
    {
      'chapterId':  105004000,
      'verseCount': 49,
    },
    {
      'chapterId':  105005000,
      'verseCount': 33,
    },
    {
      'chapterId':  105006000,
      'verseCount': 25,
    },
    {
      'chapterId':  105007000,
      'verseCount': 26,
    },
    {
      'chapterId':  105008000,
      'verseCount': 20,
    },
    {
      'chapterId':  105009000,
      'verseCount': 29,
    },
    {
      'chapterId':  105010000,
      'verseCount': 22,
    },
    {
      'chapterId':  105011000,
      'verseCount': 32,
    },
    {
      'chapterId':  105012000,
      'verseCount': 32,
    },
    {
      'chapterId':  105013000,
      'verseCount': 18,
    },
    {
      'chapterId':  105014000,
      'verseCount': 29,
    },
    {
      'chapterId':  105015000,
      'verseCount': 23,
    },
    {
      'chapterId':  105016000,
      'verseCount': 22,
    },
    {
      'chapterId':  105017000,
      'verseCount': 20,
    },
    {
      'chapterId':  105018000,
      'verseCount': 22,
    },
    {
      'chapterId':  105019000,
      'verseCount': 21,
    },
    {
      'chapterId':  105020000,
      'verseCount': 20,
    },
    {
      'chapterId':  105021000,
      'verseCount': 23,
    },
    {
      'chapterId':  105022000,
      'verseCount': 30,
    },
    {
      'chapterId':  105023000,
      'verseCount': 25,
    },
    {
      'chapterId':  105024000,
      'verseCount': 22,
    },
    {
      'chapterId':  105025000,
      'verseCount': 19,
    },
    {
      'chapterId':  105026000,
      'verseCount': 19,
    },
    {
      'chapterId':  105027000,
      'verseCount': 26,
    },
    {
      'chapterId':  105028000,
      'verseCount': 68,
    },
    {
      'chapterId':  105029000,
      'verseCount': 29,
    },
    {
      'chapterId':  105030000,
      'verseCount': 20,
    },
    {
      'chapterId':  105031000,
      'verseCount': 30,
    },
    {
      'chapterId':  105032000,
      'verseCount': 52,
    },
    {
      'chapterId':  105033000,
      'verseCount': 29,
    },
    {
      'chapterId':  105034000,
      'verseCount': 12,
    },
    {
      'chapterId':  106001000,
      'verseCount': 18,
    },
    {
      'chapterId':  106002000,
      'verseCount': 24,
    },
    {
      'chapterId':  106003000,
      'verseCount': 17,
    },
    {
      'chapterId':  106004000,
      'verseCount': 24,
    },
    {
      'chapterId':  106005000,
      'verseCount': 15,
    },
    {
      'chapterId':  106006000,
      'verseCount': 27,
    },
    {
      'chapterId':  106007000,
      'verseCount': 26,
    },
    {
      'chapterId':  106008000,
      'verseCount': 35,
    },
    {
      'chapterId':  106009000,
      'verseCount': 27,
    },
    {
      'chapterId':  106010000,
      'verseCount': 43,
    },
    {
      'chapterId':  106011000,
      'verseCount': 23,
    },
    {
      'chapterId':  106012000,
      'verseCount': 24,
    },
    {
      'chapterId':  106013000,
      'verseCount': 33,
    },
    {
      'chapterId':  106014000,
      'verseCount': 15,
    },
    {
      'chapterId':  106015000,
      'verseCount': 63,
    },
    {
      'chapterId':  106016000,
      'verseCount': 10,
    },
    {
      'chapterId':  106017000,
      'verseCount': 18,
    },
    {
      'chapterId':  106018000,
      'verseCount': 28,
    },
    {
      'chapterId':  106019000,
      'verseCount': 51,
    },
    {
      'chapterId':  106020000,
      'verseCount': 9,
    },
    {
      'chapterId':  106021000,
      'verseCount': 45,
    },
    {
      'chapterId':  106022000,
      'verseCount': 34,
    },
    {
      'chapterId':  106023000,
      'verseCount': 16,
    },
    {
      'chapterId':  106024000,
      'verseCount': 33,
    },
    {
      'chapterId':  107001000,
      'verseCount': 36,
    },
    {
      'chapterId':  107002000,
      'verseCount': 23,
    },
    {
      'chapterId':  107003000,
      'verseCount': 31,
    },
    {
      'chapterId':  107004000,
      'verseCount': 24,
    },
    {
      'chapterId':  107005000,
      'verseCount': 31,
    },
    {
      'chapterId':  107006000,
      'verseCount': 40,
    },
    {
      'chapterId':  107007000,
      'verseCount': 25,
    },
    {
      'chapterId':  107008000,
      'verseCount': 35,
    },
    {
      'chapterId':  107009000,
      'verseCount': 57,
    },
    {
      'chapterId':  107010000,
      'verseCount': 18,
    },
    {
      'chapterId':  107011000,
      'verseCount': 40,
    },
    {
      'chapterId':  107012000,
      'verseCount': 15,
    },
    {
      'chapterId':  107013000,
      'verseCount': 25,
    },
    {
      'chapterId':  107014000,
      'verseCount': 20,
    },
    {
      'chapterId':  107015000,
      'verseCount': 20,
    },
    {
      'chapterId':  107016000,
      'verseCount': 31,
    },
    {
      'chapterId':  107017000,
      'verseCount': 13,
    },
    {
      'chapterId':  107018000,
      'verseCount': 31,
    },
    {
      'chapterId':  107019000,
      'verseCount': 30,
    },
    {
      'chapterId':  107020000,
      'verseCount': 48,
    },
    {
      'chapterId':  107021000,
      'verseCount': 25,
    },
    {
      'chapterId':  108001000,
      'verseCount': 22,
    },
    {
      'chapterId':  108002000,
      'verseCount': 23,
    },
    {
      'chapterId':  108003000,
      'verseCount': 18,
    },
    {
      'chapterId':  108004000,
      'verseCount': 22,
    },
    {
      'chapterId':  109001000,
      'verseCount': 28,
    },
    {
      'chapterId':  109002000,
      'verseCount': 36,
    },
    {
      'chapterId':  109003000,
      'verseCount': 21,
    },
    {
      'chapterId':  109004000,
      'verseCount': 22,
    },
    {
      'chapterId':  109005000,
      'verseCount': 12,
    },
    {
      'chapterId':  109006000,
      'verseCount': 21,
    },
    {
      'chapterId':  109007000,
      'verseCount': 17,
    },
    {
      'chapterId':  109008000,
      'verseCount': 22,
    },
    {
      'chapterId':  109009000,
      'verseCount': 27,
    },
    {
      'chapterId':  109010000,
      'verseCount': 27,
    },
    {
      'chapterId':  109011000,
      'verseCount': 15,
    },
    {
      'chapterId':  109012000,
      'verseCount': 25,
    },
    {
      'chapterId':  109013000,
      'verseCount': 23,
    },
    {
      'chapterId':  109014000,
      'verseCount': 52,
    },
    {
      'chapterId':  109015000,
      'verseCount': 35,
    },
    {
      'chapterId':  109016000,
      'verseCount': 23,
    },
    {
      'chapterId':  109017000,
      'verseCount': 58,
    },
    {
      'chapterId':  109018000,
      'verseCount': 30,
    },
    {
      'chapterId':  109019000,
      'verseCount': 24,
    },
    {
      'chapterId':  109020000,
      'verseCount': 42,
    },
    {
      'chapterId':  109021000,
      'verseCount': 15,
    },
    {
      'chapterId':  109022000,
      'verseCount': 23,
    },
    {
      'chapterId':  109023000,
      'verseCount': 29,
    },
    {
      'chapterId':  109024000,
      'verseCount': 22,
    },
    {
      'chapterId':  109025000,
      'verseCount': 44,
    },
    {
      'chapterId':  109026000,
      'verseCount': 25,
    },
    {
      'chapterId':  109027000,
      'verseCount': 12,
    },
    {
      'chapterId':  109028000,
      'verseCount': 25,
    },
    {
      'chapterId':  109029000,
      'verseCount': 11,
    },
    {
      'chapterId':  109030000,
      'verseCount': 31,
    },
    {
      'chapterId':  109031000,
      'verseCount': 13,
    },
    {
      'chapterId':  110001000,
      'verseCount': 27,
    },
    {
      'chapterId':  110002000,
      'verseCount': 32,
    },
    {
      'chapterId':  110003000,
      'verseCount': 39,
    },
    {
      'chapterId':  110004000,
      'verseCount': 12,
    },
    {
      'chapterId':  110005000,
      'verseCount': 25,
    },
    {
      'chapterId':  110006000,
      'verseCount': 23,
    },
    {
      'chapterId':  110007000,
      'verseCount': 29,
    },
    {
      'chapterId':  110008000,
      'verseCount': 18,
    },
    {
      'chapterId':  110009000,
      'verseCount': 13,
    },
    {
      'chapterId':  110010000,
      'verseCount': 19,
    },
    {
      'chapterId':  110011000,
      'verseCount': 27,
    },
    {
      'chapterId':  110012000,
      'verseCount': 31,
    },
    {
      'chapterId':  110013000,
      'verseCount': 39,
    },
    {
      'chapterId':  110014000,
      'verseCount': 33,
    },
    {
      'chapterId':  110015000,
      'verseCount': 37,
    },
    {
      'chapterId':  110016000,
      'verseCount': 23,
    },
    {
      'chapterId':  110017000,
      'verseCount': 29,
    },
    {
      'chapterId':  110018000,
      'verseCount': 33,
    },
    {
      'chapterId':  110019000,
      'verseCount': 43,
    },
    {
      'chapterId':  110020000,
      'verseCount': 26,
    },
    {
      'chapterId':  110021000,
      'verseCount': 22,
    },
    {
      'chapterId':  110022000,
      'verseCount': 51,
    },
    {
      'chapterId':  110023000,
      'verseCount': 39,
    },
    {
      'chapterId':  110024000,
      'verseCount': 25,
    },
    {
      'chapterId':  111001000,
      'verseCount': 53,
    },
    {
      'chapterId':  111002000,
      'verseCount': 46,
    },
    {
      'chapterId':  111003000,
      'verseCount': 28,
    },
    {
      'chapterId':  111004000,
      'verseCount': 34,
    },
    {
      'chapterId':  111005000,
      'verseCount': 18,
    },
    {
      'chapterId':  111006000,
      'verseCount': 38,
    },
    {
      'chapterId':  111007000,
      'verseCount': 51,
    },
    {
      'chapterId':  111008000,
      'verseCount': 66,
    },
    {
      'chapterId':  111009000,
      'verseCount': 28,
    },
    {
      'chapterId':  111010000,
      'verseCount': 29,
    },
    {
      'chapterId':  111011000,
      'verseCount': 43,
    },
    {
      'chapterId':  111012000,
      'verseCount': 33,
    },
    {
      'chapterId':  111013000,
      'verseCount': 34,
    },
    {
      'chapterId':  111014000,
      'verseCount': 31,
    },
    {
      'chapterId':  111015000,
      'verseCount': 34,
    },
    {
      'chapterId':  111016000,
      'verseCount': 34,
    },
    {
      'chapterId':  111017000,
      'verseCount': 24,
    },
    {
      'chapterId':  111018000,
      'verseCount': 46,
    },
    {
      'chapterId':  111019000,
      'verseCount': 21,
    },
    {
      'chapterId':  111020000,
      'verseCount': 43,
    },
    {
      'chapterId':  111021000,
      'verseCount': 29,
    },
    {
      'chapterId':  111022000,
      'verseCount': 53,
    },
    {
      'chapterId':  112001000,
      'verseCount': 18,
    },
    {
      'chapterId':  112002000,
      'verseCount': 25,
    },
    {
      'chapterId':  112003000,
      'verseCount': 27,
    },
    {
      'chapterId':  112004000,
      'verseCount': 44,
    },
    {
      'chapterId':  112005000,
      'verseCount': 27,
    },
    {
      'chapterId':  112006000,
      'verseCount': 33,
    },
    {
      'chapterId':  112007000,
      'verseCount': 20,
    },
    {
      'chapterId':  112008000,
      'verseCount': 29,
    },
    {
      'chapterId':  112009000,
      'verseCount': 37,
    },
    {
      'chapterId':  112010000,
      'verseCount': 36,
    },
    {
      'chapterId':  112011000,
      'verseCount': 21,
    },
    {
      'chapterId':  112012000,
      'verseCount': 21,
    },
    {
      'chapterId':  112013000,
      'verseCount': 25,
    },
    {
      'chapterId':  112014000,
      'verseCount': 29,
    },
    {
      'chapterId':  112015000,
      'verseCount': 38,
    },
    {
      'chapterId':  112016000,
      'verseCount': 20,
    },
    {
      'chapterId':  112017000,
      'verseCount': 41,
    },
    {
      'chapterId':  112018000,
      'verseCount': 37,
    },
    {
      'chapterId':  112019000,
      'verseCount': 37,
    },
    {
      'chapterId':  112020000,
      'verseCount': 21,
    },
    {
      'chapterId':  112021000,
      'verseCount': 26,
    },
    {
      'chapterId':  112022000,
      'verseCount': 20,
    },
    {
      'chapterId':  112023000,
      'verseCount': 37,
    },
    {
      'chapterId':  112024000,
      'verseCount': 20,
    },
    {
      'chapterId':  112025000,
      'verseCount': 30,
    },
    {
      'chapterId':  113001000,
      'verseCount': 54,
    },
    {
      'chapterId':  113002000,
      'verseCount': 55,
    },
    {
      'chapterId':  113003000,
      'verseCount': 24,
    },
    {
      'chapterId':  113004000,
      'verseCount': 43,
    },
    {
      'chapterId':  113005000,
      'verseCount': 26,
    },
    {
      'chapterId':  113006000,
      'verseCount': 81,
    },
    {
      'chapterId':  113007000,
      'verseCount': 40,
    },
    {
      'chapterId':  113008000,
      'verseCount': 40,
    },
    {
      'chapterId':  113009000,
      'verseCount': 44,
    },
    {
      'chapterId':  113010000,
      'verseCount': 14,
    },
    {
      'chapterId':  113011000,
      'verseCount': 47,
    },
    {
      'chapterId':  113012000,
      'verseCount': 40,
    },
    {
      'chapterId':  113013000,
      'verseCount': 14,
    },
    {
      'chapterId':  113014000,
      'verseCount': 17,
    },
    {
      'chapterId':  113015000,
      'verseCount': 29,
    },
    {
      'chapterId':  113016000,
      'verseCount': 43,
    },
    {
      'chapterId':  113017000,
      'verseCount': 27,
    },
    {
      'chapterId':  113018000,
      'verseCount': 17,
    },
    {
      'chapterId':  113019000,
      'verseCount': 19,
    },
    {
      'chapterId':  113020000,
      'verseCount': 8,
    },
    {
      'chapterId':  113021000,
      'verseCount': 30,
    },
    {
      'chapterId':  113022000,
      'verseCount': 19,
    },
    {
      'chapterId':  113023000,
      'verseCount': 32,
    },
    {
      'chapterId':  113024000,
      'verseCount': 31,
    },
    {
      'chapterId':  113025000,
      'verseCount': 31,
    },
    {
      'chapterId':  113026000,
      'verseCount': 32,
    },
    {
      'chapterId':  113027000,
      'verseCount': 34,
    },
    {
      'chapterId':  113028000,
      'verseCount': 21,
    },
    {
      'chapterId':  113029000,
      'verseCount': 30,
    },
    {
      'chapterId':  114001000,
      'verseCount': 17,
    },
    {
      'chapterId':  114002000,
      'verseCount': 18,
    },
    {
      'chapterId':  114003000,
      'verseCount': 17,
    },
    {
      'chapterId':  114004000,
      'verseCount': 22,
    },
    {
      'chapterId':  114005000,
      'verseCount': 14,
    },
    {
      'chapterId':  114006000,
      'verseCount': 42,
    },
    {
      'chapterId':  114007000,
      'verseCount': 22,
    },
    {
      'chapterId':  114008000,
      'verseCount': 18,
    },
    {
      'chapterId':  114009000,
      'verseCount': 31,
    },
    {
      'chapterId':  114010000,
      'verseCount': 19,
    },
    {
      'chapterId':  114011000,
      'verseCount': 23,
    },
    {
      'chapterId':  114012000,
      'verseCount': 16,
    },
    {
      'chapterId':  114013000,
      'verseCount': 22,
    },
    {
      'chapterId':  114014000,
      'verseCount': 15,
    },
    {
      'chapterId':  114015000,
      'verseCount': 19,
    },
    {
      'chapterId':  114016000,
      'verseCount': 14,
    },
    {
      'chapterId':  114017000,
      'verseCount': 19,
    },
    {
      'chapterId':  114018000,
      'verseCount': 34,
    },
    {
      'chapterId':  114019000,
      'verseCount': 11,
    },
    {
      'chapterId':  114020000,
      'verseCount': 37,
    },
    {
      'chapterId':  114021000,
      'verseCount': 20,
    },
    {
      'chapterId':  114022000,
      'verseCount': 12,
    },
    {
      'chapterId':  114023000,
      'verseCount': 21,
    },
    {
      'chapterId':  114024000,
      'verseCount': 27,
    },
    {
      'chapterId':  114025000,
      'verseCount': 28,
    },
    {
      'chapterId':  114026000,
      'verseCount': 23,
    },
    {
      'chapterId':  114027000,
      'verseCount': 9,
    },
    {
      'chapterId':  114028000,
      'verseCount': 27,
    },
    {
      'chapterId':  114029000,
      'verseCount': 36,
    },
    {
      'chapterId':  114030000,
      'verseCount': 27,
    },
    {
      'chapterId':  114031000,
      'verseCount': 21,
    },
    {
      'chapterId':  114032000,
      'verseCount': 33,
    },
    {
      'chapterId':  114033000,
      'verseCount': 25,
    },
    {
      'chapterId':  114034000,
      'verseCount': 33,
    },
    {
      'chapterId':  114035000,
      'verseCount': 27,
    },
    {
      'chapterId':  114036000,
      'verseCount': 23,
    },
    {
      'chapterId':  115001000,
      'verseCount': 11,
    },
    {
      'chapterId':  115002000,
      'verseCount': 70,
    },
    {
      'chapterId':  115003000,
      'verseCount': 13,
    },
    {
      'chapterId':  115004000,
      'verseCount': 24,
    },
    {
      'chapterId':  115005000,
      'verseCount': 17,
    },
    {
      'chapterId':  115006000,
      'verseCount': 22,
    },
    {
      'chapterId':  115007000,
      'verseCount': 28,
    },
    {
      'chapterId':  115008000,
      'verseCount': 36,
    },
    {
      'chapterId':  115009000,
      'verseCount': 15,
    },
    {
      'chapterId':  115010000,
      'verseCount': 44,
    },
    {
      'chapterId':  116001000,
      'verseCount': 11,
    },
    {
      'chapterId':  116002000,
      'verseCount': 20,
    },
    {
      'chapterId':  116003000,
      'verseCount': 32,
    },
    {
      'chapterId':  116004000,
      'verseCount': 23,
    },
    {
      'chapterId':  116005000,
      'verseCount': 19,
    },
    {
      'chapterId':  116006000,
      'verseCount': 19,
    },
    {
      'chapterId':  116007000,
      'verseCount': 73,
    },
    {
      'chapterId':  116008000,
      'verseCount': 18,
    },
    {
      'chapterId':  116009000,
      'verseCount': 38,
    },
    {
      'chapterId':  116010000,
      'verseCount': 39,
    },
    {
      'chapterId':  116011000,
      'verseCount': 36,
    },
    {
      'chapterId':  116012000,
      'verseCount': 47,
    },
    {
      'chapterId':  116013000,
      'verseCount': 31,
    },
    {
      'chapterId':  117001000,
      'verseCount': 22,
    },
    {
      'chapterId':  117002000,
      'verseCount': 23,
    },
    {
      'chapterId':  117003000,
      'verseCount': 15,
    },
    {
      'chapterId':  117004000,
      'verseCount': 17,
    },
    {
      'chapterId':  117005000,
      'verseCount': 14,
    },
    {
      'chapterId':  117006000,
      'verseCount': 14,
    },
    {
      'chapterId':  117007000,
      'verseCount': 10,
    },
    {
      'chapterId':  117008000,
      'verseCount': 17,
    },
    {
      'chapterId':  117009000,
      'verseCount': 32,
    },
    {
      'chapterId':  117010000,
      'verseCount': 3,
    },
    {
      'chapterId':  118001000,
      'verseCount': 22,
    },
    {
      'chapterId':  118002000,
      'verseCount': 13,
    },
    {
      'chapterId':  118003000,
      'verseCount': 26,
    },
    {
      'chapterId':  118004000,
      'verseCount': 21,
    },
    {
      'chapterId':  118005000,
      'verseCount': 27,
    },
    {
      'chapterId':  118006000,
      'verseCount': 30,
    },
    {
      'chapterId':  118007000,
      'verseCount': 21,
    },
    {
      'chapterId':  118008000,
      'verseCount': 22,
    },
    {
      'chapterId':  118009000,
      'verseCount': 35,
    },
    {
      'chapterId':  118010000,
      'verseCount': 22,
    },
    {
      'chapterId':  118011000,
      'verseCount': 20,
    },
    {
      'chapterId':  118012000,
      'verseCount': 25,
    },
    {
      'chapterId':  118013000,
      'verseCount': 28,
    },
    {
      'chapterId':  118014000,
      'verseCount': 22,
    },
    {
      'chapterId':  118015000,
      'verseCount': 35,
    },
    {
      'chapterId':  118016000,
      'verseCount': 22,
    },
    {
      'chapterId':  118017000,
      'verseCount': 16,
    },
    {
      'chapterId':  118018000,
      'verseCount': 21,
    },
    {
      'chapterId':  118019000,
      'verseCount': 29,
    },
    {
      'chapterId':  118020000,
      'verseCount': 29,
    },
    {
      'chapterId':  118021000,
      'verseCount': 34,
    },
    {
      'chapterId':  118022000,
      'verseCount': 30,
    },
    {
      'chapterId':  118023000,
      'verseCount': 17,
    },
    {
      'chapterId':  118024000,
      'verseCount': 25,
    },
    {
      'chapterId':  118025000,
      'verseCount': 6,
    },
    {
      'chapterId':  118026000,
      'verseCount': 14,
    },
    {
      'chapterId':  118027000,
      'verseCount': 23,
    },
    {
      'chapterId':  118028000,
      'verseCount': 28,
    },
    {
      'chapterId':  118029000,
      'verseCount': 25,
    },
    {
      'chapterId':  118030000,
      'verseCount': 31,
    },
    {
      'chapterId':  118031000,
      'verseCount': 40,
    },
    {
      'chapterId':  118032000,
      'verseCount': 22,
    },
    {
      'chapterId':  118033000,
      'verseCount': 33,
    },
    {
      'chapterId':  118034000,
      'verseCount': 37,
    },
    {
      'chapterId':  118035000,
      'verseCount': 16,
    },
    {
      'chapterId':  118036000,
      'verseCount': 33,
    },
    {
      'chapterId':  118037000,
      'verseCount': 24,
    },
    {
      'chapterId':  118038000,
      'verseCount': 41,
    },
    {
      'chapterId':  118039000,
      'verseCount': 30,
    },
    {
      'chapterId':  118040000,
      'verseCount': 24,
    },
    {
      'chapterId':  118041000,
      'verseCount': 34,
    },
    {
      'chapterId':  118042000,
      'verseCount': 17,
    },
    {
      'chapterId':  119001000,
      'verseCount': 6,
    },
    {
      'chapterId':  119002000,
      'verseCount': 12,
    },
    {
      'chapterId':  119003000,
      'verseCount': 8,
    },
    {
      'chapterId':  119004000,
      'verseCount': 8,
    },
    {
      'chapterId':  119005000,
      'verseCount': 12,
    },
    {
      'chapterId':  119006000,
      'verseCount': 10,
    },
    {
      'chapterId':  119007000,
      'verseCount': 17,
    },
    {
      'chapterId':  119008000,
      'verseCount': 9,
    },
    {
      'chapterId':  119009000,
      'verseCount': 20,
    },
    {
      'chapterId':  119010000,
      'verseCount': 18,
    },
    {
      'chapterId':  119011000,
      'verseCount': 7,
    },
    {
      'chapterId':  119012000,
      'verseCount': 8,
    },
    {
      'chapterId':  119013000,
      'verseCount': 6,
    },
    {
      'chapterId':  119014000,
      'verseCount': 7,
    },
    {
      'chapterId':  119015000,
      'verseCount': 5,
    },
    {
      'chapterId':  119016000,
      'verseCount': 11,
    },
    {
      'chapterId':  119017000,
      'verseCount': 15,
    },
    {
      'chapterId':  119018000,
      'verseCount': 50,
    },
    {
      'chapterId':  119019000,
      'verseCount': 14,
    },
    {
      'chapterId':  119020000,
      'verseCount': 9,
    },
    {
      'chapterId':  119021000,
      'verseCount': 13,
    },
    {
      'chapterId':  119022000,
      'verseCount': 31,
    },
    {
      'chapterId':  119023000,
      'verseCount': 6,
    },
    {
      'chapterId':  119024000,
      'verseCount': 10,
    },
    {
      'chapterId':  119025000,
      'verseCount': 22,
    },
    {
      'chapterId':  119026000,
      'verseCount': 12,
    },
    {
      'chapterId':  119027000,
      'verseCount': 14,
    },
    {
      'chapterId':  119028000,
      'verseCount': 9,
    },
    {
      'chapterId':  119029000,
      'verseCount': 11,
    },
    {
      'chapterId':  119030000,
      'verseCount': 12,
    },
    {
      'chapterId':  119031000,
      'verseCount': 24,
    },
    {
      'chapterId':  119032000,
      'verseCount': 11,
    },
    {
      'chapterId':  119033000,
      'verseCount': 22,
    },
    {
      'chapterId':  119034000,
      'verseCount': 22,
    },
    {
      'chapterId':  119035000,
      'verseCount': 28,
    },
    {
      'chapterId':  119036000,
      'verseCount': 12,
    },
    {
      'chapterId':  119037000,
      'verseCount': 40,
    },
    {
      'chapterId':  119038000,
      'verseCount': 22,
    },
    {
      'chapterId':  119039000,
      'verseCount': 13,
    },
    {
      'chapterId':  119040000,
      'verseCount': 17,
    },
    {
      'chapterId':  119041000,
      'verseCount': 13,
    },
    {
      'chapterId':  119042000,
      'verseCount': 11,
    },
    {
      'chapterId':  119043000,
      'verseCount': 5,
    },
    {
      'chapterId':  119044000,
      'verseCount': 26,
    },
    {
      'chapterId':  119045000,
      'verseCount': 17,
    },
    {
      'chapterId':  119046000,
      'verseCount': 11,
    },
    {
      'chapterId':  119047000,
      'verseCount': 9,
    },
    {
      'chapterId':  119048000,
      'verseCount': 14,
    },
    {
      'chapterId':  119049000,
      'verseCount': 20,
    },
    {
      'chapterId':  119050000,
      'verseCount': 23,
    },
    {
      'chapterId':  119051000,
      'verseCount': 19,
    },
    {
      'chapterId':  119052000,
      'verseCount': 9,
    },
    {
      'chapterId':  119053000,
      'verseCount': 6,
    },
    {
      'chapterId':  119054000,
      'verseCount': 7,
    },
    {
      'chapterId':  119055000,
      'verseCount': 23,
    },
    {
      'chapterId':  119056000,
      'verseCount': 13,
    },
    {
      'chapterId':  119057000,
      'verseCount': 11,
    },
    {
      'chapterId':  119058000,
      'verseCount': 11,
    },
    {
      'chapterId':  119059000,
      'verseCount': 17,
    },
    {
      'chapterId':  119060000,
      'verseCount': 12,
    },
    {
      'chapterId':  119061000,
      'verseCount': 8,
    },
    {
      'chapterId':  119062000,
      'verseCount': 12,
    },
    {
      'chapterId':  119063000,
      'verseCount': 11,
    },
    {
      'chapterId':  119064000,
      'verseCount': 10,
    },
    {
      'chapterId':  119065000,
      'verseCount': 13,
    },
    {
      'chapterId':  119066000,
      'verseCount': 20,
    },
    {
      'chapterId':  119067000,
      'verseCount': 7,
    },
    {
      'chapterId':  119068000,
      'verseCount': 35,
    },
    {
      'chapterId':  119069000,
      'verseCount': 36,
    },
    {
      'chapterId':  119070000,
      'verseCount': 5,
    },
    {
      'chapterId':  119071000,
      'verseCount': 24,
    },
    {
      'chapterId':  119072000,
      'verseCount': 20,
    },
    {
      'chapterId':  119073000,
      'verseCount': 28,
    },
    {
      'chapterId':  119074000,
      'verseCount': 23,
    },
    {
      'chapterId':  119075000,
      'verseCount': 10,
    },
    {
      'chapterId':  119076000,
      'verseCount': 12,
    },
    {
      'chapterId':  119077000,
      'verseCount': 20,
    },
    {
      'chapterId':  119078000,
      'verseCount': 72,
    },
    {
      'chapterId':  119079000,
      'verseCount': 13,
    },
    {
      'chapterId':  119080000,
      'verseCount': 19,
    },
    {
      'chapterId':  119081000,
      'verseCount': 16,
    },
    {
      'chapterId':  119082000,
      'verseCount': 8,
    },
    {
      'chapterId':  119083000,
      'verseCount': 18,
    },
    {
      'chapterId':  119084000,
      'verseCount': 12,
    },
    {
      'chapterId':  119085000,
      'verseCount': 13,
    },
    {
      'chapterId':  119086000,
      'verseCount': 17,
    },
    {
      'chapterId':  119087000,
      'verseCount': 7,
    },
    {
      'chapterId':  119088000,
      'verseCount': 18,
    },
    {
      'chapterId':  119089000,
      'verseCount': 52,
    },
    {
      'chapterId':  119090000,
      'verseCount': 17,
    },
    {
      'chapterId':  119091000,
      'verseCount': 16,
    },
    {
      'chapterId':  119092000,
      'verseCount': 15,
    },
    {
      'chapterId':  119093000,
      'verseCount': 5,
    },
    {
      'chapterId':  119094000,
      'verseCount': 23,
    },
    {
      'chapterId':  119095000,
      'verseCount': 11,
    },
    {
      'chapterId':  119096000,
      'verseCount': 13,
    },
    {
      'chapterId':  119097000,
      'verseCount': 12,
    },
    {
      'chapterId':  119098000,
      'verseCount': 9,
    },
    {
      'chapterId':  119099000,
      'verseCount': 9,
    },
    {
      'chapterId':  119100000,
      'verseCount': 5,
    },
    {
      'chapterId':  119101000,
      'verseCount': 8,
    },
    {
      'chapterId':  119102000,
      'verseCount': 28,
    },
    {
      'chapterId':  119103000,
      'verseCount': 22,
    },
    {
      'chapterId':  119104000,
      'verseCount': 35,
    },
    {
      'chapterId':  119105000,
      'verseCount': 45,
    },
    {
      'chapterId':  119106000,
      'verseCount': 48,
    },
    {
      'chapterId':  119107000,
      'verseCount': 43,
    },
    {
      'chapterId':  119108000,
      'verseCount': 13,
    },
    {
      'chapterId':  119109000,
      'verseCount': 31,
    },
    {
      'chapterId':  119110000,
      'verseCount': 7,
    },
    {
      'chapterId':  119111000,
      'verseCount': 10,
    },
    {
      'chapterId':  119112000,
      'verseCount': 10,
    },
    {
      'chapterId':  119113000,
      'verseCount': 9,
    },
    {
      'chapterId':  119114000,
      'verseCount': 8,
    },
    {
      'chapterId':  119115000,
      'verseCount': 18,
    },
    {
      'chapterId':  119116000,
      'verseCount': 19,
    },
    {
      'chapterId':  119117000,
      'verseCount': 2,
    },
    {
      'chapterId':  119118000,
      'verseCount': 29,
    },
    {
      'chapterId':  119119000,
      'verseCount': 176,
    },
    {
      'chapterId':  119120000,
      'verseCount': 7,
    },
    {
      'chapterId':  119121000,
      'verseCount': 8,
    },
    {
      'chapterId':  119122000,
      'verseCount': 9,
    },
    {
      'chapterId':  119123000,
      'verseCount': 4,
    },
    {
      'chapterId':  119124000,
      'verseCount': 8,
    },
    {
      'chapterId':  119125000,
      'verseCount': 5,
    },
    {
      'chapterId':  119126000,
      'verseCount': 6,
    },
    {
      'chapterId':  119127000,
      'verseCount': 5,
    },
    {
      'chapterId':  119128000,
      'verseCount': 6,
    },
    {
      'chapterId':  119129000,
      'verseCount': 8,
    },
    {
      'chapterId':  119130000,
      'verseCount': 8,
    },
    {
      'chapterId':  119131000,
      'verseCount': 3,
    },
    {
      'chapterId':  119132000,
      'verseCount': 18,
    },
    {
      'chapterId':  119133000,
      'verseCount': 3,
    },
    {
      'chapterId':  119134000,
      'verseCount': 3,
    },
    {
      'chapterId':  119135000,
      'verseCount': 21,
    },
    {
      'chapterId':  119136000,
      'verseCount': 26,
    },
    {
      'chapterId':  119137000,
      'verseCount': 9,
    },
    {
      'chapterId':  119138000,
      'verseCount': 8,
    },
    {
      'chapterId':  119139000,
      'verseCount': 24,
    },
    {
      'chapterId':  119140000,
      'verseCount': 13,
    },
    {
      'chapterId':  119141000,
      'verseCount': 10,
    },
    {
      'chapterId':  119142000,
      'verseCount': 7,
    },
    {
      'chapterId':  119143000,
      'verseCount': 12,
    },
    {
      'chapterId':  119144000,
      'verseCount': 15,
    },
    {
      'chapterId':  119145000,
      'verseCount': 21,
    },
    {
      'chapterId':  119146000,
      'verseCount': 10,
    },
    {
      'chapterId':  119147000,
      'verseCount': 20,
    },
    {
      'chapterId':  119148000,
      'verseCount': 14,
    },
    {
      'chapterId':  119149000,
      'verseCount': 9,
    },
    {
      'chapterId':  119150000,
      'verseCount': 6,
    },
    {
      'chapterId':  120001000,
      'verseCount': 33,
    },
    {
      'chapterId':  120002000,
      'verseCount': 22,
    },
    {
      'chapterId':  120003000,
      'verseCount': 35,
    },
    {
      'chapterId':  120004000,
      'verseCount': 27,
    },
    {
      'chapterId':  120005000,
      'verseCount': 23,
    },
    {
      'chapterId':  120006000,
      'verseCount': 35,
    },
    {
      'chapterId':  120007000,
      'verseCount': 27,
    },
    {
      'chapterId':  120008000,
      'verseCount': 36,
    },
    {
      'chapterId':  120009000,
      'verseCount': 18,
    },
    {
      'chapterId':  120010000,
      'verseCount': 32,
    },
    {
      'chapterId':  120011000,
      'verseCount': 31,
    },
    {
      'chapterId':  120012000,
      'verseCount': 28,
    },
    {
      'chapterId':  120013000,
      'verseCount': 25,
    },
    {
      'chapterId':  120014000,
      'verseCount': 35,
    },
    {
      'chapterId':  120015000,
      'verseCount': 33,
    },
    {
      'chapterId':  120016000,
      'verseCount': 33,
    },
    {
      'chapterId':  120017000,
      'verseCount': 28,
    },
    {
      'chapterId':  120018000,
      'verseCount': 24,
    },
    {
      'chapterId':  120019000,
      'verseCount': 29,
    },
    {
      'chapterId':  120020000,
      'verseCount': 30,
    },
    {
      'chapterId':  120021000,
      'verseCount': 31,
    },
    {
      'chapterId':  120022000,
      'verseCount': 29,
    },
    {
      'chapterId':  120023000,
      'verseCount': 35,
    },
    {
      'chapterId':  120024000,
      'verseCount': 34,
    },
    {
      'chapterId':  120025000,
      'verseCount': 28,
    },
    {
      'chapterId':  120026000,
      'verseCount': 28,
    },
    {
      'chapterId':  120027000,
      'verseCount': 27,
    },
    {
      'chapterId':  120028000,
      'verseCount': 28,
    },
    {
      'chapterId':  120029000,
      'verseCount': 27,
    },
    {
      'chapterId':  120030000,
      'verseCount': 33,
    },
    {
      'chapterId':  120031000,
      'verseCount': 31,
    },
    {
      'chapterId':  121001000,
      'verseCount': 18,
    },
    {
      'chapterId':  121002000,
      'verseCount': 26,
    },
    {
      'chapterId':  121003000,
      'verseCount': 22,
    },
    {
      'chapterId':  121004000,
      'verseCount': 16,
    },
    {
      'chapterId':  121005000,
      'verseCount': 20,
    },
    {
      'chapterId':  121006000,
      'verseCount': 12,
    },
    {
      'chapterId':  121007000,
      'verseCount': 29,
    },
    {
      'chapterId':  121008000,
      'verseCount': 17,
    },
    {
      'chapterId':  121009000,
      'verseCount': 18,
    },
    {
      'chapterId':  121010000,
      'verseCount': 20,
    },
    {
      'chapterId':  121011000,
      'verseCount': 10,
    },
    {
      'chapterId':  121012000,
      'verseCount': 14,
    },
    {
      'chapterId':  122001000,
      'verseCount': 17,
    },
    {
      'chapterId':  122002000,
      'verseCount': 17,
    },
    {
      'chapterId':  122003000,
      'verseCount': 11,
    },
    {
      'chapterId':  122004000,
      'verseCount': 16,
    },
    {
      'chapterId':  122005000,
      'verseCount': 16,
    },
    {
      'chapterId':  122006000,
      'verseCount': 13,
    },
    {
      'chapterId':  122007000,
      'verseCount': 13,
    },
    {
      'chapterId':  122008000,
      'verseCount': 14,
    },
    {
      'chapterId':  123001000,
      'verseCount': 31,
    },
    {
      'chapterId':  123002000,
      'verseCount': 22,
    },
    {
      'chapterId':  123003000,
      'verseCount': 26,
    },
    {
      'chapterId':  123004000,
      'verseCount': 6,
    },
    {
      'chapterId':  123005000,
      'verseCount': 30,
    },
    {
      'chapterId':  123006000,
      'verseCount': 13,
    },
    {
      'chapterId':  123007000,
      'verseCount': 25,
    },
    {
      'chapterId':  123008000,
      'verseCount': 22,
    },
    {
      'chapterId':  123009000,
      'verseCount': 21,
    },
    {
      'chapterId':  123010000,
      'verseCount': 34,
    },
    {
      'chapterId':  123011000,
      'verseCount': 16,
    },
    {
      'chapterId':  123012000,
      'verseCount': 6,
    },
    {
      'chapterId':  123013000,
      'verseCount': 22,
    },
    {
      'chapterId':  123014000,
      'verseCount': 32,
    },
    {
      'chapterId':  123015000,
      'verseCount': 9,
    },
    {
      'chapterId':  123016000,
      'verseCount': 14,
    },
    {
      'chapterId':  123017000,
      'verseCount': 14,
    },
    {
      'chapterId':  123018000,
      'verseCount': 7,
    },
    {
      'chapterId':  123019000,
      'verseCount': 25,
    },
    {
      'chapterId':  123020000,
      'verseCount': 6,
    },
    {
      'chapterId':  123021000,
      'verseCount': 17,
    },
    {
      'chapterId':  123022000,
      'verseCount': 25,
    },
    {
      'chapterId':  123023000,
      'verseCount': 18,
    },
    {
      'chapterId':  123024000,
      'verseCount': 23,
    },
    {
      'chapterId':  123025000,
      'verseCount': 12,
    },
    {
      'chapterId':  123026000,
      'verseCount': 21,
    },
    {
      'chapterId':  123027000,
      'verseCount': 13,
    },
    {
      'chapterId':  123028000,
      'verseCount': 29,
    },
    {
      'chapterId':  123029000,
      'verseCount': 24,
    },
    {
      'chapterId':  123030000,
      'verseCount': 33,
    },
    {
      'chapterId':  123031000,
      'verseCount': 9,
    },
    {
      'chapterId':  123032000,
      'verseCount': 20,
    },
    {
      'chapterId':  123033000,
      'verseCount': 24,
    },
    {
      'chapterId':  123034000,
      'verseCount': 17,
    },
    {
      'chapterId':  123035000,
      'verseCount': 10,
    },
    {
      'chapterId':  123036000,
      'verseCount': 22,
    },
    {
      'chapterId':  123037000,
      'verseCount': 38,
    },
    {
      'chapterId':  123038000,
      'verseCount': 22,
    },
    {
      'chapterId':  123039000,
      'verseCount': 8,
    },
    {
      'chapterId':  123040000,
      'verseCount': 31,
    },
    {
      'chapterId':  123041000,
      'verseCount': 29,
    },
    {
      'chapterId':  123042000,
      'verseCount': 25,
    },
    {
      'chapterId':  123043000,
      'verseCount': 28,
    },
    {
      'chapterId':  123044000,
      'verseCount': 28,
    },
    {
      'chapterId':  123045000,
      'verseCount': 25,
    },
    {
      'chapterId':  123046000,
      'verseCount': 13,
    },
    {
      'chapterId':  123047000,
      'verseCount': 15,
    },
    {
      'chapterId':  123048000,
      'verseCount': 22,
    },
    {
      'chapterId':  123049000,
      'verseCount': 26,
    },
    {
      'chapterId':  123050000,
      'verseCount': 11,
    },
    {
      'chapterId':  123051000,
      'verseCount': 23,
    },
    {
      'chapterId':  123052000,
      'verseCount': 15,
    },
    {
      'chapterId':  123053000,
      'verseCount': 12,
    },
    {
      'chapterId':  123054000,
      'verseCount': 17,
    },
    {
      'chapterId':  123055000,
      'verseCount': 13,
    },
    {
      'chapterId':  123056000,
      'verseCount': 12,
    },
    {
      'chapterId':  123057000,
      'verseCount': 21,
    },
    {
      'chapterId':  123058000,
      'verseCount': 14,
    },
    {
      'chapterId':  123059000,
      'verseCount': 21,
    },
    {
      'chapterId':  123060000,
      'verseCount': 22,
    },
    {
      'chapterId':  123061000,
      'verseCount': 11,
    },
    {
      'chapterId':  123062000,
      'verseCount': 12,
    },
    {
      'chapterId':  123063000,
      'verseCount': 19,
    },
    {
      'chapterId':  123064000,
      'verseCount': 12,
    },
    {
      'chapterId':  123065000,
      'verseCount': 25,
    },
    {
      'chapterId':  123066000,
      'verseCount': 24,
    },
    {
      'chapterId':  124001000,
      'verseCount': 19,
    },
    {
      'chapterId':  124002000,
      'verseCount': 37,
    },
    {
      'chapterId':  124003000,
      'verseCount': 25,
    },
    {
      'chapterId':  124004000,
      'verseCount': 31,
    },
    {
      'chapterId':  124005000,
      'verseCount': 31,
    },
    {
      'chapterId':  124006000,
      'verseCount': 30,
    },
    {
      'chapterId':  124007000,
      'verseCount': 34,
    },
    {
      'chapterId':  124008000,
      'verseCount': 22,
    },
    {
      'chapterId':  124009000,
      'verseCount': 26,
    },
    {
      'chapterId':  124010000,
      'verseCount': 25,
    },
    {
      'chapterId':  124011000,
      'verseCount': 23,
    },
    {
      'chapterId':  124012000,
      'verseCount': 17,
    },
    {
      'chapterId':  124013000,
      'verseCount': 27,
    },
    {
      'chapterId':  124014000,
      'verseCount': 22,
    },
    {
      'chapterId':  124015000,
      'verseCount': 21,
    },
    {
      'chapterId':  124016000,
      'verseCount': 21,
    },
    {
      'chapterId':  124017000,
      'verseCount': 27,
    },
    {
      'chapterId':  124018000,
      'verseCount': 23,
    },
    {
      'chapterId':  124019000,
      'verseCount': 15,
    },
    {
      'chapterId':  124020000,
      'verseCount': 18,
    },
    {
      'chapterId':  124021000,
      'verseCount': 14,
    },
    {
      'chapterId':  124022000,
      'verseCount': 30,
    },
    {
      'chapterId':  124023000,
      'verseCount': 40,
    },
    {
      'chapterId':  124024000,
      'verseCount': 10,
    },
    {
      'chapterId':  124025000,
      'verseCount': 38,
    },
    {
      'chapterId':  124026000,
      'verseCount': 24,
    },
    {
      'chapterId':  124027000,
      'verseCount': 22,
    },
    {
      'chapterId':  124028000,
      'verseCount': 17,
    },
    {
      'chapterId':  124029000,
      'verseCount': 32,
    },
    {
      'chapterId':  124030000,
      'verseCount': 24,
    },
    {
      'chapterId':  124031000,
      'verseCount': 40,
    },
    {
      'chapterId':  124032000,
      'verseCount': 44,
    },
    {
      'chapterId':  124033000,
      'verseCount': 26,
    },
    {
      'chapterId':  124034000,
      'verseCount': 22,
    },
    {
      'chapterId':  124035000,
      'verseCount': 19,
    },
    {
      'chapterId':  124036000,
      'verseCount': 32,
    },
    {
      'chapterId':  124037000,
      'verseCount': 21,
    },
    {
      'chapterId':  124038000,
      'verseCount': 28,
    },
    {
      'chapterId':  124039000,
      'verseCount': 18,
    },
    {
      'chapterId':  124040000,
      'verseCount': 16,
    },
    {
      'chapterId':  124041000,
      'verseCount': 18,
    },
    {
      'chapterId':  124042000,
      'verseCount': 22,
    },
    {
      'chapterId':  124043000,
      'verseCount': 13,
    },
    {
      'chapterId':  124044000,
      'verseCount': 30,
    },
    {
      'chapterId':  124045000,
      'verseCount': 5,
    },
    {
      'chapterId':  124046000,
      'verseCount': 28,
    },
    {
      'chapterId':  124047000,
      'verseCount': 7,
    },
    {
      'chapterId':  124048000,
      'verseCount': 47,
    },
    {
      'chapterId':  124049000,
      'verseCount': 39,
    },
    {
      'chapterId':  124050000,
      'verseCount': 46,
    },
    {
      'chapterId':  124051000,
      'verseCount': 64,
    },
    {
      'chapterId':  124052000,
      'verseCount': 34,
    },
    {
      'chapterId':  125001000,
      'verseCount': 22,
    },
    {
      'chapterId':  125002000,
      'verseCount': 22,
    },
    {
      'chapterId':  125003000,
      'verseCount': 66,
    },
    {
      'chapterId':  125004000,
      'verseCount': 22,
    },
    {
      'chapterId':  125005000,
      'verseCount': 22,
    },
    {
      'chapterId':  126001000,
      'verseCount': 28,
    },
    {
      'chapterId':  126002000,
      'verseCount': 10,
    },
    {
      'chapterId':  126003000,
      'verseCount': 27,
    },
    {
      'chapterId':  126004000,
      'verseCount': 17,
    },
    {
      'chapterId':  126005000,
      'verseCount': 17,
    },
    {
      'chapterId':  126006000,
      'verseCount': 14,
    },
    {
      'chapterId':  126007000,
      'verseCount': 27,
    },
    {
      'chapterId':  126008000,
      'verseCount': 18,
    },
    {
      'chapterId':  126009000,
      'verseCount': 11,
    },
    {
      'chapterId':  126010000,
      'verseCount': 22,
    },
    {
      'chapterId':  126011000,
      'verseCount': 25,
    },
    {
      'chapterId':  126012000,
      'verseCount': 28,
    },
    {
      'chapterId':  126013000,
      'verseCount': 23,
    },
    {
      'chapterId':  126014000,
      'verseCount': 23,
    },
    {
      'chapterId':  126015000,
      'verseCount': 8,
    },
    {
      'chapterId':  126016000,
      'verseCount': 63,
    },
    {
      'chapterId':  126017000,
      'verseCount': 24,
    },
    {
      'chapterId':  126018000,
      'verseCount': 32,
    },
    {
      'chapterId':  126019000,
      'verseCount': 14,
    },
    {
      'chapterId':  126020000,
      'verseCount': 49,
    },
    {
      'chapterId':  126021000,
      'verseCount': 32,
    },
    {
      'chapterId':  126022000,
      'verseCount': 31,
    },
    {
      'chapterId':  126023000,
      'verseCount': 49,
    },
    {
      'chapterId':  126024000,
      'verseCount': 27,
    },
    {
      'chapterId':  126025000,
      'verseCount': 17,
    },
    {
      'chapterId':  126026000,
      'verseCount': 21,
    },
    {
      'chapterId':  126027000,
      'verseCount': 36,
    },
    {
      'chapterId':  126028000,
      'verseCount': 26,
    },
    {
      'chapterId':  126029000,
      'verseCount': 21,
    },
    {
      'chapterId':  126030000,
      'verseCount': 26,
    },
    {
      'chapterId':  126031000,
      'verseCount': 18,
    },
    {
      'chapterId':  126032000,
      'verseCount': 32,
    },
    {
      'chapterId':  126033000,
      'verseCount': 33,
    },
    {
      'chapterId':  126034000,
      'verseCount': 31,
    },
    {
      'chapterId':  126035000,
      'verseCount': 15,
    },
    {
      'chapterId':  126036000,
      'verseCount': 38,
    },
    {
      'chapterId':  126037000,
      'verseCount': 28,
    },
    {
      'chapterId':  126038000,
      'verseCount': 23,
    },
    {
      'chapterId':  126039000,
      'verseCount': 29,
    },
    {
      'chapterId':  126040000,
      'verseCount': 49,
    },
    {
      'chapterId':  126041000,
      'verseCount': 26,
    },
    {
      'chapterId':  126042000,
      'verseCount': 20,
    },
    {
      'chapterId':  126043000,
      'verseCount': 27,
    },
    {
      'chapterId':  126044000,
      'verseCount': 31,
    },
    {
      'chapterId':  126045000,
      'verseCount': 25,
    },
    {
      'chapterId':  126046000,
      'verseCount': 24,
    },
    {
      'chapterId':  126047000,
      'verseCount': 23,
    },
    {
      'chapterId':  126048000,
      'verseCount': 35,
    },
    {
      'chapterId':  127001000,
      'verseCount': 21,
    },
    {
      'chapterId':  127002000,
      'verseCount': 49,
    },
    {
      'chapterId':  127003000,
      'verseCount': 30,
    },
    {
      'chapterId':  127004000,
      'verseCount': 37,
    },
    {
      'chapterId':  127005000,
      'verseCount': 31,
    },
    {
      'chapterId':  127006000,
      'verseCount': 28,
    },
    {
      'chapterId':  127007000,
      'verseCount': 28,
    },
    {
      'chapterId':  127008000,
      'verseCount': 27,
    },
    {
      'chapterId':  127009000,
      'verseCount': 27,
    },
    {
      'chapterId':  127010000,
      'verseCount': 21,
    },
    {
      'chapterId':  127011000,
      'verseCount': 45,
    },
    {
      'chapterId':  127012000,
      'verseCount': 13,
    },
    {
      'chapterId':  128001000,
      'verseCount': 11,
    },
    {
      'chapterId':  128002000,
      'verseCount': 23,
    },
    {
      'chapterId':  128003000,
      'verseCount': 5,
    },
    {
      'chapterId':  128004000,
      'verseCount': 19,
    },
    {
      'chapterId':  128005000,
      'verseCount': 15,
    },
    {
      'chapterId':  128006000,
      'verseCount': 11,
    },
    {
      'chapterId':  128007000,
      'verseCount': 16,
    },
    {
      'chapterId':  128008000,
      'verseCount': 14,
    },
    {
      'chapterId':  128009000,
      'verseCount': 17,
    },
    {
      'chapterId':  128010000,
      'verseCount': 15,
    },
    {
      'chapterId':  128011000,
      'verseCount': 12,
    },
    {
      'chapterId':  128012000,
      'verseCount': 14,
    },
    {
      'chapterId':  128013000,
      'verseCount': 16,
    },
    {
      'chapterId':  128014000,
      'verseCount': 9,
    },
    {
      'chapterId':  129001000,
      'verseCount': 20,
    },
    {
      'chapterId':  129002000,
      'verseCount': 32,
    },
    {
      'chapterId':  129003000,
      'verseCount': 21,
    },
    {
      'chapterId':  130001000,
      'verseCount': 15,
    },
    {
      'chapterId':  130002000,
      'verseCount': 16,
    },
    {
      'chapterId':  130003000,
      'verseCount': 15,
    },
    {
      'chapterId':  130004000,
      'verseCount': 13,
    },
    {
      'chapterId':  130005000,
      'verseCount': 27,
    },
    {
      'chapterId':  130006000,
      'verseCount': 14,
    },
    {
      'chapterId':  130007000,
      'verseCount': 17,
    },
    {
      'chapterId':  130008000,
      'verseCount': 14,
    },
    {
      'chapterId':  130009000,
      'verseCount': 15,
    },
    {
      'chapterId':  131001000,
      'verseCount': 21,
    },
    {
      'chapterId':  132001000,
      'verseCount': 17,
    },
    {
      'chapterId':  132002000,
      'verseCount': 10,
    },
    {
      'chapterId':  132003000,
      'verseCount': 10,
    },
    {
      'chapterId':  132004000,
      'verseCount': 11,
    },
    {
      'chapterId':  133001000,
      'verseCount': 16,
    },
    {
      'chapterId':  133002000,
      'verseCount': 13,
    },
    {
      'chapterId':  133003000,
      'verseCount': 12,
    },
    {
      'chapterId':  133004000,
      'verseCount': 13,
    },
    {
      'chapterId':  133005000,
      'verseCount': 15,
    },
    {
      'chapterId':  133006000,
      'verseCount': 16,
    },
    {
      'chapterId':  133007000,
      'verseCount': 20,
    },
    {
      'chapterId':  134001000,
      'verseCount': 15,
    },
    {
      'chapterId':  134002000,
      'verseCount': 13,
    },
    {
      'chapterId':  134003000,
      'verseCount': 19,
    },
    {
      'chapterId':  135001000,
      'verseCount': 17,
    },
    {
      'chapterId':  135002000,
      'verseCount': 20,
    },
    {
      'chapterId':  135003000,
      'verseCount': 19,
    },
    {
      'chapterId':  136001000,
      'verseCount': 18,
    },
    {
      'chapterId':  136002000,
      'verseCount': 15,
    },
    {
      'chapterId':  136003000,
      'verseCount': 20,
    },
    {
      'chapterId':  137001000,
      'verseCount': 15,
    },
    {
      'chapterId':  137002000,
      'verseCount': 23,
    },
    {
      'chapterId':  138001000,
      'verseCount': 21,
    },
    {
      'chapterId':  138002000,
      'verseCount': 13,
    },
    {
      'chapterId':  138003000,
      'verseCount': 10,
    },
    {
      'chapterId':  138004000,
      'verseCount': 14,
    },
    {
      'chapterId':  138005000,
      'verseCount': 11,
    },
    {
      'chapterId':  138006000,
      'verseCount': 15,
    },
    {
      'chapterId':  138007000,
      'verseCount': 14,
    },
    {
      'chapterId':  138008000,
      'verseCount': 23,
    },
    {
      'chapterId':  138009000,
      'verseCount': 17,
    },
    {
      'chapterId':  138010000,
      'verseCount': 12,
    },
    {
      'chapterId':  138011000,
      'verseCount': 17,
    },
    {
      'chapterId':  138012000,
      'verseCount': 14,
    },
    {
      'chapterId':  138013000,
      'verseCount': 9,
    },
    {
      'chapterId':  138014000,
      'verseCount': 21,
    },
    {
      'chapterId':  139001000,
      'verseCount': 14,
    },
    {
      'chapterId':  139002000,
      'verseCount': 17,
    },
    {
      'chapterId':  139003000,
      'verseCount': 18,
    },
    {
      'chapterId':  139004000,
      'verseCount': 6,
    },
    {
      'chapterId':  140001000,
      'verseCount': 25,
    },
    {
      'chapterId':  140002000,
      'verseCount': 23,
    },
    {
      'chapterId':  140003000,
      'verseCount': 17,
    },
    {
      'chapterId':  140004000,
      'verseCount': 25,
    },
    {
      'chapterId':  140005000,
      'verseCount': 48,
    },
    {
      'chapterId':  140006000,
      'verseCount': 34,
    },
    {
      'chapterId':  140007000,
      'verseCount': 29,
    },
    {
      'chapterId':  140008000,
      'verseCount': 34,
    },
    {
      'chapterId':  140009000,
      'verseCount': 38,
    },
    {
      'chapterId':  140010000,
      'verseCount': 42,
    },
    {
      'chapterId':  140011000,
      'verseCount': 30,
    },
    {
      'chapterId':  140012000,
      'verseCount': 50,
    },
    {
      'chapterId':  140013000,
      'verseCount': 58,
    },
    {
      'chapterId':  140014000,
      'verseCount': 36,
    },
    {
      'chapterId':  140015000,
      'verseCount': 39,
    },
    {
      'chapterId':  140016000,
      'verseCount': 28,
    },
    {
      'chapterId':  140017000,
      'verseCount': 27,
    },
    {
      'chapterId':  140018000,
      'verseCount': 35,
    },
    {
      'chapterId':  140019000,
      'verseCount': 30,
    },
    {
      'chapterId':  140020000,
      'verseCount': 34,
    },
    {
      'chapterId':  140021000,
      'verseCount': 46,
    },
    {
      'chapterId':  140022000,
      'verseCount': 46,
    },
    {
      'chapterId':  140023000,
      'verseCount': 39,
    },
    {
      'chapterId':  140024000,
      'verseCount': 51,
    },
    {
      'chapterId':  140025000,
      'verseCount': 46,
    },
    {
      'chapterId':  140026000,
      'verseCount': 75,
    },
    {
      'chapterId':  140027000,
      'verseCount': 66,
    },
    {
      'chapterId':  140028000,
      'verseCount': 20,
    },
    {
      'chapterId':  141001000,
      'verseCount': 45,
    },
    {
      'chapterId':  141002000,
      'verseCount': 28,
    },
    {
      'chapterId':  141003000,
      'verseCount': 35,
    },
    {
      'chapterId':  141004000,
      'verseCount': 41,
    },
    {
      'chapterId':  141005000,
      'verseCount': 43,
    },
    {
      'chapterId':  141006000,
      'verseCount': 56,
    },
    {
      'chapterId':  141007000,
      'verseCount': 37,
    },
    {
      'chapterId':  141008000,
      'verseCount': 38,
    },
    {
      'chapterId':  141009000,
      'verseCount': 50,
    },
    {
      'chapterId':  141010000,
      'verseCount': 52,
    },
    {
      'chapterId':  141011000,
      'verseCount': 33,
    },
    {
      'chapterId':  141012000,
      'verseCount': 44,
    },
    {
      'chapterId':  141013000,
      'verseCount': 37,
    },
    {
      'chapterId':  141014000,
      'verseCount': 72,
    },
    {
      'chapterId':  141015000,
      'verseCount': 47,
    },
    {
      'chapterId':  141016000,
      'verseCount': 20,
    },
    {
      'chapterId':  142001000,
      'verseCount': 80,
    },
    {
      'chapterId':  142002000,
      'verseCount': 52,
    },
    {
      'chapterId':  142003000,
      'verseCount': 38,
    },
    {
      'chapterId':  142004000,
      'verseCount': 44,
    },
    {
      'chapterId':  142005000,
      'verseCount': 39,
    },
    {
      'chapterId':  142006000,
      'verseCount': 49,
    },
    {
      'chapterId':  142007000,
      'verseCount': 50,
    },
    {
      'chapterId':  142008000,
      'verseCount': 56,
    },
    {
      'chapterId':  142009000,
      'verseCount': 62,
    },
    {
      'chapterId':  142010000,
      'verseCount': 42,
    },
    {
      'chapterId':  142011000,
      'verseCount': 54,
    },
    {
      'chapterId':  142012000,
      'verseCount': 59,
    },
    {
      'chapterId':  142013000,
      'verseCount': 35,
    },
    {
      'chapterId':  142014000,
      'verseCount': 35,
    },
    {
      'chapterId':  142015000,
      'verseCount': 32,
    },
    {
      'chapterId':  142016000,
      'verseCount': 31,
    },
    {
      'chapterId':  142017000,
      'verseCount': 37,
    },
    {
      'chapterId':  142018000,
      'verseCount': 43,
    },
    {
      'chapterId':  142019000,
      'verseCount': 48,
    },
    {
      'chapterId':  142020000,
      'verseCount': 47,
    },
    {
      'chapterId':  142021000,
      'verseCount': 38,
    },
    {
      'chapterId':  142022000,
      'verseCount': 71,
    },
    {
      'chapterId':  142023000,
      'verseCount': 56,
    },
    {
      'chapterId':  142024000,
      'verseCount': 53,
    },
    {
      'chapterId':  143001000,
      'verseCount': 51,
    },
    {
      'chapterId':  143002000,
      'verseCount': 25,
    },
    {
      'chapterId':  143003000,
      'verseCount': 36,
    },
    {
      'chapterId':  143004000,
      'verseCount': 54,
    },
    {
      'chapterId':  143005000,
      'verseCount': 47,
    },
    {
      'chapterId':  143006000,
      'verseCount': 71,
    },
    {
      'chapterId':  143007000,
      'verseCount': 53,
    },
    {
      'chapterId':  143008000,
      'verseCount': 59,
    },
    {
      'chapterId':  143009000,
      'verseCount': 41,
    },
    {
      'chapterId':  143010000,
      'verseCount': 42,
    },
    {
      'chapterId':  143011000,
      'verseCount': 57,
    },
    {
      'chapterId':  143012000,
      'verseCount': 50,
    },
    {
      'chapterId':  143013000,
      'verseCount': 38,
    },
    {
      'chapterId':  143014000,
      'verseCount': 31,
    },
    {
      'chapterId':  143015000,
      'verseCount': 27,
    },
    {
      'chapterId':  143016000,
      'verseCount': 33,
    },
    {
      'chapterId':  143017000,
      'verseCount': 26,
    },
    {
      'chapterId':  143018000,
      'verseCount': 40,
    },
    {
      'chapterId':  143019000,
      'verseCount': 42,
    },
    {
      'chapterId':  143020000,
      'verseCount': 31,
    },
    {
      'chapterId':  143021000,
      'verseCount': 25,
    },
    {
      'chapterId':  144001000,
      'verseCount': 26,
    },
    {
      'chapterId':  144002000,
      'verseCount': 47,
    },
    {
      'chapterId':  144003000,
      'verseCount': 26,
    },
    {
      'chapterId':  144004000,
      'verseCount': 37,
    },
    {
      'chapterId':  144005000,
      'verseCount': 42,
    },
    {
      'chapterId':  144006000,
      'verseCount': 15,
    },
    {
      'chapterId':  144007000,
      'verseCount': 60,
    },
    {
      'chapterId':  144008000,
      'verseCount': 40,
    },
    {
      'chapterId':  144009000,
      'verseCount': 43,
    },
    {
      'chapterId':  144010000,
      'verseCount': 48,
    },
    {
      'chapterId':  144011000,
      'verseCount': 30,
    },
    {
      'chapterId':  144012000,
      'verseCount': 25,
    },
    {
      'chapterId':  144013000,
      'verseCount': 52,
    },
    {
      'chapterId':  144014000,
      'verseCount': 28,
    },
    {
      'chapterId':  144015000,
      'verseCount': 41,
    },
    {
      'chapterId':  144016000,
      'verseCount': 40,
    },
    {
      'chapterId':  144017000,
      'verseCount': 34,
    },
    {
      'chapterId':  144018000,
      'verseCount': 28,
    },
    {
      'chapterId':  144019000,
      'verseCount': 41,
    },
    {
      'chapterId':  144020000,
      'verseCount': 38,
    },
    {
      'chapterId':  144021000,
      'verseCount': 40,
    },
    {
      'chapterId':  144022000,
      'verseCount': 30,
    },
    {
      'chapterId':  144023000,
      'verseCount': 35,
    },
    {
      'chapterId':  144024000,
      'verseCount': 27,
    },
    {
      'chapterId':  144025000,
      'verseCount': 27,
    },
    {
      'chapterId':  144026000,
      'verseCount': 32,
    },
    {
      'chapterId':  144027000,
      'verseCount': 44,
    },
    {
      'chapterId':  144028000,
      'verseCount': 31,
    },
    {
      'chapterId':  145001000,
      'verseCount': 32,
    },
    {
      'chapterId':  145002000,
      'verseCount': 29,
    },
    {
      'chapterId':  145003000,
      'verseCount': 31,
    },
    {
      'chapterId':  145004000,
      'verseCount': 25,
    },
    {
      'chapterId':  145005000,
      'verseCount': 21,
    },
    {
      'chapterId':  145006000,
      'verseCount': 23,
    },
    {
      'chapterId':  145007000,
      'verseCount': 25,
    },
    {
      'chapterId':  145008000,
      'verseCount': 39,
    },
    {
      'chapterId':  145009000,
      'verseCount': 33,
    },
    {
      'chapterId':  145010000,
      'verseCount': 21,
    },
    {
      'chapterId':  145011000,
      'verseCount': 36,
    },
    {
      'chapterId':  145012000,
      'verseCount': 21,
    },
    {
      'chapterId':  145013000,
      'verseCount': 14,
    },
    {
      'chapterId':  145014000,
      'verseCount': 23,
    },
    {
      'chapterId':  145015000,
      'verseCount': 33,
    },
    {
      'chapterId':  145016000,
      'verseCount': 27,
    },
    {
      'chapterId':  146001000,
      'verseCount': 31,
    },
    {
      'chapterId':  146002000,
      'verseCount': 16,
    },
    {
      'chapterId':  146003000,
      'verseCount': 23,
    },
    {
      'chapterId':  146004000,
      'verseCount': 21,
    },
    {
      'chapterId':  146005000,
      'verseCount': 13,
    },
    {
      'chapterId':  146006000,
      'verseCount': 20,
    },
    {
      'chapterId':  146007000,
      'verseCount': 40,
    },
    {
      'chapterId':  146008000,
      'verseCount': 13,
    },
    {
      'chapterId':  146009000,
      'verseCount': 27,
    },
    {
      'chapterId':  146010000,
      'verseCount': 33,
    },
    {
      'chapterId':  146011000,
      'verseCount': 34,
    },
    {
      'chapterId':  146012000,
      'verseCount': 31,
    },
    {
      'chapterId':  146013000,
      'verseCount': 13,
    },
    {
      'chapterId':  146014000,
      'verseCount': 40,
    },
    {
      'chapterId':  146015000,
      'verseCount': 58,
    },
    {
      'chapterId':  146016000,
      'verseCount': 24,
    },
    {
      'chapterId':  147001000,
      'verseCount': 24,
    },
    {
      'chapterId':  147002000,
      'verseCount': 17,
    },
    {
      'chapterId':  147003000,
      'verseCount': 18,
    },
    {
      'chapterId':  147004000,
      'verseCount': 18,
    },
    {
      'chapterId':  147005000,
      'verseCount': 21,
    },
    {
      'chapterId':  147006000,
      'verseCount': 18,
    },
    {
      'chapterId':  147007000,
      'verseCount': 16,
    },
    {
      'chapterId':  147008000,
      'verseCount': 24,
    },
    {
      'chapterId':  147009000,
      'verseCount': 15,
    },
    {
      'chapterId':  147010000,
      'verseCount': 18,
    },
    {
      'chapterId':  147011000,
      'verseCount': 33,
    },
    {
      'chapterId':  147012000,
      'verseCount': 21,
    },
    {
      'chapterId':  147013000,
      'verseCount': 14,
    },
    {
      'chapterId':  148001000,
      'verseCount': 24,
    },
    {
      'chapterId':  148002000,
      'verseCount': 21,
    },
    {
      'chapterId':  148003000,
      'verseCount': 29,
    },
    {
      'chapterId':  148004000,
      'verseCount': 31,
    },
    {
      'chapterId':  148005000,
      'verseCount': 26,
    },
    {
      'chapterId':  148006000,
      'verseCount': 18,
    },
    {
      'chapterId':  149001000,
      'verseCount': 23,
    },
    {
      'chapterId':  149002000,
      'verseCount': 22,
    },
    {
      'chapterId':  149003000,
      'verseCount': 21,
    },
    {
      'chapterId':  149004000,
      'verseCount': 32,
    },
    {
      'chapterId':  149005000,
      'verseCount': 33,
    },
    {
      'chapterId':  149006000,
      'verseCount': 24,
    },
    {
      'chapterId':  150001000,
      'verseCount': 30,
    },
    {
      'chapterId':  150002000,
      'verseCount': 30,
    },
    {
      'chapterId':  150003000,
      'verseCount': 21,
    },
    {
      'chapterId':  150004000,
      'verseCount': 23,
    },
    {
      'chapterId':  151001000,
      'verseCount': 29,
    },
    {
      'chapterId':  151002000,
      'verseCount': 23,
    },
    {
      'chapterId':  151003000,
      'verseCount': 25,
    },
    {
      'chapterId':  151004000,
      'verseCount': 18,
    },
    {
      'chapterId':  152001000,
      'verseCount': 10,
    },
    {
      'chapterId':  152002000,
      'verseCount': 20,
    },
    {
      'chapterId':  152003000,
      'verseCount': 13,
    },
    {
      'chapterId':  152004000,
      'verseCount': 18,
    },
    {
      'chapterId':  152005000,
      'verseCount': 28,
    },
    {
      'chapterId':  153001000,
      'verseCount': 12,
    },
    {
      'chapterId':  153002000,
      'verseCount': 17,
    },
    {
      'chapterId':  153003000,
      'verseCount': 18,
    },
    {
      'chapterId':  154001000,
      'verseCount': 20,
    },
    {
      'chapterId':  154002000,
      'verseCount': 15,
    },
    {
      'chapterId':  154003000,
      'verseCount': 16,
    },
    {
      'chapterId':  154004000,
      'verseCount': 16,
    },
    {
      'chapterId':  154005000,
      'verseCount': 25,
    },
    {
      'chapterId':  154006000,
      'verseCount': 21,
    },
    {
      'chapterId':  155001000,
      'verseCount': 18,
    },
    {
      'chapterId':  155002000,
      'verseCount': 26,
    },
    {
      'chapterId':  155003000,
      'verseCount': 17,
    },
    {
      'chapterId':  155004000,
      'verseCount': 22,
    },
    {
      'chapterId':  156001000,
      'verseCount': 16,
    },
    {
      'chapterId':  156002000,
      'verseCount': 15,
    },
    {
      'chapterId':  156003000,
      'verseCount': 15,
    },
    {
      'chapterId':  157001000,
      'verseCount': 25,
    },
    {
      'chapterId':  158001000,
      'verseCount': 14,
    },
    {
      'chapterId':  158002000,
      'verseCount': 18,
    },
    {
      'chapterId':  158003000,
      'verseCount': 19,
    },
    {
      'chapterId':  158004000,
      'verseCount': 16,
    },
    {
      'chapterId':  158005000,
      'verseCount': 14,
    },
    {
      'chapterId':  158006000,
      'verseCount': 20,
    },
    {
      'chapterId':  158007000,
      'verseCount': 28,
    },
    {
      'chapterId':  158008000,
      'verseCount': 13,
    },
    {
      'chapterId':  158009000,
      'verseCount': 28,
    },
    {
      'chapterId':  158010000,
      'verseCount': 39,
    },
    {
      'chapterId':  158011000,
      'verseCount': 40,
    },
    {
      'chapterId':  158012000,
      'verseCount': 29,
    },
    {
      'chapterId':  158013000,
      'verseCount': 25,
    },
    {
      'chapterId':  159001000,
      'verseCount': 27,
    },
    {
      'chapterId':  159002000,
      'verseCount': 26,
    },
    {
      'chapterId':  159003000,
      'verseCount': 18,
    },
    {
      'chapterId':  159004000,
      'verseCount': 17,
    },
    {
      'chapterId':  159005000,
      'verseCount': 20,
    },
    {
      'chapterId':  160001000,
      'verseCount': 25,
    },
    {
      'chapterId':  160002000,
      'verseCount': 25,
    },
    {
      'chapterId':  160003000,
      'verseCount': 22,
    },
    {
      'chapterId':  160004000,
      'verseCount': 19,
    },
    {
      'chapterId':  160005000,
      'verseCount': 14,
    },
    {
      'chapterId':  161001000,
      'verseCount': 21,
    },
    {
      'chapterId':  161002000,
      'verseCount': 22,
    },
    {
      'chapterId':  161003000,
      'verseCount': 18,
    },
    {
      'chapterId':  162001000,
      'verseCount': 10,
    },
    {
      'chapterId':  162002000,
      'verseCount': 29,
    },
    {
      'chapterId':  162003000,
      'verseCount': 24,
    },
    {
      'chapterId':  162004000,
      'verseCount': 21,
    },
    {
      'chapterId':  162005000,
      'verseCount': 21,
    },
    {
      'chapterId':  163001000,
      'verseCount': 13,
    },
    {
      'chapterId':  164001000,
      'verseCount': 15,
    },
    {
      'chapterId':  165001000,
      'verseCount': 25,
    },
    {
      'chapterId':  166001000,
      'verseCount': 20,
    },
    {
      'chapterId':  166002000,
      'verseCount': 29,
    },
    {
      'chapterId':  166003000,
      'verseCount': 22,
    },
    {
      'chapterId':  166004000,
      'verseCount': 11,
    },
    {
      'chapterId':  166005000,
      'verseCount': 14,
    },
    {
      'chapterId':  166006000,
      'verseCount': 17,
    },
    {
      'chapterId':  166007000,
      'verseCount': 17,
    },
    {
      'chapterId':  166008000,
      'verseCount': 13,
    },
    {
      'chapterId':  166009000,
      'verseCount': 21,
    },
    {
      'chapterId':  166010000,
      'verseCount': 11,
    },
    {
      'chapterId':  166011000,
      'verseCount': 19,
    },
    {
      'chapterId':  166012000,
      'verseCount': 17,
    },
    {
      'chapterId':  166013000,
      'verseCount': 18,
    },
    {
      'chapterId':  166014000,
      'verseCount': 20,
    },
    {
      'chapterId':  166015000,
      'verseCount': 8,
    },
    {
      'chapterId':  166016000,
      'verseCount': 21,
    },
    {
      'chapterId':  166017000,
      'verseCount': 18,
    },
    {
      'chapterId':  166018000,
      'verseCount': 24,
    },
    {
      'chapterId':  166019000,
      'verseCount': 21,
    },
    {
      'chapterId':  166020000,
      'verseCount': 15,
    },
    {
      'chapterId':  166021000,
      'verseCount': 27,
    },
    {
      'chapterId':  166022000,
      'verseCount': 21,
    },
  ];

  const Bible = {};

  Bible.makeVerseId = (book = 0, chapter = 0, verse = 0) => {
    let verseId = 100000000 + book * 1000000 + chapter * 1000 + verse;
    return verseId;
  };

  Bible.parseVerseId = verseId => {
    verseId -= 100000000;
    let book = Math.floor(verseId / 1000000);
    verseId -= book * 1000000;
    let chapter = Math.floor(verseId / 1000);
    verseId -= chapter * 1000;
    let verse = verseId;
    return { book, chapter, verse };
  };

  Bible.getBooks = () => bibleBooks;

  Bible.getChapterVerses = () => chapterVerses;

  Bible.getBookCount = () => Bible.getBooks().length;

  Bible.getBookChapterCount = bookIndex => {
    const targetBook = bibleBooks.find(b => b.bibleOrder === bookIndex);
    if (!targetBook) return 0;
    return targetBook.chapterCount;
  };

  Bible.getChapterVerseCount = (bookIndex, chapterIndex) => {
    const chapterId = Bible.makeVerseId(bookIndex, chapterIndex);
    const result = chapterVerses.find(c => c.chapterId === chapterId);
    return result ? result.verseCount : 0;
  };

  Bible.getBookName = bookIndex => {
    const targetBook = bibleBooks.find(b => b.bibleOrder === bookIndex);
    if (!targetBook) return '';
    return targetBook.name;
  };

  Bible.countRangeVerses = (startVerseId, endVerseId) => {
    const startVerse = Bible.parseVerseId(startVerseId);
    const endVerse = Bible.parseVerseId(endVerseId);
    if (startVerse.chapter === endVerse.chapter) {
      return endVerse.verse - startVerse.verse + 1;
    }
    const { book } = startVerse;
    let verseCount = 0;
    for (let i = startVerse.chapter; i <= endVerse.chapter; i++) {
      const chapterVerses = Bible.getChapterVerseCount(book, i);
      if (i === startVerse.chapter) {
        const unreadVerses = (startVerse.verse - 1);
        verseCount += (chapterVerses - unreadVerses);
      }
      else if (i === endVerse.chapter) {
        verseCount += endVerse.verse;
      }
      else {
        verseCount += chapterVerses;
      }
    }
    return verseCount;
  };

  Bible.getBookVerseCount = bookIndex => {
    const bookChapterCount = Bible.getBookChapterCount(bookIndex);
    let totalVerses = 0;
    for (let c = 1, l = bookChapterCount; c <= l; c++) {
      totalVerses += Bible.getChapterVerseCount(bookIndex, c);
    }
    return totalVerses;
  };

  Bible.getTotalVerseCount = () => {
    const books = Bible.getBooks();
    let totalVerses = 0;
    for (let b = 1, l = books.length; b <= l; b++) {
      totalVerses += Bible.getBookVerseCount(b);
    }
    return totalVerses;
  };

  Bible.compareRanges = (range1, range2) => {
    const startVerse1 = Bible.parseVerseId(range1.startVerseId);
    const startVerse2 = Bible.parseVerseId(range2.startVerseId);
    if (startVerse1.book < startVerse2.book) return -1;
    if (startVerse1.book > startVerse2.book) return 1;
    if (startVerse1.chapter < startVerse2.chapter) return -1;
    if (startVerse1.chapter > startVerse2.chapter) return 1;
    if (startVerse1.verse < startVerse2.verse) return -1;
    if (startVerse1.verse > startVerse2.verse) return 1;
    return 0;
  };

  Bible.checkRangeOverlap = (range1, range2) => {
    // Sort ranges according to bible order
    const [firstRange, secondRange] = [range1, range2].sort(Bible.compareRanges);
    return firstRange.endVerseId >= secondRange.startVerseId;
  };

  Bible.countUniqueRangeVerses = ranges => {
    ranges = ranges.sort(Bible.compareRanges);
    let totalVerses = 0;
    let lastRange = null;
    for (let range of ranges) {
      if (!lastRange) {
        lastRange = range;
      }
      else if (range.startVerseId <= lastRange.endVerseId) {
        if (range.endVerseId > lastRange.endVerseId) {
          lastRange.endVerseId = range.endVerseId;
        }
      }
      else {
        totalVerses += Bible.countRangeVerses(lastRange.startVerseId, lastRange.endVerseId);
        lastRange = range;
      }
    }
    if (lastRange) {
      totalVerses += Bible.countRangeVerses(lastRange.startVerseId, lastRange.endVerseId);
    }
    return totalVerses;
  };

  Bible.countUniqueBookRangeVerses = (bookIndex, ranges) => {
    ranges = ranges.filter(r => Bible.parseVerseId(r.startVerseId).book === bookIndex);
    return Bible.countUniqueRangeVerses(ranges);
  };

  Bible.countUniqueBookChapterRangeVerses = (bookIndex, chapterIndex, ranges) => {
    ranges = ranges
      // Include only ranges that overlap into the given chapter of the given book
      .filter(r => {
        const startVerse = Bible.parseVerseId(r.startVerseId);
        const endVerse = Bible.parseVerseId(r.endVerseId);
        return (
          startVerse.book === bookIndex &&
          startVerse.chapter <= chapterIndex &&
          endVerse.chapter >= chapterIndex
        );
      })
      // Crop out all verses that are beyond the given chapter
      .map(r => {
        const startVerse = Bible.parseVerseId(r.startVerseId);
        const endVerse = Bible.parseVerseId(r.endVerseId);
        if (startVerse.chapter < chapterIndex) {
          startVerse.chapter = chapterIndex;
          startVerse.verse = 1;
        }
        if (endVerse.chapter > chapterIndex) {
          endVerse.chapter = chapterIndex;
          endVerse.verse = Bible.getChapterVerseCount(bookIndex, chapterIndex);
        }
        const startVerseId = Bible.makeVerseId(startVerse.book, startVerse.chapter, startVerse.verse);
        const endVerseId = Bible.makeVerseId(endVerse.book, endVerse.chapter, endVerse.verse);
        return Object.assign(r, { startVerseId, endVerseId });
      });
    return Bible.countUniqueRangeVerses(ranges);
  };

  var bible = Bible;

  class BibleVerse {

    constructor(id) {
      this.id = id;
      id -= 100000000;
      this.bookIndex = Math.round(id / 1000000);
      id -= this.bookIndex * 1000000;
      this.chapterIndex =  Math.round(id / 1000);
      id -= this.chapterIndex * 1000;
      this.verseIndex = id;
    }

    static makeId(book, chapter, verse) {
      let verseId = 100000000;
      verseId += (book * 1000000);
      verseId += (chapter * 1000);
      verseId += verse;
      return verseId;
    }
  }

  var bibleVerse = BibleVerse;

  const exports$1 = {
    Bible: bible,
    BibleVerse: bibleVerse,
  };

  Object.assign(window, exports$1);

  var modules = exports$1;

  exports.default = modules;

  return exports;

}({}));
