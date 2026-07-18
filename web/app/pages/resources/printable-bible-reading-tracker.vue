<template>
  <main>
    <div class="content-column no-print">
      <section>
        <header class="page-header">
          <h1 class="mbl-title">
            {{ t('meta.title') }}
          </h1>
          <div class="mbl-button-group mbl-button-group--start">
            <button class="mbl-button mbl-button--primary" type="button" @click="print">
              {{ t('print') }}
            </button>
          </div>
        </header>
        <div class="mbl-content">
          <p>{{ t('content.this_is') }}</p>
          <p>{{ t('content.printer_friendly') }}</p>
          <i18n-t keypath="content.download_directly" tag="p">
            <template #link>
              <a :href="t('content.download_pdf_href')" target="_blank" rel="noopener">{{ t('content.download_pdf_text') }}</a>
            </template>
          </i18n-t>
          <h2>{{ t('content.chapters_in_the_bible') }}</h2>
          <p>{{ t('content.there_are_66_books') }}</p>
          <h2>{{ t('content.track_your_progress_online') }}</h2>
          <i18n-t keypath="content.if_you_would_like" tag="p">
            <template #appLink>
              <a :href="t('content.app_href')">My Bible Log</a>
            </template>
          </i18n-t>
        </div>
      </section>
    </div>
    <div class="mbl-container">
      <div class="book-grid">
        <div v-for="book in books" :key="book.bibleOrder" class="book-box">
          <div class="chapter-checkboxes">
            <span class="book-title">{{ book.locales[locale]?.name || book.locales['en']?.name }}</span>
            <div
              v-for="chapter in book.chapterCount"
              :key="chapter"
              class="chapter-checkbox-container"
            >
              <div class="chapter-checkbox" />
              <span> {{ chapter }}</span>
            </div>
          </div>
        </div>
        <div class="attribution">
          <p>{{ t('site_title') }}</p>
          <p>{{ t('site_description') }}</p>
          <p>{{ siteUrl }}</p>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { Bible } from '@mybiblelog/shared';

const { locale, t } = useI18n();
const config = useRuntimeConfig();

const siteUrl = config.public.siteUrl as string;
const books = Bible.getBooks();

function print() {
  window.print();
}

useContentSeo({
  path: '/resources/printable-bible-reading-tracker',
  locale,
  seoTitle: t('meta.title'),
  seoDescription: t('meta.description'),
  ogTitle: t('meta.title'),
  ogDescription: t('meta.description'),
});
</script>

