<template>
  <main role="main">
    <ContentRenderer v-if="page" :value="page" />
    <content-page-footer />
  </main>
</template>

<script setup lang="ts">
import ContentPageFooter from '~/components/content/PageFooter.vue';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const localePath = useLocalePath();
const { locale } = useI18n();
const config = useRuntimeConfig();

if (authStore.loggedIn) {
  await navigateTo(localePath('/start'));
}

const { data: page } = await useAsyncData(
  () => `home-${locale.value}`,
  () => queryCollection('content').path(`/${locale.value}`).first(),
  { watch: [locale] },
);

if (!page.value) {
  throw createError({ statusCode: 404, message: 'Page not found' });
}

const siteUrl = config.public.siteUrl as string;
const ldJson = page.value?.ld_json as { name?: string; description?: string } | undefined;

useContentSeo({
  path: '',
  seoTitle: page.value?.seo?.title,
  seoDescription: page.value?.seo?.description,
  ogTitle: page.value?.og?.title || page.value?.seo?.title,
  ogDescription: page.value?.og?.description || page.value?.seo?.description,
  structuredData: ldJson
    ? {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: ldJson.name,
      description: ldJson.description,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Any modern web browser',
      softwareVersion: '1.0',
      url: siteUrl,
      screenshot: [
        `${siteUrl}/screenshots/sc7-bible-progress.webp`,
        `${siteUrl}/screenshots/sc12-checklist.webp`,
        `${siteUrl}/screenshots/sc10-notes.webp`,
        `${siteUrl}/screenshots/sc9-calendar.webp`,
        `${siteUrl}/screenshots/sc4-daily-goal.webp`,
      ],
      offers: {
        '@type': 'Offer',
        price: 'Free',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: siteUrl,
      },
    }
    : null,
});
</script>

<style>
.icon {
  display: inline !important;
}
</style>
