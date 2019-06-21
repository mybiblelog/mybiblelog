(() => {

	new Vue({
		el: '#js-vue-app',
		data: {
			books: [],
			chapterVerses: {},
      logEntries: [],
		},
		computed: {
      totalBibleVerses() {
        return Bible.getTotalVerseCount();
      },
      totalVersesRead() {
        return Bible.countUniqueRangeVerses(this.logEntries);
      },
      percentageRead() {
        return this.percentage(this.totalVersesRead, this.totalBibleVerses);
      }
    },
		methods: {
      percentage(numerator, denominator) {
        return (numerator / denominator * 100).toFixed(2);
      },
			bookReport(bookIndex) {
        const bookName = Bible.getBookName(bookIndex);
        const totalVerses = Bible.getBookVerseCount(bookIndex);
        const versesRead = Bible.countUniqueBookRangeVerses(bookIndex, this.logEntries);
        const percentage = this.percentage(versesRead, totalVerses);
        return { bookName, totalVerses, versesRead, percentage };
      },
		},
		mounted() {
			fetch('/api/log-entries')
        .then(response => response.json())
        .then(data => {
          this.logEntries = data;
        });
		},
	});

})();