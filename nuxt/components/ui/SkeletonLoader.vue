<template>
  <div class="skeleton-loader" role="status" :aria-label="$t('loading')" data-testid="skeleton-loader">
    <div
      v-for="n in count"
      :key="n"
      class="skeleton-loader__card"
      :class="`skeleton-loader__card--${variant}`"
      aria-hidden="true"
    >
      <template v-if="variant === 'note'">
        <div class="skeleton-loader__row">
          <div class="skeleton-loader__bar skeleton-loader__bar--title" />
          <div class="skeleton-loader__bar skeleton-loader__bar--meta" />
        </div>
        <div class="skeleton-loader__bar skeleton-loader__bar--text" />
        <div class="skeleton-loader__bar skeleton-loader__bar--text skeleton-loader__bar--text-short" />
        <div class="skeleton-loader__row skeleton-loader__row--footer">
          <div class="skeleton-loader__bar skeleton-loader__bar--pill" />
          <div class="skeleton-loader__bar skeleton-loader__bar--buttons" />
        </div>
      </template>
      <template v-else-if="variant === 'tag'">
        <div class="skeleton-loader__bar skeleton-loader__bar--tag-label" />
        <div class="skeleton-loader__bar skeleton-loader__bar--text skeleton-loader__bar--text-short" />
        <div class="skeleton-loader__row skeleton-loader__row--footer">
          <div class="skeleton-loader__bar skeleton-loader__bar--meta" />
          <div class="skeleton-loader__bar skeleton-loader__bar--buttons" />
        </div>
      </template>
      <template v-else>
        <div class="skeleton-loader__row">
          <div>
            <div class="skeleton-loader__bar skeleton-loader__bar--title" />
            <div class="skeleton-loader__bar skeleton-loader__bar--subtitle" />
          </div>
          <div class="skeleton-loader__bar skeleton-loader__bar--action" />
        </div>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SkeletonLoader',
  props: {
    // mimics the card being loaded: a LogEntry, a PassageNote, or a tag line
    variant: {
      type: String,
      default: 'log-entry',
      validator: value => ['log-entry', 'note', 'tag'].includes(value),
    },
    count: {
      type: Number,
      default: 1,
    },
  },
};
</script>

<style scoped>
.skeleton-loader__card {
  border-radius: 0.25rem;
  background: var(--mbl-bg-elevated);
  box-shadow: var(--mbl-card-shadow);
}

/* matches .log-entry dimensions */
.skeleton-loader__card--log-entry {
  padding: 1em 0.5em;
  margin: 0.5rem 0;
}

/* matches .passage-note dimensions */
.skeleton-loader__card--note {
  padding: 0.5rem 1rem;
  margin: 1rem 0;
}

/* matches .tag-line dimensions */
.skeleton-loader__card--tag {
  padding: 0.5rem 1rem;
  margin: 1rem -0.5rem;
  background: var(--mbl-bg);
}

.skeleton-loader__row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.skeleton-loader__row--footer {
  align-items: flex-end;
  margin-top: 0.5rem;
}

.skeleton-loader__bar {
  background: var(--mbl-border-soft);
  border-radius: 0.25rem;
  animation: skeleton-loader-pulse 1.4s ease-in-out infinite;
}

.skeleton-loader__bar--title {
  width: 9rem;
  max-width: 40%;
  height: 1rem;
  margin: 0.25rem 0;
}

.skeleton-loader__bar--subtitle {
  width: 6rem;
  max-width: 30%;
  height: 0.75rem;
  margin-top: 0.5rem;
}

.skeleton-loader__bar--action {
  width: 1.75rem;
  height: 1.75rem;
}

.skeleton-loader__bar--meta {
  width: 5rem;
  height: 0.75rem;
  margin: 0.25rem 0;
}

.skeleton-loader__bar--text {
  width: 100%;
  height: 0.8rem;
  margin: 0.6rem 0;
}

.skeleton-loader__bar--text-short {
  width: 65%;
}

.skeleton-loader__bar--pill {
  width: 4rem;
  height: 1.4rem;
  border-radius: 999px;
}

.skeleton-loader__bar--buttons {
  width: 7rem;
  max-width: 45%;
  height: 1.7rem;
}

.skeleton-loader__bar--tag-label {
  width: 100%;
  height: 2rem;
}

@keyframes skeleton-loader-pulse {
  0%, 100% {
    opacity: 1;
  }

  50% {
    opacity: 0.45;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-loader__bar {
    animation: none;
  }
}
</style>

<i18n lang="json">
{
  "en": {
    "loading": "Loading..."
  },
  "de": {
    "loading": "Lädt..."
  },
  "es": {
    "loading": "Cargando..."
  },
  "fr": {
    "loading": "Chargement..."
  },
  "ko": {
    "loading": "불러오는 중…"
  },
  "pt": {
    "loading": "Carregando..."
  },
  "uk": {
    "loading": "Завантаження..."
  }
}
</i18n>
