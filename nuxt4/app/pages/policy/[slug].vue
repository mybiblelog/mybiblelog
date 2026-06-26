<template>
  <main>
    <div class="content-column mbl-content">
      <ContentRenderer v-if="page" :value="page" />
    </div>
    <ContentPageFooter />
  </main>
</template>

<script setup lang="ts">
import ContentPageFooter from '~/components/content/PageFooter.vue';

const route = useRoute();
const { locale } = useI18n();

const slug = route.params.slug as string;

const { data: page } = await useAsyncData(`policy-${slug}`, () =>
  queryCollection('content').path(`/${locale.value}/policy/${slug}`).first(),
);

if (!page.value) {
  throw createError({ statusCode: 404, message: 'Page not found' });
}

useHead({ meta: [{ name: 'robots', content: 'noindex' }] });
</script>

<style>
.icon {
  display: inline !important;
}
</style>
