<template>
  <main role="main">
    <article class="content-column mbl-content">
      <nav class="book-breadcrumb" aria-label="Breadcrumb">
        <NuxtLink to="/books-of-the-bible">
          Books of the Bible
        </NuxtLink>
        <span aria-hidden="true"> › </span>
        <span>{{ bookName }}</span>
      </nav>

      <h1>{{ bookName }}: Chapters, Verses &amp; Reading Time</h1>
      <p class="book-section-label">
        {{ testament }} · {{ guide.section }} · Book {{ bookIndex }} of 66
      </p>

      <dl class="book-stats">
        <div class="book-stat">
          <dt>Chapters</dt>
          <dd>{{ chapterCount }}</dd>
        </div>
        <div class="book-stat">
          <dt>Verses</dt>
          <dd>{{ verseCount.toLocaleString('en-US') }}</dd>
        </div>
        <div class="book-stat">
          <dt>Words*</dt>
          <dd>{{ wordCount.toLocaleString('en-US') }}</dd>
        </div>
        <div class="book-stat">
          <dt>Reading time*</dt>
          <dd>{{ readingTime }}</dd>
        </div>
      </dl>

      <h2>About {{ bookName }}</h2>
      <p>{{ guide.overview }}</p>
      <p>
        <strong>Well-known passages:</strong> {{ guide.keyPassages.join(' · ') }}
      </p>

      <h2>How long does it take to read {{ bookName }}?</h2>
      <p>
        {{ bookName }} has {{ chapterCount }} {{ chapterCount === 1 ? 'chapter' : 'chapters' }} and
        {{ verseCount.toLocaleString('en-US') }} verses. At an average adult reading speed of
        {{ WORDS_PER_MINUTE }} words per minute, reading all of {{ bookName }} takes about
        <strong>{{ readingTime }}</strong>.
        <template v-if="readingMinutes <= 30">
          You can easily read it in one sitting.
        </template>
      </p>

      <div v-if="chapterCount > 3" class="mbl-table-wrap">
        <table class="mbl-table mbl-table--striped">
          <thead>
            <tr>
              <th>If you read…</th>
              <th>You'll finish {{ bookName }} in</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pace in paces" :key="pace.label">
              <td>{{ pace.label }}</td>
              <td>{{ pace.days }} {{ pace.days === 1 ? 'day' : 'days' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <content-app-callout
        :title="`Track your reading of ${bookName}`"
        description="My Bible Log is a free Bible reading tracker. Check off chapters as you read them, in any order, and watch your progress grow."
        :list="[
          `See exactly which chapters of ${bookName} you've read`,
          'Set a daily goal and get a predicted finish date',
          'Take notes and tag passages as you study',
          'Works with any reading plan — or none at all',
        ]"
        image-src="/screenshots/en/sc6-book-chapter-progress.webp"
        image-alt="My Bible Log showing reading progress through each chapter of a Bible book"
      />

      <h2>Chapters of {{ bookName }}</h2>
      <p>The number of verses in each chapter of {{ bookName }}:</p>
      <ol class="book-chapters">
        <li v-for="chapter in chapters" :key="chapter.number">
          <span class="book-chapter-number">{{ bookName }} {{ chapter.number }}</span>
          <span class="book-chapter-verses">{{ chapter.verses }} verses</span>
        </li>
      </ol>

      <h2>Keep reading</h2>
      <ul>
        <li v-if="previousBook">
          Previous book: <NuxtLink :to="previousBook.path">
            {{ previousBook.name }}
          </NuxtLink>
        </li>
        <li v-if="nextBook">
          Next book: <NuxtLink :to="nextBook.path">
            {{ nextBook.name }}
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/books-of-the-bible">
            All 66 books of the Bible
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/about/guide--how-long-does-it-take-to-read-the-bible">
            How long does it take to read the Bible?
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/about/guide--bible-reading-plans-compared">
            Bible reading plans compared
          </NuxtLink>
        </li>
      </ul>

      <p class="book-footnote">
        * Word counts are from the Berean Standard Bible (public domain). Reading time assumes
        {{ WORDS_PER_MINUTE }} words per minute, the average adult silent reading speed for
        non-fiction; your pace and translation will vary. Verse counts follow the versification
        My Bible Log uses for tracking.
      </p>
    </article>
    <content-page-footer />
  </main>
</template>

<script setup lang="ts">
import { Bible } from '@mybiblelog/shared';
import ContentPageFooter from '~/components/content/PageFooter.vue';
import ContentAppCallout from '~/components/content/ContentAppCallout.vue';
import bibleBookGuides from '~/helpers/bible-book-guides';
import {
  WORDS_PER_MINUTE,
  formatReadingTime,
  getBookReadingMinutes,
  getBookWordCount,
  getDaysAtChaptersPerDay,
  getDaysAtMinutesPerDay,
} from '~/helpers/bible-reading-time';

// The book guide pages are English-only for now (their prose isn't translated).
defineI18nRoute({ locales: ['en'] });
definePageMeta({ contentPage: true });

const route = useRoute();
const { locale } = useI18n();
const config = useRuntimeConfig();

const bookIndex = Bible.getBookIndexBySlug(String(route.params.book ?? ''));
const guide = bibleBookGuides[bookIndex - 1];
if (bookIndex < 1 || !guide) {
  throw createError({ statusCode: 404, message: 'Page not found' });
}

const bookName = Bible.getBookName(bookIndex);
const testament = Bible.isNewTestament(bookIndex) ? 'New Testament' : 'Old Testament';
const chapterCount = Bible.getBookChapterCount(bookIndex);
const verseCount = Bible.getBookVerseCount(bookIndex);
const wordCount = getBookWordCount(bookIndex);
const readingMinutes = getBookReadingMinutes(bookIndex);
const readingTime = formatReadingTime(readingMinutes);

const chapters = Array.from({ length: chapterCount }, (_, i) => ({
  number: i + 1,
  verses: Bible.getChapterVerseCount(bookIndex, i + 1),
}));

const paces = [
  { label: '1 chapter a day', days: getDaysAtChaptersPerDay(bookIndex, 1) },
  { label: '2 chapters a day', days: getDaysAtChaptersPerDay(bookIndex, 2) },
  { label: '3 chapters a day', days: getDaysAtChaptersPerDay(bookIndex, 3) },
  { label: '10 minutes a day', days: getDaysAtMinutesPerDay(bookIndex, 10) },
];

const bookLink = (index: number) => (index >= 1 && index <= Bible.getBookCount()
  ? { name: Bible.getBookName(index), path: `/books-of-the-bible/${Bible.getBookSlug(index)}` }
  : null);
const previousBook = bookLink(bookIndex - 1);
const nextBook = bookLink(bookIndex + 1);

const siteUrl = config.public.siteUrl as string;
const path = `/books-of-the-bible/${Bible.getBookSlug(bookIndex)}`;
const seoTitle = `${bookName}: ${chapterCount} ${chapterCount === 1 ? 'Chapter' : 'Chapters'}, Summary & Reading Time`;
const seoDescription = `How many chapters and verses are in ${bookName}, how long it takes to read, and a short overview of the book. Track your reading of ${bookName} free with My Bible Log.`;

useContentSeo({
  path,
  locale,
  locales: ['en'],
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
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: 'Books of the Bible', item: `${siteUrl}/books-of-the-bible` },
        { '@type': 'ListItem', position: 3, name: bookName, item: `${siteUrl}${path}` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: seoTitle,
      description: seoDescription,
      url: `${siteUrl}${path}`,
      inLanguage: 'en',
      about: {
        '@type': 'Book',
        name: bookName,
        isPartOf: { '@type': 'Book', name: 'The Bible' },
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
