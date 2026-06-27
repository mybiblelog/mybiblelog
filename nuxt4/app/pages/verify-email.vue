<template>
  <main>
    <div class="content-column">
      <h1 class="mbl-title">Verify Email</h1>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'], auth: 'guest' });
useHead({ title: 'Verify Email', meta: [{ name: 'robots', content: 'noindex' }] });
</script>
