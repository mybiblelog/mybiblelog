(() => {

  const CompletionBar = {
    template: '#completion-bar',
    props: {
      percentage: String,
      backgroundColor: {
        type: String,
        default: '#000',
      },
      foregroundColor: {
        type: String,
        default: '#09f',
      },
    },
    computed: {
      backgroundStyle() {
        return {
          height: '0.5rem',
          background: this.backgroundColor,
          margin: '1rem 0',
        };
      },
      foregroundStyle() {
        return {
          height: '100%',
          background: this.foregroundColor,
          width: this.percentage + '%',
        };
      },
    },
  };

	new Vue({
    el: '#js-vue-app',
    components: {
      CompletionBar,
    },
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
      },
      allBookReports() {
        const reports = [];
        for (let i = 1, l = Bible.getBookCount(); i <= l; i++) {
          reports.push(this.bookReport(i));
        }
        return reports;
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