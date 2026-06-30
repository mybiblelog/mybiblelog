<template>
  <main>
    <div class="content-column">
      <header class="page-header">
        <h1 class="mbl-title mbl-title--3">
          {{ $t('unsubscribe') }}
        </h1>
      </header>
      <div class="mbl-content">
        <template v-if="complete">
          <i18n-t keypath="success" tag="p">
            <template #email><strong>{{ email }}</strong></template>
          </i18n-t>
          <p>
            <NuxtLink class="mbl-button mbl-button--primary" :to="localePath('/settings/reminder')">
              {{ $t('update_preferences') }}
            </NuxtLink>
          </p>
        </template>
        <template v-else>
          <template v-if="errorMsg">
            <p class="mbl-text-danger">
              {{ $t('client_error.title') }}
            </p>
            <p>{{ $t('client_error.p1') }}</p>
            <p>{{ $t('client_error.p2') }}</p>
            <p>{{ $t('client_error.p3') }}</p>
            <p>
              <NuxtLink class="mbl-button mbl-button--primary" :to="localePath('/settings/reminder')">
                {{ $t('update_preferences') }}
              </NuxtLink>
            </p>
          </template>
          <template v-else>
            <p>{{ $t('unsubscribing_you') }}</p>
          </template>
        </template>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ApiError } from '~/helpers/api-error';

useHead({ meta: [{ name: 'robots', content: 'noindex' }] });

const localePath = useLocalePath();
const { t } = useI18n();

const complete = ref(false);
const errorMsg = ref('');
const email = ref('');

onMounted(async () => {
  const code = new URL(window.location.href).searchParams.get('code');
  if (!code) {
    await navigateTo(localePath('/'));
    return;
  }
  try {
    const { $http } = useNuxtApp();
    const { data } = await $http.put(`/api/reminders/daily-reminder/unsubscribe/${code}`);
    complete.value = true;
    email.value = data.email;
  }
  catch (err) {
    if (err instanceof ApiError) {
      errorMsg.value = [t('server_error.p1'), t('server_error.p2'), t('server_error.p3')].join(' ');
    }
    else {
      errorMsg.value = t('there_was_an_error');
    }
  }
});
</script>

