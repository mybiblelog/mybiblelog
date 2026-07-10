<template>
  <main>
    <div class="content-column">
      <h1 class="mbl-title">
        {{ t('change_email') }}
      </h1>
      <div v-if="busy" class="mbl-content">
        <p>{{ t('confirming_your_new_email_address') }}</p>
      </div>
      <div v-if="codeExpired" class="mbl-content">
        <p>{{ t('your_email_change_request_has_expired') }}</p>
        <p>{{ t('please_go_to_your_settings_and_try_changing_your_email_address_again') }}</p>
      </div>
      <div v-if="serverError" class="mbl-content">
        <p>{{ t('there_was_an_error_changing_your_email_address') }}</p>
        <p>{{ serverError }}</p>
        <p>{{ t('please_go_to_your_settings_and_try_changing_your_email_address_again') }}</p>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ApiError, UnknownApiError } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';
import { useToastStore } from '~/stores/toast';
import { useAuthStore } from '~/stores/auth';

// NO auth middleware -- this page must be reachable via email link for both
// authenticated and unauthenticated users.

const { t } = useI18n();
useHead({ title: () => t('change_email'), meta: [{ name: 'robots', content: 'noindex' }] });

const localePath = useLocalePath();
const router = useRouter();
const { $http, $terr } = useNuxtApp();

const busy = ref(true);
const codeExpired = ref(false);
const serverError = ref('');

onMounted(async () => {
  const code = new URL(window.location.href).searchParams.get('code');
  if (!code) {
    await router.push(localePath('/settings/email'));
    return;
  }

  let changeEmailRequest: { newEmail: string; expires: number };
  try {
    const { data } = await $http.get<{ newEmail: string; expires: number }>(`/api/auth/change-email/${code}`);
    changeEmailRequest = data;
  }
  catch {
    // No open email change request (404) -- redirect to settings, which
    // shows the user's current email address.
    await router.push(localePath('/settings'));
    return;
  }

  if (Date.now() > changeEmailRequest.expires) {
    codeExpired.value = true;
    busy.value = false;
    return;
  }

  try {
    await $http.post(`/api/auth/change-email/${code}`);
  }
  catch (err) {
    const apiError = err instanceof ApiError ? err : new UnknownApiError();
    const errorDetail = apiError.errors?.[0] ?? mapFormErrors(apiError)._form;
    serverError.value = errorDetail ? $terr(errorDetail) : '';
    busy.value = false;
    return;
  }

  useToastStore().add({ type: 'success', text: t('your_email_address_was_updated_successfully') });

  // Reload user now that the auth cookie should reflect the new email.
  await useAuthStore().refreshUser();

  await router.push(localePath('/settings'));
});
</script>

<i18n lang="json">
{
  "en": {
    "change_email": "Change Email",
    "confirming_your_new_email_address": "Confirming your new email address...",
    "your_email_change_request_has_expired": "Your email change request has expired.",
    "please_go_to_your_settings_and_try_changing_your_email_address_again": "Please go to your settings and try changing your email address again.",
    "there_was_an_error_changing_your_email_address": "There was an error changing your email address.",
    "your_email_address_was_updated_successfully": "Your email address was updated successfully."
  },
  "de": {
    "change_email": "E-Mail ändern",
    "confirming_your_new_email_address": "Bestätige deine neue E-Mail-Adresse...",
    "your_email_change_request_has_expired": "Deine E-Mail-Änderungsanfrage ist abgelaufen.",
    "please_go_to_your_settings_and_try_changing_your_email_address_again": "Gehe zu deinen Einstellungen und versuche erneut, deine E-Mail-Adresse zu ändern.",
    "there_was_an_error_changing_your_email_address": "Es gab einen Fehler beim Ändern deiner E-Mail-Adresse.",
    "your_email_address_was_updated_successfully": "Deine E-Mail-Adresse wurde erfolgreich aktualisiert."
  },
  "es": {
    "change_email": "Cambiar Correo Electrónico",
    "confirming_your_new_email_address": "Confirmando su nueva dirección de correo electrónico...",
    "your_email_change_request_has_expired": "Su solicitud de cambio de correo electrónico ha caducado.",
    "please_go_to_your_settings_and_try_changing_your_email_address_again": "Por favor, vaya a su configuración e intente cambiar su dirección de correo electrónico de nuevo.",
    "there_was_an_error_changing_your_email_address": "Hubo un error al cambiar su dirección de correo electrónico.",
    "your_email_address_was_updated_successfully": "Su dirección de correo electrónico se actualizó correctamente."
  },
  "fr": {
    "change_email": "Changer l'e-mail",
    "confirming_your_new_email_address": "Confirmation de votre nouvelle adresse e-mail...",
    "your_email_change_request_has_expired": "Votre demande de changement d'e-mail a expiré.",
    "please_go_to_your_settings_and_try_changing_your_email_address_again": "Veuillez vous rendre dans vos paramètres et essayer de changer à nouveau votre adresse e-mail.",
    "there_was_an_error_changing_your_email_address": "Une erreur s'est produite lors du changement de votre adresse e-mail.",
    "your_email_address_was_updated_successfully": "Votre adresse e-mail a été mise à jour avec succès."
  },
  "ko": {
    "change_email": "이메일 변경",
    "confirming_your_new_email_address": "새 이메일 주소를 확인하는 중…",
    "your_email_change_request_has_expired": "이메일 변경 요청이 만료되었습니다.",
    "please_go_to_your_settings_and_try_changing_your_email_address_again": "설정에서 이메일 변경을 다시 시도해 주세요.",
    "there_was_an_error_changing_your_email_address": "이메일 주소를 변경하는 과정에서 오류가 발생했습니다.",
    "your_email_address_was_updated_successfully": "이메일 주소가 성공적으로 변경되었습니다."
  },
  "pt": {
    "change_email": "Alterar E-mail",
    "confirming_your_new_email_address": "Confirmando seu novo endereço de e-mail...",
    "your_email_change_request_has_expired": "Seu pedido de alteração de e-mail expirou.",
    "please_go_to_your_settings_and_try_changing_your_email_address_again": "Por favor, acesse suas configurações e tente alterar seu endereço de e-mail novamente.",
    "there_was_an_error_changing_your_email_address": "Houve um erro ao alterar seu endereço de e-mail.",
    "your_email_address_was_updated_successfully": "Seu endereço de e-mail foi atualizado com sucesso."
  },
  "uk": {
    "change_email": "Змінити електронну адресу",
    "confirming_your_new_email_address": "Підтвердження вашої нової електронної адреси...",
    "your_email_change_request_has_expired": "Ваш запит на зміну електронної адреси застарів.",
    "please_go_to_your_settings_and_try_changing_your_email_address_again": "Будь ласка, перейдіть до налаштувань і спробуйте змінити свою електронну адресу знову.",
    "there_was_an_error_changing_your_email_address": "Під час зміни вашої електронної адреси сталася помилка.",
    "your_email_address_was_updated_successfully": "Ваша електронна адреса була успішно оновлена."
  }
}
</i18n>
