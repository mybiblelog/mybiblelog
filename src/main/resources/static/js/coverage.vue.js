(() => {

  const calcPercent = (numerator, denominator, decimalDigits = 2) => {
    return (numerator / denominator * 100).toFixed(decimalDigits);
  };

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
          borderRadius: '0.5rem',
          overflow: 'hidden',
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

  const BibleReport = {
    template: '#bible-report',
    components: {
      CompletionBar,
    },
    props: {
      logEntries: Array,
    },
    computed: {
      totalBibleVerses() {
        return Bible.getTotalVerseCount();
      },
      totalVersesRead() {
        return Bible.countUniqueRangeVerses(this.logEntries);
      },
      percentageRead() {
        return calcPercent(this.totalVersesRead, this.totalBibleVerses);
      },
      allBookReports() {
        const reports = [];
        for (let i = 1, l = Bible.getBookCount(); i <= l; i++) {
          reports.push(this.bookReport(i));
        }
        return reports;
      },
    },
    methods: {
      bookReport(bookIndex) {
        const bookName = Bible.getBookName(bookIndex);
        const totalVerses = Bible.getBookVerseCount(bookIndex);
        const versesRead = Bible.countUniqueBookRangeVerses(bookIndex, this.logEntries);
        const percentage = calcPercent(versesRead, totalVerses);
        return { bookIndex, bookName, totalVerses, versesRead, percentage };
      },
    },
  };

  const BookReport = {
    template: '#book-report',
    components: {
      CompletionBar,
    },
    props: {
      logEntries: Array,
      bookIndex: Number,
    },
    computed: {
      book() {
        return Bible.getBooks().find(b => b.bibleOrder === this.bookIndex);
      },
      totalBookVerses() {
        return Bible.getBookVerseCount(this.bookIndex);
      },
      totalVersesRead() {
        return Bible.countUniqueBookRangeVerses(this.bookIndex, this.logEntries);
      },
      percentageRead() {
        return calcPercent(this.totalVersesRead, this.totalBookVerses);
      },
      allChapterReports() {
        const reports = [];
        for (let i = 1, l = Bible.getBookChapterCount(this.bookIndex); i <= l; i++) {
          reports.push(this.chapterReport(i));
        }
        return reports;
      },
    },
    methods: {
      chapterReport(chapterIndex) {
        const totalVerses = Bible.getChapterVerseCount(this.bookIndex, chapterIndex);
        const versesRead = Bible.countUniqueBookChapterRangeVerses(this.bookIndex, chapterIndex, this.logEntries);
        const percentage = calcPercent(versesRead, totalVerses);
        return { chapterIndex, totalVerses, versesRead, percentage };
      },
    },
  };

	new Vue({
    el: '#js-vue-app',
    components: {
      BibleReport,
      BookReport,
    },
		data: {
      view: 'bible',
      bookIndex: 1,
      logEntries: [],
		},
		computed: {
      //
    },
		methods: {
      viewBibleReport() {
        this.view = 'bible';
      },
      viewBookReport(bookIndex) {
        this.view = 'book';
        this.bookIndex = bookIndex;
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