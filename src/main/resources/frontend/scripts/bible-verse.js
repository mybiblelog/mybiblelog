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

module.exports = BibleVerse;
