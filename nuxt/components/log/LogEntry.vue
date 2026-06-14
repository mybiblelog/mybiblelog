<template>
  <div class="log-entry" data-testid="log-entry">
    <div v-if="message && passage" class="log-entry-header">
      <div class="log-entry-header-message">
        {{ message }}
      </div>
    </div>
    <div class="log-entry-body">
      <div>
        <template v-if="passage">
          <div class="passage" data-testid="log-entry-passage">
            {{ displayVerseRange(passage.startVerseId, passage.endVerseId) }}
          </div>
          <div class="verse-count" data-testid="log-entry-verse-count">
            {{ displayVerseCountMessage(passage) }}
          </div>
        </template>
        <template v-else>
          <template v-if="message">
            <div class="log-entry-body-message">
              {{ message }}
            </div>
          </template>
        </template>
      </div>
      <div class="button-controls">
        <action-menu :actions="actions" />
      </div>
    </div>
  </div>
</template>

<script>
import { Bible } from '@mybiblelog/shared';
import ActionMenu from '@/components/ui/ActionMenu';

export default {
  name: 'LogEntry',
  components: {
    ActionMenu,
  },
  props: {
    message: {
      // allows a message to be displayed in the format of a log entry
      // useful for displaying "loading" or "no log entries" messaging
      type: String,
      default: () => '',
    },
    passage: {
      // expects `startVerseId` and `endVerseId` to be passed in as props
      // optionally allows `newVerseCount` to be passed in as a prop
      type: Object,
      default: () => null,
    },
    actions: {
      // expects an array of objects with `label` and `callback` properties
      type: Array,
      default: () => [],
    },
  },
  methods: {
    displayVerseRange(startVerseId, endVerseId) {
      return Bible.displayVerseRange(startVerseId, endVerseId, this.$i18n.locale);
    },
    displayVerseCountMessage({ startVerseId, endVerseId, newVerseCount }) {
      const count = Bible.countRangeVerses(startVerseId, endVerseId);
      if (!newVerseCount) {
        return `${count} ${this.$tc('verse', count)}`;
      }
      const newQuantity = newVerseCount === count ? this.$tc('all', count) : newVerseCount;
      return `${count} ${this.$tc('verse', count)} - ${newQuantity} ${this.$tc('new', newVerseCount)}`;
    },
  },
};
</script>

<style>
.log-entry {
  display: flex;
  flex-direction: column;
  padding: 1em 0.5em;
  border-radius: 0.25rem;
  background: var(--mbl-bg-elevated);
  box-shadow: var(--mbl-card-shadow);
  margin: 0.5rem 0;
}

.log-entry .log-entry-header-message {
  position: relative;
  top: -0.5rem;
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
  color: var(--mbl-link-muted);
  font-size: 0.8em;
  letter-spacing: 0.05cap;
}

.log-entry .log-entry-body {
  display: flex;
  justify-content: space-between;
}

.log-entry .passage {
  font-weight: bold;
}

.log-entry .verse-count {
  font-size: 0.8em;
}

.log-entry .button-controls {
  display: flex;
  justify-content: flex-end;
}
</style>

<i18n lang="json">
{
  "en": {
    "verse": "verse | verses",
    "all": "all | all",
    "new": "new | new"
  },
  "de": {
    "verse": "Vers | Verse",
    "all": "alle | alle",
    "new": "neu | neu"
  },
  "es": {
    "verse": "versículo | versículos",
    "all": "todo | todos",
    "new": "nuevo | nuevos"
  },
  "fr": {
    "verse": "verset | versets",
    "all": "tout | tout",
    "new": "nouveau | nouveau"
  },
  "ko": {
    "verse": "절 | 절",
    "all": "전부 | 전부",
    "new": "새 분량 | 새 분량"
  },
  "pt": {
    "verse": "versículo | versículos",
    "all": "todas | todas",
    "new": "novos | novos"
  },
  "uk": {
    "verse": "верс | віршів",
    "all": "всі | всі",
    "new": "новий | нові"
  }
}
</i18n>
