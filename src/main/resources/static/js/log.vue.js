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

				const bookIndex = this.model.book;
				const book = this.books.find(b => b.bibleOrder === bookIndex);
				const chapterCount = book.chapterCount;
				const chapters = [];
				for (let i = 1; i <= chapterCount; i++) chapters.push(i);
				this.startChapters = chapters;
			},
			onSelectStartChapter() {
				// TODO: populate start verse select
			},
			onSelectStartVerse() {
				//
			},
			onSelectEndChapter() {
				//
			},
			onSelectEndVerse() {
				//
			},
			onSubmitLogEntryForm() {
				alert('"Submitted"')
				// TODO: ensure the minimum number of fields is selected
				// TODO: generate startVerseId and endVerseId
				// TODO: submit request
				// TODO: update state with result
				// TODO: render page
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