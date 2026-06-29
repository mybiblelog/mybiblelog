<template>
  <div>
    <h2 class="mbl-title mbl-title--5">
      {{ t('start_page.get_started.title') }}
    </h2>
    <div class="mbl-content">
      <p>
        {{ t('start_page.get_started.description') }}
      </p>
    </div>
    <div class="mbl-field">
      <div class="mbl-control buttons">
        <button class="mbl-button mbl-button--primary mbl-button--lg" data-testid="get-started-go" @click="handleGetStarted">
          {{ t('start_page.get_started.button') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserSettingsStore } from '~/stores/user-settings';

withDefaults(defineProps<{ previousButtonText?: string }>(), { previousButtonText: 'Back' });

const { t } = useI18n();
const localePath = useLocalePath();
const router = useRouter();

async function handleGetStarted() {
  await useUserSettingsStore().updateSettings({ startPage: 'today' });
  await router.push(localePath('/today'));
}
</script>

<i18n lang="json">
{
  "en": { "start_page": { "get_started": { "title": "Get Started", "description": "You're all set up! It's time to start reading.", "button": "Let's Go" } } },
  "de": { "start_page": { "get_started": { "title": "Loslegen", "description": "Sie sind fertig eingerichtet! Es ist Zeit, mit dem Lesen zu beginnen.", "button": "Los geht's" } } },
  "es": { "start_page": { "get_started": { "title": "Comenzar", "description": "¡Todo está listo! Es hora de comenzar a leer.", "button": "Vamos" } } },
  "fr": { "start_page": { "get_started": { "title": "Commencer", "description": "Tout est prêt ! Il est temps de commencer à lire.", "button": "Allons-y" } } },
  "ko": { "start_page": { "get_started": { "title": "시작하기", "description": "준비가 모두 끝났습니다! 이제 성경을 읽기 시작할 시간이에요.", "button": "시작해볼까요?" } } },
  "pt": { "start_page": { "get_started": { "title": "Começar", "description": "Tudo está pronto! É hora de começar a ler.", "button": "Vamos lá" } } },
  "uk": { "start_page": { "get_started": { "title": "Почніть", "description": "Все налаштовано! Час почати читати.", "button": "Поїхали" } } }
}
</i18n>
