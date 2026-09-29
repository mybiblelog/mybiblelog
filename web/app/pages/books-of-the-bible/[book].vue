<template>
  <main role="main">
    <article class="content-column mbl-content">
      <nav class="book-breadcrumb" :aria-label="t('breadcrumb_label')">
        <NuxtLink :to="localePath('/books-of-the-bible')">
          {{ t('hub') }}
        </NuxtLink>
        <span aria-hidden="true"> › </span>
        <span>{{ bookName }}</span>
      </nav>

      <h1>{{ t('h1', { book: bookName }) }}</h1>
      <p class="book-section-label">
        {{ t('meta_line', { testament, section: t(`section.${guide.section}`), n: bookIndex }) }}
      </p>

      <dl class="book-stats">
        <div class="book-stat">
          <dt>{{ t('stat.chapters') }}</dt>
          <dd>{{ chapterCount }}</dd>
        </div>
        <div class="book-stat">
          <dt>{{ t('stat.verses') }}</dt>
          <dd>{{ formatNumber(verseCount) }}</dd>
        </div>
        <div class="book-stat">
          <dt>{{ t('stat.words') }}</dt>
          <dd>{{ formatNumber(wordCount) }}</dd>
        </div>
        <div class="book-stat">
          <dt>{{ t('stat.reading_time') }}</dt>
          <dd>{{ readingTime }}</dd>
        </div>
      </dl>

      <h2>{{ t('about_heading', { book: bookName }) }}</h2>
      <p>{{ overview }}</p>
      <p>
        <strong>{{ t('well_known') }}</strong> {{ keyPassages.join(' · ') }}
      </p>

      <h2>{{ t('how_long_heading', { book: bookName }) }}</h2>
      <p>
        {{ t('how_long_text', {
          book: bookName,
          chapters: chaptersText(chapterCount),
          verses: versesText(verseCount),
          wpm: WORDS_PER_MINUTE,
          time: readingTime,
        }) }}
        <template v-if="readingMinutes <= 30">
          {{ t('one_sitting') }}
        </template>
      </p>

      <div v-if="chapterCount > 3" class="mbl-table-wrap">
        <table class="mbl-table mbl-table--striped">
          <thead>
            <tr>
              <th>{{ t('pace.header_1') }}</th>
              <th>{{ t('pace.header_2', { book: bookName }) }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pace in paces" :key="pace.label">
              <td>{{ pace.label }}</td>
              <td>{{ t('days_count', { n: formatNumber(pace.days) }, pace.days) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <content-app-callout
        :title="t('callout.title', { book: bookName })"
        :description="t('callout.description')"
        :list="[
          t('callout.item_1', { book: bookName }),
          t('callout.item_2'),
          t('callout.item_3'),
          t('callout.item_4'),
        ]"
        :button-text="t('callout.button')"
        :note="t('callout.note')"
        image-src="/screenshots/en/sc6-book-chapter-progress.webp"
        :image-alt="t('callout.image_alt')"
      />

      <h2>{{ t('chapters_heading', { book: bookName }) }}</h2>
      <p>{{ t('chapters_intro', { book: bookName }) }}</p>
      <ol class="book-chapters">
        <li v-for="chapter in chapters" :key="chapter.number">
          <span class="book-chapter-number">{{ t('chapter_label', { book: bookName, n: chapter.number }) }}</span>
          <span class="book-chapter-verses">{{ versesText(chapter.verses) }}</span>
        </li>
      </ol>

      <h2>{{ t('keep_reading.heading') }}</h2>
      <ul>
        <li v-if="previousBook">
          {{ t('keep_reading.previous') }} <NuxtLink :to="previousBook.path">
            {{ previousBook.name }}
          </NuxtLink>
        </li>
        <li v-if="nextBook">
          {{ t('keep_reading.next') }} <NuxtLink :to="nextBook.path">
            {{ nextBook.name }}
          </NuxtLink>
        </li>
        <li>
          <NuxtLink :to="localePath('/books-of-the-bible')">
            {{ t('keep_reading.all_books') }}
          </NuxtLink>
        </li>
        <li>
          <NuxtLink :to="localePath('/about/guide--how-long-does-it-take-to-read-the-bible')">
            {{ t('keep_reading.how_long_guide') }}
          </NuxtLink>
        </li>
        <li>
          <NuxtLink :to="localePath('/about/guide--bible-reading-plans-compared')">
            {{ t('keep_reading.plans_guide') }}
          </NuxtLink>
        </li>
      </ul>

      <p class="book-footnote">
        {{ t('footnote', { wpm: WORDS_PER_MINUTE }) }}
      </p>
    </article>
    <content-page-footer />
  </main>
</template>

<script setup lang="ts">
import { Bible } from '@mybiblelog/shared';
import ContentPageFooter from '~/components/content/PageFooter.vue';
import ContentAppCallout from '~/components/content/ContentAppCallout.vue';
import { formatKeyPassage, getBookGuide, loadBookOverviews } from '~/helpers/bible-book-content';
import {
  WORDS_PER_MINUTE,
  formatReadingTime,
  getBookReadingMinutes,
  getBookWordCount,
  getDaysAtChaptersPerDay,
  getDaysAtMinutesPerDay,
} from '~/helpers/bible-reading-time';

definePageMeta({ contentPage: true });

const route = useRoute();
const { t, locale } = useI18n();
const localePath = useLocalePath();
const config = useRuntimeConfig();

const bookIndex = Bible.getBookIndexBySlug(String(route.params.book ?? ''));
const guide = getBookGuide(bookIndex);
if (bookIndex < 1 || !guide) {
  throw createError({ statusCode: 404, message: 'Page not found' });
}

const formatNumber = (n: number) => n.toLocaleString(locale.value);
const chaptersText = (n: number) => t('chapters_count', { n: formatNumber(n) }, n);
const versesText = (n: number) => t('verses_count', { n: formatNumber(n) }, n);

const bookName = Bible.getBookName(bookIndex, locale.value);
const testament = t(Bible.isNewTestament(bookIndex) ? 'testament_new' : 'testament_old');
const chapterCount = Bible.getBookChapterCount(bookIndex);
const verseCount = Bible.getBookVerseCount(bookIndex);
const wordCount = getBookWordCount(bookIndex);
const readingMinutes = getBookReadingMinutes(bookIndex);
const readingTime = formatReadingTime(readingMinutes, { hour: t('units.hour'), minute: t('units.minute') });
const keyPassages = guide.keyPassages.map(ref => formatKeyPassage(bookIndex, ref, locale.value));

// Only this book's overview goes into the page payload (the locale's full set is code-split).
const { data: overview } = await useAsyncData(
  () => `book-overview-${locale.value}-${bookIndex}`,
  async () => (await loadBookOverviews(locale.value))[bookIndex - 1] ?? '',
);

const chapters = Array.from({ length: chapterCount }, (_, i) => ({
  number: i + 1,
  verses: Bible.getChapterVerseCount(bookIndex, i + 1),
}));

const paces = [1, 2, 3].map(perDay => ({
  label: t('pace.chapters_per_day', { n: perDay }, perDay),
  days: getDaysAtChaptersPerDay(bookIndex, perDay),
})).concat([{ label: t('pace.minutes_per_day', { n: 10 }), days: getDaysAtMinutesPerDay(bookIndex, 10) }]);

const bookLink = (index: number) => (index >= 1 && index <= Bible.getBookCount()
  ? { name: Bible.getBookName(index, locale.value), path: localePath(`/books-of-the-bible/${Bible.getBookSlug(index)}`) }
  : null);
const previousBook = bookLink(bookIndex - 1);
const nextBook = bookLink(bookIndex + 1);

const siteUrl = config.public.siteUrl as string;
const localeSegment = locale.value === 'en' ? '' : `/${locale.value}`;
const path = `/books-of-the-bible/${Bible.getBookSlug(bookIndex)}`;
const pageUrl = `${siteUrl}${localeSegment}${path}`;
const chaptersTitle = t('chapters_title', { n: chapterCount }, chapterCount);
const seoTitle = t('seo.title', { book: bookName, chapters: chaptersTitle });
const seoDescription = t('seo.description', { book: bookName });

useContentSeo({
  path,
  locale,
  ogType: 'article',
  seoTitle,
  seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  structuredData: [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('home'), item: `${siteUrl}${localeSegment || '/'}` },
        { '@type': 'ListItem', position: 2, name: t('hub'), item: `${siteUrl}${localeSegment}/books-of-the-bible` },
        { '@type': 'ListItem', position: 3, name: bookName, item: pageUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: seoTitle,
      description: seoDescription,
      url: pageUrl,
      inLanguage: locale.value,
      about: {
        '@type': 'Book',
        name: bookName,
        isPartOf: { '@type': 'Book', name: t('hub') },
      },
    },
  ],
});
</script>

<style scoped>
.book-breadcrumb {
  margin-bottom: var(--mbl-space-md);
  font-size: 0.9rem;
  color: var(--mbl-text-muted);
}

.book-section-label {
  color: var(--mbl-text-muted);
}

.book-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--mbl-space-md);
  margin: var(--mbl-space-xl) 0;
}

