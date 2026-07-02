<template>
  <main>
    <div class="content-column no-print">
      <section>
        <header class="page-header">
          <h1 class="mbl-title">
            {{ $t('meta.title') }}
          </h1>
          <div class="mbl-button-group mbl-button-group--start">
            <button class="mbl-button mbl-button--primary" @click="print">
              {{ $t('print') }}
            </button>
          </div>
        </header>
        <div class="mbl-content">
          <p>{{ $t('content.this_is') }}</p>
          <p>{{ $t('content.printer_friendly') }}</p>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p v-html="$t('content.download_directly')" />
          <h2>{{ $t('content.chapters_in_the_bible') }}</h2>
          <p>{{ $t('content.there_are_66_books') }}</p>
          <h2>{{ $t('content.track_your_progress_online') }}</h2>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p v-html="$t('content.if_you_would_like')" />
        </div>
      </section>
    </div>
    <div class="mbl-container">
      <div class="book-grid">
        <div v-for="book in books" :key="book.id" class="book-box">
          <div class="chapter-checkboxes">
            <span class="book-title">{{ book.locales[$i18n.locale].name }}</span>
            <div v-for="chapter in Array.from({ length: book.chapterCount }, (_, i) => i + 1)" :key="chapter" class="chapter-checkbox-container">
              <div class="chapter-checkbox" />
              <span> {{ chapter }}</span>
            </div>
          </div>
        </div>
        <div class="attribution">
          <p>{{ $t('site_title') }}</p>
          <p>{{ $t('site_description') }}</p>
          <p>{{ siteUrl }}</p>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import { Bible } from '@mybiblelog/shared';

export default {
  data() {
    return {
      siteUrl: this.$config.siteUrl,
      books: Bible.getBooks(),
    };
  },
  head() {
    const localePathSegment = this.$i18n.locale === 'en' ? '' : `/${this.$i18n.locale}`;
    return {
      title: this.$t('meta.title'),
      link: [
        { rel: 'canonical', href: `${this.$config.siteUrl}${localePathSegment}/resources/printable-bible-reading-tracker` },
      ],
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('meta.description'),
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: this.$t('meta.title'),
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: this.$t('meta.description'),
        },
        {
          hid: 'og:image',
          name: 'og:image',
          content: `${this.$config.siteUrl}/share.jpg`,
        },
      ],
    };
  },
  methods: {
    print() {
      window.print();
    },
    async getReadChapters() {
      const ranges = Bible.consolidateRanges(this.logEntries);
      const readChapters = {}; // { [`${bookIndex}.${chapterIndex}`]: boolean }
      function markRead(bookIndex, chapterIndex) { readChapters[`${bookIndex}.${chapterIndex}`] = true; }

      for (const range of ranges) {
        const { book, chapter: startChapter, verse: startVerse } = Bible.parseVerseId(range.startVerseId);
        const { chapter: endChapter, verse: endVerse } = Bible.parseVerseId(range.endVerseId);

        if (startVerse === 1) {
          if (endChapter > startChapter || Bible.getChapterVerseCount(book, startChapter) === endVerse) {
            markRead(book, startChapter);
          }
        }
        if (endChapter > startChapter && Bible.getChapterVerseCount(book, endChapter) === endVerse) {
          markRead(book, endChapter);
        }
        if (endChapter > startChapter + 1) {
          for (let c = startChapter + 1; c < endChapter; c++) {
            markRead(book, c);
          }
        }

        // Give up the event loop to let other things happen
        await new Promise(resolve => setImmediate(resolve));
      }
      this.readChapters = readChapters;
    },
  },
  auth: false,
};
</script>

<style>
@media print {
  body.has-site-nav-fixed {
    padding-top: 0;
  }

  .container {
    max-width: 100%;
    margin: 0;
    padding: 0;
  }

  .chapter-checkboxes {
    break-inside: avoid;
  }
}

.book-grid {
  columns: 12rem 4;
  column-gap: 0.1rem;
}

.book-box {
  border: 1px solid var(--mbl-text-stronger);
  margin-bottom: -1px;
  line-height: 1;
}

