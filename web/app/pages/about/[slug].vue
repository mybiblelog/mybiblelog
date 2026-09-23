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

definePageMeta({ contentPage: true });

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

// A real 404 (not a redirect to the overview) so unknown or retired URLs
// don't get indexed as soft-404 duplicates of the overview page.
if (error.value || !page.value) {
  throw createError({ statusCode: 404, message: 'Page not found' });
}

const config = useRuntimeConfig();
const siteUrl = config.public.siteUrl as string;
const localeSegment = locale.value === 'en' ? '' : `/${locale.value}`;
const pageUrl = `${siteUrl}${localeSegment}/about/${slug}`;
const isArticle = slug.startsWith('how-to--');
const headline = page.value?.seo?.title || page.value?.title;

const breadcrumbItems = [
  { name: t('breadcrumb_home'), url: `${siteUrl}${localeSegment || '/'}` },
  { name: t('breadcrumb_about'), url: `${siteUrl}${localeSegment}/about/overview` },
  ...(slug === 'overview' ? [] : [{ name: headline, url: pageUrl }]),
];

const structuredData: Record<string, unknown>[] = [{
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbItems.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
}];

if (isArticle) {
  structuredData.push({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description: page.value?.seo?.description,
    image: `${siteUrl}/share.jpg`,
    inLanguage: locale.value,
    mainEntityOfPage: pageUrl,
    ...(page.value?.dateModified ? { dateModified: page.value.dateModified } : {}),
    author: { '@type': 'Organization', name: 'My Bible Log', url: siteUrl },
    publisher: { '@type': 'Organization', name: 'My Bible Log', url: siteUrl },
  });
}

useContentSeo({
  path: `/about/${slug}`,
  locale,
  ogType: isArticle ? 'article' : 'website',
  structuredData,
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

@mixin mbl-mobile {
  .phone-frame {
    float: none;
    display: block;
    margin: 0 auto var(--mbl-space-md);
  }
}
</style>

<i18n lang="json">
{
  "en": {
    "back": "Go to My Bible Log overview",
    "breadcrumb_home": "Home",
    "breadcrumb_about": "Features & Guides"
  },
  "de": {
    "back": "Zurück zur Übersicht von My Bible Log",
    "breadcrumb_home": "Startseite",
    "breadcrumb_about": "Funktionen & Anleitungen"
  },
  "es": {
    "back": "Volver a la página de My Bible Log",
    "breadcrumb_home": "Inicio",
    "breadcrumb_about": "Funciones y guías"
  },
  "fr": {
    "back": "Retour à la page d'accueil de My Bible Log",
    "breadcrumb_home": "Accueil",
    "breadcrumb_about": "Fonctionnalités et guides"
  },
  "ko": {
    "back": "My Bible Log 소개 페이지로 이동",
    "breadcrumb_home": "홈",
    "breadcrumb_about": "기능 및 가이드"
  },
  "pt": {
    "back": "Ir para a visão geral do My Bible Log",
    "breadcrumb_home": "Início",
    "breadcrumb_about": "Recursos e guias"
  },
  "uk": {
    "back": "Перейти до огляду My Bible Log",
    "breadcrumb_home": "Головна",
    "breadcrumb_about": "Функції та посібники"
  }
}
</i18n>
