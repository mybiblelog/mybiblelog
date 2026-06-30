<template>
  <div>
    <h1 class="mbl-title">
      {{ $t('settings') }} — Email
    </h1>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] });
const { t } = useI18n();
useHead({ title: () => t('settings') });
</script>
