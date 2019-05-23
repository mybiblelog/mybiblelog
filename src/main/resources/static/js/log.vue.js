(() => {

	new Vue({
		el: '#js-vue-app',
		data: {
			model: {
				book:			0,
				startChapter:	0,
				startVerse:		0,
				endChapter:		0,
				endVerse:		0,
			},
			logEntries: [],
			books: [],
			startChapters: [],
			startVerses: [],
			endChapters: [],
			endVerses: [],
		},
		computed: {
			//
		},
		methods: {
			displayRange(startVerseId, endVerseId) {
				const start = Bible.parseVerseId(startVerseId);
				const end = Bible.parseVerseId(endVerseId);
				const bookName = this.books.find(b => b.bibleOrder = start.book).name;
				let range = bookName + ' ';
				if (start.chapter === end.chapter) {
					range += start.chapter + ':';
					range += start.verse + '-' + end.verse;
					return range;
				}
				else {
					range += start.chapter + ':' + start.verse + '-';
					range += end.chapter + ':' + end.verse;
					return range
				}
			},
			onSelectBook() {
				this.model.startChapter = 0;
				this.model.startVerse = 0;
				this.model.endChapter = 0;
				this.model.endVerse = 0;

				this.startChapters = [];
				this.startVerses = [];
				this.endChapters = [];
				this.endVerses = [];

				const bookIndex = this.model.book;
				const book = this.books.find(b => b.bibleOrder === bookIndex);
				const chapterCount = book.chapterCount;
				const chapters = [];
				for (let i = 1; i <= chapterCount; i++) chapters.push(i);
				this.startChapters = chapters;
			},
			onSelectStartChapter() {
				this.model.startVerse = 0;
				this.model.endChapter = 0;
				this.model.endVerse = 0;

				this.startVerses = [];
				this.endChapters = [];
				this.endVerses = [];

				fetch(`/countBookChapterVerses?bookIndex=${this.model.book}&chapterIndex=${this.model.startChapter}`)
					.then(response => response.json())
					.then(verseCount => {
						const verses = [];
						for (let i = 1; i <= verseCount; i++) verses.push(i);
						this.startVerses = verses;
					});
			},
			onSelectStartVerse() {
				this.model.endChapter = 0;
				this.model.endVerse = 0;

				this.endChapters = [];
				this.endVerses = [];

				const bookIndex = this.model.book;
				const book = this.books.find(b => b.bibleOrder === bookIndex);
				const chapterCount = book.chapterCount;
				const chapters = [];
				for (let i = this.model.startChapter; i <= chapterCount; i++) chapters.push(i);
				this.endChapters = chapters;
			},
			onSelectEndChapter() {
				this.model.endVerse = 0;

				this.endVerses = [];

				fetch(`/countBookChapterVerses?bookIndex=${this.model.book}&chapterIndex=${this.model.endChapter}`)
					.then(response => response.json())
					.then(verseCount => {
						const verses = [];
						let i = 1;
						if (this.model.startChapter === this.model.endChapter) i = this.model.startVerse;
						for (; i <= verseCount; i++) verses.push(i);
						this.endVerses = verses;
					});
			},
			onSubmitLogEntryForm() {
				const startVerseId = Bible.makeVerseId(this.model.book, this.model.startChapter, this.model.startVerse);
				const endVerseId = Bible.makeVerseId(this.model.book, this.model.endChapter, this.model.endVerse);

				console.log({ startVerseId, endVerseId });
				alert('Check Console');
				
				// TODO: submit request
				// TODO: update data with result
			},
		},
		mounted() {

			const loadBibleBooks =
				() => fetch('/bibleBooks')
					.then(response => response.json())
					.then(data => {
						this.books = data;
					});
			
			const loadLogEntries =
				() => fetch('/logEntries')
					.then(response => response.json())
					.then(data => {
						this.logEntries = data;
					});

			// Load bible metadata first since it is used to
			// display log entries
			loadBibleBooks().then(loadLogEntries);
		},
	});

})();