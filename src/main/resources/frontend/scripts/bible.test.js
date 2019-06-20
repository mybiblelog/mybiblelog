const Bible = require('./bible');

test('loads bible book data', () => {
	const bibleBooks = Bible.getBooks();
	expect(bibleBooks.length).toBe(66);
});

test('loads chapter verse data', () => {
	const chapterVerses = Bible.getChapterVerses();
	expect(typeof chapterVerses).toBe('object');
});

test('can count book chapters', () => {
	const genesisChapters = Bible.countBookChapters(1);
	expect(genesisChapters).toBe(50);
});

test('can count chapter verses', () => {
	const genesis1Verses = Bible.countChapterVerses(1, 1);
	expect(genesis1Verses).toBe(31);
});
