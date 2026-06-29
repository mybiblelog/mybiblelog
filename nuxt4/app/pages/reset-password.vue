<template>
  <main>
    <div class="content-column">
      <h1 class="mbl-title">
        Reset Password
      </h1>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'], auth: 'guest' });
useHead({ title: 'Reset Password', meta: [{ name: 'robots', content: 'noindex' }] });
</script>
