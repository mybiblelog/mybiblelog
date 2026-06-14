<template>
  <div class="bible-verse-range">
    <p v-if="loading" class="mbl-text-small mbl-text-muted">
      {{ $t('scripture_passage.loading') }}
    </p>
    <p v-else-if="loadError" class="mbl-text-small bible-verse-range__error">
      {{ $t('scripture_passage.error') }}
    </p>
    <template v-else>
      <template v-for="(row, rowIdx) in displayRows">
        <div
          v-if="row.type === 'chapter_label'"
          :key="rowKey(row, rowIdx)"
          class="bible-verse-range__chapter-label"
        >
          {{ row.text }}
        </div>
        <div
          v-else-if="row.type === 'section_heading'"
          :key="rowKey(row, rowIdx)"
          class="bible-verse-range__section-heading"
        >
          {{ row.text }}
        </div>
        <div
          v-else
          :key="rowKey(row, rowIdx)"
          class="bible-verse-range__verse"
        >
          <span class="bible-verse-range__ref">{{ row.chapter }}:{{ row.number }}</span>
          <span class="bible-verse-range__body">
            <template v-for="(seg, sIdx) in row.segments">
              <br v-if="seg.kind === 'line_break'" :key="'br-' + rowKey(row, rowIdx) + '-' + sIdx">
              <span
                v-else
                :key="'t-' + rowKey(row, rowIdx) + '-' + sIdx"
                :class="segmentClass(seg)"
              >{{ seg.text }}</span>
            </template>
          </span>
        </div>
      </template>
      <button
        v-if="next !== null"
        type="button"
        class="mbl-button mbl-button--text mbl-button--sm bible-verse-range__read-more"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? $t('scripture_passage.loading') : $t('scripture_passage.read_more') }}
      </button>
      <p v-if="readMoreError" class="mbl-text-small bible-verse-range__error">
        {{ $t('scripture_passage.error') }}
      </p>
      <p v-if="licenseUrl && next === null && hasVerses" class="bible-verse-range__attr mbl-text-small mbl-text-muted">
        <a :href="licenseUrl" target="_blank" rel="noopener noreferrer">{{ translationName }}</a>
      </p>
    </template>
  </div>
</template>

<script>
import { Bible } from '@mybiblelog/shared';

export default {
  name: 'BibleVerseRange',
  props: {
    startVerseId: {
      type: Number,
      required: true,
    },
    endVerseId: {
      type: Number,
      required: true,
    },
    /** PreferredBibleVersion key (e.g. NASB2020) from user settings */
    bibleVersion: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      loading: true,
      loadingMore: false,
      loadError: false,
      readMoreError: false,
      blocks: [],
      translationName: '',
      licenseUrl: '',
      /** Continuation cursor ({ startVerseId, endVerseId }) for the rest of the passage, or null */
      next: null,
    };
  },
  computed: {
    hasVerses() {
      return this.blocks.some(b => b.type === 'verse');
    },
    displayRows() {
      const blocks = this.blocks;
      if (!blocks.length) {
        return [];
      }
      const bookIndex = Bible.parseVerseId(this.startVerseId).book;
      const lang = this.$i18n.locale;
      const labeledChapters = new Set();
      const out = [];
      for (const block of blocks) {
        if (!labeledChapters.has(block.chapter)) {
          labeledChapters.add(block.chapter);
          out.push({
            type: 'chapter_label',
            chapter: block.chapter,
            text: `${Bible.getBookName(bookIndex, lang)} ${block.chapter}`,
          });
        }
        out.push(block);
      }
      return out;
    },
  },
  watch: {
    startVerseId: 'loadPassage',
    endVerseId: 'loadPassage',
    bibleVersion: 'loadPassage',
  },
  mounted() {
    this.loadPassage();
  },
  methods: {
    rowKey(row, idx) {
      if (row.type === 'chapter_label') {
        return `cl-${row.chapter}-${idx}`;
      }
      if (row.type === 'section_heading') {
        return `sh-${idx}-${String(row.text).slice(0, 40)}`;
      }
      return `v-${row.chapter}-${row.number}-${idx}`;
    },
    segmentClass(seg) {
      if (seg.kind !== 'text') {
        return {};
      }
      return {
        'bible-verse-range__jesus': Boolean(seg.wordsOfJesus),
        [`bible-verse-range__poem bible-verse-range__poem--${seg.poem}`]: typeof seg.poem === 'number',
      };
    },
    async fetchChunk(startVerseId, endVerseId) {
      const params = new URLSearchParams({
        startVerseId: String(startVerseId),
        endVerseId: String(endVerseId),
        bibleVersion: String(this.bibleVersion),
      });
      const { data } = await this.$http.get(`/api/scripture/passage?${params.toString()}`);
      return data;
    },
    async loadPassage() {
      this.loading = true;
      this.loadingMore = false;
      this.loadError = false;
      this.readMoreError = false;
      this.blocks = [];
      this.translationName = '';
      this.licenseUrl = '';
      this.next = null;

      try {
        const data = await this.fetchChunk(this.startVerseId, this.endVerseId);
        this.blocks = data.blocks;
        this.translationName = data.translation.name;
        this.licenseUrl = data.translation.licenseUrl;
        this.next = data.next;
      }
      catch {
        this.loadError = true;
        this.blocks = [];
      }
      finally {
        this.loading = false;
      }
    },
    async loadMore() {
      if (!this.next || this.loadingMore) {
        return;
      }
      this.loadingMore = true;
      this.readMoreError = false;
      try {
        const data = await this.fetchChunk(this.next.startVerseId, this.next.endVerseId);
        this.blocks = [...this.blocks, ...data.blocks];
        this.next = data.next;
      }
      catch {
        this.readMoreError = true;
      }
      finally {
        this.loadingMore = false;
      }
    },
  },
};
</script>

