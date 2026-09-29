<template>
  <main role="main">
    <article class="content-column mbl-content">
      <h1>{{ t('h1') }}</h1>
      <p>
        {{ t('intro_1', {
          books: booksText(books.length),
          ot: booksText(groups[0]!.books.length),
          nt: booksText(groups[1]!.books.length),
          chapters: chaptersText(totalChapters),
          verses: versesText(totalVerses),
          hours: t('hours_count', { n: formatNumber(totalHours) }, totalHours),
        }) }}
      </p>
      <i18n-t keypath="intro_2" tag="p">
        <template #link>
          <NuxtLink :to="localePath('/about/guide--how-long-does-it-take-to-read-the-bible')">
            {{ t('intro_2_link') }}
          </NuxtLink>
        </template>
      </i18n-t>

      <section v-for="group in groups" :key="group.testament">
        <h2>{{ t('testament_heading', { testament: group.label, books: booksText(group.books.length) }) }}</h2>
        <template v-for="section in group.sections" :key="section.name">
          <h3>{{ t(`section.${section.name}`) }}</h3>
          <div class="mbl-table-wrap">
            <table class="mbl-table mbl-table--striped">
              <thead>
                <tr>
                  <th>{{ t('table.book') }}</th>
                  <th>{{ t('table.chapters') }}</th>
                  <th>{{ t('table.verses') }}</th>
                  <th>{{ t('table.reading_time') }}</th>
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
                  <td>{{ formatNumber(book.verses) }}</td>
                  <td>{{ book.readingTime }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <content-app-callout
          v-if="group.testament === 'old'"
          :title="t('callout.title')"
          :description="t('callout.description')"
          :list="[t('callout.item_1'), t('callout.item_2'), t('callout.item_3')]"
          :button-text="t('callout.button')"
          :note="t('callout.note')"
          image-src="/screenshots/en/sc7-bible-progress.webp"
          :image-alt="t('callout.image_alt')"
        />
      </section>

      <h2>{{ t('paper_heading') }}</h2>
      <i18n-t keypath="paper_text" tag="p">
        <template #link>
          <NuxtLink :to="localePath('/resources/printable-bible-reading-tracker')">
            {{ t('paper_link') }}
          </NuxtLink>
        </template>
      </i18n-t>

      <p class="books-footnote">
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
import { getBookGuide } from '~/helpers/bible-book-content';
import {
  WORDS_PER_MINUTE,
  formatReadingTime,
  getBookReadingMinutes,
  getTotalWordCount,
} from '~/helpers/bible-reading-time';

definePageMeta({ contentPage: true });

const { t, locale } = useI18n();
const localePath = useLocalePath();
const config = useRuntimeConfig();

const formatNumber = (n: number) => n.toLocaleString(locale.value);
const booksText = (n: number) => t('books_count', { n: formatNumber(n) }, n);
const chaptersText = (n: number) => t('chapters_count', { n: formatNumber(n) }, n);
const versesText = (n: number) => t('verses_count', { n: formatNumber(n) }, n);

const units = { hour: t('units.hour'), minute: t('units.minute') };

const books = Bible.getBooks().map(book => ({
  index: book.bibleOrder,
  name: Bible.getBookName(book.bibleOrder, locale.value),
  path: localePath(`/books-of-the-bible/${Bible.getBookSlug(book.bibleOrder)}`),
  chapters: book.chapterCount,
  verses: Bible.getBookVerseCount(book.bibleOrder),
  readingTime: formatReadingTime(getBookReadingMinutes(book.bibleOrder), units),
  section: getBookGuide(book.bibleOrder)!.section,
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
  { testament: 'old', label: t('testament_old'), books: books.filter(b => !b.newTestament) },
  { testament: 'new', label: t('testament_new'), books: books.filter(b => b.newTestament) },
].map(group => ({ ...group, sections: groupBySection(group.books) }));

const totalChapters = books.reduce((sum, b) => sum + b.chapters, 0);
const totalVerses = Bible.getTotalVerseCount();
const totalHours = Math.round(getTotalWordCount() / WORDS_PER_MINUTE / 60);

const siteUrl = config.public.siteUrl as string;
const localeSegment = locale.value === 'en' ? '' : `/${locale.value}`;
const seoTitle = t('seo.title');
const seoDescription = t('seo.description');

useContentSeo({
  path: '/books-of-the-bible',
  locale,
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
        { '@type': 'ListItem', position: 2, name: t('list_name'), item: `${siteUrl}${localeSegment}/books-of-the-bible` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: t('list_name'),
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

<i18n lang="json">
{
  "en": {
    "h1": "Books of the Bible: All 66 Books with Chapters, Verses & Reading Time",
    "intro_1": "The Protestant Bible contains {books}: {ot} in the Old Testament and {nt} in the New Testament. Together they have {chapters} and {verses}. At an average adult reading speed, reading the whole Bible takes about {hours}.",
    "intro_2": "Choose a book below to see its chapters, verse counts, reading time, and a short overview. Or learn {link} at different paces.",
    "intro_2_link": "how long it takes to read the Bible",
    "books_count": "{n} book | {n} books",
    "chapters_count": "{n} chapter | {n} chapters",
    "verses_count": "{n} verse | {n} verses",
    "hours_count": "{n} hour | {n} hours",
    "testament_old": "Old Testament",
    "testament_new": "New Testament",
    "testament_heading": "{testament} ({books})",
    "table": {
      "book": "Book",
      "chapters": "Chapters",
      "verses": "Verses",
      "reading_time": "Reading time*"
    },
    "callout": {
      "title": "Track every book you read",
      "description": "My Bible Log is a free Bible reading tracker. Log the chapters you read from any plan, sermon, or small group, and see your progress across all 66 books.",
      "item_1": "Check off chapters in any order",
      "item_2": "Set a daily goal and see when you will finish",
      "item_3": "Take notes and organize them with tags",
      "image_alt": "My Bible Log showing reading progress across every book of the Bible",
      "button": "Start Tracking Free",
      "note": "Completely free. No ads. Sign up with email or Google."
    },
    "paper_heading": "Prefer paper?",
    "paper_text": "Download the free {link} with a checkbox for every chapter of the Bible.",
    "paper_link": "printable Bible reading tracker",
    "footnote": "* Reading times are estimates based on word counts from the Berean Standard Bible (public domain), an English translation, at {wpm} words per minute, the average adult silent reading speed for English non-fiction. Your pace, language, and translation will vary.",
    "units": {
      "hour": "hr",
      "minute": "min"
    },
    "seo": {
      "title": "Books of the Bible: All 66 Books with Chapters & Reading Time",
      "description": "A complete list of the 66 books of the Bible in order, with the number of chapters and verses in each book, estimated reading times, and a short overview of every book."
    },
    "list_name": "Books of the Bible",
    "home": "Home",
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
    }
  },
  "de": {
    "h1": "Bücher der Bibel: Alle 66 Bücher mit Kapiteln, Versen & Lesezeit",
    "intro_1": "Die Bibel (in der evangelischen Zählung) enthält {books}: {ot} im Alten Testament und {nt} im Neuen Testament. Zusammen haben sie {chapters} und {verses}. Bei durchschnittlicher Lesegeschwindigkeit dauert es etwa {hours}, die ganze Bibel zu lesen.",
    "intro_2": "Wählen Sie unten ein Buch aus, um Kapitel, Verszahlen, Lesezeit und einen kurzen Überblick zu sehen. Oder erfahren Sie, {link} – bei verschiedenen Lesetempi.",
    "intro_2_link": "wie lange es dauert, die Bibel zu lesen",
    "books_count": "{n} Buch | {n} Bücher",
    "chapters_count": "{n} Kapitel",
    "verses_count": "{n} Vers | {n} Verse",
    "hours_count": "{n} Stunde | {n} Stunden",
    "testament_old": "Altes Testament",
    "testament_new": "Neues Testament",
    "testament_heading": "{testament} ({books})",
    "table": {
      "book": "Buch",
      "chapters": "Kapitel",
      "verses": "Verse",
      "reading_time": "Lesezeit*"
    },
    "callout": {
      "title": "Halten Sie fest, welche Bücher Sie gelesen haben",
      "description": "My Bible Log ist ein kostenloser Bibellese-Tracker. Tragen Sie die Kapitel ein, die Sie lesen – aus jedem Plan, jeder Predigt oder Gruppe – und sehen Sie Ihren Fortschritt durch alle 66 Bücher.",
      "item_1": "Kapitel in beliebiger Reihenfolge abhaken",
      "item_2": "Ein Tagesziel setzen und sehen, wann Sie fertig sind",
      "item_3": "Notizen machen und mit Tags ordnen",
      "image_alt": "My Bible Log zeigt den Lesefortschritt durch alle Bücher der Bibel",
      "button": "Kostenlos loslegen",
      "note": "Völlig kostenlos. Keine Werbung. Mit E-Mail oder Google anmelden."
    },
    "paper_heading": "Lieber auf Papier?",
    "paper_text": "Laden Sie den kostenlosen {link} mit einem Kästchen für jedes Kapitel der Bibel herunter.",
    "paper_link": "druckbaren Bibellese-Tracker",
    "footnote": "* Die Lesezeiten sind Schätzungen auf Grundlage der Wortzahlen der Berean Standard Bible (gemeinfrei), einer englischen Übersetzung, bei {wpm} Wörtern pro Minute – der durchschnittlichen stillen Lesegeschwindigkeit Erwachsener bei englischen Sachtexten. Ihr Tempo, Ihre Sprache und Ihre Übersetzung können abweichen.",
    "units": {
      "hour": "Std.",
      "minute": "Min."
    },
    "seo": {
      "title": "Bücher der Bibel: Alle 66 Bücher mit Kapiteln & Lesezeit",
      "description": "Die vollständige Liste der 66 Bücher der Bibel in der richtigen Reihenfolge – mit Kapitel- und Verszahl, geschätzter Lesezeit und einem kurzen Überblick über jedes Buch."
    },
    "list_name": "Bücher der Bibel",
    "home": "Startseite",
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
    }
  },
  "es": {
    "h1": "Libros de la Biblia: los 66 libros con capítulos, versículos y tiempo de lectura",
    "intro_1": "La Biblia protestante contiene {books}: {ot} en el Antiguo Testamento y {nt} en el Nuevo Testamento. Entre todos suman {chapters} y {verses}. A una velocidad de lectura media, leer toda la Biblia lleva unas {hours}.",
    "intro_2": "Elige un libro para ver sus capítulos, el número de versículos, el tiempo de lectura y un breve resumen. O descubre {link} a distintos ritmos.",
    "intro_2_link": "cuánto se tarda en leer la Biblia",
    "books_count": "{n} libro | {n} libros",
    "chapters_count": "{n} capítulo | {n} capítulos",
    "verses_count": "{n} versículo | {n} versículos",
    "hours_count": "{n} hora | {n} horas",
    "testament_old": "Antiguo Testamento",
    "testament_new": "Nuevo Testamento",
    "testament_heading": "{testament} ({books})",
    "table": {
      "book": "Libro",
      "chapters": "Capítulos",
      "verses": "Versículos",
      "reading_time": "Tiempo de lectura*"
    },
    "callout": {
      "title": "Registra cada libro que lees",
      "description": "My Bible Log es un registro gratuito de lectura bíblica. Anota los capítulos que lees de cualquier plan, sermón o grupo pequeño y mira tu avance por los 66 libros.",
      "item_1": "Marca capítulos en el orden que quieras",
      "item_2": "Fija una meta diaria y mira cuándo terminarás",
      "item_3": "Toma notas y organízalas con etiquetas",
      "image_alt": "My Bible Log mostrando el avance de lectura por todos los libros de la Biblia",
      "button": "Empieza gratis",
      "note": "Totalmente gratis. Sin anuncios. Regístrate con correo o con Google."
    },
    "paper_heading": "¿Prefieres el papel?",
    "paper_text": "Descarga gratis el {link} con una casilla para cada capítulo de la Biblia.",
    "paper_link": "registro de lectura bíblica imprimible",
    "footnote": "* Los tiempos de lectura son estimaciones basadas en el número de palabras de la Berean Standard Bible (dominio público), una traducción al inglés, a {wpm} palabras por minuto, la velocidad media de lectura silenciosa de un adulto con textos no literarios en inglés. Tu ritmo, tu idioma y tu traducción pueden variar.",
    "units": {
      "hour": "h",
      "minute": "min"
    },
    "seo": {
      "title": "Libros de la Biblia: los 66 libros con capítulos y tiempo de lectura",
      "description": "Lista completa de los 66 libros de la Biblia en orden, con el número de capítulos y versículos de cada uno, el tiempo de lectura estimado y un breve resumen de cada libro."
    },
    "list_name": "Libros de la Biblia",
    "home": "Inicio",
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
    }
  },
  "fr": {
    "h1": "Livres de la Bible : les 66 livres avec chapitres, versets et durée de lecture",
    "intro_1": "La Bible protestante compte {books} : {ot} dans l'Ancien Testament et {nt} dans le Nouveau Testament. Ensemble, ils totalisent {chapters} et {verses}. À une vitesse de lecture moyenne, lire toute la Bible prend environ {hours}.",
    "intro_2": "Choisissez un livre ci-dessous pour voir ses chapitres, son nombre de versets, sa durée de lecture et un bref aperçu. Ou découvrez {link} selon différents rythmes.",
    "intro_2_link": "combien de temps il faut pour lire la Bible",
    "books_count": "{n} livre | {n} livres",
    "chapters_count": "{n} chapitre | {n} chapitres",
    "verses_count": "{n} verset | {n} versets",
    "hours_count": "{n} heure | {n} heures",
    "testament_old": "Ancien Testament",
    "testament_new": "Nouveau Testament",
    "testament_heading": "{testament} ({books})",
    "table": {
      "book": "Livre",
      "chapters": "Chapitres",
      "verses": "Versets",
      "reading_time": "Durée de lecture*"
    },
    "callout": {
      "title": "Suivez chaque livre que vous lisez",
      "description": "My Bible Log est un suivi de lecture biblique gratuit. Notez les chapitres lus, quel que soit le plan, la prédication ou le groupe, et voyez votre progression dans les 66 livres.",
      "item_1": "Cochez les chapitres dans l'ordre de votre choix",
      "item_2": "Fixez un objectif quotidien et voyez quand vous aurez terminé",
      "item_3": "Prenez des notes et organisez-les avec des étiquettes",
      "image_alt": "My Bible Log affichant la progression de lecture dans tous les livres de la Bible",
      "button": "Commencer gratuitement",
      "note": "Entièrement gratuit. Sans publicité. Inscription par e-mail ou avec Google."
    },
    "paper_heading": "Vous préférez le papier ?",
    "paper_text": "Téléchargez gratuitement le {link} avec une case à cocher pour chaque chapitre de la Bible.",
    "paper_link": "suivi de lecture biblique imprimable",
    "footnote": "* Les durées de lecture sont des estimations fondées sur le nombre de mots de la Berean Standard Bible (domaine public), une traduction anglaise, à {wpm} mots par minute, la vitesse moyenne de lecture silencieuse d'un adulte pour un texte non littéraire en anglais. Votre rythme, votre langue et votre traduction peuvent différer.",
    "units": {
      "hour": "h",
      "minute": "min"
    },
    "seo": {
      "title": "Livres de la Bible : les 66 livres, chapitres et durée de lecture",
      "description": "La liste complète des 66 livres de la Bible dans l'ordre, avec le nombre de chapitres et de versets de chacun, la durée de lecture estimée et un bref aperçu de chaque livre."
    },
    "list_name": "Livres de la Bible",
    "home": "Accueil",
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
    }
  },
  "pt": {
    "h1": "Livros da Bíblia: os 66 livros com capítulos, versículos e tempo de leitura",
    "intro_1": "A Bíblia protestante contém {books}: {ot} no Antigo Testamento e {nt} no Novo Testamento. Juntos, somam {chapters} e {verses}. Em uma velocidade média de leitura, ler a Bíblia inteira leva cerca de {hours}.",
    "intro_2": "Escolha um livro abaixo para ver seus capítulos, o número de versículos, o tempo de leitura e um breve resumo. Ou descubra {link} em diferentes ritmos.",
    "intro_2_link": "quanto tempo leva para ler a Bíblia",
    "books_count": "{n} livro | {n} livros",
    "chapters_count": "{n} capítulo | {n} capítulos",
    "verses_count": "{n} versículo | {n} versículos",
    "hours_count": "{n} hora | {n} horas",
    "testament_old": "Antigo Testamento",
    "testament_new": "Novo Testamento",
    "testament_heading": "{testament} ({books})",
    "table": {
      "book": "Livro",
      "chapters": "Capítulos",
      "verses": "Versículos",
      "reading_time": "Tempo de leitura*"
    },
    "callout": {
      "title": "Registre cada livro que você lê",
      "description": "O My Bible Log é um registro gratuito de leitura da Bíblia. Anote os capítulos que você lê, de qualquer plano, sermão ou pequeno grupo, e veja seu progresso pelos 66 livros.",
      "item_1": "Marque capítulos na ordem que quiser",
      "item_2": "Defina uma meta diária e veja quando você termina",
      "item_3": "Faça anotações e organize-as com etiquetas",
      "image_alt": "My Bible Log mostrando o progresso de leitura em todos os livros da Bíblia",
      "button": "Comece grátis",
      "note": "Totalmente grátis. Sem anúncios. Cadastre-se com e-mail ou Google."
    },
    "paper_heading": "Prefere papel?",
    "paper_text": "Baixe grátis o {link} com uma caixinha para cada capítulo da Bíblia.",
    "paper_link": "registro de leitura da Bíblia para imprimir",
    "footnote": "* Os tempos de leitura são estimativas baseadas na contagem de palavras da Berean Standard Bible (domínio público), uma tradução em inglês, a {wpm} palavras por minuto, a velocidade média de leitura silenciosa de um adulto em textos não literários em inglês. Seu ritmo, seu idioma e sua tradução podem variar.",
    "units": {
      "hour": "h",
      "minute": "min"
    },
    "seo": {
      "title": "Livros da Bíblia: os 66 livros com capítulos e tempo de leitura",
      "description": "Lista completa dos 66 livros da Bíblia em ordem, com o número de capítulos e versículos de cada um, o tempo de leitura estimado e um breve resumo de cada livro."
    },
    "list_name": "Livros da Bíblia",
    "home": "Início",
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
    }
  },
  "uk": {
    "h1": "Книги Біблії: усі 66 книг із розділами, віршами та часом читання",
    "intro_1": "Протестантська Біблія містить {books}: {ot} у Старому Заповіті та {nt} у Новому Заповіті. Разом це {chapters} і {verses}. За середньої швидкості читання, щоб прочитати всю Біблію, потрібно приблизно {hours}.",
    "intro_2": "Оберіть книгу нижче, щоб побачити її розділи, кількість віршів, час читання та короткий огляд. Або дізнайтеся, {link} за різного темпу.",
    "intro_2_link": "скільки часу потрібно, щоб прочитати Біблію",
    "books_count": "{n} книга | {n} книги | {n} книг",
    "chapters_count": "{n} розділ | {n} розділи | {n} розділів",
    "verses_count": "{n} вірш | {n} вірші | {n} віршів",
    "hours_count": "{n} година | {n} години | {n} годин",
    "testament_old": "Старий Заповіт",
    "testament_new": "Новий Заповіт",
    "testament_heading": "{testament} ({books})",
    "table": {
      "book": "Книга",
      "chapters": "Розділи",
      "verses": "Вірші",
      "reading_time": "Час читання*"
    },
    "callout": {
      "title": "Відстежуйте кожну прочитану книгу",
      "description": "My Bible Log — безкоштовний трекер читання Біблії. Записуйте прочитані розділи з будь-якого плану, проповіді чи малої групи та спостерігайте за своїм поступом у всіх 66 книгах.",
      "item_1": "Позначайте розділи в будь-якому порядку",
      "item_2": "Ставте щоденну мету й дізнавайтеся, коли завершите",
      "item_3": "Робіть нотатки та впорядковуйте їх за допомогою тегів",
      "image_alt": "My Bible Log показує поступ читання в усіх книгах Біблії",
      "button": "Почати безкоштовно",
      "note": "Цілком безкоштовно. Без реклами. Реєстрація через пошту або Google."
    },
    "paper_heading": "Віддаєте перевагу паперу?",
    "paper_text": "Завантажте безкоштовний {link} із віконцем для кожного розділу Біблії.",
    "paper_link": "трекер читання Біблії для друку",
    "footnote": "* Час читання — це оцінка на основі кількості слів у Berean Standard Bible (суспільне надбання), англійському перекладі, за {wpm} слів на хвилину — середньої швидкості мовчазного читання дорослого під час читання англомовних нехудожніх текстів. Ваш темп, мова та переклад можуть відрізнятися.",
    "units": {
      "hour": "год",
      "minute": "хв"
    },
    "seo": {
      "title": "Книги Біблії: усі 66 книг із розділами та часом читання",
      "description": "Повний перелік 66 книг Біблії по порядку: кількість розділів і віршів у кожній книзі, орієнтовний час читання та короткий огляд кожної книги."
    },
    "list_name": "Книги Біблії",
    "home": "Головна",
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
    }
  },
  "ko": {
    "h1": "성경 66권: 장 수, 절 수, 읽는 시간 한눈에 보기",
    "intro_1": "개신교 성경은 구약 {ot}과 신약 {nt}을 합쳐 모두 {books}으로 이루어져 있습니다. 전체 분량은 {chapters}, {verses}이며, 성인 평균 읽기 속도로 성경 전체를 읽는 데 약 {hours}이 걸립니다.",
    "intro_2": "아래에서 책을 선택하면 장 수와 절 수, 읽는 시간, 간단한 소개를 볼 수 있습니다. 또는 읽는 속도별로 {link}도 확인해 보세요.",
    "intro_2_link": "성경을 다 읽는 데 얼마나 걸리는지",
    "books_count": "{n}권",
    "chapters_count": "{n}장",
    "verses_count": "{n}절",
    "hours_count": "{n}시간",
    "testament_old": "구약",
    "testament_new": "신약",
    "testament_heading": "{testament} ({books})",
    "table": {
      "book": "책",
      "chapters": "장 수",
      "verses": "절 수",
      "reading_time": "읽는 시간*"
    },
    "callout": {
      "title": "읽은 책을 모두 기록하세요",
      "description": "My Bible Log는 무료 성경읽기 기록 서비스입니다. 어떤 읽기 계획이든, 설교나 소그룹에서 읽은 내용이든 장별로 기록하고, 66권 전체의 진도를 확인해 보세요.",
      "item_1": "읽은 장을 순서에 상관없이 체크할 수 있습니다",
      "item_2": "하루 목표를 정하고 완독 시점을 확인할 수 있습니다",
      "item_3": "메모를 남기고 태그로 정리할 수 있습니다",
      "image_alt": "성경 모든 책의 읽기 진도를 보여 주는 My Bible Log 화면",
      "button": "무료로 시작하기",
      "note": "완전 무료입니다. 광고가 없습니다. 이메일 또는 Google로 가입하세요."
    },
    "paper_heading": "종이가 더 편하신가요?",
    "paper_text": "성경 모든 장마다 체크 칸이 있는 무료 {link}를 내려받으세요.",
    "paper_link": "인쇄용 성경 읽기 추적표",
    "footnote": "* 읽는 시간은 영어 번역본인 Berean Standard Bible(퍼블릭 도메인)의 단어 수를 바탕으로, 영어 비문학 텍스트를 읽는 성인의 평균 묵독 속도인 분당 {wpm}단어로 계산한 추정치입니다. 읽는 속도와 언어, 번역본에 따라 달라질 수 있습니다.",
    "units": {
      "hour": "시간",
      "minute": "분"
    },
    "seo": {
      "title": "성경 66권: 장 수와 읽는 시간 한눈에 보기",
      "description": "성경 66권을 순서대로 정리한 전체 목록입니다. 각 책의 장 수와 절 수, 예상 읽는 시간, 간단한 소개를 확인해 보세요."
    },
    "list_name": "성경 66권",
    "home": "홈",
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
    }
  }
}
</i18n>
