<template>
  <div class="passage-note" data-testid="passage-note">
    <div class="passage-note--passages" data-testid="passage-note-passages">
      <ul class="passage-note__passage-list">
        <li
          v-for="(passage, pIdx) in note.passages"
          :key="passageKey(passage, pIdx)"
          class="passage-note__passage-item"
        >
          <details
            class="passage-note__passage-details"
            @toggle="onPassageDetailsToggle(passage, pIdx, $event)"
          >
            <summary class="passage-note__passage-summary">
              <strong>{{ displayVerseRange(passage.startVerseId, passage.endVerseId) }}</strong>
            </summary>
            <div
              v-if="passageTextLoaded[passageKey(passage, pIdx)]"
              class="passage-note__passage-body"
            >
              <bible-verse-range
                :start-verse-id="passage.startVerseId"
                :end-verse-id="passage.endVerseId"
                :bible-version="preferredBibleVersion"
              />
            </div>
          </details>
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
import BibleVerseRange from '@/components/bible/BibleVerseRange';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';
import { useUserSettingsStore } from '~/stores/user-settings';

export default {
  name: 'PassageNote',
  components: {
    BibleVerseRange,
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
  },
  data() {
    return {
      // Tracks which passages have been expanded at least once,
      // so passage text is only fetched on first open
      passageTextLoaded: {},
    };
  },
  computed: {
    passageNoteTagsStore() {
      return usePassageNoteTagsStore();
    },
    passageNoteTags() {
      return this.passageNoteTagsStore.passageNoteTags;
    },
    preferredBibleVersion() {
      return useUserSettingsStore().settings.preferredBibleVersion;
    },
  },
  methods: {
    passageKey(passage, index) {
      return passage.id || `p-${this.note.id}-${index}-${passage.startVerseId}-${passage.endVerseId}`;
    },
    onPassageDetailsToggle(passage, index, event) {
      if (event.target.open) {
        const key = this.passageKey(passage, index);
        this.$set(this.passageTextLoaded, key, true);
      }
    },
    displayVerseRange(startVerseId, endVerseId) {
      return Bible.displayVerseRange(startVerseId, endVerseId, this.$i18n.locale);
    },
    displayDateTime(date) {
      return displayDateTime(date, this.$i18n.locale);
    },
    displayTimeSince(date) {
      return displayTimeSince(date, this.$i18n.locale);
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

.passage-note--passages {
  grid-area: 1 / 1 / 2 / 3;
}

.passage-note__passage-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.passage-note__passage-item {
  margin: 0.15rem 0;
}

.passage-note__passage-details {
  border-radius: 0.2rem;
}

.passage-note__passage-details[open] .passage-note__passage-body {
  box-sizing: border-box;
  margin-top: 0.4rem;
  margin-bottom: 0.15rem;
  padding: 0.5rem 0.75rem 0.85rem;
  max-height: min(20rem, 40vh);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: var(--mbl-overlay-04);
  border: 1px solid var(--mbl-border-soft);
  border-radius: 0.25rem;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.passage-note__passage-summary {
  cursor: pointer;
  user-select: none;
}

.passage-note__passage-summary:focus {
  outline: 1px dotted var(--mbl-border-strong);
  outline-offset: 2px;
}

.passage-note__passage-summary::marker {
  color: var(--mbl-link-muted);
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
