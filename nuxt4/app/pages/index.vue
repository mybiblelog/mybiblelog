<template>
  <div />
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const localePath = useLocalePath();

if (authStore.loggedIn) {
  await navigateTo(localePath('/start'));
}
else {
  await navigateTo(localePath('/login'));
}
</script>
