<template>
  <section class="play-store-banner">
    <p class="play-store-banner-title">
      {{ t('title') }}
    </p>
    <div class="mbl-button-group mbl-button-group--center">
      <a
        :href="productionUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="mbl-button mbl-button--primary mbl-button--glow"
      >
        {{ t('get_the_app') }}
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
const productionUrl = 'https://play.google.com/store/apps/details?id=com.mybiblelog.app';

const { t } = useI18n();
</script>

<style scoped>
.play-store-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mbl-space-md);
  padding: var(--mbl-space-xl);
  margin: 0 0 var(--mbl-space-2xl);
  background:
    radial-gradient(circle, rgb(255 255 255 / 25%) 1.5px, transparent 1.5px) 0 0 / 22px 22px,
    linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 55%, var(--tertiary-color) 100%);
  border-radius: var(--mbl-radius-xl);
  box-shadow: var(--mbl-shadow-cta);
  text-align: center;
}

.play-store-banner-title {
  font-size: var(--mbl-title-5);
  font-weight: 700;
  color: var(--mbl-on-accent);
  text-shadow: 0 1px 2px rgb(0 0 0 / 15%);
  margin: 0;
}

/* Overrides the shared .mbl-button modifiers only within this banner's
   scope, since the vivid gradient backdrop needs a light-on-color button
   rather than the design system's default surface-colored one. */
.play-store-banner :deep(.mbl-button--primary.mbl-button--glow) {
  background-color: var(--mbl-on-accent);
  border-color: var(--mbl-on-accent);
  color: var(--secondary-color);
}

.play-store-banner :deep(.mbl-button--primary.mbl-button--glow:hover) {
  background-color: var(--mbl-on-accent);
  filter: brightness(0.95);
}
</style>

<i18n lang="json">
{
  "en": {
    "title": "Now Available on Google Play",
    "get_the_app": "Get the App"
  },
  "de": {
    "title": "Jetzt bei Google Play erhältlich",
    "get_the_app": "App herunterladen"
  },
  "es": {
    "title": "Ya disponible en Google Play",
    "get_the_app": "Obtener la app"
  },
  "fr": {
    "title": "Désormais disponible sur Google Play",
    "get_the_app": "Obtenir l'application"
  },
  "ko": {
    "title": "지금 Google Play에서 이용 가능",
    "get_the_app": "앱 받기"
  },
  "pt": {
    "title": "Já disponível no Google Play",
    "get_the_app": "Baixar o app"
  },
  "uk": {
    "title": "Тепер доступно в Google Play",
    "get_the_app": "Отримати додаток"
  }
}
</i18n>
