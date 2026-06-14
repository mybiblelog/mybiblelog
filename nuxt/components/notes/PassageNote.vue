<template>
  <div class="passage-note" data-testid="passage-note" :class="{ 'empty': empty }">
    <div class="passage-note--passages" data-testid="passage-note-passages">
      <ul>
        <li v-for="passage in note.passages" :key="passage.id">
          <a :href="readingUrl(passage)" target="_blank">
            <strong>{{ displayVerseRange(passage.startVerseId, passage.endVerseId) }}</strong>
          </a>
        </li>
      </ul>
    </div>
    <div class="passage-note--created-date">
      <span class="mbl-text-muted mbl-text-small" :title="displayDateTime(note.createdAt)">{{ displayTimeSince(note.createdAt) }}</span>
    </div>
    <div class="passage-note--content" data-testid="passage-note-content">
      <hyperlinked-text :text="note.content" />
    </div>
    <div class="passage-note--tags" data-testid="passage-note-tags">
      <passage-note-tag-pill v-for="tag in populatedTags(note.tags)" :key="tag.id" :tag="tag" />
    </div>
    <div class="passage-note--controls">
      <div class="mbl-button-group mbl-button-group--end">
        <button
          v-for="(action, index) in actions"
          :key="index"
          class="mbl-button mbl-button--sm"
          @click="action.callback"
        >
          {{ action.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { Bible, displayDateTime, displayTimeSince } from '@mybiblelog/shared';
import HyperlinkedText from '@/components/ui/HyperlinkedText';
import PassageNoteTagPill from '@/components/notes/PassageNoteTagPill';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';

export default {
  name: 'PassageNote',
  components: {
    HyperlinkedText,
    PassageNoteTagPill,
  },
  props: {
    note: {
      // expects note object with passages, content, tags, createdAt, id
      type: Object,
      required: true,
    },
    actions: {
      // expects an array of objects with `label` and `callback` properties
      type: Array,
      default: () => [],
    },
    empty: {
      // allows the passage note to be displayed without border or shadow
      type: Boolean,
      default: () => false,
    },
    getReadingUrl: {
      // function to get reading URL for a passage
      // expects (bookIndex, chapterIndex) => url
      type: Function,
      required: true,
    },
  },
  computed: {
    passageNoteTagsStore() {
      return usePassageNoteTagsStore();
    },
    passageNoteTags() {
      return this.passageNoteTagsStore.passageNoteTags;
    },
  },
  methods: {
    displayVerseRange(startVerseId, endVerseId) {
      return Bible.displayVerseRange(startVerseId, endVerseId, this.$i18n.locale);
    },
    displayDateTime(date) {
      return displayDateTime(date, this.$i18n.locale);
    },
    displayTimeSince(date) {
      return displayTimeSince(date, this.$i18n.locale);
    },
    readingUrl(passage) {
      const { book, chapter } = Bible.parseVerseId(passage.startVerseId);
      return this.getReadingUrl(book, chapter);
    },
    populatedTags(tagIds) {
      if (!this.passageNoteTags || !this.passageNoteTags.length) {
        return tagIds.map(id => ({ id, label: 'Loading', color: 'var(--mbl-text-strong)' }));
      }
      return tagIds.map(id => this.passageNoteTags.find(tag => tag.id === id)).filter(Boolean);
    },
  },
};
</script>

<style scoped>
.passage-note {
  padding: 0.5rem 1rem;
  margin: 1rem 0;
  border-radius: 0.25rem;
  background: var(--mbl-bg-elevated);
  box-shadow: var(--mbl-card-shadow);

  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(4, auto);
}

.passage-note.empty {
  box-shadow: none;
  padding-top: 0;
  padding-bottom: 0;
}

.passage-note--passages {
  grid-area: 1 / 1 / 2 / 3;
}

.passage-note--created-date {
  grid-area: 1 / 2 / 2 / 3;
  text-align: right;
  cursor: default;
}

.passage-note--created-date > span {
  border-bottom: 1px dotted var(--mbl-border-strong);
}

.passage-note--content {
  overflow-wrap: break-word;
  white-space: pre-line;
  margin: 0.5rem 0;
  grid-area: 2 / 1 / 3 / 3;
}

.passage-note--tags {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  grid-area: 3 / 1 / 4 / 2;
}

.passage-note--controls {
  display: flex;
  flex-direction: column-reverse;
  grid-area: 3 / 2 / 4 / 3;
}
</style>
