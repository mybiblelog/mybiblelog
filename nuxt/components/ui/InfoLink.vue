<template>
  <nuxt-link :to="to" class="info-link" :aria-label="ariaLabel">
    <span class="info-icon">i</span>
  </nuxt-link>
</template>

<script>
export default {
  name: 'InfoLink',
  props: {
    to: {
      type: String,
      required: true,
    },
  },
  computed: {
    ariaLabel() {
      return this.$t('aria.more_information');
    },
  },
};
</script>

<style scoped>
.info-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  border-radius: 50%;
  background-color: var(--mbl-border-strong);
  color: var(--mbl-on-accent);
  font-size: 0.6em;
  font-weight: bold;
}
</style>

<i18n lang="json">
{
  "en": {
    "aria": {
      "more_information": "More information"
    }
  },
  "de": {
    "aria": {
      "more_information": "Weitere Informationen"
    }
  },
  "es": {
    "aria": {
      "more_information": "Más información"
    }
  },
  "fr": {
    "aria": {
      "more_information": "Plus d'informations"
    }
  },
  "ko": {
    "aria": {
      "more_information": "추가 정보"
    }
  },
  "pt": {
    "aria": {
      "more_information": "Mais informações"
    }
  },
  "uk": {
    "aria": {
      "more_information": "Більше інформації"
    }
  }
}
</i18n>