.book-title {
  font-weight: bold;
  font-size: 0.8rem;
  white-space: nowrap;
  padding-right: 0.2rem;
}

.chapter-checkboxes {
  display: inline-flex;
  flex-wrap: wrap;
  line-height: 0.5rem;
}

.chapter-checkbox-container {
  display: inline-flex;
  align-items: center;
  margin: 0 0.1rem;
  font-size: 0.8rem;
}

.chapter-checkbox {
  display: inline-block;
  width: 0.6rem;
  height: 0.6rem;
  border: 1px solid var(--mbl-text-stronger);
  margin: 0.1rem;
  text-align: center;
}

.attribution {
  padding: 0.5rem;
  text-align: right;
}

.attribution p {
  margin: 0;
  font-size: 0.8rem;
}
</style>

<i18n lang="json">
{
  "en": {
    "meta": {
      "title": "Printable Bible Reading Tracker",
      "description": "Free printable Bible reading tracker with checkboxes for each chapter of the Bible. Keep track of your progress as you read through the books of the Bible."
    },
    "print": "Print",
    "site_title": "My Bible Log",
    "site_description": "Free Bible Reading Tracker",
    "content": {
      "this_is": "This is a free printable Bible reading tracker with checkboxes for each chapter of the Bible. Use it to track of your progress as you read through the books of the Bible.",
      "printer_friendly": "This page is printer-friendly. Click the \"Print\" button above to print this page. Only the actual checklist will be printed.",
      "download_directly": "You can also download the PDF version directly <a target='_blank' href='/downloads/printable-bible-reading-tracker.pdf'>here</a>.",
      "chapters_in_the_bible": "Chapters in the Bible",
      "there_are_66_books": "There are 66 books in the Bible, and a total of 1,189 chapters. If you read 3.25 chapters each day (or a total of 23 chapters each week), you can read the entire Bible in one year.",
      "track_your_progress_online": "Track Your Progress Online",
      "if_you_would_like": "If you would like to track your Bible reading from your device, check out the free <a href='/'>My Bible Log</a> app and website!"
    }
  },
  "de": {
    "meta": {
      "title": "Druckbare Bibel-Lesetrack",
      "description": "Druckbare Bibel-Lesetrack mit Kontrollkästchen für jeden Kapitel der Bibel. Verfolgen Sie Ihren Fortschritt beim Lesen durch die Bücher der Bibel."
    },
    "print": "Drucken",
    "site_title": "My Bible Log",
    "site_description": "Druckbare Bibel-Lesetrack",
    "content": {
      "this_is": "Dies ist ein druckbares Kontrollkästchen für die Bibel-Lesetrack mit Kontrollkästchen für jeden Kapitel der Bibel. Verfolgen Sie Ihren Fortschritt beim Lesen durch die Bücher der Bibel.",
      "printer_friendly": "Diese Seite ist druckfreundlich. Klicken Sie auf den Druckknopf oben, um diese Seite zu drucken. Nur die tatsächliche Checkliste wird gedruckt.",
      "download_directly": "Sie können auch die PDF-Version direkt <a target='_blank' href='/downloads/druckbare-bibel-lesetrack.pdf'>hier</a> herunterladen.",
      "chapters_in_the_bible": "Kapitel in der Bibel",
      "there_are_66_books": "Es gibt 66 Bücher in der Bibel und insgesamt 1.189 Kapitel. Wenn Sie 3,25 Kapitel pro Tag lesen (oder insgesamt 23 Kapitel pro Woche), können Sie die gesamte Bibel in einem Jahr lesen.",
      "track_your_progress_online": "Verfolgen Sie Ihren Fortschritt online",
      "if_you_would_like": "Wenn Sie Ihren Fortschritt beim Lesen der Bibel von Ihrem Gerät aus verfolgen möchten, schauen Sie sich die kostenlosen <a href='/de'>My Bible Log</a> App und Website an!"
    }
  },
  "es": {
    "meta": {
      "title": "Rastreador de lectura de la Biblia imprimible",
      "description": "Rastreador de lectura de la Biblia imprimible gratuito con casillas de verificación para cada capítulo de la Biblia. Lleve un registro de su progreso a medida que lee los libros de la Biblia."
    },
    "print": "Imprimir",
    "site_title": "My Bible Log",
    "site_description": "Rastreador de la Biblia gratuito",
    "content": {
      "this_is": "Este es un rastreador de lectura de la Biblia imprimible gratuito con casillas de verificación para cada capítulo de la Biblia. Úselo para llevar un registro de su progreso a medida que lee los libros de la Biblia.",
      "printer_friendly": "Esta página es apta para imprimir. Haga clic en el botón \"Imprimir\" de arriba para imprimir esta página. Solo se imprimirá la lista de verificación real.",
      "download_directly": "También puede descargar la versión en PDF directamente <a target='_blank' href='/downloads/rastreador-de-lectura-de-la-biblia-imprimible.pdf'>aquí</a>.",
      "chapters_in_the_bible": "Capítulos en la Biblia",
      "there_are_66_books": "Hay 66 libros en la Biblia y un total de 1,189 capítulos. Si lee 3.25 capítulos cada día (o un total de 23 capítulos cada semana), puede leer toda la Biblia en un año.",
      "track_your_progress_online": "Rastrea tu progreso en línea",
      "if_you_would_like": "Si desea realizar un seguimiento de su lectura de la Biblia desde su dispositivo, ¡consulte la aplicación y el sitio web gratuitos de <a href='/es'>My Bible Log</a>!"
    }
  },
  "fr": {
    "meta": {
      "title": "Feuille de suivi de lecture de la Bible imprimable",
      "description": "Feuille de suivi de lecture de la Bible imprimable gratuite avec des cases à cocher pour chaque chapitre de la Bible. Suivez votre progrès pendant que vous lisez à travers les livres de la Bible."
    },
    "print": "Imprimer",
    "site_title": "My Bible Log",
    "site_description": "Feuille de suivi de lecture de la Bible gratuite",
    "content": {
      "this_is": "Il s'agit d'une feuille de suivi de lecture de la Bible imprimable gratuite avec des cases à cocher pour chaque chapitre de la Bible. Utilisez-la pour suivre votre progrès pendant que vous lisez à travers les livres de la Bible.",
      "printer_friendly": "Cette page est adaptée à l'impression. Cliquez sur le bouton \"Imprimer\" ci-dessus pour imprimer cette page. Seule la liste de contrôle réelle sera imprimée.",
      "download_directly": "Vous pouvez également télécharger la version PDF directement <a target='_blank' href='/downloads/feuille-de-suivi-de-lecture-de-la-Bible-imprimable.pdf'>ici</a>.",
      "chapters_in_the_bible": "Chapitres dans la Bible",
      "there_are_66_books": "Il y a 66 livres dans la Bible, et un total de 1 189 chapitres. Si vous lisez 3,25 chapitres chaque jour (ou un total de 23 chapitres chaque semaine), vous pouvez lire toute la Bible en un an.",
      "track_your_progress_online": "Suivez votre progression en ligne",
      "if_you_would_like": "Si vous souhaitez suivre votre lecture de la Bible à partir de votre appareil, consultez l'application et le site Web gratuits <a href='/'>My Bible Log</a> !"
    }
  },
  "ko": {
    "meta": {
      "title": "인쇄용 성경읽기표",
      "description": "성경 각 장 옆 체크박스가 있는 무료 인쇄용 성경읽기표입니다. 성경을 읽으며 진행 상황을 기록해 보세요."
    },
    "print": "인쇄",
    "site_title": "My Bible Log",
    "site_description": "무료 성경 읽기표",
    "content": {
      "this_is": "성경 각 장별 체크박스가 있는 무료 인쇄용 성경읽기표입니다. 성경의 각 책을 읽어 나가며 진도를 관리하는 데 활용하세요.",
      "printer_friendly": "이 페이지는 인쇄에 최적화되어 있습니다. 위의 \"인쇄\" 버튼을 클릭하면 이 페이지를 출력할 수 있습니다. 실제 체크박스만 인쇄됩니다.",
      "download_directly": "PDF 파일은 <a target='_blank' href='/downloads/인쇄용 성경 읽기표.pdf'>이곳</a>을 눌러 직접 다운로드 받을 수 있습니다.",
      "chapters_in_the_bible": "성경 장 수",
      "there_are_66_books": "성경에는 66권의 책과 총 1,189개의 장이 있습니다. 매일 3.25장씩(또는 매주 총 23장씩) 읽으면, 1년 안에 성경 전체를 읽을 수 있습니다.",
      "track_your_progress_online": "온라인으로 진도 기록하기",
      "if_you_would_like": "나의 기기에서 성경 읽기 진도를 관리하고 싶다면, 무료 <a href='/ko'>My Bible Log</a> 앱과 웹사이트를 확인해 보세요!"
    }
  },
  "pt": {
    "meta": {
      "title": "Rastreador de Leitura da Bíblia para Imprimir",
      "description": "Rastreador de leitura da Bíblia para imprimir gratuitamente com caixas de seleção para cada capítulo da Bíblia. Acompanhe seu progresso enquanto lê os livros da Bíblia."
    },
    "print": "Imprimir",
    "site_title": "My Bible Log",
    "site_description": "Rastreador de Leitura da Bíblia Gratuito",
    "content": {
      "this_is": "Este é um rastreador de leitura da Bíblia para imprimir gratuitamente com caixas de seleção para cada capítulo da Bíblia. Use-o para acompanhar seu progresso enquanto lê os livros da Bíblia.",
      "printer_friendly": "Esta página é amigável para impressão. Clique no botão \"Imprimir\" acima para imprimir esta página. Apenas a lista de verificação será impressa.",
      "download_directly": "Você também pode baixar a versão em PDF diretamente <a target='_blank' href='/downloads/rastreador-de-leitura-da-biblia-para-imprimir.pdf'>aqui</a>.",
      "chapters_in_the_bible": "Capítulos na Bíblia",
      "there_are_66_books": "Existem 66 livros na Bíblia e um total de 1.189 capítulos. Se você ler 3,25 capítulos por dia (ou um total de 23 capítulos por semana), poderá ler a Bíblia inteira em um ano.",
      "track_your_progress_online": "Acompanhe seu progresso online",
      "if_you_would_like": "Se deseja acompanhar sua leitura da Bíblia a partir do seu dispositivo, confira o aplicativo e site gratuito <a href='/'>Meu Registro Bíblico</a>!"
    }
  },
  "uk": {
    "meta": {
      "title": "Друкований відстежувач читання Біблії",
      "description": "Безкоштовний друкований відстежувач читання Біблії з прапорцями для кожної глави Біблії. Відстежуйте свій прогрес, читаючи книги Біблії."
    },
    "print": "Друк",
    "site_title": "My Bible Log (Мій Біблійний Журнал)",
    "site_description": "Безкоштовний трекер Біблії",
    "content": {
      "this_is": "Це безкоштовний друкований відстежувач читання Біблії з прапорцями для кожної глави Біблії. Використовуйте його, щоб відстежувати свій прогрес, читаючи книги Біблії.",
      "printer_friendly": "Ця сторінка придатна для друку. Натисніть кнопку \"Друк\" вище, щоб роздрукувати цю сторінку. Буде роздруковано лише фактичний список.",
      "download_directly": "Ви також можете завантажити версію PDF безпосередньо <a target='_blank' href='/downloads/drukovanyy-vidstezhuvach-chytannya-bibliyi.pdf'>тут</a>.",
      "chapters_in_the_bible": "Глави в Біблії",
      "there_are_66_books": "У Біблії 66 книг і всього 1 189 глав. Якщо ви читаєте 3,25 глави кожен день (або всього 23 глави кожного тижня), ви можете прочитати всю Біблію за рік.",
      "track_your_progress_online": "Відстежуйте свій прогрес онлайн",
      "if_you_would_like": "Якщо ви хочете відстежувати своє читання Біблії зі свого пристрою, перегляньте безкоштовний додаток та веб-сайт <a href='/uk'>My Bible Log</a>!"
    }
  }
}
</i18n>
