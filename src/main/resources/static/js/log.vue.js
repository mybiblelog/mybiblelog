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
			books: [],
			logEntries: [],
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
				// TODO: populate start chapter 
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
			fetch('/logEntries')
				.then(response => response.json())
				.then(data => {
					this.logEntries = data;
				});
			fetch('/bibleBooks')
				.then(response => response.json())
				.then(data => {
					this.books = data;
				});
			console.log({ this: this });
		},
	});

})();