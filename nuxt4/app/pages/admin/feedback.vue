<template>
  <main>
    <div class="content-column">
      <h1 class="mbl-title">{{ $t('admin') }} — {{ $t('feedback') }}</h1>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'], auth: 'admin' });
const { t } = useI18n();
useHead({ title: () => t('admin') });
</script>
