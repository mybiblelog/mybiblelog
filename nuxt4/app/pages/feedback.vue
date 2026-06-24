<template>
  <main>
    <div class="content-column">
      <h1 class="mbl-title">{{ $t('feedback') }}</h1>
    </div>
  </main>
</template>

<script setup lang="ts">
const { t } = useI18n();
useHead({ title: () => t('feedback') });
</script>
