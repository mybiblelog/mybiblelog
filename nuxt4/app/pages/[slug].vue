<template>
  <main>
    <div class="content-column">
      <h1 class="mbl-title">{{ $t('my_bible_log') }}</h1>
    </div>
  </main>
</template>

<script setup lang="ts">
const { t } = useI18n();
useHead({ title: () => t('my_bible_log') });
</script>
