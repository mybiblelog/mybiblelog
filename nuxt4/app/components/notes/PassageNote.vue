<template>
  <div class="passage-note" data-testid="passage-note">
    <div class="passage-note--passages" data-testid="passage-note-passages">
      <ul>
        <li v-for="passage in note.passages" :key="`${passage.startVerseId}-${passage.endVerseId}`">
          <a :href="readingUrl(passage)" target="_blank">
            <strong>{{ displayRange(passage.startVerseId, passage.endVerseId) }}</strong>
          </a>
        </li>
      </ul>
    </div>
    <div class="passage-note--created-date">
      <span class="mbl-text-muted mbl-text-small" :title="noteCreatedAtDisplayTime">{{ timeSince(note.createdAt) }}</span>
    </div>
    <div class="passage-note--content" data-testid="passage-note-content">
      {{ note.content }}
    </div>
    <div class="passage-note--tags" data-testid="passage-note-tags">
      <passage-note-tag-pill v-for="tag in resolvedTags" :key="tag.id" :tag="tag" />
    </div>
    <div class="passage-note--controls">
      <div class="mbl-button-group mbl-button-group--end">
        <button
          v-for="(action, index) in actions"
          :key="index"
          class="mbl-button mbl-button--sm"
          @click="action.callback()"
        >
          {{ action.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bible, displayTimeSince } from '@mybiblelog/shared';
import PassageNoteTagPill from '~/components/notes/PassageNoteTagPill.vue';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';

const props = defineProps<{
  note: {
    id: string | number;
    passages?: Array<{ startVerseId: number; endVerseId: number }>;
    tags?: Array<string | number>;
    content?: string;
    createdAt?: string;
  };
  actions?: Array<{ label: string; callback:() => void }>;
  getReadingUrl?: (bookIndex: number, chapterIndex: number) => string;
}>();

const { locale } = useI18n();
const passageNoteTagsStore = usePassageNoteTagsStore();

function displayRange(startVerseId: number, endVerseId: number) {
  return Bible.displayVerseRange(startVerseId, endVerseId, locale.value);
}

function readingUrl(passage: { startVerseId: number }) {
  const { book, chapter } = Bible.parseVerseId(passage.startVerseId);
  return props.getReadingUrl ? props.getReadingUrl(book, chapter) : '#';
}

function timeSince(date?: string) {
  if (!date) { return ''; }
  return displayTimeSince(date, locale.value);
}

const noteCreatedAtDisplayTime = computed(() => {
  return props.note.createdAt ? new Date(props.note.createdAt).toLocaleString(locale.value) : '';
});

const resolvedTags = computed(() => {
  const tagIds = props.note.tags ?? [];
  const allTags = passageNoteTagsStore.passageNoteTags;
  if (!allTags || !allTags.length) {
    return tagIds.map(id => ({ id, label: '…', color: 'var(--mbl-text-strong)' }));
  }
  return tagIds
    .map(id => allTags.find(t => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .map(t => ({ id: t.id as string | number, label: t.label ?? '', color: t.color ?? 'var(--mbl-text-strong)' }));
});
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
.passage-note--passages { grid-area: 1 / 1 / 2 / 3; }
.passage-note--created-date { grid-area: 1 / 2 / 2 / 3; text-align: right; cursor: default; }
.passage-note--created-date > span { border-bottom: 1px dotted var(--mbl-border-strong); }
.passage-note--content {
  overflow-wrap: break-word;
  white-space: pre-line;
  margin: 0.5rem 0;
  grid-area: 2 / 1 / 3 / 3;
}
.passage-note--tags { display: flex; flex-direction: column; align-items: flex-start; grid-area: 3 / 1 / 4 / 2; }
.passage-note--controls { display: flex; flex-direction: column-reverse; grid-area: 3 / 2 / 4 / 3; }
</style>
