<template>
  <main>
    <div class="content-column">
      <h1 class="mbl-title">
        {{ t('verifying_email') }}
      </h1>
      <p v-if="error">
        {{ $terr(error) }}
      </p>
      <p v-else>
        {{ t('one_moment_please') }}
      </p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ApiError, UnknownApiError } from '~/helpers/api-error';
import type { ApiErrorDetail } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';
import { useAuthStore } from '~/stores/auth';

definePageMeta({ middleware: ['auth'], auth: 'guest' });

const { t } = useI18n();
useHead({ title: () => t('verify_email'), meta: [{ name: 'robots', content: 'noindex' }] });

const localePath = useLocalePath();
const router = useRouter();
const authStore = useAuthStore();
const { $http, $terr } = useNuxtApp() as {
  $http: { post: <T>(path: string, body?: unknown) => Promise<T> };
  $terr: (error: unknown, props?: Record<string, unknown>) => string;
};

const error = ref<ApiErrorDetail | null>(null);

onMounted(async () => {
  const emailVerificationCode = new URL(window.location.href).searchParams.get('code');
  if (!emailVerificationCode) {
    await router.push(localePath('/login'));
    return;
  }

  try {
    await $http.post('/api/auth/verify-email', { code: emailVerificationCode });
    // If successful, automatically log the user in
    await authStore.refreshUser();
    await router.push(localePath('/start'));
  }
  catch (err) {
    const formErrors = mapFormErrors(err instanceof ApiError ? err : new UnknownApiError());
    error.value = formErrors._form ?? null;
  }
});
</script>

<i18n lang="json">
{
  "en": {
    "verify_email": "Verify Email",
    "verifying_email": "Verifying Email",
    "one_moment_please": "One moment please..."
  },
  "de": {
    "verify_email": "E-Mail bestätigen",
    "verifying_email": "E-Mail wird bestätigt",
    "one_moment_please": "Einen Moment bitte..."
  },
  "es": {
    "verify_email": "Verificar correo electrónico",
    "verifying_email": "Verificando correo electrónico",
    "one_moment_please": "Un momento por favor..."
  },
  "fr": {
    "verify_email": "Vérifier l'email",
    "verifying_email": "Vérification de l'email",
    "one_moment_please": "Un instant s'il vous plaît..."
  },
  "ko": {
    "verify_email": "이메일 인증",
    "verifying_email": "이메일 인증 진행 중",
    "one_moment_please": "잠시만 기다려주세요..."
  },
  "pt": {
    "verify_email": "Verificar Email",
    "verifying_email": "Verificando Email",
    "one_moment_please": "Por favor, aguarde um momento..."
  },
  "uk": {
    "verify_email": "Підтвердити електронну пошту",
    "verifying_email": "Підтвердження електронної пошти",
    "one_moment_please": "Зачекайте хвилинку..."
  }
}
</i18n>