<i18n lang="json">
{
  "en": {
    "unsubscribe": "Unsubscribe",
    "success": "Success! The email address {email} has been unsubscribed from daily reminder emails.",
    "update_preferences": "Update Preferences",
    "client_error": { "title": "Error encountered while trying to unsubscribe.", "p1": "The unsubscribe link that was used to reach this page is probably expired.", "p2": "This happens when someone has unsubscribed then subscribed again, creating a new subscription.", "p3": "Please follow the unsubscribe link in the most recent email or update your preferences." },
    "server_error": { "p1": "The unsubscribe link that was used to reach this page is expired.", "p2": "This happens when someone has unsubscribed then subscribed again, creating a new subscription.", "p3": "Please follow the unsubscribe link in the most recent email or sign in to update your preferences." },
    "unsubscribing_you": "Unsubscribing you from daily reminder emails...",
    "there_was_an_error": "There was an error during the unsubscribe process."
  },
  "de": {
    "unsubscribe": "Abmelden",
    "success": "Erfolg! Die E-Mail-Adresse {email} wurde von den täglichen Erinnerungs-E-Mails abgemeldet.",
    "update_preferences": "Einstellungen aktualisieren",
    "client_error": { "title": "Fehler beim Versuch der Abmeldung aufgetreten.", "p1": "Der Abmeldelink, der verwendet wurde, um diese Seite zu erreichen, ist wahrscheinlich abgelaufen.", "p2": "Dies geschieht, wenn jemand sich abgemeldet hat und dann erneut angemeldet hat und so ein neues Abonnement erstellt hat.", "p3": "Bitte folgen Sie dem Abmeldelink in der neuesten E-Mail oder aktualisieren Sie Ihre Einstellungen." },
    "server_error": { "p1": "Der Abmeldelink, der verwendet wurde, um diese Seite zu erreichen, ist abgelaufen.", "p2": "Dies geschieht, wenn jemand sich abgemeldet hat und dann erneut angemeldet hat und so ein neues Abonnement erstellt hat.", "p3": "Bitte folgen Sie dem Abmeldelink in der neuesten E-Mail oder melden Sie sich an, um Ihre Einstellungen zu aktualisieren." },
    "unsubscribing_you": "Abmeldung von täglichen Erinnerungsmails...",
    "there_was_an_error": "Es ist ein Fehler während des Abmeldeprozesses aufgetreten."
  },
  "es": {
    "unsubscribe": "Cancelar suscripción",
    "success": "¡Éxito! La dirección de correo electrónico {email} ha sido cancelada de los correos electrónicos de recordatorio diario.",
    "update_preferences": "Actualizar preferencias",
    "client_error": { "title": "Se produjo un error al intentar cancelar la suscripción.", "p1": "El enlace de cancelación de suscripción que se utilizó para llegar a esta página probablemente haya caducado.", "p2": "Esto sucede cuando alguien se ha dado de baja y luego se ha vuelto a suscribir, creando una nueva suscripción.", "p3": "Siga el enlace de cancelación de suscripción en el correo electrónico más reciente o actualice sus preferencias." },
    "server_error": { "p1": "El enlace de cancelación de suscripción que se utilizó para llegar a esta página ha caducado.", "p2": "Esto sucede cuando alguien se ha dado de baja y luego se ha vuelto a suscribir, creando una nueva suscripción.", "p3": "Siga el enlace de cancelación de suscripción en el correo electrónico más reciente o inicie sesión para actualizar sus preferencias." },
    "unsubscribing_you": "Dándote de baja de los correos electrónicos de recordatorio diario...",
    "there_was_an_error": "Se produjo un error durante el proceso de cancelación de la suscripción."
  },
  "fr": {
    "unsubscribe": "Se désabonner",
    "success": "Succès ! L'adresse e-mail {email} a été désabonnée des e-mails de rappel quotidiens.",
    "update_preferences": "Mettre à jour les préférences",
    "client_error": { "title": "Erreur rencontrée lors de la tentative de désabonnement.", "p1": "Le lien de désabonnement qui a été utilisé pour accéder à cette page est probablement expiré.", "p2": "Cela se produit lorsque quelqu'un se désabonne puis se réabonne, créant ainsi un nouvel abonnement.", "p3": "Veuillez suivre le lien de désabonnement dans le courriel le plus récent ou mettre à jour vos préférences." },
    "server_error": { "p1": "Le lien de désabonnement qui a été utilisé pour accéder à cette page est expiré.", "p2": "Cela se produit lorsque quelqu'un se désabonne puis se réabonne, créant ainsi un nouvel abonnement.", "p3": "Veuillez suivre le lien de désabonnement dans le courriel le plus récent ou vous connecter pour mettre à jour vos préférences." },
    "unsubscribing_you": "Désabonnement des e-mails de rappel quotidiens en cours...",
    "there_was_an_error": "Une erreur s'est produite lors du processus de désabonnement."
  },
  "ko": {
    "unsubscribe": "수신 거부",
    "success": "수신 거부가 완료되었습니다! {email} 주소는 매일 알림 목록에서 삭제되었습니다.",
    "update_preferences": "설정 변경",
    "client_error": { "title": "수신 거부 처리 중 오류가 발생했습니다.", "p1": "이 페이지로 연결되는 링크가 만료되었을 수 있습니다.", "p2": "수신 거부 이후 재구독시, 구독이 새로 생성되어 링크가 변경됩니다.", "p3": "가장 최근 수신된 이메일에 포함된 수신 거부 링크를 클릭하거나 설정을 변경해 주세요." },
    "server_error": { "p1": "이 페이지로 연결되는 링크가 만료되었습니다.", "p2": "수신 거부 이후 재구독시, 구독이 새로 생성되어 링크가 변경됩니다.", "p3": "가장 최근 수신된 이메일에 포함된 수신 거부 링크를 클릭하거나 로그인 후 설정에서 변경해 주세요." },
    "unsubscribing_you": "매일 알림 목록에서 삭제하는 중…",
    "there_was_an_error": "수신 거부 처리 과정에서 오류가 발생했습니다."
  },
  "pt": {
    "unsubscribe": "Cancelar a subscrição",
    "success": "Sucesso! O endereço de e-mail {email} foi cancelado dos e-mails de lembrete diários.",
    "update_preferences": "Atualizar Preferências",
    "client_error": { "title": "Erro encontrado ao tentar cancelar a subscrição.", "p1": "O link de cancelamento usado para chegar a esta página provavelmente expirou.", "p2": "Isso acontece quando alguém cancela a subscrição e depois se inscreve novamente, criando uma nova subscrição.", "p3": "Por favor, siga o link de cancelamento no e-mail mais recente ou atualize suas preferências." },
    "server_error": { "p1": "O link de cancelamento usado para chegar a esta página expirou.", "p2": "Isso acontece quando alguém cancela a subscrição e depois se inscreve novamente, criando uma nova subscrição.", "p3": "Por favor, siga o link de cancelamento no e-mail mais recente ou faça login para atualizar suas preferências." },
    "unsubscribing_you": "Cancelando a sua inscrição nos e-mails de lembrete diário...",
    "there_was_an_error": "Ocorreu um erro durante o processo de cancelamento."
  },
  "uk": {
    "unsubscribe": "Відписатися",
    "success": "Успіх! Адреса електронної пошти {email} була відписана від щоденних листів-нагадувань.",
    "update_preferences": "Оновити налаштування",
    "client_error": { "title": "Під час спроби відписатися виникла помилка.", "p1": "Посилання для відписки, за допомогою якого було досягнуто цієї сторінки, ймовірно, застаріло.", "p2": "Це стається, коли хтось відписався, а потім знову підписався, створивши нову підписку.", "p3": "Будь ласка, перейдіть за посиланням для відписки в останньому електронному листі або оновіть свої налаштування." },
    "server_error": { "p1": "Посилання для відписки, за допомогою якого було досягнуто цієї сторінки, застаріло.", "p2": "Це стається, коли хтось відписався, а потім знову підписався, створивши нову підписку.", "p3": "Будь ласка, перейдіть за посиланням для відписки в останньому електронному листі або увійдіть, щоб оновити свої налаштування." },
    "unsubscribing_you": "Відписуємо вас від щоденних листів-нагадувань...",
    "there_was_an_error": "Під час процесу відписки сталася помилка."
  }
}
</i18n>