<style>
@media print {
  body.has-site-nav-fixed { padding-top: 0; }
  .container { max-width: 100%; margin: 0; padding: 0; }
  .chapter-checkboxes { break-inside: avoid; }
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
      "download_directly": "You can also download the PDF version directly {link}.",
      "download_pdf_href": "/downloads/printable-bible-reading-tracker.pdf",
      "download_pdf_text": "here",
      "chapters_in_the_bible": "Chapters in the Bible",
      "there_are_66_books": "There are 66 books in the Bible, and a total of 1,189 chapters. If you read 3.25 chapters each day (or a total of 23 chapters each week), you can read the entire Bible in one year.",
      "track_your_progress_online": "Track Your Progress Online",
      "if_you_would_like": "If you would like to track your Bible reading from your device, check out the free {appLink} app and website!",
      "app_href": "/"
    }
  },
  "de": {
    "meta": {
      "title": "Druckbare Bibel-Lesetrack",
      "description": "Druckbare Bibel-Lesetrack mit Kontrollkästchen für jeden Kapitel der Bibel."
    },
    "print": "Drucken",
    "site_title": "My Bible Log",
    "site_description": "Druckbare Bibel-Lesetrack",
    "content": {
      "this_is": "Dies ist ein druckbares Kontrollkästchen für die Bibel-Lesetrack mit Kontrollkästchen für jeden Kapitel der Bibel.",
      "printer_friendly": "Diese Seite ist druckfreundlich. Klicken Sie auf den Druckknopf oben, um diese Seite zu drucken.",
      "download_directly": "Sie können auch die PDF-Version direkt {link} herunterladen.",
      "download_pdf_href": "/downloads/druckbare-bibel-lesetrack.pdf",
      "download_pdf_text": "hier",
      "chapters_in_the_bible": "Kapitel in der Bibel",
      "there_are_66_books": "Es gibt 66 Bücher in der Bibel und insgesamt 1.189 Kapitel.",
      "track_your_progress_online": "Verfolgen Sie Ihren Fortschritt online",
      "if_you_would_like": "Schauen Sie sich die kostenlosen {appLink} App und Website an!",
      "app_href": "/de"
    }
  },
  "es": {
    "meta": {
      "title": "Rastreador de lectura de la Biblia imprimible",
      "description": "Rastreador de lectura de la Biblia imprimible gratuito con casillas de verificación para cada capítulo de la Biblia."
    },
    "print": "Imprimir",
    "site_title": "My Bible Log",
    "site_description": "Rastreador de la Biblia gratuito",
    "content": {
      "this_is": "Este es un rastreador de lectura de la Biblia imprimible gratuito con casillas de verificación para cada capítulo de la Biblia.",
      "printer_friendly": "Esta página es apta para imprimir.",
      "download_directly": "También puede descargar la versión en PDF directamente {link}.",
      "download_pdf_href": "/downloads/rastreador-de-lectura-de-la-biblia-imprimible.pdf",
      "download_pdf_text": "aquí",
      "chapters_in_the_bible": "Capítulos en la Biblia",
      "there_are_66_books": "Hay 66 libros en la Biblia y un total de 1,189 capítulos.",
      "track_your_progress_online": "Rastrea tu progreso en línea",
      "if_you_would_like": "¡Consulte la aplicación y el sitio web gratuitos de {appLink}!",
      "app_href": "/es"
    }
  },
  "fr": {
    "meta": {
      "title": "Feuille de suivi de lecture de la Bible imprimable",
      "description": "Feuille de suivi de lecture de la Bible imprimable gratuite avec des cases à cocher pour chaque chapitre de la Bible."
    },
    "print": "Imprimer",
    "site_title": "My Bible Log",
    "site_description": "Feuille de suivi de lecture de la Bible gratuite",
    "content": {
      "this_is": "Il s'agit d'une feuille de suivi de lecture de la Bible imprimable gratuite avec des cases à cocher pour chaque chapitre de la Bible.",
      "printer_friendly": "Cette page est adaptée à l'impression.",
      "download_directly": "Vous pouvez également télécharger la version PDF directement {link}.",
      "download_pdf_href": "/downloads/feuille-de-suivi-de-lecture-de-la-Bible-imprimable.pdf",
      "download_pdf_text": "ici",
      "chapters_in_the_bible": "Chapitres dans la Bible",
      "there_are_66_books": "Il y a 66 livres dans la Bible, et un total de 1 189 chapitres.",
      "track_your_progress_online": "Suivez votre progression en ligne",
      "if_you_would_like": "Consultez l'application et le site Web gratuits {appLink} !",
      "app_href": "/fr"
    }
  },
  "ko": {
    "meta": {
      "title": "인쇄용 성경읽기표",
      "description": "성경 각 장 옆 체크박스가 있는 무료 인쇄용 성경읽기표입니다."
    },
    "print": "인쇄",
    "site_title": "My Bible Log",
    "site_description": "무료 성경 읽기표",
    "content": {
      "this_is": "성경 각 장별 체크박스가 있는 무료 인쇄용 성경읽기표입니다.",
      "printer_friendly": "이 페이지는 인쇄에 최적화되어 있습니다.",
      "download_directly": "PDF 파일은 {link}을 눌러 직접 다운로드 받을 수 있습니다.",
      "download_pdf_href": "/downloads/인쇄용 성경 읽기표.pdf",
      "download_pdf_text": "이곳",
      "chapters_in_the_bible": "성경 장 수",
      "there_are_66_books": "성경에는 66권의 책과 총 1,189개의 장이 있습니다.",
      "track_your_progress_online": "온라인으로 진도 기록하기",
      "if_you_would_like": "무료 {appLink} 앱과 웹사이트를 확인해 보세요!",
      "app_href": "/ko"
    }
  },
  "pt": {
    "meta": {
      "title": "Rastreador de Leitura da Bíblia para Imprimir",
      "description": "Rastreador de leitura da Bíblia para imprimir gratuitamente com caixas de seleção para cada capítulo da Bíblia."
    },
    "print": "Imprimir",
    "site_title": "My Bible Log",
    "site_description": "Rastreador de Leitura da Bíblia Gratuito",
    "content": {
      "this_is": "Este é um rastreador de leitura da Bíblia para imprimir gratuitamente com caixas de seleção para cada capítulo da Bíblia.",
      "printer_friendly": "Esta página é amigável para impressão.",
      "download_directly": "Você também pode baixar a versão em PDF diretamente {link}.",
      "download_pdf_href": "/downloads/rastreador-de-leitura-da-biblia-para-imprimir.pdf",
      "download_pdf_text": "aqui",
      "chapters_in_the_bible": "Capítulos na Bíblia",
      "there_are_66_books": "Existem 66 livros na Bíblia e um total de 1.189 capítulos.",
      "track_your_progress_online": "Acompanhe seu progresso online",
      "if_you_would_like": "Confira o aplicativo e site gratuito {appLink}!",
      "app_href": "/pt"
    }
  },
  "uk": {
    "meta": {
      "title": "Друкований відстежувач читання Біблії",
      "description": "Безкоштовний друкований відстежувач читання Біблії з прапорцями для кожної глави Біблії."
    },
    "print": "Друк",
    "site_title": "My Bible Log (Мій Біблійний Журнал)",
    "site_description": "Безкоштовний трекер Біблії",
    "content": {
      "this_is": "Це безкоштовний друкований відстежувач читання Біблії з прапорцями для кожної глави Біблії.",
      "printer_friendly": "Ця сторінка придатна для друку. Натисніть кнопку \"Друк\" вище.",
      "download_directly": "Ви також можете завантажити версію PDF безпосередньо {link}.",
      "download_pdf_href": "/downloads/drukovanyy-vidstezhuvach-chytannya-bibliyi.pdf",
      "download_pdf_text": "тут",
      "chapters_in_the_bible": "Глави в Біблії",
      "there_are_66_books": "У Біблії 66 книг і всього 1 189 глав.",
      "track_your_progress_online": "Відстежуйте свій прогрес онлайн",
      "if_you_would_like": "Перегляньте безкоштовний додаток та веб-сайт {appLink}!",
      "app_href": "/uk"
    }
  }
}
</i18n>
