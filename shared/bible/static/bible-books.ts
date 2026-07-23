export type BibleBook = {
  testamentOrder: number;
  bibleOrder: number;
  newTestament: boolean;
  /** True for deuterocanonical/apocryphal books not in the 66-book Protestant canon. */
  deuterocanonical: boolean;
  /** Display position (1-based) when deuterocanonical books are interleaved,
   * following the NRSVUE full-canon order. Unique across all books; used to sort
   * book lists so DC books slot in between the Protestant books they neighbour. */
  dcBookOrder: number;
  chapterCount: number;
  /** Paratext/USFM-style book code used by YouVersion and Bible.com (e.g. "GEN", "1SA"). */
  usfmCode: string;
  /** Blue Letter Bible URL book code (e.g. "Gen", "1Sa"). */
  blbCode: string;
  locales: {
    [locale: string]: {
      name: string;
      abbreviations: string[];
    };
  };
}

const bibleBooks: BibleBook[] = [
  {
    testamentOrder: 1,
    bibleOrder: 1,
    deuterocanonical: false,
    dcBookOrder: 1,
    newTestament: false,
    chapterCount: 50,
    usfmCode: 'GEN',
    blbCode: 'Gen',
    locales: {
      de: {
        name: 'Genesis',
        abbreviations: [
          'Gen',
          '1. Mose',
        ],
      },
      en: {
        name: 'Genesis',
        abbreviations: [
          'Gen',
          'Ge',
          'Gn',
        ],
      },
      es: {
        name: 'Génesis',
        abbreviations: [
          'Gén',
          'Gn',
        ],
      },
      fr: {
        name: 'Genèse',
        abbreviations: [
          'Gn',
        ],
      },
      pt: {
        name: 'Gênesis',
        abbreviations: [
          'Gn',
          'Gen',
        ],
      },
      ko: {
        name: '창세기',
        abbreviations: [
          '창',
        ],
      },
      uk: {
        name: 'Буття',
        abbreviations: [
          'Бутт.',
          'Бт.',
        ],
      },
    },
  },
  {
    testamentOrder: 2,
    bibleOrder: 2,
    deuterocanonical: false,
    dcBookOrder: 2,
    newTestament: false,
    chapterCount: 40,
    usfmCode: 'EXO',
    blbCode: 'Exo',
    locales: {
      de: {
        name: 'Exodus',
        abbreviations: [
          'Ex',
          '2. Mose',
        ],
      },
      en: {
        name: 'Exodus',
        abbreviations: [
          'Ex',
          'Exod',
        ],
      },
      es: {
        name: 'Éxodo',
        abbreviations: [
          'Éxo',
          'Ex',
        ],
      },
      fr: {
        name: 'Exode',
        abbreviations: [
          'Ex',
        ],
      },
      pt: {
        name: 'Êxodo',
        abbreviations: [
          'Ex',
          'Êx',
        ],
      },
      ko: {
        name: '출애굽기',
        abbreviations: [
          '출',
        ],
      },
      uk: {
        name: 'Вихід',
        abbreviations: [
          'Вих.',
          'Вх.',
        ],
      },
    },
  },
  {
    testamentOrder: 3,
    bibleOrder: 3,
    deuterocanonical: false,
    dcBookOrder: 3,
    newTestament: false,
    chapterCount: 27,
    usfmCode: 'LEV',
    blbCode: 'Lev',
    locales: {
      de: {
        name: 'Levitikus',
        abbreviations: [
          'Lev',
          '3. Mose',
        ],
      },
      en: {
        name: 'Leviticus',
        abbreviations: [
          'Lev',
          'Le',
          'Lv',
        ],
      },
      es: {
        name: 'Levítico',
        abbreviations: [
          'Lev',
          'Lv',
        ],
      },
      fr: {
        name: 'Lévitique',
        abbreviations: [
          'Lv',
        ],
      },
      pt: {
        name: 'Levítico',
        abbreviations: [
          'Lv',
        ],
      },
      ko: {
        name: '레위기',
        abbreviations: [
          '레',
        ],
      },
      uk: {
        name: 'Левит',
        abbreviations: [
          'Лев.',
          'Лв.',
        ],
      },
    },
  },
  {
    testamentOrder: 4,
    bibleOrder: 4,
    deuterocanonical: false,
    dcBookOrder: 4,
    newTestament: false,
    chapterCount: 36,
    usfmCode: 'NUM',
    blbCode: 'Num',
    locales: {
      de: {
        name: 'Numeri',
        abbreviations: [
          'Num',
          '4. Mose',
        ],
      },
      en: {
        name: 'Numbers',
        abbreviations: [
          'Num',
          'Nu',
          'Nm',
          'Nb',
        ],
      },
      es: {
        name: 'Números',
        abbreviations: [
          'Núm',
          'Nm',
        ],
      },
      fr: {
        name: 'Nombres',
        abbreviations: [
          'Nb',
        ],
      },
      pt: {
        name: 'Números',
        abbreviations: [
          'Nm',
          'Núm',
        ],
      },
      ko: {
        name: '민수기',
        abbreviations: [
          '민',
        ],
      },
      uk: {
        name: 'Числа',
        abbreviations: [
          'Чис.',
          'Чс.',
        ],
      },
    },
  },
  {
    testamentOrder: 5,
    bibleOrder: 5,
    deuterocanonical: false,
    dcBookOrder: 5,
    newTestament: false,
    chapterCount: 34,
    usfmCode: 'DEU',
    blbCode: 'Deu',
    locales: {
      de: {
        name: 'Deuteronomium',
        abbreviations: [
          'Dtn',
          '5. Mose',
        ],
      },
      en: {
        name: 'Deuteronomy',
        abbreviations: [
          'Deut',
          'De',
          'Dt',
        ],
      },
      es: {
        name: 'Deuteronomio',
        abbreviations: [
          'Deut',
          'Dt',
        ],
      },
      fr: {
        name: 'Deutéronome',
        abbreviations: [
          'Dt',
        ],
      },
      pt: {
        name: 'Deuteronômio',
        abbreviations: [
          'Dt',
          'Deut',
        ],
      },
      ko: {
        name: '신명기',
        abbreviations: [
          '신',
        ],
      },
      uk: {
        name: 'Повторення Закону',
        abbreviations: [
          'Повт. Зак.',
          'Пвт. Зк.',
        ],
      },
    },
  },
  {
    testamentOrder: 6,
    bibleOrder: 6,
    deuterocanonical: false,
    dcBookOrder: 6,
    newTestament: false,
    chapterCount: 24,
    usfmCode: 'JOS',
    blbCode: 'Jos',
    locales: {
      de: {
        name: 'Josua',
        abbreviations: [
          'Jos',
          'Josua',
        ],
      },
      en: {
        name: 'Joshua',
        abbreviations: [
          'Josh',
          'Jos',
          'Jsh',
        ],
      },
      es: {
        name: 'Josué',
        abbreviations: [
          'Jos',
          'Jos',
        ],
      },
      fr: {
        name: 'Josué',
        abbreviations: [
          'Js',
        ],
      },
      pt: {
        name: 'Josué',
        abbreviations: [
          'Js',
          'Jos',
        ],
      },
      ko: {
        name: '여호수아',
        abbreviations: [
          '수',
        ],
      },
      uk: {
        name: 'Єгова',
        abbreviations: [
          'Єг.',
          'Єгов.',
        ],
      },
    },
  },
  {
    testamentOrder: 7,
    bibleOrder: 7,
    deuterocanonical: false,
    dcBookOrder: 7,
    newTestament: false,
    chapterCount: 21,
    usfmCode: 'JDG',
    blbCode: 'Jdg',
    locales: {
      de: {
        name: 'Richter',
        abbreviations: [
          'Ri',
          'Richter',
        ],
      },
      en: {
        name: 'Judges',
        abbreviations: [
          'Judg',
          'Jdg',
          'Jg',
          'Jdgs',
        ],
      },
      es: {
        name: 'Jueces',
        abbreviations: [
          'Jue',
          'Jue',
        ],
      },
      fr: {
        name: 'Juges',
        abbreviations: [
          'Jg',
        ],
      },
      pt: {
        name: 'Juízes',
        abbreviations: [
          'Jz',
          'Juíz',
        ],
      },
      ko: {
        name: '사사기',
        abbreviations: [
          '삿',
        ],
      },
      uk: {
        name: 'Суддів',
        abbreviations: [
          'Суд.',
          'Сд.',
        ],
      },
    },
  },
  {
    testamentOrder: 8,
    bibleOrder: 8,
    deuterocanonical: false,
    dcBookOrder: 8,
    newTestament: false,
    chapterCount: 4,
    usfmCode: 'RUT',
    blbCode: 'Rth',
    locales: {
      de: {
        name: 'Ruth',
        abbreviations: [
          'Rut',
          'Ruth',
        ],
      },
      en: {
        name: 'Ruth',
        abbreviations: [
          'Ruth',
          'Rth',
          'Ru',
        ],
      },
      es: {
        name: 'Rut',
        abbreviations: [
          'Rut',
          'Rt',
        ],
      },
      fr: {
        name: 'Ruth',
        abbreviations: [
          'Rt',
        ],
      },
      pt: {
        name: 'Rute',
        abbreviations: [
          'Rt',
        ],
      },
      ko: {
        name: '룻기',
        abbreviations: [
          '룻',
        ],
      },
      uk: {
        name: 'Рут',
        abbreviations: [
          'Рт.',
        ],
      },
    },
  },
  {
    testamentOrder: 9,
    bibleOrder: 9,
    deuterocanonical: false,
    dcBookOrder: 9,
    newTestament: false,
    chapterCount: 31,
    usfmCode: '1SA',
    blbCode: '1Sa',
    locales: {
      de: {
        name: '1. Samuel',
        abbreviations: [
          '1. Sam',
          '1. Samuel',
        ],
      },
      en: {
        name: '1 Samuel',
        abbreviations: [
          '1 Sam',
          '1 Sm',
          '1 Sa',
          '1 S',
        ],
      },
      es: {
        name: '1 Samuel',
        abbreviations: [
          '1 Sam',
          '1 S',
        ],
      },
      fr: {
        name: '1 Samuel',
        abbreviations: [
          '1 S',
        ],
      },
      pt: {
        name: '1 Samuel',
        abbreviations: [
          '1Sm',
          '1Sam',
          '1Samuel',
        ],
      },
      ko: {
        name: '사무엘상',
        abbreviations: [
          '삼상',
        ],
      },
      uk: {
        name: '1 Самуїл',
        abbreviations: [
          '1 Сам.',
          '1 См.',
        ],
      },
    },
  },
  {
    testamentOrder: 10,
    bibleOrder: 10,
    deuterocanonical: false,
    dcBookOrder: 10,
    newTestament: false,
    chapterCount: 24,
    usfmCode: '2SA',
    blbCode: '2Sa',
    locales: {
      de: {
        name: '2. Samuel',
        abbreviations: [
          '2. Sam',
          '2. Samuel',
        ],
      },
      en: {
        name: '2 Samuel',
        abbreviations: [
          '2 Sam',
          '2 Sm',
          '2 Sa',
          '2 S',
        ],
      },
      es: {
        name: '2 Samuel',
        abbreviations: [
          '2 Sam',
          '2 S',
        ],
      },
      fr: {
        name: '2 Samuel',
        abbreviations: [
          '2 S',
        ],
      },
      pt: {
        name: '2 Samuel',
        abbreviations: [
          '2Sm',
          '2Sam',
          '2Samuel',
        ],
      },
      ko: {
        name: '사무엘하',
        abbreviations: [
          '삼하',
        ],
      },
      uk: {
        name: '2 Самуїл',
        abbreviations: [
          '2 Сам.',
          '2 См.',
        ],
      },
    },
  },
  {
    testamentOrder: 11,
    bibleOrder: 11,
    deuterocanonical: false,
    dcBookOrder: 11,
    newTestament: false,
    chapterCount: 22,
    usfmCode: '1KI',
    blbCode: '1Ki',
    locales: {
      de: {
        name: '1. Könige',
        abbreviations: [
          '1. Kön',
          '1. Könige',
        ],
      },
      en: {
        name: '1 Kings',
        abbreviations: [
          '1 Kings',
          '1 Kgs',
          '1 Kin',
          '1 Ki',
        ],
      },
      es: {
        name: '1 Reyes',
        abbreviations: [
          '1 Rey',
          '1 R',
        ],
      },
      fr: {
        name: '1 Rois',
        abbreviations: [
          '1 R',
        ],
      },
      pt: {
        name: '1 Reis',
        abbreviations: [
          '1Rs',
          '1Reis',
        ],
      },
      ko: {
        name: '열왕기상',
        abbreviations: [
          '왕상',
        ],
      },
      uk: {
        name: '1 Царів',
        abbreviations: [
          '1 Цар.',
          '1 Цр.',
        ],
      },
    },
  },
  {
    testamentOrder: 12,
    bibleOrder: 12,
    deuterocanonical: false,
    dcBookOrder: 12,
    newTestament: false,
    chapterCount: 25,
    usfmCode: '2KI',
    blbCode: '2Ki',
    locales: {
      de: {
        name: '2. Könige',
        abbreviations: [
          '2. Kön',
          '2. Könige',
        ],
      },
      en: {
        name: '2 Kings',
        abbreviations: [
          '2 Kings',
          '2 Kgs',
          '2 Kin',
          '2 Ki',
        ],
      },
      es: {
        name: '2 Reyes',
        abbreviations: [
          '2 Rey',
          '2 R',
        ],
      },
      fr: {
        name: '2 Rois',
        abbreviations: [
          '2 R',
        ],
      },
      pt: {
        name: '2 Reis',
        abbreviations: [
          '2Rs',
          '2Reis',
        ],
      },
      ko: {
        name: '열왕기하',
        abbreviations: [
          '왕하',
        ],
      },
      uk: {
        name: '2 Царів',
        abbreviations: [
          '2 Цар.',
          '2 Цр.',
        ],
      },
    },
  },
  {
    testamentOrder: 13,
    bibleOrder: 13,
    deuterocanonical: false,
    dcBookOrder: 13,
    newTestament: false,
    chapterCount: 29,
    usfmCode: '1CH',
    blbCode: '1Ch',
    locales: {
      de: {
        name: '1. Chronik',
        abbreviations: [
          '1. Chr',
          '1. Chronik',
        ],
      },
      en: {
        name: '1 Chronicles',
        abbreviations: [
          '1 Chr',
          '1 Chr',
          '1 Ch',
        ],
      },
      es: {
        name: '1 Crónicas',
        abbreviations: [
          '1 Crón',
          '1 Cr',
        ],
      },
      fr: {
        name: '1 Chroniques',
        abbreviations: [
          '1 Ch',
        ],
      },
      pt: {
        name: '1 Crônicas',
        abbreviations: [
          '1Cr',
          '1Crônicas',
        ],
      },
      ko: {
        name: '역대상',
        abbreviations: [
          '대상',
        ],
      },
      uk: {
        name: '1 Паралипоменон',
        abbreviations: [
          '1 Пар.',
          '1 Парал.',
        ],
      },
    },
  },
  {
    testamentOrder: 14,
    bibleOrder: 14,
    deuterocanonical: false,
    dcBookOrder: 14,
    newTestament: false,
    chapterCount: 36,
    usfmCode: '2CH',
    blbCode: '2Ch',
    locales: {
      de: {
        name: '2. Chronik',
        abbreviations: [
          '2. Chr',
          '2. Chronik',
        ],
      },
      en: {
        name: '2 Chronicles',
        abbreviations: [
          '2 Chr',
          '2 Ch',
          '2 Chron',
        ],
      },
      es: {
        name: '2 Crónicas',
        abbreviations: [
          '2 Crón',
          '2 Cr',
        ],
      },
      fr: {
        name: '2 Chroniques',
        abbreviations: [
          '2 Ch',
        ],
      },
      pt: {
        name: '2 Crônicas',
        abbreviations: [
          '2Cr',
          '2Crônicas',
        ],
      },
      ko: {
        name: '역대하',
        abbreviations: [
          '대하',
        ],
      },
      uk: {
        name: '2 Паралипоменон',
        abbreviations: [
          '2 Пар.',
          '2 Парал.',
        ],
      },
    },
  },
  {
    testamentOrder: 15,
    bibleOrder: 15,
    deuterocanonical: false,
    dcBookOrder: 15,
    newTestament: false,
    chapterCount: 10,
    usfmCode: 'EZR',
    blbCode: 'Ezr',
    locales: {
      de: {
        name: 'Esra',
        abbreviations: [
          'Esr',
          'Esra',
        ],
      },
      en: {
        name: 'Ezra',
        abbreviations: [
          'Ezra',
          'Ezr',
        ],
      },
      es: {
        name: 'Esdras',
        abbreviations: [
          'Esd',
          'Ezr',
        ],
      },
      fr: {
        name: 'Esdras',
        abbreviations: [
          'Esd',
        ],
      },
      pt: {
        name: 'Esdras',
        abbreviations: [
          'Ed',
        ],
      },
      ko: {
        name: '에스라',
        abbreviations: [
          '스',
        ],
      },
      uk: {
        name: 'Езра',
        abbreviations: [
          'Езр.',
        ],
      },
    },
  },
  {
    testamentOrder: 16,
    bibleOrder: 16,
    deuterocanonical: false,
    dcBookOrder: 16,
    newTestament: false,
    chapterCount: 13,
    usfmCode: 'NEH',
    blbCode: 'Neh',
    locales: {
      de: {
        name: 'Nehemia',
        abbreviations: [
          'Neh',
          'Nehemia',
        ],
      },
      en: {
        name: 'Nehemiah',
        abbreviations: [
          'Neh',
          'Ne',
        ],
      },
      es: {
        name: 'Nehemías',
        abbreviations: [
          'Neh',
          'Ne',
        ],
      },
      fr: {
        name: 'Néhémie',
        abbreviations: [
          'Ne',
        ],
      },
      pt: {
        name: 'Neemias',
        abbreviations: [
          'Ne',
          'Neem',
        ],
      },
      ko: {
        name: '느헤미야',
        abbreviations: [
          '느',
        ],
      },
      uk: {
        name: 'Неемія',
        abbreviations: [
          'Неєм.',
          'Неїм.',
        ],
      },
    },
  },
  {
    testamentOrder: 17,
    bibleOrder: 17,
    deuterocanonical: false,
    dcBookOrder: 19,
    newTestament: false,
    chapterCount: 10,
    usfmCode: 'EST',
    blbCode: 'Est',
    locales: {
      de: {
        name: 'Esther',
        abbreviations: [
          'Est',
          'Esther',
        ],
      },
      en: {
        name: 'Esther',
        abbreviations: [
          'Esth 1',
          'Est',
          'Es',
        ],
      },
      es: {
        name: 'Ester',
        abbreviations: [
          'Est',
          'Es',
        ],
      },
      fr: {
        name: 'Esther',
        abbreviations: [
          'Est',
        ],
      },
      pt: {
        name: 'Ester',
        abbreviations: [
          'Et',
        ],
      },
      ko: {
        name: '에스더',
        abbreviations: [
          '에',
        ],
      },
      uk: {
        name: 'Есфір',
        abbreviations: [
          'Есф.',
          'Ес.',
        ],
      },
    },
  },
  {
    testamentOrder: 18,
    bibleOrder: 18,
    deuterocanonical: false,
    dcBookOrder: 22,
    newTestament: false,
    chapterCount: 42,
    usfmCode: 'JOB',
    blbCode: 'Job',
    locales: {
      de: {
        name: 'Hiob',
        abbreviations: [
          'Hi',
          'Hiob',
        ],
      },
      en: {
        name: 'Job',
        abbreviations: [
          'Job',
          'Jb',
        ],
      },
      es: {
        name: 'Job',
        abbreviations: [
          'Job',
          'Jb',
        ],
      },
      fr: {
        name: 'Job',
        abbreviations: [
          'Jb',
        ],
      },
      pt: {
        name: 'Jó',
        abbreviations: [
          'Jó',
        ],
      },
      ko: {
        name: '욥기',
        abbreviations: [
          '욥',
        ],
      },
      uk: {
        name: 'Йов',
        abbreviations: [
          'Йв.',
        ],
      },
    },
  },
  {
    testamentOrder: 19,
    bibleOrder: 19,
    deuterocanonical: false,
    dcBookOrder: 23,
    newTestament: false,
    chapterCount: 150,
    usfmCode: 'PSA',
    blbCode: 'Psa',
    locales: {
      de: {
        name: 'Psalm',
        abbreviations: [
          'Ps',
          'Psalm',
        ],
      },
      en: {
        name: 'Psalms',
        abbreviations: [
          'Ps',
          'Psalm',
          'Pslm',
          'Psa',
          'Psm',
        ],
      },
      es: {
        name: 'Salmos',
        abbreviations: [
          'Sal',
          'Ps',
        ],
      },
      fr: {
        name: 'Psaumes',
        abbreviations: [
          'Ps',
        ],
      },
      pt: {
        name: 'Salmos',
        abbreviations: [
          'Sl',
          'Sal',
        ],
      },
      ko: {
        name: '시편',
        abbreviations: [
          '시',
        ],
      },
      uk: {
        name: 'Псалми',
        abbreviations: [
          'Псал.',
          'Пс.',
        ],
      },
    },
  },
  {
    testamentOrder: 20,
    bibleOrder: 20,
    deuterocanonical: false,
    dcBookOrder: 24,
    newTestament: false,
    chapterCount: 31,
    usfmCode: 'PRO',
    blbCode: 'Pro',
    locales: {
      de: {
        name: 'Sprüche',
        abbreviations: [
          'Spr',
          'Sprüche',
        ],
      },
      en: {
        name: 'Proverbs',
        abbreviations: [
          'Prov',
          'Pro',
          'Prv',
          'Pr',
        ],
      },
      es: {
        name: 'Proverbios',
        abbreviations: [
          'Prov',
          'Pr',
        ],
      },
      fr: {
        name: 'Proverbes',
        abbreviations: [
          'Pr',
        ],
      },
      pt: {
        name: 'Provérbios',
        abbreviations: [
          'Pv',
          'Prov',
        ],
      },
      ko: {
        name: '잠언',
        abbreviations: [
          '잠',
        ],
      },
      uk: {
        name: 'Приповісті',
        abbreviations: [
          'Притчі',
          'Прит.',
        ],
      },
    },
  },
  {
    testamentOrder: 21,
    bibleOrder: 21,
    deuterocanonical: false,
    dcBookOrder: 25,
    newTestament: false,
    chapterCount: 12,
    usfmCode: 'ECC',
    blbCode: 'Ecc',
    locales: {
      de: {
        name: 'Prediger',
        abbreviations: [
          'Pred',
          'Prediger',
        ],
      },
      en: {
        name: 'Ecclesiastes',
        abbreviations: [
          'Ecc1',
          'Eccles',
          'Eccle',
          'Ecc',
          'Ec',
        ],
      },
      es: {
        name: 'Eclesiastés',
        abbreviations: [
          'Ecl',
          'Ec',
        ],
      },
      fr: {
        name: 'Ecclésiaste',
        abbreviations: [
          'Ec',
          'Qo',
          'Qohélet',
        ],
      },
      pt: {
        name: 'Eclesiastes',
        abbreviations: [
          'Ec',
        ],
      },
      ko: {
        name: '전도서',
        abbreviations: [
          '전',
        ],
      },
      uk: {
        name: 'Екклезіяст',
        abbreviations: [
          'Еккл.',
          'Ек.',
        ],
      },
    },
  },
  {
    testamentOrder: 22,
    bibleOrder: 22,
    deuterocanonical: false,
    dcBookOrder: 26,
    newTestament: false,
    chapterCount: 8,
    usfmCode: 'SNG',
    blbCode: 'Sng',
    locales: {
      de: {
        name: 'Hohelied',
        abbreviations: [
          'Hoh',
          'Hohelied',
        ],
      },
      en: {
        name: 'Song of Songs',
        abbreviations: [
          'Song',
          'Song of Solomon',
        ],
      },
      es: {
        name: 'Cantar de los Cantares',
        abbreviations: [
          'Cant',
          'Sg',
        ],
      },
      fr: {
        name: 'Cantique des cantiques',
        abbreviations: [
          'Ct',
        ],
      },
      pt: {
        name: 'Cântico dos Cânticos',
        abbreviations: [
          'Ct',
        ],
      },
      ko: {
        name: '아가',
        abbreviations: [
          '아',
        ],
      },
      uk: {
        name: 'Пісня над Піснями',
        abbreviations: [
          'Пісн.',
          'ПнП.',
        ],
      },
    },
  },
  {
    testamentOrder: 23,
    bibleOrder: 23,
    deuterocanonical: false,
    dcBookOrder: 29,
    newTestament: false,
    chapterCount: 66,
    usfmCode: 'ISA',
    blbCode: 'Isa',
    locales: {
      de: {
        name: 'Jesaja',
        abbreviations: [
          'Jes',
          'Jesaja',
        ],
      },
      en: {
        name: 'Isaiah',
        abbreviations: [
          'Isa',
          'Is',
        ],
      },
      es: {
        name: 'Isaías',
        abbreviations: [
          'Isa',
          'Is',
        ],
      },
      fr: {
        name: 'Isaïe',
        abbreviations: [
          'Is',
        ],
      },
      pt: {
        name: 'Isaías',
        abbreviations: [
          'Is',
        ],
      },
      ko: {
        name: '이사야',
        abbreviations: [
          '사',
        ],
      },
      uk: {
        name: 'Ісая',
        abbreviations: [
          'Іс.',
          'Ісаї.',
        ],
      },
    },
  },
  {
    testamentOrder: 24,
    bibleOrder: 24,
    deuterocanonical: false,
    dcBookOrder: 30,
    newTestament: false,
    chapterCount: 52,
    usfmCode: 'JER',
    blbCode: 'Jer',
    locales: {
      de: {
        name: 'Jeremia',
        abbreviations: [
          'Jer',
          'Jeremia',
        ],
      },
      en: {
        name: 'Jeremiah',
        abbreviations: [
          'Jer',
          'Je',
          'Jr',
        ],
      },
      es: {
        name: 'Jeremías',
        abbreviations: [
          'Jer',
          'Jr',
        ],
      },
      fr: {
        name: 'Jérémie',
        abbreviations: [
          'Jr',
        ],
      },
      pt: {
        name: 'Jeremias',
        abbreviations: [
          'Jr',
          'Jer',
        ],
      },
      ko: {
        name: '예레미야',
        abbreviations: [
          '렘',
        ],
      },
      uk: {
        name: 'Єремія',
        abbreviations: [
          'Єр.',
          'Єрем.',
        ],
      },
    },
  },
  {
    testamentOrder: 25,
    bibleOrder: 25,
    deuterocanonical: false,
    dcBookOrder: 31,
    newTestament: false,
    chapterCount: 5,
    usfmCode: 'LAM',
    blbCode: 'Lam',
    locales: {
      de: {
        name: 'Klagelieder',
        abbreviations: [
          'Klgl',
          'Klagelieder',
        ],
      },
      en: {
        name: 'Lamentations',
        abbreviations: [
          'Lam',
          'La',
        ],
      },
      es: {
        name: 'Lamentaciones',
        abbreviations: [
          'Lam',
          'La',
        ],
      },
      fr: {
        name: 'Lamentations',
        abbreviations: [
          'Lm',
        ],
      },
      pt: {
        name: 'Lamentações',
        abbreviations: [
          'Lm',
          'Lam',
        ],
      },
      ko: {
        name: '예레미야애가',
        abbreviations: [
          '렘애',
        ],
      },
      uk: {
        name: 'Плач Єремії',
        abbreviations: [
          'Пл. Єр.',
          'Плч.',
        ],
      },
    },
  },
  {
    testamentOrder: 26,
    bibleOrder: 26,
    deuterocanonical: false,
    dcBookOrder: 33,
    newTestament: false,
    chapterCount: 48,
    usfmCode: 'EZK',
    blbCode: 'Eze',
    locales: {
      de: {
        name: 'Hesekiel',
        abbreviations: [
          'Hes',
          'Hesekiel',
        ],
      },
      en: {
        name: 'Ezekiel',
        abbreviations: [
          'Ezek',
          'Eze',
          'Ezk',
        ],
      },
      es: {
        name: 'Ezequiel',
        abbreviations: [
          'Eze',
          'Ez',
        ],
      },
      fr: {
        name: 'Ézéchiel',
        abbreviations: [
          'Ez',
        ],
      },
      pt: {
        name: 'Ezequiel',
        abbreviations: [
          'Ez',
          'Ezeq',
        ],
      },
      ko: {
        name: '에스겔',
        abbreviations: [
          '겔',
        ],
      },
      uk: {
        name: 'Єзекіїль',
        abbreviations: [
          'Єз.',
          'Єзк.',
        ],
      },
    },
  },
  {
    testamentOrder: 27,
    bibleOrder: 27,
    deuterocanonical: false,
    dcBookOrder: 34,
    newTestament: false,
    chapterCount: 12,
    usfmCode: 'DAN',
    blbCode: 'Dan',
    locales: {
      de: {
        name: 'Daniel',
        abbreviations: [
          'Dan',
          'Daniel',
        ],
      },
      en: {
        name: 'Daniel',
        abbreviations: [
          'Dan',
          'Da',
          'Dn',
        ],
      },
      es: {
        name: 'Daniel',
        abbreviations: [
          'Dan',
          'Dn',
        ],
      },
      fr: {
        name: 'Daniel',
        abbreviations: [
          'Dn',
        ],
      },
      pt: {
        name: 'Daniel',
        abbreviations: [
          'Dn',
          'Dan',
        ],
      },
      ko: {
        name: '다니엘',
        abbreviations: [
          '단',
        ],
      },
      uk: {
        name: 'Даниїл',
        abbreviations: [
          'Дан.',
          'Днл.',
        ],
      },
    },
  },
  {
    testamentOrder: 28,
    bibleOrder: 28,
    deuterocanonical: false,
    dcBookOrder: 35,
    newTestament: false,
    chapterCount: 14,
    usfmCode: 'HOS',
    blbCode: 'Hos',
    locales: {
      de: {
        name: 'Hosea',
        abbreviations: [
          'Hos',
          'Hosea',
        ],
      },
      en: {
        name: 'Hosea',
        abbreviations: [
          'Hos',
          'Ho',
        ],
      },
      es: {
        name: 'Oseas',
        abbreviations: [
          'Os',
          'Ho',
        ],
      },
      fr: {
        name: 'Osée',
        abbreviations: [
          'Os',
        ],
      },
      pt: {
        name: 'Oséias',
        abbreviations: [
          'Os',
          'Ose',
        ],
      },
      ko: {
        name: '호세아',
        abbreviations: [
          '호',
        ],
      },
      uk: {
        name: 'Осія',
        abbreviations: [
          'Ос.',
          'Осі.',
        ],
      },
    },
  },
  {
    testamentOrder: 29,
    bibleOrder: 29,
    deuterocanonical: false,
    dcBookOrder: 36,
    newTestament: false,
    chapterCount: 3,
    usfmCode: 'JOL',
    blbCode: 'Joe',
    locales: {
      de: {
        name: 'Joel',
        abbreviations: [
          'Joe',
          'Joel',
        ],
      },
      en: {
        name: 'Joel',
        abbreviations: [
          'Joel',
          'Jl',
        ],
      },
      es: {
        name: 'Joel',
        abbreviations: [
          'Joel',
          'Jl',
        ],
      },
      fr: {
        name: 'Joël',
        abbreviations: [
          'Jl',
        ],
      },
      pt: {
        name: 'Joel',
        abbreviations: [
          'Jl',
        ],
      },
      ko: {
        name: '요엘',
        abbreviations: [
          '욜',
        ],
      },
      uk: {
        name: 'Йоїл',
        abbreviations: [
          'Йл.',
        ],
      },
    },
  },
  {
    testamentOrder: 30,
    bibleOrder: 30,
    deuterocanonical: false,
    dcBookOrder: 37,
    newTestament: false,
    chapterCount: 9,
    usfmCode: 'AMO',
    blbCode: 'Amo',
    locales: {
      de: {
        name: 'Amos',
        abbreviations: [
          'Am',
          'Amos',
        ],
      },
      en: {
        name: 'Amos',
        abbreviations: [
          'Am',
        ],
      },
      es: {
        name: 'Amós',
        abbreviations: [
          'Am',
          'Am',
        ],
      },
      fr: {
        name: 'Amos',
        abbreviations: [
          'Am',
        ],
      },
      pt: {
        name: 'Amós',
        abbreviations: [
          'Am',
        ],
      },
      ko: {
        name: '아모스',
        abbreviations: [
          '암',
        ],
      },
      uk: {
        name: 'Амос',
        abbreviations: [
          'Ам.',
        ],
      },
    },
  },
  {
    testamentOrder: 31,
    bibleOrder: 31,
    deuterocanonical: false,
    dcBookOrder: 38,
    newTestament: false,
    chapterCount: 1,
    usfmCode: 'OBA',
    blbCode: 'Oba',
    locales: {
      de: {
        name: 'Obadja',
        abbreviations: [
          'Ob',
          'Obadja',
        ],
      },
      en: {
        name: 'Obadiah',
        abbreviations: [
          'Obad',
        ],
      },
      es: {
        name: 'Abdías',
        abbreviations: [
          'Abd',
          'Ob',
        ],
      },
      fr: {
        name: 'Abdias',
        abbreviations: [
          'Abd',
        ],
      },
      pt: {
        name: 'Obadias',
        abbreviations: [
          'Ob',
          'Obd',
        ],
      },
      ko: {
        name: '오바댜',
        abbreviations: [
          '옵',
        ],
      },
      uk: {
        name: 'Овдій',
        abbreviations: [
          'Овд.',
        ],
      },
    },
  },
  {
    testamentOrder: 32,
    bibleOrder: 32,
    deuterocanonical: false,
    dcBookOrder: 39,
    newTestament: false,
    chapterCount: 4,
    usfmCode: 'JON',
    blbCode: 'Jon',
    locales: {
      de: {
        name: 'Jona',
        abbreviations: [
          'Jon',
          'Jona',
        ],
      },
      en: {
        name: 'Jonah',
        abbreviations: [
          'Jon',
          'Jnh',
        ],
      },
      es: {
        name: 'Jonás',
        abbreviations: [
          'Jon',
          'Jnh',
        ],
      },
      fr: {
        name: 'Jonas',
        abbreviations: [
          'Jon',
        ],
      },
      pt: {
        name: 'Jonas',
        abbreviations: [
          'Jn',
        ],
      },
      ko: {
        name: '요나',
        abbreviations: [
          '욘',
        ],
      },
      uk: {
        name: 'Йона',
        abbreviations: [
          'Йн.',
        ],
      },
    },
  },
  {
    testamentOrder: 33,
    bibleOrder: 33,
    deuterocanonical: false,
    dcBookOrder: 40,
    newTestament: false,
    chapterCount: 7,
    usfmCode: 'MIC',
    blbCode: 'Mic',
    locales: {
      de: {
        name: 'Micha',
        abbreviations: [
          'Mi',
          'Micha',
        ],
      },
      en: {
        name: 'Micah',
        abbreviations: [
          'Mic',
          'Mc',
        ],
      },
      es: {
        name: 'Miqueas',
        abbreviations: [
          'Miq',
          'Mic',
        ],
      },
      fr: {
        name: 'Michée',
        abbreviations: [
          'Mi',
        ],
      },
      pt: {
        name: 'Miquéias',
        abbreviations: [
          'Mq',
          'Miq',
        ],
      },
      ko: {
        name: '미가',
        abbreviations: [
          '미',
        ],
      },
      uk: {
        name: 'Михей',
        abbreviations: [
          'Мих.',
          'Мх.',
        ],
      },
    },
  },
  {
    testamentOrder: 34,
    bibleOrder: 34,
    deuterocanonical: false,
    dcBookOrder: 41,
    newTestament: false,
    chapterCount: 3,
    usfmCode: 'NAM',
    blbCode: 'Nah',
    locales: {
      de: {
        name: 'Nahum',
        abbreviations: [
          'Na',
          'Nahum',
        ],
      },
      en: {
        name: 'Nahum',
        abbreviations: [
          'Nah',
          'Na',
        ],
      },
      es: {
        name: 'Nahúm',
        abbreviations: [
          'Nah',
          'Na',
        ],
      },
      fr: {
        name: 'Nahum',
        abbreviations: [
          'Na',
        ],
      },
      pt: {
        name: 'Naum',
        abbreviations: [
          'Na',
          'Nm',
        ],
      },
      ko: {
        name: '나훔',
        abbreviations: [
          '나',
        ],
      },
      uk: {
        name: 'Наум',
        abbreviations: [
          'Наум',
          'Нм.',
        ],
      },
    },
  },
  {
    testamentOrder: 35,
    bibleOrder: 35,
    deuterocanonical: false,
    dcBookOrder: 42,
    newTestament: false,
    chapterCount: 3,
    usfmCode: 'HAB',
    blbCode: 'Hab',
    locales: {
      de: {
        name: 'Habakuk',
        abbreviations: [
          'Hab',
          'Habakuk',
        ],
      },
      en: {
        name: 'Habakkuk',
        abbreviations: [
          'Hab',
          'Hb',
        ],
      },
      es: {
        name: 'Habacuc',
        abbreviations: [
          'Hab',
          'Hb',
        ],
      },
      fr: {
        name: 'Habacuc',
        abbreviations: [
          'Ha',
        ],
      },
      pt: {
        name: 'Habacuque',
        abbreviations: [
          'Hc',
          'Hab',
        ],
      },
      ko: {
        name: '하박국',
        abbreviations: [
          '합',
        ],
      },
      uk: {
        name: 'Авакум',
        abbreviations: [
          'Авк.',
          'Авак.',
        ],
      },
    },
  },
  {
    testamentOrder: 36,
    bibleOrder: 36,
    deuterocanonical: false,
    dcBookOrder: 43,
    newTestament: false,
    chapterCount: 3,
    usfmCode: 'ZEP',
    blbCode: 'Zep',
    locales: {
      de: {
        name: 'Zephanja',
        abbreviations: [
          'Zep',
          'Zephanja',
        ],
      },
      en: {
        name: 'Zephaniah',
        abbreviations: [
          'Zeph',
          'Zep',
          'Zp',
        ],
      },
      es: {
        name: 'Sofonías',
        abbreviations: [
          'Sof',
          'Zep',
        ],
      },
      fr: {
        name: 'Sophonie',
        abbreviations: [
          'So',
        ],
      },
      pt: {
        name: 'Sofonias',
        abbreviations: [
          'Sf',
          'Sof',
        ],
      },
      ko: {
        name: '스바냐',
        abbreviations: [
          '습',
        ],
      },
      uk: {
        name: 'Софонія',
        abbreviations: [
          'Соф.',
          'Сф.',
        ],
      },
    },
  },
  {
    testamentOrder: 37,
    bibleOrder: 37,
    deuterocanonical: false,
    dcBookOrder: 44,
    newTestament: false,
    chapterCount: 2,
    usfmCode: 'HAG',
    blbCode: 'Hag',
    locales: {
      de: {
        name: 'Haggai',
        abbreviations: [
          'Hag',
          'Haggai',
        ],
      },
      en: {
        name: 'Haggai',
        abbreviations: [
          'Hag',
          'Hg',
        ],
      },
      es: {
        name: 'Hageo',
        abbreviations: [
          'Hag',
          'Hg',
        ],
      },
      fr: {
        name: 'Aggée',
        abbreviations: [
          'Ag',
        ],
      },
      pt: {
        name: 'Ageu',
        abbreviations: [
          'Ag',
        ],
      },
      ko: {
        name: '학개',
        abbreviations: [
          '학',
        ],
      },
      uk: {
        name: 'Аггей',
        abbreviations: [
          'Агг.',
          'Аг.',
        ],
      },
    },
  },
  {
    testamentOrder: 38,
    bibleOrder: 38,
    deuterocanonical: false,
    dcBookOrder: 45,
    newTestament: false,
    chapterCount: 14,
    usfmCode: 'ZEC',
    blbCode: 'Zec',
    locales: {
      de: {
        name: 'Sacharja',
        abbreviations: [
          'Sach',
          'Sacharja',
        ],
      },
      en: {
        name: 'Zechariah',
        abbreviations: [
          'Zech',
          'Zec',
          'Zc',
        ],
      },
      es: {
        name: 'Zacarías',
        abbreviations: [
          'Zac',
          'Zec',
        ],
      },
      fr: {
        name: 'Zacharie',
        abbreviations: [
          'Za',
        ],
      },
      pt: {
        name: 'Zacarias',
        abbreviations: [
          'Zc',
          'Zac',
        ],
      },
      ko: {
        name: '스가랴',
        abbreviations: [
          '슥',
        ],
      },
      uk: {
        name: 'Захарія',
        abbreviations: [
          'Зах.',
          'Зх.',
        ],
      },
    },
  },
  {
    testamentOrder: 39,
    bibleOrder: 39,
    deuterocanonical: false,
    dcBookOrder: 46,
    newTestament: false,
    chapterCount: 4,
    usfmCode: 'MAL',
    blbCode: 'Mal',
    locales: {
      de: {
        name: 'Maleachi',
        abbreviations: [
          'Mal',
          'Maleachi',
        ],
      },
      en: {
        name: 'Malachi',
        abbreviations: [
          'Mal',
          'Ml',
        ],
      },
      es: {
        name: 'Malaquías',
        abbreviations: [
          'Mal',
          'Mal',
        ],
      },
      fr: {
        name: 'Malachie',
        abbreviations: [
          'Ml',
        ],
      },
      pt: {
        name: 'Malaquias',
        abbreviations: [
          'Ml',
          'Mal',
        ],
      },
      ko: {
        name: '말라기',
        abbreviations: [
          '말',
        ],
      },
      uk: {
        name: 'Малахій',
        abbreviations: [
          'Мал.',
          'Мх.',
        ],
      },
    },
  },
  {
    testamentOrder: 1,
    bibleOrder: 40,
    deuterocanonical: false,
    dcBookOrder: 47,
    newTestament: true,
    chapterCount: 28,
    usfmCode: 'MAT',
    blbCode: 'Mat',
    locales: {
      de: {
        name: 'Matthäus',
        abbreviations: [
          'Mt',
          'Matth',
        ],
      },
      en: {
        name: 'Matthew',
        abbreviations: [
          'Mt',
          'Matt',
        ],
      },
      es: {
        name: 'Mateo',
        abbreviations: [
          'Mat',
          'Mt',
        ],
      },
      fr: {
        name: 'Matthieu',
        abbreviations: [
          'Mt',
        ],
      },
      pt: {
        name: 'Mateus',
        abbreviations: [
          'Mt',
        ],
      },
      ko: {
        name: '마태복음',
        abbreviations: [
          '마',
        ],
      },
      uk: {
        name: 'Матвій',
        abbreviations: [
          'Мат.',
          'Мт.',
        ],
      },
    },
  },
  {
    testamentOrder: 2,
    bibleOrder: 41,
    deuterocanonical: false,
    dcBookOrder: 48,
    newTestament: true,
    chapterCount: 16,
    usfmCode: 'MRK',
    blbCode: 'Mar',
    locales: {
      de: {
        name: 'Markus',
        abbreviations: [
          'Mk',
          'Mark',
        ],
      },
      en: {
        name: 'Mark',
        abbreviations: [
          'Mk',
          'Mrk',
        ],
      },
      es: {
        name: 'Marcos',
        abbreviations: [
          'Mar',
          'Mk',
        ],
      },
      fr: {
        name: 'Marc',
        abbreviations: [
          'Mc',
        ],
      },
      pt: {
        name: 'Marcos',
        abbreviations: [
          'Mc',
          'Mr',
        ],
      },
      ko: {
        name: '마가복음',
        abbreviations: [
          '막',
        ],
      },
      uk: {
        name: 'Марк',
        abbreviations: [
          'Мрк.',
        ],
      },
    },
  },
  {
    testamentOrder: 3,
    bibleOrder: 42,
    deuterocanonical: false,
    dcBookOrder: 49,
    newTestament: true,
    chapterCount: 24,
    usfmCode: 'LUK',
    blbCode: 'Luk',
    locales: {
      de: {
        name: 'Lukas',
        abbreviations: [
          'Lk',
          'Luk',
        ],
      },
      en: {
        name: 'Luke',
        abbreviations: [
          'Lk',
          'Luk',
        ],
      },
      es: {
        name: 'Lucas',
        abbreviations: [
          'Luc',
          'Lk',
        ],
      },
      fr: {
        name: 'Luc',
        abbreviations: [
          'Lc',
        ],
      },
      pt: {
        name: 'Lucas',
        abbreviations: [
          'Lc',
          'Lc',
        ],
      },
      ko: {
        name: '누가복음',
        abbreviations: [
          '눅',
        ],
      },
      uk: {
        name: 'Лука',
        abbreviations: [
          'Лк.',
        ],
      },
    },
  },
  {
    testamentOrder: 4,
    bibleOrder: 43,
    deuterocanonical: false,
    dcBookOrder: 50,
    newTestament: true,
    chapterCount: 21,
    usfmCode: 'JHN',
    blbCode: 'Jhn',
    locales: {
      de: {
        name: 'Johannes',
        abbreviations: [
          'Joh',
          'Jh',
        ],
      },
      en: {
        name: 'John',
        abbreviations: [
          'Jn',
          'Jhn',
        ],
      },
      es: {
        name: 'Juan',
        abbreviations: [
          'Jn',
        ],
      },
      fr: {
        name: 'Jean',
        abbreviations: [
          'Jn',
        ],
      },
      pt: {
        name: 'João',
        abbreviations: [
          'Jo',
          'João',
        ],
      },
      ko: {
        name: '요한복음',
        abbreviations: [
          '요',
        ],
      },
      uk: {
        name: 'Іван',
        abbreviations: [
          'Ів.',
          'Ін.',
        ],
      },
    },
  },
  {
    testamentOrder: 5,
    bibleOrder: 44,
    deuterocanonical: false,
    dcBookOrder: 51,
    newTestament: true,
    chapterCount: 28,
    usfmCode: 'ACT',
    blbCode: 'Act',
    locales: {
      de: {
        name: 'Apostelgeschichte',
        abbreviations: [
          'Apg',
          'Apgesch',
        ],
      },
      en: {
        name: 'Acts',
        abbreviations: [],
      },
      es: {
        name: 'Hechos',
        abbreviations: [
          'Hch',
          'Ac',
        ],
      },
      fr: {
        name: 'Actes',
        abbreviations: [
          'Ac',
        ],
      },
      pt: {
        name: 'Atos',
        abbreviations: [
          'At',
        ],
      },
      ko: {
        name: '사도행전',
        abbreviations: [
          '행',
        ],
      },
      uk: {
        name: 'Дії апостолів',
        abbreviations: [
          'Дії',
          'Дії ап.',
        ],
      },
    },
  },
  {
    testamentOrder: 6,
    bibleOrder: 45,
    deuterocanonical: false,
    dcBookOrder: 52,
    newTestament: true,
    chapterCount: 16,
    usfmCode: 'ROM',
    blbCode: 'Rom',
    locales: {
      de: {
        name: 'Römer',
        abbreviations: [
          'Röm',
          'Römer',
        ],
      },
      en: {
        name: 'Romans',
        abbreviations: [
          'Rom',
          'Ro',
          'Rm',
        ],
      },
      es: {
        name: 'Romanos',
        abbreviations: [
          'Rom',
          'Ro',
        ],
      },
      fr: {
        name: 'Romains',
        abbreviations: [
          'Rm',
        ],
      },
      pt: {
        name: 'Romanos',
        abbreviations: [
          'Rm',
          'Rom',
        ],
      },
      ko: {
        name: '로마서',
        abbreviations: [
          '롬',
        ],
      },
      uk: {
        name: 'Римляни',
        abbreviations: [
          'Рим.',
          'Рм.',
        ],
      },
    },
  },
  {
    testamentOrder: 7,
    bibleOrder: 46,
    deuterocanonical: false,
    dcBookOrder: 53,
    newTestament: true,
    chapterCount: 16,
    usfmCode: '1CO',
    blbCode: '1Co',
    locales: {
      de: {
        name: '1. Korinther',
        abbreviations: [
          '1. Kor',
          '1. Korinther',
        ],
      },
      en: {
        name: '1 Corinthians',
        abbreviations: [
          '1 Cor',
          '1 Co',
        ],
      },
      es: {
        name: '1 Corintios',
        abbreviations: [
          '1 Cor',
          '1 Co',
        ],
      },
      fr: {
        name: '1 Corinthiens',
        abbreviations: [
          '1 Co',
        ],
      },
      pt: {
        name: '1 Coríntios',
        abbreviations: [
          '1Co',
          '1Cor',
        ],
      },
      ko: {
        name: '고린도전서',
        abbreviations: [
          '고전',
        ],
      },
      uk: {
        name: '1 Коринтяни',
        abbreviations: [
          '1 Кор.',
          '1 Кр.',
        ],
      },
    },
  },
  {
    testamentOrder: 8,
    bibleOrder: 47,
    deuterocanonical: false,
    dcBookOrder: 54,
    newTestament: true,
    chapterCount: 13,
    usfmCode: '2CO',
    blbCode: '2Co',
    locales: {
      de: {
        name: '2. Korinther',
        abbreviations: [
          '2. Kor',
          '2. Korinther',
        ],
      },
      en: {
        name: '2 Corinthians',
        abbreviations: [
          '2 Cor',
          '2 Co',
        ],
      },
      es: {
        name: '2 Corintios',
        abbreviations: [
          '2 Cor',
          '2 Co',
        ],
      },
      fr: {
        name: '2 Corinthiens',
        abbreviations: [
          '2 Co',
        ],
      },
      pt: {
        name: '2 Coríntios',
        abbreviations: [
          '2Co',
          '2Cor',
        ],
      },
      ko: {
        name: '고린도후서',
        abbreviations: [
          '고후',
        ],
      },
      uk: {
        name: '2 Коринтяни',
        abbreviations: [
          '2 Кор.',
          '2 Кр.',
        ],
      },
    },
  },
  {
    testamentOrder: 9,
    bibleOrder: 48,
    deuterocanonical: false,
    dcBookOrder: 55,
    newTestament: true,
    chapterCount: 6,
    usfmCode: 'GAL',
    blbCode: 'Gal',
    locales: {
      de: {
        name: 'Galater',
        abbreviations: [
          'Gal',
          'Galater',
        ],
      },
      en: {
        name: 'Galatians',
        abbreviations: [
          'Gal',
          'Ga',
        ],
      },
      es: {
        name: 'Gálatas',
        abbreviations: [
          'Gál',
          'Ga',
        ],
      },
      fr: {
        name: 'Galates',
        abbreviations: [
          'Ga',
        ],
      },
      pt: {
        name: 'Gálatas',
        abbreviations: [
          'Gl',
          'Gál',
        ],
      },
      ko: {
        name: '갈라디아서',
        abbreviations: [
          '갈',
        ],
      },
      uk: {
        name: 'Галати',
        abbreviations: [
          'Гал.',
          'Гл.',
        ],
      },
    },
  },
  {
    testamentOrder: 10,
    bibleOrder: 49,
    deuterocanonical: false,
    dcBookOrder: 56,
    newTestament: true,
    chapterCount: 6,
    usfmCode: 'EPH',
    blbCode: 'Eph',
    locales: {
      de: {
        name: 'Epheser',
        abbreviations: [
          'Eph',
          'Epheser',
        ],
      },
      en: {
        name: 'Ephesians',
        abbreviations: [
          'Eph',
          'Ephes',
        ],
      },
      es: {
        name: 'Efesios',
        abbreviations: [
          'Ef',
          'Eph',
        ],
      },
      fr: {
        name: 'Éphésiens',
        abbreviations: [
          'Ep',
        ],
      },
      pt: {
        name: 'Efésios',
        abbreviations: [
          'Ef',
        ],
      },
      ko: {
        name: '에베소서',
        abbreviations: [
          '엡',
        ],
      },
      uk: {
        name: 'Ефесяни',
        abbreviations: [
          'Еф.',
          'Ефс.',
        ],
      },
    },
  },
  {
    testamentOrder: 11,
    bibleOrder: 50,
    deuterocanonical: false,
    dcBookOrder: 57,
    newTestament: true,
    chapterCount: 4,
    usfmCode: 'PHP',
    blbCode: 'Phl',
    locales: {
      de: {
        name: 'Philipper',
        abbreviations: [
          'Phil',
          'Philipp',
        ],
      },
      en: {
        name: 'Philippians',
        abbreviations: [
          'Phil',
          'Php',
          'Pp',
        ],
      },
      es: {
        name: 'Filipenses',
        abbreviations: [
          'Fil',
          'Php',
        ],
      },
      fr: {
        name: 'Philippiens',
        abbreviations: [
          'Ph',
        ],
      },
      pt: {
        name: 'Filipenses',
        abbreviations: [
          'Fp',
          'Fil',
        ],
      },
      ko: {
        name: '빌립보서',
        abbreviations: [
          '빌',
        ],
      },
      uk: {
        name: "Филип'яни",
        abbreviations: [
          'Філ.',
          'Фп.',
        ],
      },
    },
  },
  {
    testamentOrder: 12,
    bibleOrder: 51,
    deuterocanonical: false,
    dcBookOrder: 58,
    newTestament: true,
    chapterCount: 4,
    usfmCode: 'COL',
    blbCode: 'Col',
    locales: {
      de: {
        name: 'Kolosser',
        abbreviations: [
          'Kol',
          'Kolosser',
        ],
      },
      en: {
        name: 'Colossians',
        abbreviations: [
          'Col',
        ],
      },
      es: {
        name: 'Colosenses',
        abbreviations: [
          'Col',
          'Col',
        ],
      },
      fr: {
        name: 'Colossiens',
        abbreviations: [
          'Col',
        ],
      },
      pt: {
        name: 'Colossenses',
        abbreviations: [
          'Cl',
          'Col',
        ],
      },
      ko: {
        name: '골로새서',
        abbreviations: [
          '골',
        ],
      },
      uk: {
        name: 'Колосяни',
        abbreviations: [
          'Кол.',
          'Кл.',
        ],
      },
    },
  },
  {
    testamentOrder: 13,
    bibleOrder: 52,
    deuterocanonical: false,
    dcBookOrder: 59,
    newTestament: true,
    chapterCount: 5,
    usfmCode: '1TH',
    blbCode: '1Th',
    locales: {
      de: {
        name: '1. Thessalonicher',
        abbreviations: [
          '1. Thess',
          '1. Thessalonicher',
        ],
      },
      en: {
        name: '1 Thessalonians',
        abbreviations: [
          '1 Thess',
          '1 Thes',
          '1 Th',
        ],
      },
      es: {
        name: '1 Tesalonicenses',
        abbreviations: [
          '1 Tes',
          '1 Th',
        ],
      },
      fr: {
        name: '1 Thessaloniciens',
        abbreviations: [
          '1 Th',
        ],
      },
      pt: {
        name: '1 Tessalonicenses',
        abbreviations: [
          '1Ts',
          '1Tes',
        ],
      },
      ko: {
        name: '데살로니가전서',
        abbreviations: [
          '살전',
        ],
      },
      uk: {
        name: '1 Солуняни',
        abbreviations: [
          '1 Сол.',
          '1 Слн.',
        ],
      },
    },
  },
  {
    testamentOrder: 14,
    bibleOrder: 53,
    deuterocanonical: false,
    dcBookOrder: 60,
    newTestament: true,
    chapterCount: 3,
    usfmCode: '2TH',
    blbCode: '2Th',
    locales: {
      de: {
        name: '2. Thessalonicher',
        abbreviations: [
          '2. Thess',
          '2. Thessalonicher',
        ],
      },
      en: {
        name: '2 Thessalonians',
        abbreviations: [
          '2 Thess',
          '2 Thes',
          '2 Th',
        ],
      },
      es: {
        name: '2 Tesalonicenses',
        abbreviations: [
          '2 Tes',
          '2 Th',
        ],
      },
      fr: {
        name: '2 Thessaloniciens',
        abbreviations: [
          '2 Th',
        ],
      },
      pt: {
        name: '2 Tessalonicenses',
        abbreviations: [
          '2Ts',
          '2Tes',
        ],
      },
      ko: {
        name: '데살로니가후서',
        abbreviations: [
          '살후',
        ],
      },
      uk: {
        name: '2 Солуняни',
        abbreviations: [
          '2 Сол.',
          '2 Слн.',
        ],
      },
    },
  },
  {
    testamentOrder: 15,
    bibleOrder: 54,
    deuterocanonical: false,
    dcBookOrder: 61,
    newTestament: true,
    chapterCount: 6,
    usfmCode: '1TI',
    blbCode: '1Ti',
    locales: {
      de: {
        name: '1. Timotheus',
        abbreviations: [
          '1. Tim',
          '1. Timotheus',
        ],
      },
      en: {
        name: '1 Timothy',
        abbreviations: [
          '1 Tim',
          '1 Ti',
        ],
      },
      es: {
        name: '1 Timoteo',
        abbreviations: [
          '1 Tim',
          '1 Ti',
        ],
      },
      fr: {
        name: '1 Timothée',
        abbreviations: [
          '1 Tm',
        ],
      },
      pt: {
        name: '1 Timóteo',
        abbreviations: [
          '1Tm',
          '1Tm',
        ],
      },
      ko: {
        name: '디모데전서',
        abbreviations: [
          '딤전',
        ],
      },
      uk: {
        name: '1 Тимофію',
        abbreviations: [
          '1 Тим.',
          '1 Тм.',
        ],
      },
    },
  },
  {
    testamentOrder: 16,
    bibleOrder: 55,
    deuterocanonical: false,
    dcBookOrder: 62,
    newTestament: true,
    chapterCount: 4,
    usfmCode: '2TI',
    blbCode: '2Ti',
    locales: {
      de: {
        name: '2. Timotheus',
        abbreviations: [
          '2. Tim',
          '2. Timotheus',
        ],
      },
      en: {
        name: '2 Timothy',
        abbreviations: [
          '2 Tim',
          '2 Ti',
        ],
      },
      es: {
        name: '2 Timoteo',
        abbreviations: [
          '2 Tim',
          '2 Ti',
        ],
      },
      fr: {
        name: '2 Timothée',
        abbreviations: [
          '2 Tm',
        ],
      },
      pt: {
        name: '2 Timóteo',
        abbreviations: [
          '2Tm',
          '2Tm',
        ],
      },
      ko: {
        name: '디모데후서',
        abbreviations: [
          '딤후',
        ],
      },
      uk: {
        name: '2 Тимофію',
        abbreviations: [
          '2 Тим.',
          '2 Тм.',
        ],
      },
    },
  },
  {
    testamentOrder: 17,
    bibleOrder: 56,
    deuterocanonical: false,
    dcBookOrder: 63,
    newTestament: true,
    chapterCount: 3,
    usfmCode: 'TIT',
    blbCode: 'Tit',
    locales: {
      de: {
        name: 'Titus',
        abbreviations: [
          'Tit',
          'Titus',
        ],
      },
      en: {
        name: 'Titus',
        abbreviations: [
          'Tit',
          'Ti',
        ],
      },
      es: {
        name: 'Tito',
        abbreviations: [
          'Tit',
          'Tt',
        ],
      },
      fr: {
        name: 'Tite',
        abbreviations: [
          'Tt',
        ],
      },
      pt: {
        name: 'Tito',
        abbreviations: [
          'Tt',
        ],
      },
      ko: {
        name: '디도서',
        abbreviations: [
          '딛',
        ],
      },
      uk: {
        name: 'Титу',
        abbreviations: [
          'Тит.',
          'Тт.',
        ],
      },
    },
  },
  {
    testamentOrder: 18,
    bibleOrder: 57,
    deuterocanonical: false,
    dcBookOrder: 64,
    newTestament: true,
    chapterCount: 1,
    usfmCode: 'PHM',
    blbCode: 'Phm',
    locales: {
      de: {
        name: 'Philemon',
        abbreviations: [
          'Phlm',
          'Philem',
        ],
      },
      en: {
        name: 'Philemon',
        abbreviations: [
          'Philem',
          'Phlm',
          'Phm',
          'Pm',
        ],
      },
      es: {
        name: 'Filemón',
        abbreviations: [
          'Fil',
          'Phm',
        ],
      },
      fr: {
        name: 'Philémon',
        abbreviations: [
          'Phm',
        ],
      },
      pt: {
        name: 'Filemom',
        abbreviations: [
          'Fm',
        ],
      },
      ko: {
        name: '빌레몬서',
        abbreviations: [
          '몬',
        ],
      },
      uk: {
        name: 'Филимона',
        abbreviations: [
          'Филим.',
          'Флм.',
        ],
      },
    },
  },
  {
    testamentOrder: 19,
    bibleOrder: 58,
    deuterocanonical: false,
    dcBookOrder: 65,
    newTestament: true,
    chapterCount: 13,
    usfmCode: 'HEB',
    blbCode: 'Heb',
    locales: {
      de: {
        name: 'Hebräer',
        abbreviations: [
          'Hebr',
          'Hebräer',
        ],
      },
      en: {
        name: 'Hebrews',
        abbreviations: [
          'Heb',
        ],
      },
      es: {
        name: 'Hebreos',
        abbreviations: [
          'Heb',
          'Heb',
        ],
      },
      fr: {
        name: 'Hébreux',
        abbreviations: [
          'He',
        ],
      },
      pt: {
        name: 'Hebreus',
        abbreviations: [
          'Hb',
        ],
      },
      ko: {
        name: '히브리서',
        abbreviations: [
          '히',
        ],
      },
      uk: {
        name: 'Євреїв',
        abbreviations: [
          'Євр.',
          'Євр.',
        ],
      },
    },
  },
  {
    testamentOrder: 20,
    bibleOrder: 59,
    deuterocanonical: false,
    dcBookOrder: 66,
    newTestament: true,
    chapterCount: 5,
    usfmCode: 'JAS',
    blbCode: 'Jas',
    locales: {
      de: {
        name: 'Jakobus',
        abbreviations: [
          'Jak',
          'Jakob',
        ],
      },
      en: {
        name: 'James',
        abbreviations: [
          'Jas',
          'Jm',
        ],
      },
      es: {
        name: 'Santiago',
        abbreviations: [
          'Stg',
          'Jas',
        ],
      },
      fr: {
        name: 'Jacques',
        abbreviations: [
          'Jc',
        ],
      },
      pt: {
        name: 'Tiago',
        abbreviations: [
          'Tg',
          'Tia',
        ],
      },
      ko: {
        name: '야고보서',
        abbreviations: [
          '약',
        ],
      },
      uk: {
        name: 'Якова',
        abbreviations: [
          'Як.',
          'Іак.',
        ],
      },
    },
  },
  {
    testamentOrder: 21,
    bibleOrder: 60,
    deuterocanonical: false,
    dcBookOrder: 67,
    newTestament: true,
    chapterCount: 5,
    usfmCode: '1PE',
    blbCode: '1Pe',
    locales: {
      de: {
        name: '1. Petrus',
        abbreviations: [
          '1. Petr',
          '1. Petrus',
        ],
      },
      en: {
        name: '1 Peter',
        abbreviations: [
          '1 Pet',
          '1 Pe',
          '1 Pt',
          '1 P',
        ],
      },
      es: {
        name: '1 Pedro',
        abbreviations: [
          '1 Ped',
          '1 Pe',
        ],
      },
      fr: {
        name: '1 Pierre',
        abbreviations: [
          '1 P',
        ],
      },
      pt: {
        name: '1 Pedro',
        abbreviations: [
          '1Pe',
          '1Pedro',
        ],
      },
      ko: {
        name: '베드로전서',
        abbreviations: [
          '벧전',
        ],
      },
      uk: {
        name: '1 Петра',
        abbreviations: [
          '1 Пет.',
          '1 Пт.',
        ],
      },
    },
  },
  {
    testamentOrder: 22,
    bibleOrder: 61,
    deuterocanonical: false,
    dcBookOrder: 68,
    newTestament: true,
    chapterCount: 3,
    usfmCode: '2PE',
    blbCode: '2Pe',
    locales: {
      de: {
        name: '2. Petrus',
        abbreviations: [
          '2. Petr',
          '2. Petrus',
        ],
      },
      en: {
        name: '2 Peter',
        abbreviations: [
          '2 Pet',
          '2 Pe',
          '2 Pt',
          '2 P',
        ],
      },
      es: {
        name: '2 Pedro',
        abbreviations: [
          '2 Ped',
          '2 Pe',
        ],
      },
      fr: {
        name: '2 Pierre',
        abbreviations: [
          '2 P',
        ],
      },
      pt: {
        name: '2 Pedro',
        abbreviations: [
          '2Pe',
          '2Pedro',
        ],
      },
      ko: {
        name: '베드로후서',
        abbreviations: [
          '벧후',
        ],
      },
      uk: {
        name: '2 Петра',
        abbreviations: [
          '2 Пет.',
          '2 Пт.',
        ],
      },
    },
  },
  {
    testamentOrder: 23,
    bibleOrder: 62,
    deuterocanonical: false,
    dcBookOrder: 69,
    newTestament: true,
    chapterCount: 5,
    usfmCode: '1JN',
    blbCode: '1Jo',
    locales: {
      de: {
        name: '1. Johannes',
        abbreviations: [
          '1. Joh',
          '1. Johannes',
        ],
      },
      en: {
        name: '1 John',
        abbreviations: [
          '1 Jn',
          '1 Jhn',
          '1 J',
        ],
      },
      es: {
        name: '1 Juan',
        abbreviations: [
          '1 Juan',
          '1 Jn',
        ],
      },
      fr: {
        name: '1 Jean',
        abbreviations: [
          '1 Jn',
        ],
      },
      pt: {
        name: '1 João',
        abbreviations: [
          '1Jo',
          '1João',
        ],
      },
      ko: {
        name: '요한일서',
        abbreviations: [
          '요일',
        ],
      },
      uk: {
        name: '1 Івана',
        abbreviations: [
          '1 Ів.',
          '1 Ін.',
        ],
      },
    },
  },
  {
    testamentOrder: 24,
    bibleOrder: 63,
    deuterocanonical: false,
    dcBookOrder: 70,
    newTestament: true,
    chapterCount: 1,
    usfmCode: '2JN',
    blbCode: '2Jo',
    locales: {
      de: {
        name: '2. Johannes',
        abbreviations: [
          '2. Joh',
          '2. Johannes',
        ],
      },
      en: {
        name: '2 John',
        abbreviations: [
          '2 Jn',
          '2 Jhn',
          '2 J',
        ],
      },
      es: {
        name: '2 Juan',
        abbreviations: [
          '2 Juan',
          '2 Jn',
        ],
      },
      fr: {
        name: '2 Jean',
        abbreviations: [
          '2 Jn',
        ],
      },
      pt: {
        name: '2 João',
        abbreviations: [
          '2Jo',
          '2João',
        ],
      },
      ko: {
        name: '요한이서',
        abbreviations: [
          '요이',
        ],
      },
      uk: {
        name: '2 Івана',
        abbreviations: [
          '2 Ів.',
          '2 Ін.',
        ],
      },
    },
  },
  {
    testamentOrder: 25,
    bibleOrder: 64,
    deuterocanonical: false,
    dcBookOrder: 71,
    newTestament: true,
    chapterCount: 1,
    usfmCode: '3JN',
    blbCode: '3Jo',
    locales: {
      de: {
        name: '3. Johannes',
        abbreviations: [
          '3. Joh',
          '3. Johannes',
        ],
      },
      en: {
        name: '3 John',
        abbreviations: [
          '3 Jn',
          '3 Jhn',
          '3 J',
        ],
      },
      es: {
        name: '3 Juan',
        abbreviations: [
          '3 Juan',
          '3 Jn',
        ],
      },
      fr: {
        name: '3 Jean',
        abbreviations: [
          '3 Jn',
        ],
      },
      pt: {
        name: '3 João',
        abbreviations: [
          '3Jo',
          '3João',
        ],
      },
      ko: {
        name: '요한삼서',
        abbreviations: [
          '요삼',
        ],
      },
      uk: {
        name: '3 Івана',
        abbreviations: [
          '3 Ів.',
          '3 Ін.',
        ],
      },
    },
  },
  {
    testamentOrder: 26,
    bibleOrder: 65,
    deuterocanonical: false,
    dcBookOrder: 72,
    newTestament: true,
    chapterCount: 1,
    usfmCode: 'JUD',
    blbCode: 'Jde',
    locales: {
      de: {
        name: 'Judas',
        abbreviations: [
          'Jud',
          'Judas',
        ],
      },
      en: {
        name: 'Jude',
        abbreviations: [
          'Jude',
          'Jud',
          'Jd',
        ],
      },
      es: {
        name: 'Judas',
        abbreviations: [
          'Jud',
          'Jude',
        ],
      },
      fr: {
        name: 'Jude',
        abbreviations: [
          'Jd',
        ],
      },
      pt: {
        name: 'Judas',
        abbreviations: [
          'Jd',
        ],
      },
      ko: {
        name: '유다서',
        abbreviations: [
          '유',
        ],
      },
      uk: {
        name: 'Юда',
        abbreviations: [
          'Юд.',
        ],
      },
    },
  },
  {
    testamentOrder: 27,
    bibleOrder: 66,
    deuterocanonical: false,
    dcBookOrder: 73,
    newTestament: true,
    chapterCount: 22,
    usfmCode: 'REV',
    blbCode: 'Rev',
    locales: {
      de: {
        name: 'Offenbarung',
        abbreviations: [
          'Offb',
          'Offenb',
        ],
      },
      en: {
        name: 'Revelation',
        abbreviations: [
          'Rev',
        ],
      },
      es: {
        name: 'Apocalipsis',
        abbreviations: [
          'Ap',
          'Rev',
        ],
      },
      fr: {
        name: 'Apocalypse',
        abbreviations: [
          'Ap',
          'Apoc',
        ],
      },
      pt: {
        name: 'Apocalipse',
        abbreviations: [
          'Ap',
          'Apoc',
        ],
      },
      ko: {
        name: '요한계시록',
        abbreviations: [
          '계',
        ],
      },
      uk: {
        name: "Об'явлення",
        abbreviations: [
          "Об'яв.",
          'Об.',
        ],
      },
    },
  },
  {
    testamentOrder: 17,
    bibleOrder: 67,
    newTestament: false,
    deuterocanonical: true,
    dcBookOrder: 17,
    chapterCount: 14,
    usfmCode: 'TOB',
    blbCode: 'Tob',
    locales: {
      de: {
        name: 'Tobit',
        abbreviations: [
          'Tob',
        ],
      },
      en: {
        name: 'Tobit',
        abbreviations: [
          'Tob',
          'Tb',
        ],
      },
      es: {
        name: 'Tobías',
        abbreviations: [
          'Tob',
          'Tb',
        ],
      },
      fr: {
        name: 'Tobie',
        abbreviations: [
          'Tb',
        ],
      },
      pt: {
        name: 'Tobias',
        abbreviations: [
          'Tb',
        ],
      },
      ko: {
        name: '토빗기',
        abbreviations: [
          '토빗',
        ],
      },
      uk: {
        name: 'Товит',
        abbreviations: [
          'Тов.',
        ],
      },
    },
  },
  {
    testamentOrder: 18,
    bibleOrder: 68,
    newTestament: false,
    deuterocanonical: true,
    dcBookOrder: 18,
    chapterCount: 16,
    usfmCode: 'JDT',
    blbCode: 'Jdt',
    locales: {
      de: {
        name: 'Judit',
        abbreviations: [
          'Jdt',
        ],
      },
      en: {
        name: 'Judith',
        abbreviations: [
          'Jdt',
          'Jth',
        ],
      },
      es: {
        name: 'Judit',
        abbreviations: [
          'Jdt',
        ],
      },
      fr: {
        name: 'Judith',
        abbreviations: [
          'Jdt',
        ],
      },
      pt: {
        name: 'Judite',
        abbreviations: [
          'Jt',
        ],
      },
      ko: {
        name: '유딧기',
        abbreviations: [
          '유딧',
        ],
      },
      uk: {
        name: 'Юдита',
        abbreviations: [
          'Юдт.',
        ],
      },
    },
  },
  {
    testamentOrder: 20,
    bibleOrder: 69,
    newTestament: false,
    deuterocanonical: true,
    dcBookOrder: 20,
    chapterCount: 16,
    usfmCode: '1MA',
    blbCode: '1Ma',
    locales: {
      de: {
        name: '1. Makkabäer',
        abbreviations: [
          '1. Makk',
        ],
      },
      en: {
        name: '1 Maccabees',
        abbreviations: [
          '1 Macc',
          '1 Mac',
          '1 Ma',
        ],
      },
      es: {
        name: '1 Macabeos',
        abbreviations: [
          '1 Mac',
        ],
      },
      fr: {
        name: '1 Maccabées',
        abbreviations: [
          '1 M',
        ],
      },
      pt: {
        name: '1 Macabeus',
        abbreviations: [
          '1 Mac',
        ],
      },
      ko: {
        name: '마카베오상',
        abbreviations: [
          '1마카',
        ],
      },
      uk: {
        name: '1 Маккавеїв',
        abbreviations: [
          '1 Мак.',
        ],
      },
    },
  },
  {
    testamentOrder: 21,
    bibleOrder: 70,
    newTestament: false,
    deuterocanonical: true,
    dcBookOrder: 21,
    chapterCount: 15,
    usfmCode: '2MA',
    blbCode: '2Ma',
    locales: {
      de: {
        name: '2. Makkabäer',
        abbreviations: [
          '2. Makk',
        ],
      },
      en: {
        name: '2 Maccabees',
        abbreviations: [
          '2 Macc',
          '2 Mac',
          '2 Ma',
        ],
      },
      es: {
        name: '2 Macabeos',
        abbreviations: [
          '2 Mac',
        ],
      },
      fr: {
        name: '2 Maccabées',
        abbreviations: [
          '2 M',
        ],
      },
      pt: {
        name: '2 Macabeus',
        abbreviations: [
          '2 Mac',
        ],
      },
      ko: {
        name: '마카베오하',
        abbreviations: [
          '2마카',
        ],
      },
      uk: {
        name: '2 Маккавеїв',
        abbreviations: [
          '2 Мак.',
        ],
      },
    },
  },
  {
    testamentOrder: 27,
    bibleOrder: 71,
    newTestament: false,
    deuterocanonical: true,
    dcBookOrder: 27,
    chapterCount: 19,
    usfmCode: 'WIS',
    blbCode: 'Wis',
    locales: {
      de: {
        name: 'Weisheit',
        abbreviations: [
          'Weish',
        ],
      },
      en: {
        name: 'Wisdom',
        abbreviations: [
          'Wis',
          'Wisd of Sol',
        ],
      },
      es: {
        name: 'Sabiduría',
        abbreviations: [
          'Sab',
        ],
      },
      fr: {
        name: 'Sagesse',
        abbreviations: [
          'Sg',
        ],
      },
      pt: {
        name: 'Sabedoria',
        abbreviations: [
          'Sb',
        ],
      },
      ko: {
        name: '지혜서',
        abbreviations: [
          '지혜',
        ],
      },
      uk: {
        name: 'Премудрість Соломона',
        abbreviations: [
          'Прем.',
        ],
      },
    },
  },
  {
    testamentOrder: 28,
    bibleOrder: 72,
    newTestament: false,
    deuterocanonical: true,
    dcBookOrder: 28,
    chapterCount: 51,
    usfmCode: 'SIR',
    blbCode: 'Sir',
    locales: {
      de: {
        name: 'Jesus Sirach',
        abbreviations: [
          'Sir',
        ],
      },
      en: {
        name: 'Sirach',
        abbreviations: [
          'Sir',
          'Ecclus',
        ],
      },
      es: {
        name: 'Eclesiástico',
        abbreviations: [
          'Eclo',
          'Sir',
        ],
      },
      fr: {
        name: 'Siracide',
        abbreviations: [
          'Si',
        ],
      },
      pt: {
        name: 'Eclesiástico',
        abbreviations: [
          'Eclo',
          'Sir',
        ],
      },
      ko: {
        name: '집회서',
        abbreviations: [
          '집회',
        ],
      },
      uk: {
        name: 'Сирах',
        abbreviations: [
          'Сир.',
        ],
      },
    },
  },
  {
    testamentOrder: 32,
    bibleOrder: 73,
    newTestament: false,
    deuterocanonical: true,
    dcBookOrder: 32,
    chapterCount: 6,
    usfmCode: 'BAR',
    blbCode: 'Bar',
    locales: {
      de: {
        name: 'Baruch',
        abbreviations: [
          'Bar',
        ],
      },
      en: {
        name: 'Baruch',
        abbreviations: [
          'Bar',
        ],
      },
      es: {
        name: 'Baruc',
        abbreviations: [
          'Bar',
        ],
      },
      fr: {
        name: 'Baruch',
        abbreviations: [
          'Ba',
        ],
      },
      pt: {
        name: 'Baruque',
        abbreviations: [
          'Br',
        ],
      },
      ko: {
        name: '바룩서',
        abbreviations: [
          '바룩',
        ],
      },
      uk: {
        name: 'Варух',
        abbreviations: [
          'Вар.',
        ],
      },
    },
  },
];

export default bibleBooks;
