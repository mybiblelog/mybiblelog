<template>
  <main role="main">
    <article class="content-column mbl-content">
      <ContentRenderer v-if="page" :value="page" />
    </article>
    <content-page-footer />
  </main>
</template>

<script setup lang="ts">
import ContentPageFooter from '~/components/content/PageFooter.vue';

const route = useRoute();
const { locale } = useI18n();

const slug = route.params.slug as string;

const { data: page } = await useAsyncData(`content-${slug}`, () =>
  queryCollection('content').path(`/${locale.value}/${slug}`).first(),
);

if (!page.value) {
  throw createError({ statusCode: 404, message: 'Page not found' });
}

useContentSeo({
  path: `/${slug}`,
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
</style>
