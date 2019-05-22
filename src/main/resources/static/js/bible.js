(Bible => {
	
	Bible.makeVerseId = (book, chapter, verse) => {
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

	Bible.countBookChapters = bookIndex => {
		return fetch('/countBookChapters?bookIndex=' + bookIndex)
			.then(response => response.json());
	};

	Bible.countChapterVerses = (bookIndex, chapterIndex) => {
		return fetch('/countBookChapterVerses?bookIndex=' + bookIndex + '&chapterIndex=' + chapterIndex)
			.then(response => response.json());
	};

})(window.Bible = window.Bible || {});