@mixin mbl-mobile {
  .book-stats { grid-template-columns: repeat(2, 1fr); }
}

.book-stat {
  padding: var(--mbl-space-md);
  border: 1px solid var(--mbl-border);
  border-radius: var(--mbl-radius-xl);
  background: var(--mbl-bg-subtle);
  text-align: center;
}

.book-stat dt {
  font-size: 0.85rem;
  color: var(--mbl-text-muted);
}

.book-stat dd {
  margin: 0;
  font-size: var(--mbl-title-5);
  font-weight: 700;
  color: var(--mbl-text-strong);
}

.mbl-content .book-chapters {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--mbl-space-xs);
  margin: var(--mbl-space-md) 0;
  list-style: none;
}

.book-chapters li {
  display: flex;
  justify-content: space-between;
  margin: 0;
  padding: var(--mbl-space-xs) var(--mbl-space-sm);
  border: 1px solid var(--mbl-border-soft);
  border-radius: var(--mbl-radius-md);
  font-size: 0.9rem;
}

.book-chapter-verses {
  color: var(--mbl-text-muted);
}

.book-footnote {
  margin-top: var(--mbl-space-2xl);
  font-size: 0.85rem;
  color: var(--mbl-text-muted);
}
</style>

<i18n lang="json">
{
  "en": {
    "breadcrumb_label": "Breadcrumb",
    "hub": "Books of the Bible",
    "h1": "{book}: Chapters, Verses & Reading Time",
    "meta_line": "{testament} · {section} · Book {n} of 66",
    "testament_old": "Old Testament",
    "testament_new": "New Testament",
    "section": {
      "law": "Law",
      "history": "History",
      "poetry_wisdom": "Poetry & Wisdom",
      "major_prophets": "Major Prophets",
      "minor_prophets": "Minor Prophets",
      "gospels": "Gospels",
      "letters_of_paul": "Letters of Paul",
      "general_letters": "General Letters",
      "prophecy": "Prophecy"
    },
    "stat": {
      "chapters": "Chapters",
      "verses": "Verses",
      "words": "Words*",
      "reading_time": "Reading time*"
    },
    "about_heading": "About {book}",
    "well_known": "Well-known passages:",
    "how_long_heading": "How long does it take to read {book}?",
    "how_long_text": "{book} has {chapters} and {verses}. At an average adult reading speed of {wpm} words per minute, reading all of {book} takes about {time}.",
    "one_sitting": "You can easily read it in one sitting.",
    "chapters_count": "{n} chapter | {n} chapters",
    "chapters_title": "{n} Chapter | {n} Chapters",
    "verses_count": "{n} verse | {n} verses",
    "days_count": "{n} day | {n} days",
    "pace": {
      "header_1": "If you read…",
      "header_2": "You'll finish {book} in",
      "chapters_per_day": "{n} chapter a day | {n} chapters a day",
      "minutes_per_day": "{n} minutes a day"
    },
    "callout": {
      "title": "Track your reading of {book}",
      "description": "My Bible Log is a free Bible reading tracker. Check off chapters as you read them, in any order, and watch your progress grow.",
      "item_1": "See exactly which chapters of {book} you've read",
      "item_2": "Set a daily goal and get a predicted finish date",
      "item_3": "Take notes and tag passages as you study",
      "item_4": "Works with any reading plan — or none at all",
      "image_alt": "My Bible Log showing reading progress through each chapter of a Bible book",
      "button": "Start Tracking Free",
      "note": "Completely free. No ads. Sign up with email or Google."
    },
    "chapters_heading": "Chapters of {book}",
    "chapters_intro": "The number of verses in each chapter of {book}:",
    "chapter_label": "{book} {n}",
    "keep_reading": {
      "heading": "Keep reading",
      "previous": "Previous book:",
      "next": "Next book:",
      "all_books": "All 66 books of the Bible",
      "how_long_guide": "How long does it take to read the Bible?",
      "plans_guide": "Bible reading plans compared"
    },
    "footnote": "* Word counts are from the Berean Standard Bible (public domain), an English translation. Reading time assumes {wpm} words per minute, the average adult silent reading speed for English non-fiction; your pace, language, and translation will vary. Verse counts follow the versification My Bible Log uses for tracking.",
    "units": {
      "hour": "hr",
      "minute": "min"
    },
    "seo": {
      "title": "{book}: {chapters}, Summary & Reading Time",
      "description": "How many chapters and verses are in {book}, how long it takes to read, and a short overview of the book. Track your reading of {book} free with My Bible Log."
    },
    "home": "Home"
  },
  "de": {
    "breadcrumb_label": "Brotkrumennavigation",
    "hub": "Bücher der Bibel",
    "h1": "{book}: Kapitel, Verse & Lesezeit",
    "meta_line": "{testament} · {section} · Buch {n} von 66",
    "testament_old": "Altes Testament",
    "testament_new": "Neues Testament",
    "section": {
      "law": "Gesetz",
      "history": "Geschichtsbücher",
      "poetry_wisdom": "Poesie & Weisheit",
      "major_prophets": "Große Propheten",
      "minor_prophets": "Kleine Propheten",
      "gospels": "Evangelien",
      "letters_of_paul": "Briefe des Paulus",
      "general_letters": "Allgemeine Briefe",
      "prophecy": "Prophetie"
    },
    "stat": {
      "chapters": "Kapitel",
      "verses": "Verse",
      "words": "Wörter*",
      "reading_time": "Lesezeit*"
    },
    "about_heading": "Über {book}",
    "well_known": "Bekannte Stellen:",
    "how_long_heading": "Wie lange dauert es, {book} zu lesen?",
    "how_long_text": "{book} hat {chapters} und {verses}. Bei einer durchschnittlichen Lesegeschwindigkeit von {wpm} Wörtern pro Minute dauert es etwa {time}, {book} ganz zu lesen.",
    "one_sitting": "Das lässt sich bequem in einem Zug lesen.",
    "chapters_count": "{n} Kapitel",
    "chapters_title": "{n} Kapitel",
    "verses_count": "{n} Vers | {n} Verse",
    "days_count": "{n} Tag | {n} Tage",
    "pace": {
      "header_1": "Wenn Sie lesen …",
      "header_2": "Sie sind mit {book} fertig in",
      "chapters_per_day": "{n} Kapitel pro Tag",
      "minutes_per_day": "{n} Minuten pro Tag"
    },
    "callout": {
      "title": "Halten Sie fest, was Sie in {book} gelesen haben",
      "description": "My Bible Log ist ein kostenloser Bibellese-Tracker. Haken Sie Kapitel ab, sobald Sie sie gelesen haben – in beliebiger Reihenfolge – und sehen Sie Ihren Fortschritt wachsen.",
      "item_1": "Sehen Sie genau, welche Kapitel von {book} Sie schon gelesen haben",
      "item_2": "Setzen Sie ein Tagesziel und erhalten Sie ein voraussichtliches Enddatum",
      "item_3": "Machen Sie Notizen und versehen Sie Bibelstellen mit Tags",
      "item_4": "Funktioniert mit jedem Leseplan – oder ganz ohne",
      "image_alt": "My Bible Log zeigt den Lesefortschritt durch die einzelnen Kapitel eines Bibelbuchs",
      "button": "Kostenlos loslegen",
      "note": "Völlig kostenlos. Keine Werbung. Mit E-Mail oder Google anmelden."
    },
    "chapters_heading": "Die Kapitel von {book}",
    "chapters_intro": "So viele Verse hat jedes Kapitel von {book}:",
    "chapter_label": "{book} {n}",
    "keep_reading": {
      "heading": "Weiterlesen",
      "previous": "Vorheriges Buch:",
      "next": "Nächstes Buch:",
      "all_books": "Alle 66 Bücher der Bibel",
      "how_long_guide": "Wie lange dauert es, die Bibel zu lesen?",
      "plans_guide": "Bibelleseplan-Vergleich"
    },
    "footnote": "* Die Wortzahlen stammen aus der Berean Standard Bible (gemeinfrei), einer englischen Übersetzung. Die Lesezeit geht von {wpm} Wörtern pro Minute aus, der durchschnittlichen stillen Lesegeschwindigkeit Erwachsener bei englischen Sachtexten; Ihr Tempo, Ihre Sprache und Ihre Übersetzung können abweichen. Die Verszahlen folgen der Verszählung, die My Bible Log für das Tracking verwendet.",
    "units": {
      "hour": "Std.",
      "minute": "Min."
    },
    "seo": {
      "title": "{book}: {chapters}, Zusammenfassung & Lesezeit",
      "description": "Wie viele Kapitel und Verse hat {book}, wie lange dauert das Lesen und was steht drin? Ein kurzer Überblick – und Ihr Lesen in {book} kostenlos festhalten mit My Bible Log."
    },
    "home": "Startseite"
  },
  "es": {
    "breadcrumb_label": "Ruta de navegación",
    "hub": "Libros de la Biblia",
    "h1": "{book}: capítulos, versículos y tiempo de lectura",
    "meta_line": "{testament} · {section} · Libro {n} de 66",
    "testament_old": "Antiguo Testamento",
    "testament_new": "Nuevo Testamento",
    "section": {
      "law": "La Ley",
      "history": "Libros históricos",
      "poetry_wisdom": "Poesía y sabiduría",
      "major_prophets": "Profetas mayores",
      "minor_prophets": "Profetas menores",
      "gospels": "Evangelios",
      "letters_of_paul": "Cartas de Pablo",
      "general_letters": "Cartas generales",
      "prophecy": "Profecía"
    },
    "stat": {
      "chapters": "Capítulos",
      "verses": "Versículos",
      "words": "Palabras*",
      "reading_time": "Tiempo de lectura*"
    },
    "about_heading": "Acerca de {book}",
    "well_known": "Pasajes conocidos:",
    "how_long_heading": "¿Cuánto se tarda en leer {book}?",
    "how_long_text": "{book} tiene {chapters} y {verses}. A una velocidad de lectura media de {wpm} palabras por minuto, leer {book} completo lleva unos {time}.",
    "one_sitting": "Se puede leer con facilidad de una sola vez.",
    "chapters_count": "{n} capítulo | {n} capítulos",
    "chapters_title": "{n} capítulo | {n} capítulos",
    "verses_count": "{n} versículo | {n} versículos",
    "days_count": "{n} día | {n} días",
    "pace": {
      "header_1": "Si lees…",
      "header_2": "Terminarás {book} en",
      "chapters_per_day": "{n} capítulo al día | {n} capítulos al día",
      "minutes_per_day": "{n} minutos al día"
    },
    "callout": {
      "title": "Registra tu lectura de {book}",
      "description": "My Bible Log es un registro gratuito de lectura bíblica. Marca los capítulos a medida que los lees, en el orden que quieras, y mira cómo crece tu avance.",
      "item_1": "Mira exactamente qué capítulos de {book} ya leíste",
      "item_2": "Fija una meta diaria y obtén una fecha estimada de finalización",
      "item_3": "Toma notas y etiqueta los pasajes mientras estudias",
      "item_4": "Funciona con cualquier plan de lectura, o sin ninguno",
      "image_alt": "My Bible Log mostrando el avance de lectura por cada capítulo de un libro de la Biblia",
      "button": "Empieza gratis",
      "note": "Totalmente gratis. Sin anuncios. Regístrate con correo o con Google."
    },
    "chapters_heading": "Los capítulos de {book}",
    "chapters_intro": "Número de versículos de cada capítulo de {book}:",
    "chapter_label": "{book} {n}",
    "keep_reading": {
      "heading": "Sigue leyendo",
      "previous": "Libro anterior:",
      "next": "Libro siguiente:",
      "all_books": "Los 66 libros de la Biblia",
      "how_long_guide": "¿Cuánto se tarda en leer la Biblia?",
      "plans_guide": "Planes de lectura bíblica comparados"
    },
    "footnote": "* El número de palabras procede de la Berean Standard Bible (dominio público), una traducción al inglés. El tiempo de lectura supone {wpm} palabras por minuto, la velocidad media de lectura silenciosa de un adulto con textos no literarios en inglés; tu ritmo, tu idioma y tu traducción pueden variar. El número de versículos sigue la versificación que My Bible Log usa para el seguimiento.",
    "units": {
      "hour": "h",
      "minute": "min"
    },
    "seo": {
      "title": "{book}: {chapters}, resumen y tiempo de lectura",
      "description": "Cuántos capítulos y versículos tiene {book}, cuánto se tarda en leerlo y un breve resumen del libro. Registra gratis tu lectura de {book} con My Bible Log."
    },
    "home": "Inicio"
  },
  "fr": {
    "breadcrumb_label": "Fil d'Ariane",
    "hub": "Livres de la Bible",
    "h1": "{book} : chapitres, versets et durée de lecture",
    "meta_line": "{testament} · {section} · Livre {n} sur 66",
    "testament_old": "Ancien Testament",
    "testament_new": "Nouveau Testament",
    "section": {
      "law": "La Loi",
      "history": "Livres historiques",
      "poetry_wisdom": "Poésie et sagesse",
      "major_prophets": "Grands prophètes",
      "minor_prophets": "Petits prophètes",
      "gospels": "Évangiles",
      "letters_of_paul": "Lettres de Paul",
      "general_letters": "Lettres générales",
      "prophecy": "Prophétie"
    },
    "stat": {
      "chapters": "Chapitres",
      "verses": "Versets",
      "words": "Mots*",
      "reading_time": "Durée de lecture*"
    },
    "about_heading": "À propos de {book}",
    "well_known": "Passages connus :",
    "how_long_heading": "Combien de temps faut-il pour lire {book} ?",
    "how_long_text": "{book} compte {chapters} et {verses}. À une vitesse de lecture moyenne de {wpm} mots par minute pour un adulte, lire {book} en entier prend environ {time}.",
    "one_sitting": "On peut facilement le lire d'une seule traite.",
    "chapters_count": "{n} chapitre | {n} chapitres",
    "chapters_title": "{n} chapitre | {n} chapitres",
    "verses_count": "{n} verset | {n} versets",
    "days_count": "{n} jour | {n} jours",
    "pace": {
      "header_1": "Si vous lisez…",
      "header_2": "Vous aurez terminé {book} en",
      "chapters_per_day": "{n} chapitre par jour | {n} chapitres par jour",
      "minutes_per_day": "{n} minutes par jour"
    },
    "callout": {
      "title": "Suivez votre lecture de {book}",
      "description": "My Bible Log est un suivi de lecture biblique gratuit. Cochez les chapitres au fur et à mesure, dans l'ordre de votre choix, et regardez votre progression grandir.",
      "item_1": "Voyez précisément quels chapitres de {book} vous avez lus",
      "item_2": "Fixez un objectif quotidien et obtenez une date de fin estimée",
      "item_3": "Prenez des notes et ajoutez des étiquettes aux passages que vous étudiez",
      "item_4": "Compatible avec n'importe quel plan de lecture, ou sans plan du tout",
      "image_alt": "My Bible Log affichant la progression de lecture dans chaque chapitre d'un livre de la Bible",
      "button": "Commencer gratuitement",
      "note": "Entièrement gratuit. Sans publicité. Inscription par e-mail ou avec Google."
    },
    "chapters_heading": "Les chapitres de {book}",
    "chapters_intro": "Nombre de versets de chaque chapitre de {book} :",
    "chapter_label": "{book} {n}",
    "keep_reading": {
      "heading": "Continuer à lire",
      "previous": "Livre précédent :",
      "next": "Livre suivant :",
      "all_books": "Les 66 livres de la Bible",
      "how_long_guide": "Combien de temps faut-il pour lire la Bible ?",
      "plans_guide": "Plans de lecture de la Bible comparés"
    },
    "footnote": "* Le nombre de mots provient de la Berean Standard Bible (domaine public), une traduction anglaise. La durée de lecture suppose {wpm} mots par minute, la vitesse moyenne de lecture silencieuse d'un adulte pour un texte non littéraire en anglais ; votre rythme, votre langue et votre traduction peuvent différer. Le nombre de versets suit la numérotation utilisée par My Bible Log pour le suivi.",
    "units": {
      "hour": "h",
      "minute": "min"
    },
    "seo": {
      "title": "{book} : {chapters}, résumé et durée de lecture",
      "description": "Combien de chapitres et de versets compte {book}, combien de temps faut-il pour le lire, et un bref aperçu du livre. Suivez gratuitement votre lecture de {book} avec My Bible Log."
    },
    "home": "Accueil"
  },
  "pt": {
    "breadcrumb_label": "Trilha de navegação",
    "hub": "Livros da Bíblia",
    "h1": "{book}: capítulos, versículos e tempo de leitura",
    "meta_line": "{testament} · {section} · Livro {n} de 66",
    "testament_old": "Antigo Testamento",
    "testament_new": "Novo Testamento",
    "section": {
      "law": "A Lei",
      "history": "Livros históricos",
      "poetry_wisdom": "Poesia e sabedoria",
      "major_prophets": "Profetas maiores",
      "minor_prophets": "Profetas menores",
      "gospels": "Evangelhos",
      "letters_of_paul": "Cartas de Paulo",
      "general_letters": "Cartas gerais",
      "prophecy": "Profecia"
    },
    "stat": {
      "chapters": "Capítulos",
      "verses": "Versículos",
      "words": "Palavras*",
      "reading_time": "Tempo de leitura*"
    },
    "about_heading": "Sobre {book}",
    "well_known": "Passagens conhecidas:",
    "how_long_heading": "Quanto tempo leva para ler {book}?",
    "how_long_text": "{book} tem {chapters} e {verses}. Com a velocidade média de leitura de um adulto, de {wpm} palavras por minuto, ler {book} inteiro leva cerca de {time}.",
    "one_sitting": "Dá para ler tranquilamente de uma só vez.",
    "chapters_count": "{n} capítulo | {n} capítulos",
    "chapters_title": "{n} capítulo | {n} capítulos",
    "verses_count": "{n} versículo | {n} versículos",
    "days_count": "{n} dia | {n} dias",
    "pace": {
      "header_1": "Se você ler…",
      "header_2": "Você termina {book} em",
      "chapters_per_day": "{n} capítulo por dia | {n} capítulos por dia",
      "minutes_per_day": "{n} minutos por dia"
    },
    "callout": {
      "title": "Registre sua leitura de {book}",
      "description": "O My Bible Log é um registro gratuito de leitura da Bíblia. Marque os capítulos conforme você lê, na ordem que quiser, e veja seu progresso crescer.",
      "item_1": "Veja exatamente quais capítulos de {book} você já leu",
      "item_2": "Defina uma meta diária e receba uma data prevista de conclusão",
      "item_3": "Faça anotações e marque passagens com etiquetas enquanto estuda",
      "item_4": "Funciona com qualquer plano de leitura, ou sem plano nenhum",
      "image_alt": "My Bible Log mostrando o progresso de leitura em cada capítulo de um livro da Bíblia",
      "button": "Comece grátis",
      "note": "Totalmente grátis. Sem anúncios. Cadastre-se com e-mail ou Google."
    },
    "chapters_heading": "Os capítulos de {book}",
    "chapters_intro": "Número de versículos em cada capítulo de {book}:",
    "chapter_label": "{book} {n}",
    "keep_reading": {
      "heading": "Continue lendo",
      "previous": "Livro anterior:",
      "next": "Próximo livro:",
      "all_books": "Os 66 livros da Bíblia",
      "how_long_guide": "Quanto tempo leva para ler a Bíblia?",
      "plans_guide": "Planos de leitura da Bíblia comparados"
    },
    "footnote": "* A contagem de palavras vem da Berean Standard Bible (domínio público), uma tradução em inglês. O tempo de leitura considera {wpm} palavras por minuto, a velocidade média de leitura silenciosa de um adulto em textos não literários em inglês; seu ritmo, seu idioma e sua tradução podem variar. A contagem de versículos segue a versificação que o My Bible Log usa no acompanhamento.",
    "units": {
      "hour": "h",
      "minute": "min"
    },
    "seo": {
      "title": "{book}: {chapters}, resumo e tempo de leitura",
      "description": "Quantos capítulos e versículos tem {book}, quanto tempo leva para ler e um resumo breve do livro. Registre grátis sua leitura de {book} com o My Bible Log."
    },
    "home": "Início"
  },
  "uk": {
    "breadcrumb_label": "Навігаційний ланцюжок",
    "hub": "Книги Біблії",
    "h1": "{book}: розділи, вірші та час читання",
    "meta_line": "{testament} · {section} · Книга {n} із 66",
    "testament_old": "Старий Заповіт",
    "testament_new": "Новий Заповіт",
    "section": {
      "law": "Закон",
      "history": "Історичні книги",
      "poetry_wisdom": "Поезія та мудрість",
      "major_prophets": "Великі пророки",
      "minor_prophets": "Малі пророки",
      "gospels": "Євангелії",
      "letters_of_paul": "Послання Павла",
      "general_letters": "Соборні послання",
      "prophecy": "Пророцтво"
    },
    "stat": {
      "chapters": "Розділи",
      "verses": "Вірші",
      "words": "Слова*",
      "reading_time": "Час читання*"
    },
    "about_heading": "Про книгу: {book}",
    "well_known": "Відомі місця:",
    "how_long_heading": "Скільки часу потрібно, щоб прочитати книгу {book}?",
    "how_long_text": "У книзі {book}: {chapters} і {verses}. За середньої швидкості читання дорослого — {wpm} слів на хвилину — прочитати всю книгу {book} можна приблизно за {time}.",
    "one_sitting": "Її легко прочитати за один раз.",
    "chapters_count": "{n} розділ | {n} розділи | {n} розділів",
    "chapters_title": "{n} розділ | {n} розділи | {n} розділів",
    "verses_count": "{n} вірш | {n} вірші | {n} віршів",
    "days_count": "{n} день | {n} дні | {n} днів",
    "pace": {
      "header_1": "Якщо ви читаєте…",
      "header_2": "Ви завершите книгу {book} за",
      "chapters_per_day": "{n} розділ на день | {n} розділи на день | {n} розділів на день",
      "minutes_per_day": "{n} хвилин на день"
    },
    "callout": {
      "title": "Відстежуйте читання: книга {book}",
      "description": "My Bible Log — безкоштовний трекер читання Біблії. Позначайте розділи, щойно прочитали їх, у будь-якому порядку, і спостерігайте, як зростає ваш поступ.",
      "item_1": "Одразу бачте, які розділи книги {book} ви вже прочитали",
      "item_2": "Ставте щоденну мету та отримуйте орієнтовну дату завершення",
      "item_3": "Робіть нотатки й позначайте уривки тегами під час вивчення",
      "item_4": "Підходить до будь-якого плану читання — або без плану взагалі",
      "image_alt": "My Bible Log показує поступ читання за розділами книги Біблії",
      "button": "Почати безкоштовно",
      "note": "Цілком безкоштовно. Без реклами. Реєстрація через пошту або Google."
    },
    "chapters_heading": "Розділи книги {book}",
    "chapters_intro": "Кількість віршів у кожному розділі книги {book}:",
    "chapter_label": "{book} {n}",
    "keep_reading": {
      "heading": "Читайте далі",
      "previous": "Попередня книга:",
      "next": "Наступна книга:",
      "all_books": "Усі 66 книг Біблії",
      "how_long_guide": "Скільки часу потрібно, щоб прочитати Біблію?",
      "plans_guide": "Порівняння планів читання Біблії"
    },
    "footnote": "* Кількість слів взято з Berean Standard Bible (суспільне надбання) — англійського перекладу. Час читання розраховано за {wpm} слів на хвилину — середньої швидкості мовчазного читання дорослого під час читання англомовних нехудожніх текстів; ваш темп, мова та переклад можуть відрізнятися. Кількість віршів відповідає нумерації, яку My Bible Log використовує для відстеження.",
    "units": {
      "hour": "год",
      "minute": "хв"
    },
    "seo": {
      "title": "{book}: {chapters}, короткий зміст і час читання",
      "description": "Скільки розділів і віршів у книзі {book}, скільки часу потрібно, щоб її прочитати, і короткий огляд книги. Безкоштовно відстежуйте читання книги {book} у My Bible Log."
    },
    "home": "Головна"
  },
  "ko": {
    "breadcrumb_label": "현재 위치",
    "hub": "성경 66권",
    "h1": "{book}: 장 수, 절 수, 읽는 시간",
    "meta_line": "{testament} · {section} · 66권 중 {n}번째 책",
    "testament_old": "구약",
    "testament_new": "신약",
    "section": {
      "law": "율법서",
      "history": "역사서",
      "poetry_wisdom": "시가서",
      "major_prophets": "대예언서",
      "minor_prophets": "소예언서",
      "gospels": "복음서",
      "letters_of_paul": "바울 서신",
      "general_letters": "일반 서신",
      "prophecy": "예언서"
    },
    "stat": {
      "chapters": "장",
      "verses": "절",
      "words": "단어 수*",
      "reading_time": "읽는 시간*"
    },
    "about_heading": "{book} 소개",
    "well_known": "잘 알려진 구절:",
    "how_long_heading": "{book} 읽는 데 얼마나 걸릴까요?",
    "how_long_text": "{book}의 분량은 {chapters}, {verses}입니다. 성인 평균 읽기 속도인 분당 {wpm}단어로 계산하면 {book} 전체를 읽는 데 약 {time}이 걸립니다.",
    "one_sitting": "한 번에 편하게 읽을 수 있는 분량입니다.",
    "chapters_count": "{n}장",
    "chapters_title": "{n}장",
    "verses_count": "{n}절",
    "days_count": "{n}일",
    "pace": {
      "header_1": "이렇게 읽으면",
      "header_2": "{book} 완독까지 걸리는 기간",
      "chapters_per_day": "하루 {n}장",
      "minutes_per_day": "하루 {n}분"
    },
    "callout": {
      "title": "{book} 읽기 기록하기",
      "description": "My Bible Log는 무료 성경읽기 기록 서비스입니다. 읽은 장을 순서에 관계없이 체크하고, 진도가 쌓이는 모습을 확인해 보세요.",
      "item_1": "{book}에서 어느 장을 읽었는지 바로 확인할 수 있습니다",
      "item_2": "하루 목표를 정하고 완독 예상 날짜를 확인할 수 있습니다",
      "item_3": "공부하면서 메모를 남기고 구절에 태그를 붙일 수 있습니다",
      "item_4": "어떤 읽기 계획과도 함께 쓸 수 있고, 계획이 없어도 됩니다",
      "image_alt": "성경 한 권의 각 장별 읽기 진도를 보여 주는 My Bible Log 화면",
      "button": "무료로 시작하기",
      "note": "완전 무료입니다. 광고가 없습니다. 이메일 또는 Google로 가입하세요."
    },
    "chapters_heading": "{book}의 장별 구성",
    "chapters_intro": "{book}의 각 장에 담긴 절 수입니다.",
    "chapter_label": "{book} {n}장",
    "keep_reading": {
      "heading": "이어서 읽기",
      "previous": "이전 책:",
      "next": "다음 책:",
      "all_books": "성경 66권 전체 보기",
      "how_long_guide": "성경을 다 읽는 데 얼마나 걸릴까요?",
      "plans_guide": "성경 읽기 계획 비교"
    },
    "footnote": "* 단어 수는 영어 번역본인 Berean Standard Bible(퍼블릭 도메인)을 기준으로 한 것입니다. 읽는 시간은 영어 비문학 텍스트를 읽는 성인의 평균 묵독 속도인 분당 {wpm}단어를 기준으로 계산했으며, 읽는 속도와 언어, 번역본에 따라 달라질 수 있습니다. 절 수는 My Bible Log가 진도 기록에 사용하는 절 구분을 따릅니다.",
    "units": {
      "hour": "시간",
      "minute": "분"
    },
    "seo": {
      "title": "{book}: {chapters}, 줄거리와 읽는 시간",
      "description": "{book}의 장 수와 절 수, 읽는 데 걸리는 시간, 책의 간단한 소개를 확인하고, My Bible Log로 {book} 읽기를 무료로 기록해 보세요."
    },
    "home": "홈"
  }
}
</i18n>
