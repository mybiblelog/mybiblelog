(() => {

	const DateString = {
		parse(dateString) {
			const [yyyy, mm, dd] = dateString.split('-');
			const year = +yyyy;
			const month = +mm;
			const date = +dd;
			return { year, month, date };
		},
		stringify(year, month, date) {
			return `${year}-${month}-${date}`;
		},
		fromDate(dateObject) {
			const year = dateObject.getFullYear().toString().padStart(4, '0');
			const month = (dateObject.getMonth() + 1).toString().padStart(2, '0');
			const date = dateObject.getDate().toString().padStart(2, '0');
			return this.stringify(year, month, date);
		},
		now() {
			const today = new Date();
			return this.fromDate(today);
		},
		makeDate(dateString) {
			const { year, month, date } = this.parse(dateString);
			const result = new Date();
			result.setFullYear(year);
			result.setMonth(month);
			result.setDate(date);
			return result;
		},
	};

	new Vue({
		el: '#js-vue-app',
		data: {
      logEntries: [],
      loading: false,

			formOpen: false,
			model: {
				id:				null,
				date: 			DateString.now(),
				book:			0,
				startChapter:	0,
				startVerse:		0,
				endChapter:		0,
				endVerse:		0,
			},

			chapterVerses: {},
			
			books: [],
			startChapters: [],
			startVerses: [],
			endChapters: [],
			endVerses: [],
		},
		computed: {
			entryDates() {
				const dateMap = {};
				for (let logEntry of this.logEntries) {
					if (!dateMap[logEntry.date]) {
            dateMap[logEntry.date] = [];
            dateMap[logEntry.date].verses = 0;
					}
          dateMap[logEntry.date].push(logEntry);
          dateMap[logEntry.date].verses += Bible.countRangeVerses(logEntry.startVerseId, logEntry.endVerseId);
				}
				const dates = Object.keys(dateMap).sort().map(date => ({
					date,
          entries: dateMap[date],
          verses: dateMap[date].verses,
        }));
				return dates;
			},
		},
		methods: {
			displayDate(dateString) {
				// Include time to make the date timezone-agnostic, preventing date shift
				date = new Date(dateString + ' 00:00');
				const options = {
					weekday: 	'long',
					year: 		'numeric',
					month: 		'long',
					day: 		  'numeric'
				};
				return date.toLocaleDateString('en-US', options);
			},
			displayVerseRange(startVerseId, endVerseId) {
				const start = Bible.parseVerseId(startVerseId);
				const end = Bible.parseVerseId(endVerseId);

				const bookName = this.books.find(b => b.bibleOrder === start.book).name;
				let range = bookName + ' ';
				if (start.chapter === end.chapter) {
					range += start.chapter + ':';
          range += start.verse;
          if (start.verse !== end.verse) {
            range += '-' + end.verse;
          }
					return range;
				}
				else {
					range += start.chapter + ':' + start.verse + '-';
					range += end.chapter + ':' + end.verse;
					return range
				}
      },
      displayVerseRangeCount(startVerseId, endVerseId) {
        return Bible.countRangeVerses(startVerseId, endVerseId);
      },
			deleteEntry(id) {
				if (!confirm('Are you sure you want to delete this entry?')) return;
				fetch('/api/log-entries/' + id, { method: 'DELETE' })
					.then(response => response.json())
					.then(data => {
						if (data) {
							this.logEntries = this.logEntries.filter(e => e.id !== id);
						}
						else {
							alert('The log entry could not be deleted.');
						}
					});
			},
			openAddEntryForm() {
				this.resetForm();
				this.formOpen = true;
			},
			openEditEntryForm(id) {
				this.formOpen = true;
				const targetEntry = this.logEntries.find(e => e.id === id);
				const { date, startVerseId, endVerseId } = targetEntry;
				const start = Bible.parseVerseId(startVerseId);
				const end = Bible.parseVerseId(endVerseId);
				Object.assign(this.model, {
					id,
					date,
					book: start.book,
				});
				this.onSelectBook();
				this.model.startChapter = start.chapter;
				this.onSelectStartChapter();
				this.model.startVerse = start.verse;
				this.onSelectStartVerse();
				this.model.endChapter = end.chapter;
				this.onSelectEndChapter();
				this.model.endVerse = end.verse;
				this.onSelectEndVerse();
			},
			closeAddEntryForm() {
				this.formOpen = false;
				this.resetForm();
			},
			resetStartChapter() {
				this.model.startChapter = 0;
				this.startChapters = [];
			},
			resetStartVerse() {
				this.model.startVerse = 0;
				this.startVerses = [];
			},
			resetEndChapter() {
				this.model.endChapter = 0;
				this.endChapters = [];
			},
			resetEndVerse() {
				this.model.endVerse = 0;
				this.endVerses = [];
			},
			resetForm() {
				this.model.id = null;
				this.model.date = DateString.now();
				this.model.book = 0;
				this.resetStartChapter();
				this.resetStartVerse();
				this.resetEndChapter();
				this.resetEndVerse();
			},
			onSelectBook() {
				this.resetStartChapter();
				this.resetStartVerse();
				this.resetEndChapter();
				this.resetEndVerse();

				const bookIndex = this.model.book;
				const book = this.books.find(b => b.bibleOrder === bookIndex);
				const chapterCount = book.chapterCount;
				const chapters = [];
				for (let i = 1; i <= chapterCount; i++) chapters.push(i);
				this.startChapters = chapters;

				this.$nextTick(() => this.$refs.startChapter.focus());
			},
			onSelectStartChapter() {
				this.resetStartVerse();
				this.resetEndChapter();
				this.resetEndVerse();
				
				const chapterId = Bible.makeVerseId(this.model.book, this.model.startChapter, 0);
				const chapterVerseCount = this.chapterVerses[chapterId];
				const verses = [];
				for (let i = 1; i <= chapterVerseCount; i++) verses.push(i);
				this.startVerses = verses;
        this.$nextTick(() => this.$refs.endVerse.focus());

        // Make it easier to log an entry that begins at the beginning of a chapter
        this.model.startVerse = 1;
        this.onSelectStartVerse();
			},
			onSelectStartVerse() {
				this.resetEndChapter();
				this.resetEndVerse();

				const bookIndex = this.model.book;
				const book = this.books.find(b => b.bibleOrder === bookIndex);
				const chapterCount = book.chapterCount;
				const chapters = [];
				for (let i = this.model.startChapter; i <= chapterCount; i++) chapters.push(i);
				this.endChapters = chapters;
			},
			onSelectEndChapter() {
				this.resetEndVerse();

				const chapterId = Bible.makeVerseId(this.model.book, this.model.endChapter, 0);
				const chapterVerseCount = this.chapterVerses[chapterId];
				const verses = [];
				let i = 1;
				if (this.model.startChapter === this.model.endChapter) i = this.model.startVerse;
				for (; i <= chapterVerseCount; i++) verses.push(i);
				this.endVerses = verses;
        this.$nextTick(() => this.$refs.endVerse.focus());

        // Make it easier to log an entry that ends at the end of a chapter
        this.model.endVerse = this.endVerses[this.endVerses.length-1];
        this.onSelectEndVerse();
			},
			onSelectEndVerse() {
				this.$nextTick(() => this.$refs.submit.focus());
			},
			onSubmitLogEntryForm() {
				if (this.model.id) {
					this.processEditEntryForm();
				}
				else {
					this.processAddEntryForm();
				}
			},
			processAddEntryForm() {
				const startVerseId = Bible.makeVerseId(this.model.book, this.model.startChapter, this.model.startVerse);
				const endVerseId = Bible.makeVerseId(this.model.book, this.model.endChapter, this.model.endVerse);

				const requestBody = JSON.stringify({
					date: this.model.date,
					startVerseId,
					endVerseId,
				});

				fetch('/api/log-entries', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: requestBody,
				})
				.then(response => response.json())
				.then(data => {
					if (!data) {
						alert('Unable to add entry.');
					}
					else {
						console.log({ data });
						this.logEntries.push(data);
						this.closeAddEntryForm()
					}
				});
			},
			processEditEntryForm() {
				const startVerseId = Bible.makeVerseId(this.model.book, this.model.startChapter, this.model.startVerse);
				const endVerseId = Bible.makeVerseId(this.model.book, this.model.endChapter, this.model.endVerse);

				const requestBody = JSON.stringify({
					id: this.model.id,
					date: this.model.date,
					startVerseId,
					endVerseId,
				});

				fetch(`/api/log-entries/${this.model.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: requestBody,
				})
				.then(response => response.json())
				.then(data => {
					if (!data) {
						alert('Unable to update entry.');
					}
					else {
						console.log({ data });
						const updatedLogEntry = this.logEntries.find(e => e.id === data.id);
						Object.assign(updatedLogEntry, data);
						this.closeAddEntryForm()
					}
				});
			},
		},
		mounted() {

			const loadBibleBooks =
				() => fetch('/bible-books.json')
					.then(response => response.json())
					.then(data => this.books = data);

			const loadChapterVerses =
				() => fetch('/chapter-verses.json')
					.then(response => response.json())
					.then(data => this.chapterVerses = data);
			
			const loadLogEntries =
				() => fetch('/api/log-entries')
					.then(response => response.json())
					.then(data => {
						this.logEntries = data;
					});

			// Load bible metadata first since it is used to
      // display log entries
      this.loading = true;
			loadBibleBooks()
				.then(loadChapterVerses)
        .then(loadLogEntries)
        .then(() => this.loading = false);
		},
	});

})();