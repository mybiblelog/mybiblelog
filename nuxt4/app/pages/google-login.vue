<template>
  <main>
    <div class="content-column">
      <h1 class="mbl-title">Signing in with Google…</h1>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'], auth: 'guest' });
useHead({ title: 'Google Sign In', meta: [{ name: 'robots', content: 'noindex' }] });
</script>
