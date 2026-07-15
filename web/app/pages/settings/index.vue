<template>
  <div>
    <h1 class="mbl-title mbl-title--4">
      {{ t('account') }}
    </h1>
    <div class="mbl-content">
      <p>
        <em>{{ authStore.user?.email }}</em>
      </p>
      <p>
        <NuxtLink class="mbl-button mbl-button--primary" :to="localePath('/settings/email')">
          {{ t('change_email') }}
        </NuxtLink>
      </p>
    </div>
    <template v-if="authStore.user?.hasLocalAccount">
      <h2 class="mbl-title mbl-title--4">
        {{ t('password') }}
      </h2>
      <div class="mbl-content">
        <p>{{ t('you_can_change_your_password_below') }}</p>
        <p>
          <NuxtLink class="mbl-button mbl-button--primary" :to="localePath('/settings/password')">
            {{ t('change_password') }}
          </NuxtLink>
        </p>
      </div>
    </template>
    <h2 class="mbl-title mbl-title--4">
      {{ t('sessions') }}
    </h2>
    <div class="mbl-content">
      <p>{{ t('log_out_all_description') }}</p>
      <p>
        <button
          class="mbl-button mbl-button--danger"
          :disabled="!mounted || busy"
          @click="logOutAllSessions"
        >
          {{ t('log_out_all') }}
        </button>
      </p>
    </div>
    <h2 class="mbl-title mbl-title--4">
      {{ t('delete_account') }}
    </h2>
    <div class="mbl-content">
      <p>{{ t('you_are_in_control') }}</p>
      <p>
        <NuxtLink :to="localePath('/settings/delete-account')">
          {{ t('learn_more') }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { useDialogStore } from '~/stores/dialog';
import { useToastStore } from '~/stores/toast';

definePageMeta({ middleware: ['auth'] });
useHead({ meta: [{ name: 'robots', content: 'noindex' }] });

const { t } = useI18n();
const localePath = useLocalePath();
const authStore = useAuthStore();
const dialogStore = useDialogStore();
const toastStore = useToastStore();
const { $http } = useNuxtApp();

// Guard against double-submits and against interacting before hydration
// (mirrors the disabled-until-mounted pattern used across settings pages).
const mounted = ref(false);
onMounted(() => { mounted.value = true; });
const busy = ref(false);

async function logOutAllSessions() {
  if (busy.value) { return; }
  const confirmed = await dialogStore.confirm({
    title: t('log_out_all'),
    message: t('log_out_all_confirm'),
    confirmButtonText: t('log_out_all_confirm_button'),
    confirmButtonType: 'danger',
    cancelButtonText: t('cancel'),
  });
  if (!confirmed) { return; }

  busy.value = true;
  try {
    // The endpoint bumps tokenVersion (revoking other devices) and re-mints this
    // device's cookie, so we stay signed in — no redirect.
    await $http.post('/api/auth/logout-all');
    toastStore.add({ type: 'success', text: t('log_out_all_success') });
  }
  catch {
    toastStore.add({ type: 'error', text: t('log_out_all_error') });
  }
  finally {
    busy.value = false;
  }
}
</script>

<i18n lang="json">
{
  "en": {
    "account": "Account",
    "change_email": "Change Email",
    "password": "Password",
    "you_can_change_your_password_below": "You can change your password below.",
    "change_password": "Change Password",
    "delete_account": "Delete Account",
    "you_are_in_control": "You are in control of your data. You can delete your account and all data associated with it.",
    "learn_more": "Learn More",
    "sessions": "Sessions",
    "log_out_all_description": "Sign out of My Bible Log on every other device. Your current device stays signed in. Do this if you've used a shared computer or think someone else may have access to your account.",
    "log_out_all": "Log Out All Sessions",
    "log_out_all_confirm": "This will sign you out of My Bible Log on all other devices. You will stay signed in here.",
    "log_out_all_confirm_button": "Log Out All Sessions",
    "cancel": "Cancel",
    "log_out_all_success": "All other sessions have been logged out.",
    "log_out_all_error": "Unable to log out other sessions. Please try again later."
  },
  "de": {
    "account": "Konto",
    "change_email": "E-Mail ändern",
    "password": "Passwort",
    "you_can_change_your_password_below": "Sie können Ihr Passwort unten ändern.",
    "change_password": "Passwort ändern",
    "delete_account": "Konto löschen",
    "you_are_in_control": "Sie haben die Kontrolle über Ihre Daten. Sie können Ihr Konto und alle mit ihm verbundenen Daten löschen.",
    "learn_more": "Mehr erfahren",
    "sessions": "Sitzungen",
    "log_out_all_description": "Melden Sie sich auf allen anderen Geräten von My Bible Log ab. Ihr aktuelles Gerät bleibt angemeldet. Tun Sie dies, wenn Sie einen gemeinsam genutzten Computer verwendet haben oder vermuten, dass jemand anderes Zugriff auf Ihr Konto hat.",
    "log_out_all": "Von allen Sitzungen abmelden",
    "log_out_all_confirm": "Dadurch werden Sie auf allen anderen Geräten von My Bible Log abgemeldet. Auf diesem Gerät bleiben Sie angemeldet.",
    "log_out_all_confirm_button": "Von allen Sitzungen abmelden",
    "cancel": "Abbrechen",
    "log_out_all_success": "Alle anderen Sitzungen wurden abgemeldet.",
    "log_out_all_error": "Andere Sitzungen konnten nicht abgemeldet werden. Bitte versuchen Sie es später erneut."
  },
  "es": {
    "account": "Cuenta",
    "change_email": "Cambiar correo electrónico",
    "password": "Contraseña",
    "you_can_change_your_password_below": "Puede cambiar su contraseña a continuación.",
    "change_password": "Cambiar contraseña",
    "delete_account": "Eliminar cuenta",
    "you_are_in_control": "Usted tiene el control de sus datos. Puede eliminar su cuenta y todos los datos asociados a ella.",
    "learn_more": "Aprende más",
    "sessions": "Sesiones",
    "log_out_all_description": "Cierre sesión de My Bible Log en todos los demás dispositivos. Su dispositivo actual permanecerá con la sesión iniciada. Hágalo si ha usado un ordenador compartido o cree que alguien más puede tener acceso a su cuenta.",
    "log_out_all": "Cerrar todas las sesiones",
    "log_out_all_confirm": "Esto cerrará su sesión de My Bible Log en todos los demás dispositivos. Aquí permanecerá con la sesión iniciada.",
    "log_out_all_confirm_button": "Cerrar todas las sesiones",
    "cancel": "Cancelar",
    "log_out_all_success": "Se han cerrado todas las demás sesiones.",
    "log_out_all_error": "No se pudieron cerrar las otras sesiones. Por favor, inténtelo de nuevo más tarde."
  },
  "fr": {
    "account": "Compte",
    "change_email": "Changer Email",
    "password": "Mot de passe",
    "you_can_change_your_password_below": "Vous pouvez changer votre mot de passe ci-dessous.",
    "change_password": "Changer Mot de passe",
    "delete_account": "Supprimer Compte",
    "you_are_in_control": "Vous êtes en contrôle de vos données. Vous pouvez supprimer votre compte et toutes les données qui y sont associées.",
    "learn_more": "En savoir plus",
    "sessions": "Sessions",
    "log_out_all_description": "Déconnectez-vous de My Bible Log sur tous les autres appareils. Votre appareil actuel reste connecté. Faites-le si vous avez utilisé un ordinateur partagé ou si vous pensez que quelqu'un d'autre a accès à votre compte.",
    "log_out_all": "Déconnecter toutes les sessions",
    "log_out_all_confirm": "Cela vous déconnectera de My Bible Log sur tous les autres appareils. Vous resterez connecté ici.",
    "log_out_all_confirm_button": "Déconnecter toutes les sessions",
    "cancel": "Annuler",
    "log_out_all_success": "Toutes les autres sessions ont été déconnectées.",
    "log_out_all_error": "Impossible de déconnecter les autres sessions. Veuillez réessayer plus tard."
  },
  "ko": {
    "account": "계정",
    "change_email": "이메일 변경",
    "password": "비밀번호",
    "you_can_change_your_password_below": "아래에서 비밀번호를 변경할 수 있습니다.",
    "change_password": "비밀번호 변경",
    "delete_account": "계정 삭제",
    "you_are_in_control": "여러분의 데이터는 여러분이 관리할 수 있습니다. 계정 및 모든 관련 데이터를 삭제할 수 있습니다.",
    "learn_more": "자세히 보기",
    "sessions": "세션",
    "log_out_all_description": "다른 모든 기기에서 My Bible Log 로그아웃합니다. 현재 기기는 로그인 상태로 유지됩니다. 공용 컴퓨터를 사용했거나 다른 사람이 계정에 접근했을 수 있다고 생각되면 이 기능을 사용하세요.",
    "log_out_all": "모든 세션 로그아웃",
    "log_out_all_confirm": "다른 모든 기기에서 My Bible Log 로그아웃됩니다. 이 기기에서는 로그인 상태가 유지됩니다.",
    "log_out_all_confirm_button": "모든 세션 로그아웃",
    "cancel": "취소",
    "log_out_all_success": "다른 모든 세션이 로그아웃되었습니다.",
    "log_out_all_error": "다른 세션을 로그아웃할 수 없습니다. 나중에 다시 시도해 주세요."
  },
  "pt": {
    "account": "Conta",
    "change_email": "Alterar Email",
    "password": "Senha",
    "you_can_change_your_password_below": "Você pode alterar sua senha abaixo.",
    "change_password": "Alterar Senha",
    "delete_account": "Excluir Conta",
    "you_are_in_control": "Você está no controle dos seus dados. Você pode excluir sua conta e todos os dados associados a ela.",
    "learn_more": "Saiba Mais",
    "sessions": "Sessões",
    "log_out_all_description": "Saia do My Bible Log em todos os outros dispositivos. O seu dispositivo atual permanece conectado. Faça isso se você usou um computador compartilhado ou acha que outra pessoa pode ter acesso à sua conta.",
    "log_out_all": "Encerrar todas as sessões",
    "log_out_all_confirm": "Isso encerrará sua sessão do My Bible Log em todos os outros dispositivos. Você permanecerá conectado aqui.",
    "log_out_all_confirm_button": "Encerrar todas as sessões",
    "cancel": "Cancelar",
    "log_out_all_success": "Todas as outras sessões foram encerradas.",
    "log_out_all_error": "Não foi possível encerrar as outras sessões. Por favor, tente novamente mais tarde."
  },
  "uk": {
    "account": "Обліковий запис",
    "change_email": "Змінити електронну пошту",
    "password": "Пароль",
    "you_can_change_your_password_below": "Ви можете змінити свій пароль нижче.",
    "change_password": "Змінити пароль",
    "delete_account": "Видалити обліковий запис",
    "you_are_in_control": "Ви контролюєте свої дані. Ви можете видалити свій обліковий запис та всі пов'язані з ним дані.",
    "learn_more": "Дізнатися більше",
    "sessions": "Сеанси",
    "log_out_all_description": "Вийдіть із My Bible Log на всіх інших пристроях. Ваш поточний пристрій залишиться в системі. Зробіть це, якщо ви користувалися спільним комп'ютером або вважаєте, що хтось інший може мати доступ до вашого облікового запису.",
    "log_out_all": "Вийти з усіх сеансів",
    "log_out_all_confirm": "Це призведе до виходу з My Bible Log на всіх інших пристроях. На цьому пристрої ви залишитеся в системі.",
    "log_out_all_confirm_button": "Вийти з усіх сеансів",
    "cancel": "Скасувати",
    "log_out_all_success": "З усіх інших сеансів виконано вихід.",
    "log_out_all_error": "Не вдалося вийти з інших сеансів. Будь ласка, спробуйте пізніше."
  }
}
</i18n>