<style scoped>
.bible-verse-range {
  margin-top: 0.35rem;
  padding: 0.35rem 0 0.25rem;
  line-height: 1.45;
}

.bible-verse-range__error {
  color: var(--mbl-danger);
}

.bible-verse-range__chapter-label {
  font-size: 0.88rem;
  font-weight: 600;
  margin: 0.55rem 0 0.4rem;
  color: var(--mbl-text-strong);
}

.bible-verse-range__chapter-label:first-child {
  margin-top: 0;
}

.bible-verse-range__section-heading {
  font-size: 0.82rem;
  font-weight: 600;
  font-style: italic;
  margin: 0.4rem 0 0.3rem;
  color: var(--mbl-text-subtle);
}

.bible-verse-range__verse {
  margin-bottom: 0.35rem;
}

.bible-verse-range__ref {
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--mbl-text-muted);
  margin-right: 0.35rem;
}

.bible-verse-range__body {
  font-size: 0.9rem;
}

.bible-verse-range__jesus {
  color: var(--mbl-scripture-words-of-jesus);
}

.bible-verse-range__poem {
  display: inline-block;
}

.bible-verse-range__poem--1 {
  padding-left: 0.75rem;
}

.bible-verse-range__poem--2 {
  padding-left: 1.5rem;
}

.bible-verse-range__read-more {
  margin-top: 0.25rem;
}

.bible-verse-range__attr {
  margin-top: 0.5rem;
  margin-bottom: 0;
}

.bible-verse-range__attr a {
  color: var(--mbl-link-muted);
  text-decoration: underline;
  text-decoration-style: dotted;
}
</style>

<i18n lang="json">
{
  "en": {
    "scripture_passage": {
      "loading": "Loading passage…",
      "error": "Could not load this passage. Try again later.",
      "read_more": "Read more"
    }
  },
  "de": {
    "scripture_passage": {
      "loading": "Abschnitt wird geladen…",
      "error": "Dieser Abschnitt konnte nicht geladen werden. Bitte später erneut versuchen.",
      "read_more": "Mehr lesen"
    }
  },
  "es": {
    "scripture_passage": {
      "loading": "Cargando pasaje…",
      "error": "No se pudo cargar este pasaje. Inténtalo de nuevo más tarde.",
      "read_more": "Leer más"
    }
  },
  "fr": {
    "scripture_passage": {
      "loading": "Chargement du passage…",
      "error": "Impossible de charger ce passage. Réessayez plus tard.",
      "read_more": "Lire la suite"
    }
  },
  "ko": {
    "scripture_passage": {
      "loading": "구절 불러오는 중…",
      "error": "이 구절을 불러올 수 없습니다. 나중에 다시 시도해 주세요.",
      "read_more": "더 보기"
    }
  },
  "pt": {
    "scripture_passage": {
      "loading": "Carregando passagem…",
      "error": "Não foi possível carregar esta passagem. Tente novamente mais tarde.",
      "read_more": "Ler mais"
    }
  },
  "uk": {
    "scripture_passage": {
      "loading": "Завантаження уривка…",
      "error": "Не вдалося завантажити цей уривок. Спробуйте пізніше.",
      "read_more": "Читати далі"
    }
  }
}
</i18n>
