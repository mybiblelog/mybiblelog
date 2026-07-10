<template>
  <main role="main">
    <article class="content-column mbl-content">
      <ContentRenderer v-if="page" :value="page" />
      <template v-if="slug !== 'overview'">
        <br>
        <NuxtLink :to="localePath('/about/overview')">
          {{ t('back') }}
        </NuxtLink>
      </template>
    </article>
    <content-page-footer />
  </main>
</template>

<script setup lang="ts">
import ContentPageFooter from '~/components/content/PageFooter.vue';

const route = useRoute();
const { t, locale } = useI18n();
const localePath = useLocalePath();

const slug = route.params.slug as string;

// @nuxt/content v3 collapses repeated dashes when generating a document's
// `path` (e.g. `page-features--today.md` → `/en/about/page-features-today`),
// but the public URLs and sitemap keep the original `--`. Normalize the slug
// for the lookup so these pages resolve instead of 404-redirecting to overview.
// The canonical/SEO path below intentionally keeps the original `--` slug so it
// matches the URL the visitor (and crawler) actually requested.
const contentSlug = slug.replace(/-{2,}/g, '-');

const { data: page, error } = await useAsyncData(
  () => `about-${slug}-${locale.value}`,
  () => queryCollection('content').path(`/${locale.value}/about/${contentSlug}`).first(),
  { watch: [locale] },
);

// Redirect to overview if page not found
if (error.value || !page.value) {
  await navigateTo(localePath('/about/overview'));
}

useContentSeo({
  path: `/about/${slug}`,
  seoTitle: page.value?.seo?.title,
  seoDescription: page.value?.seo?.description,
  ogTitle: (page.value?.og as { title?: string })?.title || page.value?.seo?.title,
  ogDescription: (page.value?.og as { description?: string })?.description || page.value?.seo?.description,
});
</script>

<style>
.icon {
  display: inline !important;
}

h1, h2, h3, h4, h5, h6 { clear: both; }

@media (max-width: 767px) {
  .phone-frame {
    float: none;
    display: block;
    margin: 0 auto 1rem;
  }
}
</style>

<i18n lang="json">
{
  "en": {
    "back": "Go to My Bible Log overview"
  },
  "de": {
    "back": "Zurück zur Übersicht von My Bible Log"
  },
  "es": {
    "back": "Volver a la página de My Bible Log"
  },
  "fr": {
    "back": "Retour à la page d'accueil de My Bible Log"
  },
  "ko": {
    "back": "My Bible Log 소개 페이지로 이동"
  },
  "pt": {
    "back": "Ir para a visão geral do My Bible Log"
  },
  "uk": {
    "back": "Перейти до огляду My Bible Log"
  }
}
</i18n>
