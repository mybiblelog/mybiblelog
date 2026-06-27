<template>
  <main>
    <div class="content-column">
      <div class="start-page__welcome">
        <h1 class="mbl-title">
          {{ $t('start_page.welcome.title') }}
        </h1>
        <p>{{ $t('start_page.welcome.description') }}</p>
        <div class="mbl-button-group">
          <NuxtLink class="mbl-button mbl-button--primary" :to="localePath('/settings')">
            {{ $t('start_page.welcome.button') }}
          </NuxtLink>
          <button class="mbl-button mbl-button--text" @click="skipPersonalization">
            {{ $t('start_page.welcome.skip_personalization') }}
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useUserSettingsStore } from '~/stores/user-settings';

definePageMeta({ middleware: ['auth', 'start-redirect'] });

const { t } = useI18n();
useHead({ title: () => t('today') });

const localePath = useLocalePath();
const router = useRouter();
const userSettingsStore = useUserSettingsStore();

const skipPersonalization = async () => {
  await userSettingsStore.updateSettings({ startPage: 'today' });
  await router.push(localePath('/today'));
};
</script>

<style scoped>
.start-page__welcome {
  margin-top: 3rem;
  text-align: center;
}

.start-page__welcome p {
  margin: 1rem 0 2rem;
  color: var(--mbl-text-subtle);
}
</style>
