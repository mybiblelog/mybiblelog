(() => {

	new Vue({
		el: '#js-vue-app',
		data: {
			books: [],
			chapterVerses: {},
			logEntries: [],
		},
		computed: {
			//
		},
		methods: {
			//
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

			loadBibleBooks()
				.then(loadChapterVerses)
				.then(loadLogEntries);
		},
	});

})();