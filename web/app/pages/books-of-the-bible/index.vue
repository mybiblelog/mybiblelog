<template>
  <main role="main">
    <article class="content-column mbl-content">
      <h1>Books of the Bible: All 66 Books with Chapters, Verses &amp; Reading Time</h1>
      <p>
        The Protestant Bible contains <strong>66 books</strong>: 39 in the Old Testament and 27 in the
        New Testament. Together they have <strong>{{ totalChapters.toLocaleString('en-US') }} chapters</strong>
        and <strong>{{ totalVerses.toLocaleString('en-US') }} verses</strong>. At an average adult reading
        speed, reading the whole Bible takes about <strong>{{ totalHours }} hours</strong>.
      </p>
      <p>
        Choose a book below to see its chapters, verse counts, reading time, and a short overview.
        Or learn <NuxtLink to="/about/guide--how-long-does-it-take-to-read-the-bible">
          how long it takes to read the Bible
        </NuxtLink> at different paces.
      </p>

      <section v-for="group in groups" :key="group.testament">
        <h2>{{ group.testament }} ({{ group.books.length }} books)</h2>
        <template v-for="section in group.sections" :key="section.name">
          <h3>{{ section.name }}</h3>
          <div class="mbl-table-wrap">
            <table class="mbl-table mbl-table--striped">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Chapters</th>
                  <th>Verses</th>
                  <th>Reading time*</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="book in section.books" :key="book.index">
                  <td>
                    <NuxtLink :to="book.path">
                      {{ book.name }}
                    </NuxtLink>
                  </td>
                  <td>{{ book.chapters }}</td>
                  <td>{{ book.verses.toLocaleString('en-US') }}</td>
                  <td>{{ book.readingTime }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <content-app-callout
          v-if="group.testament === 'Old Testament'"
          title="Track every book you read"
          description="My Bible Log is a free Bible reading tracker. Log the chapters you read from any plan, sermon, or small group, and see your progress across all 66 books."
          :list="[
            'Check off chapters in any order',
            'Set a daily goal and see when you will finish',
            'Take notes and organize them with tags',
          ]"
          image-src="/screenshots/en/sc7-bible-progress.webp"
          image-alt="My Bible Log showing reading progress across every book of the Bible"
        />
      </section>

      <h2>Prefer paper?</h2>
      <p>
        Download the free <NuxtLink to="/resources/printable-bible-reading-tracker">
          printable Bible reading tracker
        </NuxtLink> with a checkbox for every chapter of the Bible.
      </p>

      <p class="books-footnote">
        * Reading times are estimates based on word counts from the Berean Standard Bible (public
        domain) at {{ WORDS_PER_MINUTE }} words per minute, the average adult silent reading speed for
        non-fiction. Your pace and translation will vary.
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
  getTotalWordCount,
} from '~/helpers/bible-reading-time';

// The book guide pages are English-only for now (their prose isn't translated).
defineI18nRoute({ locales: ['en'] });
definePageMeta({ contentPage: true });

const { locale } = useI18n();
const config = useRuntimeConfig();

const books = Bible.getBooks().map(book => ({
  index: book.bibleOrder,
  name: Bible.getBookName(book.bibleOrder),
  path: `/books-of-the-bible/${Bible.getBookSlug(book.bibleOrder)}`,
  chapters: book.chapterCount,
  verses: Bible.getBookVerseCount(book.bibleOrder),
  readingTime: formatReadingTime(getBookReadingMinutes(book.bibleOrder)),
  section: bibleBookGuides[book.bibleOrder - 1]!.section,
  newTestament: book.newTestament,
}));

const groupBySection = (list: typeof books) => {
  const sections: { name: string; books: typeof books }[] = [];
  for (const book of list) {
    const last = sections[sections.length - 1];
    if (last && last.name === book.section) {
      last.books.push(book);
    }
    else {
      sections.push({ name: book.section, books: [book] });
    }
  }
  return sections;
};

const groups = [
  { testament: 'Old Testament', books: books.filter(b => !b.newTestament) },
  { testament: 'New Testament', books: books.filter(b => b.newTestament) },
].map(group => ({ ...group, sections: groupBySection(group.books) }));

const totalChapters = books.reduce((sum, b) => sum + b.chapters, 0);
const totalVerses = Bible.getTotalVerseCount();
const totalHours = Math.round(getTotalWordCount() / WORDS_PER_MINUTE / 60);

const siteUrl = config.public.siteUrl as string;
const seoTitle = 'Books of the Bible: All 66 Books with Chapters & Reading Time';
const seoDescription = 'A complete list of the 66 books of the Bible in order, with the number of chapters and verses in each book, estimated reading times, and a short overview of every book.';

useContentSeo({
  path: '/books-of-the-bible',
  locale,
  locales: ['en'],
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
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Books of the Bible',
      numberOfItems: books.length,
      itemListElement: books.map(book => ({
        '@type': 'ListItem',
        position: book.index,
        name: book.name,
        url: `${siteUrl}${book.path}`,
      })),
    },
  ],
});
</script>

<style scoped>
.books-footnote {
  margin-top: var(--mbl-space-2xl);
  font-size: 0.85rem;
  color: var(--mbl-text-muted);
}
</style>
