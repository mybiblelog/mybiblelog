export type ParsedVerseId = {
  book: number,
  chapter: number,
  verse: number
}

export type VerseId = number;

export type VerseRange = {
  startVerseId: VerseId,
  endVerseId: VerseId,
}

export type Segment = {
  startVerseId: VerseId,
  endVerseId: VerseId,
  read: boolean,
  verseCount: number,
}

export const makeVerseId = (book = 0, chapter = 0, verse = 0): VerseId => {
  const verseId = 100000000 + book * 1000000 + chapter * 1000 + verse;
  return verseId;
};

export const parseVerseId = (verseId: number): ParsedVerseId => {
  verseId -= 100000000;
  const book = Math.floor(verseId / 1000000);
  verseId -= book * 1000000;
  const chapter = Math.floor(verseId / 1000);
  verseId -= chapter * 1000;
  const verse = verseId;
  return { book, chapter, verse };
};
