<template>
  <main>
    <div class="content-column">
      <header class="page-header">
        <h1 class="mbl-title mbl-title--3">
          {{ t('insights') }}
        </h1>
        <div class="mbl-dropdown narrow-screen" :class="menuOpen ? 'mbl-dropdown--active' : ''">
          <div class="mbl-dropdown__trigger" @click="toggleMenu">
            <button class="mbl-button" type="button" aria-haspopup="true">
              <span>{{ t('menu') }}</span>
            </button>
          </div>
          <div class="mbl-dropdown__menu" role="menu" @click="toggleMenu">
            <div class="mbl-dropdown__content">
              <NuxtLink class="mbl-dropdown__item" :to="localePath('/insights')">
                {{ t('activity') }}
              </NuxtLink>
              <NuxtLink class="mbl-dropdown__item" :to="localePath('/insights/books')">
                {{ t('books') }}
              </NuxtLink>
              <NuxtLink class="mbl-dropdown__item" :to="localePath('/insights/frequency')">
                {{ t('frequency') }}
              </NuxtLink>
              <NuxtLink class="mbl-dropdown__item" :to="localePath('/insights/trend')">
                {{ t('trend') }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </header>
      <div class="mbl-tabs wide-screen">
        <ul>
          <li>
            <NuxtLink :to="localePath('/insights')">
              {{ t('activity') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="localePath('/insights/books')">
              {{ t('books') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="localePath('/insights/frequency')">
              {{ t('frequency') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="localePath('/insights/trend')">
              {{ t('trend') }}
            </NuxtLink>
          </li>
        </ul>
      </div>
      <NuxtPage />
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] });

const { t } = useI18n();
const localePath = useLocalePath();

useHead({
  title: () => t('insights'),
  meta: [{ name: 'robots', content: 'noindex' }],
});

const menuOpen = ref(false);
function toggleMenu() { menuOpen.value = !menuOpen.value; }
</script>

<style scoped>
.narrow-screen { display: block; }
.wide-screen { display: none; }

@media (min-width: 800px) {
  .narrow-screen { display: none; }
  .wide-screen { display: block; }
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
