<template>
  <main>
    <div class="content-column">
      <header class="page-header">
        <h1 class="mbl-title mbl-title--3">
          {{ $t('insights') }}
        </h1>
        <div class="mbl-dropdown narrow-screen mbl-dropdown--right" :class="menuOpen ? 'mbl-dropdown--active' : ''">
          <div class="mbl-dropdown__trigger" @click="toggleMenu">
            <button class="mbl-button" aria-haspopup="true" aria-controls="mbl-dropdown__menu">
              <span>{{ $t('menu') }}</span>
            </button>
          </div>
          <div class="mbl-dropdown__menu" role="menu" @click="toggleMenu">
            <div class="mbl-dropdown__content">
              <nuxt-link class="mbl-dropdown__item" :to="localePath('/insights')">
                {{ $t('activity') }}
              </nuxt-link>
              <nuxt-link class="mbl-dropdown__item" :to="localePath('/insights/books')">
                {{ $t('books') }}
              </nuxt-link>
              <nuxt-link class="mbl-dropdown__item" :to="localePath('/insights/frequency')">
                {{ $t('frequency') }}
              </nuxt-link>
              <nuxt-link class="mbl-dropdown__item" :to="localePath('/insights/trend')">
                {{ $t('trend') }}
              </nuxt-link>
            </div>
          </div>
        </div>
      </header>
      <div class="mbl-tabs wide-screen">
        <ul>
          <li>
            <nuxt-link :to="localePath('/insights')">
              {{ $t('activity') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link :to="localePath('/insights/books')">
              {{ $t('books') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link :to="localePath('/insights/frequency')">
              {{ $t('frequency') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link :to="localePath('/insights/trend')">
              {{ $t('trend') }}
            </nuxt-link>
          </li>
        </ul>
      </div>
      <nuxt-child />
    </div>
  </main>
</template>

<script>
export default {
  name: 'InsightsPage',
  middleware: ['auth'],
  data() {
    return {
      menuOpen: false,
    };
  },
  head() {
    return {
      title: this.$t('insights'),
      meta: [
        { hid: 'robots', name: 'robots', content: 'noindex' },
      ],
    };
  },
  methods: {
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
    },
  },
};
</script>

<style scoped>
@media screen and (min-width: 600px) {
  .narrow-screen {
    display: none;
  }
}

@media screen and (max-width: 599px) {
  .wide-screen {
    display: none;
  }
}
</style>

<i18n lang="json">
{
  "en": { "insights": "Insights", "menu": "Menu", "activity": "Activity", "books": "Books", "frequency": "Frequency", "trend": "Trend" },
  "de": { "insights": "Einblicke", "menu": "Menü", "activity": "Aktivität", "books": "Bücher", "frequency": "Häufigkeit", "trend": "Verlauf" },
  "es": { "insights": "Estadísticas", "menu": "Menú", "activity": "Actividad", "books": "Libros", "frequency": "Frecuencia", "trend": "Tendencia" },
  "fr": { "insights": "Analyses", "menu": "Menu", "activity": "Activité", "books": "Livres", "frequency": "Fréquence", "trend": "Tendance" },
  "ko": { "insights": "통계", "menu": "메뉴", "activity": "활동", "books": "책", "frequency": "빈도", "trend": "추세" },
  "pt": { "insights": "Estatísticas", "menu": "Menu", "activity": "Atividade", "books": "Livros", "frequency": "Frequência", "trend": "Tendência" },
  "uk": { "insights": "Аналітика", "menu": "Меню", "activity": "Активність", "books": "Книги", "frequency": "Частота", "trend": "Тренд" }
}
</i18n>
