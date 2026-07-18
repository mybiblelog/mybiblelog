<template>
  <div>
    <h2 class="mbl-title mbl-title--4">
      {{ t('change_email') }}
    </h2>
    <template v-if="checkingForEmailChangeRequest">
      <div class="mbl-content">
        <p>{{ t('checking_current_email_settings') }}</p>
      </div>
    </template>
    <template v-else-if="currentChangeEmailRequest">
      <div class="mbl-content">
        <p>
          {{ t('your_current_email_is') }}
          <br>
          <strong>{{ authStore.user?.email }}</strong>
        </p>
        <p>
          {{ t('your_requested_email_is') }}
          <br>
          <strong>{{ currentChangeEmailRequest.newEmail }}</strong>
        </p>
        <p>{{ t('check_your_new_email') }}</p>
        <p>{{ t('you_can_cancel') }}</p>
        <button class="mbl-button mbl-button--danger" :disabled="!mounted || formBusy" @click="cancelChangeEmailRequest">
          {{ t('cancel_request') }}
        </button>
      </div>
    </template>
    <template v-else-if="!authStore.user?.hasLocalAccount">
      <div class="mbl-content">
        <p>{{ t('no_password_message') }}</p>
        <p>{{ t('must_set_password') }}</p>
      </div>
      <form @submit.prevent="submitSetPassword">
        <div v-if="setPasswordErrors._form" class="mbl-help mbl-help--danger">
          {{ $terr(setPasswordErrors._form) }}
        </div>
        <div class="mbl-field">
          <label class="mbl-label" for="setPasswordPassword">{{ t('set_password_new_password') }}</label>
          <div class="mbl-control">
            <input
              id="setPasswordPassword"
              v-model="setPasswordModel.password"
              class="mbl-input"
              type="password"
              name="setPasswordPassword"
              :disabled="!mounted"
            >
          </div>
          <div v-if="setPasswordErrors.password" class="mbl-help mbl-help--danger">
            {{ $terr(setPasswordErrors.password, { field: t('set_password_new_password') }) }}
          </div>
        </div>
        <div class="mbl-field">
          <label class="mbl-label" for="setPasswordConfirmPassword">{{ t('confirm_new_password') }}</label>
          <div class="mbl-control">
            <input
              id="setPasswordConfirmPassword"
              v-model="setPasswordModel.confirmPassword"
              class="mbl-input"
              type="password"
              name="setPasswordConfirmPassword"
              :disabled="!mounted"
            >
          </div>
          <div v-if="setPasswordErrors.confirmPassword" class="mbl-help mbl-help--danger">
            {{ $terr(setPasswordErrors.confirmPassword, { field: t('confirm_new_password') }) }}
          </div>
        </div>
        <div class="mbl-field">
          <div class="mbl-control">
            <button class="mbl-button mbl-button--primary" type="submit" :disabled="!mounted || formBusy">
              {{ t('set_password') }}
            </button>
          </div>
        </div>
      </form>
    </template>
    <template v-else>
      <div class="mbl-content">
        <p>{{ t('enter_new_email') }}</p>
        <p>{{ t('you_will_receive_an_email') }}</p>
      </div>
      <form @submit.prevent="submitChangeEmail">
        <div v-if="changeEmailErrors._form" class="mbl-help mbl-help--danger">
          {{ $terr(changeEmailErrors._form) }}
        </div>
        <div class="mbl-field">
          <label class="mbl-label" for="newEmail">{{ t('new_email') }}</label>
          <div class="mbl-control">
            <input
              id="newEmail"
              v-model="changeEmailModel.newEmail"
              class="mbl-input"
              type="email"
              name="newEmail"
              :disabled="!mounted"
            >
          </div>
          <div v-if="changeEmailErrors.newEmail" class="mbl-help mbl-help--danger">
            {{ $terr(changeEmailErrors.newEmail, { field: t('new_email') }) }}
          </div>
        </div>
        <div class="mbl-field">
          <label class="mbl-label" for="password">{{ t('current_password') }}</label>
          <div class="mbl-control">
            <input
              id="password"
              v-model="changeEmailModel.password"
              class="mbl-input"
              type="password"
              name="password"
              :disabled="!mounted"
            >
          </div>
          <div v-if="changeEmailErrors.password" class="mbl-help mbl-help--danger">
            {{ $terr(changeEmailErrors.password, { field: t('current_password') }) }}
          </div>
        </div>
        <div class="mbl-field">
          <div class="mbl-control">
            <button class="mbl-button mbl-button--primary" type="submit" :disabled="!mounted || formBusy">
              {{ t('change_email') }}
            </button>
          </div>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ApiError, UnknownApiError } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';
import type { ApiErrorDetail } from '~/helpers/api-error';
import { useDialogStore } from '~/stores/dialog';
import { useToastStore } from '~/stores/toast';
import { useAuthStore } from '~/stores/auth';

definePageMeta({ middleware: ['auth'] });

const { t } = useI18n();
useHead({ title: () => t('change_email'), meta: [{ name: 'robots', content: 'noindex' }] });

const mounted = ref(false);
onMounted(() => { mounted.value = true; });

const authStore = useAuthStore();
const dialogStore = useDialogStore();
const toastStore = useToastStore();
const { $http, $terr } = useNuxtApp();

type ChangeEmailRequest = { newEmail: string; expires: number };

const formBusy = ref(false);
const changeEmailModel = reactive({ password: '', newEmail: '' });
const changeEmailErrors = reactive<Record<string, string | ApiErrorDetail>>({ _form: '', password: '', newEmail: '' });
const setPasswordModel = reactive({ password: '', confirmPassword: '' });
const setPasswordErrors = reactive<Record<string, string | ApiErrorDetail>>({ _form: '', password: '', confirmPassword: '' });

const checkingForEmailChangeRequest = ref(true);
const currentChangeEmailRequest = ref<ChangeEmailRequest | null>(null);

function resetChangeEmailErrors() {
  Object.assign(changeEmailErrors, { _form: '', password: '', newEmail: '' });
}

function resetSetPasswordErrors() {
  Object.assign(setPasswordErrors, { _form: '', password: '', confirmPassword: '' });
}

let checkChangeEmailRequestInFlight = false;

async function checkChangeEmailRequestState() {
  if (checkChangeEmailRequestInFlight) { return; }
  checkChangeEmailRequestInFlight = true;
  try {
    const { data } = await $http.get<ChangeEmailRequest | null>('/api/auth/change-email');
    currentChangeEmailRequest.value = data?.newEmail ? data : null;
  }
  catch {
    currentChangeEmailRequest.value = null;
  }
  finally {
    checkingForEmailChangeRequest.value = false;
    checkChangeEmailRequestInFlight = false;
  }
}

onMounted(() => {
  checkChangeEmailRequestState();
  window.addEventListener('focus', checkChangeEmailRequestState);
});
onUnmounted(() => {
  window.removeEventListener('focus', checkChangeEmailRequestState);
});

async function submitChangeEmail() {
  if (formBusy.value) { return; }
  formBusy.value = true;
  resetChangeEmailErrors();

  const { password, newEmail } = changeEmailModel;

  if (!password.length) {
    changeEmailErrors.password = t('enter_your_current_password');
    formBusy.value = false;
    return;
  }

  try {
    await $http.post('/api/auth/change-email', { password, newEmail });
    changeEmailModel.password = '';
    changeEmailModel.newEmail = '';
    resetChangeEmailErrors();
    toastStore.add({ type: 'success', text: t('confirmation_link_sent') });
  }
  catch (err) {
    Object.assign(changeEmailErrors, mapFormErrors(err instanceof ApiError ? err : new UnknownApiError()));
  }
  finally {
    formBusy.value = false;
    await checkChangeEmailRequestState();
  }
}

async function submitSetPassword() {
  if (formBusy.value) { return; }
  formBusy.value = true;
  resetSetPasswordErrors();

  const { password, confirmPassword } = setPasswordModel;

  if (!password.length) {
    setPasswordErrors.password = t('please_enter_a_password');
    formBusy.value = false;
    return;
  }

  if (password !== confirmPassword) {
    setPasswordErrors.confirmPassword = t('passwords_must_match');
    formBusy.value = false;
    return;
  }

  try {
    await $http.post('/api/auth/password/set', { password, confirmPassword });
    setPasswordModel.password = '';
    setPasswordModel.confirmPassword = '';
    await authStore.refreshUser();
  }
  catch (err) {
    Object.assign(setPasswordErrors, mapFormErrors(err instanceof ApiError ? err : new UnknownApiError()));
  }
  finally {
    formBusy.value = false;
  }
}

async function cancelChangeEmailRequest() {
  if (formBusy.value) { return; }
  formBusy.value = true;
  try {
    const { data } = await $http.delete<boolean>('/api/auth/change-email');
    if (data === true) {
      currentChangeEmailRequest.value = null;
      await dialogStore.alert({ message: t('your_request_was_cancelled') });
    }
    else {
      toastStore.add({ type: 'error', text: t('unable_to_cancel_request') });
    }
  }
  catch {
    toastStore.add({ type: 'error', text: t('something_went_wrong') });
  }
  finally {
    formBusy.value = false;
  }
}
</script>

<style scoped>
p {
  margin-bottom: 1rem;
}
</style>

<i18n lang="json">
{
  "en": {
    "change_email": "Change Email",
    "checking_current_email_settings": "Checking current email settings...",
    "your_current_email_is": "Your current email address is:",
    "your_requested_email_is": "You requested to change your email address to:",
    "check_your_new_email": "Please check your new email address to confirm the change. You may need to refresh this page afterward.",
    "you_can_cancel": "You can also cancel your email change request to keep your current email.",
    "cancel_request": "Cancel Request",
    "enter_new_email": "Enter your new email along with your current password.",
    "you_will_receive_an_email": "You will receive an email at the new address to confirm the change.",
    "no_password_message": "Your account was created with Google and does not have a password.",
    "must_set_password": "To change your email address, you first need to create a password.",
    "set_password_new_password": "New Password",
    "confirm_new_password": "Confirm Password",
    "set_password": "Set Password",
    "please_enter_a_password": "Please enter a password.",
    "passwords_must_match": "Passwords must match.",
    "new_email": "New Email",
    "current_password": "Current Password",
    "enter_your_current_password": "Enter your current password.",
    "confirmation_link_sent": "A confirmation link has been sent to your new email address. Click the link to finish changing your email.",
    "your_request_was_cancelled": "Your email change request was cancelled.",
    "unable_to_cancel_request": "Unable to cancel request. It may already be fulfilled.",
    "something_went_wrong": "Something went wrong. Please try again."
  },
  "de": {
    "change_email": "E-Mail ändern",
    "checking_current_email_settings": "Aktuelle E-Mail-Einstellungen werden überprüft...",
    "your_current_email_is": "Ihre aktuelle E-Mail-Adresse ist:",
    "your_requested_email_is": "Sie haben angefragt, Ihre E-Mail-Adresse zu ändern zu:",
    "check_your_new_email": "Bitte überprüfen Sie Ihre neue E-Mail-Adresse, um den Wechsel zu bestätigen. Möglicherweise müssen Sie diese Seite später aktualisieren.",
    "you_can_cancel": "Sie können auch Ihre E-Mail-Änderungsanfrage stornieren, um Ihre aktuelle E-Mail-Adresse beizubehalten.",
    "cancel_request": "Anfrage stornieren",
    "enter_new_email": "Geben Sie Ihre neue E-Mail-Adresse sowie Ihr aktuelles Passwort ein.",
    "you_will_receive_an_email": "Sie erhalten eine E-Mail an der neuen Adresse, um den Wechsel zu bestätigen.",
    "no_password_message": "Ihr Konto wurde mit Google erstellt und hat kein Passwort.",
    "must_set_password": "Um Ihre E-Mail-Adresse zu ändern, müssen Sie zunächst ein Passwort erstellen.",
    "set_password_new_password": "Neues Passwort",
    "confirm_new_password": "Passwort bestätigen",
    "set_password": "Passwort festlegen",
    "please_enter_a_password": "Bitte geben Sie ein Passwort ein.",
    "passwords_must_match": "Die Passwörter müssen übereinstimmen.",
    "new_email": "Neue E-Mail-Adresse",
    "current_password": "Aktuelles Passwort",
    "enter_your_current_password": "Geben Sie Ihr aktuelles Passwort ein.",
    "confirmation_link_sent": "Eine Bestätigungs-E-Mail wurde an Ihre neue E-Mail-Adresse gesendet. Klicken Sie auf den Link, um den Wechsel abzuschließen.",
    "your_request_was_cancelled": "Ihre E-Mail-Änderungsanfrage wurde storniert.",
    "unable_to_cancel_request": "Die Anfrage konnte nicht storniert werden. Möglicherweise wurde sie bereits ausgeführt.",
    "something_went_wrong": "Etwas ist schiefgegangen. Bitte versuchen Sie es erneut."
  },
  "es": {
    "change_email": "Cambiar Correo Electrónico",
    "checking_current_email_settings": "Comprobando la configuración de correo electrónico actual...",
    "your_current_email_is": "Su dirección de correo electrónico actual es:",
    "your_requested_email_is": "Solicitó cambiar su dirección de correo electrónico a:",
    "check_your_new_email": "Por favor, compruebe su nueva dirección de correo electrónico para confirmar el cambio. Es posible que tenga que actualizar esta página después.",
    "you_can_cancel": "También puede cancelar su solicitud de cambio de correo electrónico para mantener su correo electrónico actual.",
    "cancel_request": "Cancelar Solicitud",
    "enter_new_email": "Introduzca su nuevo correo electrónico junto con su contraseña actual.",
    "you_will_receive_an_email": "Recibirá un correo electrónico en la nueva dirección para confirmar el cambio.",
    "no_password_message": "Su cuenta fue creada con Google y no tiene contraseña.",
    "must_set_password": "Para cambiar su dirección de correo electrónico, primero debe crear una contraseña.",
    "set_password_new_password": "Nueva Contraseña",
    "confirm_new_password": "Confirmar Contraseña",
    "set_password": "Establecer Contraseña",
    "please_enter_a_password": "Por favor ingrese una contraseña.",
    "passwords_must_match": "Las contraseñas deben coincidir.",
    "new_email": "Nuevo Correo Electrónico",
    "current_password": "Contraseña Actual",
    "enter_your_current_password": "Introduzca su contraseña actual.",
    "confirmation_link_sent": "Se ha enviado un enlace de confirmación a su nueva dirección de correo electrónico. Haga clic en el enlace para terminar de cambiar su correo electrónico.",
    "your_request_was_cancelled": "Su solicitud de cambio de correo electrónico fue cancelada.",
    "unable_to_cancel_request": "No se puede cancelar la solicitud. Es posible que ya esté cumplida.",
    "something_went_wrong": "Algo salió mal. Por favor, inténtelo de nuevo."
  },
  "fr": {
    "change_email": "Changer Email",
    "checking_current_email_settings": "Vérification des paramètres d'email actuels...",
    "your_current_email_is": "Votre adresse email actuelle est :",
    "your_requested_email_is": "Vous avez demandé à changer votre adresse email pour :",
    "check_your_new_email": "Veuillez vérifier votre nouvelle adresse email pour confirmer le changement. Vous devrez peut-être rafraîchir cette page par la suite.",
    "you_can_cancel": "Vous pouvez également annuler votre demande de changement d'email pour conserver votre adresse email actuelle.",
    "cancel_request": "Annuler la Demande",
    "enter_new_email": "Entrez votre nouvelle adresse email ainsi que votre mot de passe actuel.",
    "you_will_receive_an_email": "Vous recevrez un email à la nouvelle adresse pour confirmer le changement.",
    "no_password_message": "Votre compte a été créé avec Google et n'a pas de mot de passe.",
    "must_set_password": "Pour changer votre adresse email, vous devez d'abord créer un mot de passe.",
    "set_password_new_password": "Nouveau Mot de Passe",
    "confirm_new_password": "Confirmer le Mot de Passe",
    "set_password": "Définir le Mot de Passe",
    "please_enter_a_password": "Veuillez entrer un mot de passe.",
    "passwords_must_match": "Les mots de passe doivent correspondre.",
    "new_email": "Nouvel Email",
    "current_password": "Mot de passe actuel",
    "enter_your_current_password": "Entrez votre mot de passe actuel.",
    "confirmation_link_sent": "Un lien de confirmation a été envoyé à votre nouvelle adresse e-mail. Cliquez sur le lien pour terminer la modification de votre e-mail.",
    "your_request_was_cancelled": "Votre demande de changement d'e-mail a été annulée.",
    "unable_to_cancel_request": "Impossible d'annuler la demande. Elle peut déjà être satisfaite.",
    "something_went_wrong": "Quelque chose s'est mal passé. Veuillez réessayer."
  },
  "ko": {
    "change_email": "이메일 변경",
    "checking_current_email_settings": "현재 이메일 설정을 확인하는 중…",
    "your_current_email_is": "현재 이메일 주소:",
    "your_requested_email_is": "다음 주소로 변경을 요청하셨습니다:",
    "check_your_new_email": "변경을 완료하려면 새 이메일 주소로 보낸 메일을 확인하세요. 이후 이 페이지를 새로고침해야 할 수 있습니다.",
    "you_can_cancel": "이메일 변경 요청을 취소하고 현재 이메일을 유지할 수도 있습니다.",
    "cancel_request": "요청 취소",
    "enter_new_email": "새 이메일과 현재 비밀번호를 입력하세요.",
    "you_will_receive_an_email": "새로운 주소로 확인 메일이 발송됩니다.",
    "no_password_message": "귀하의 계정은 Google로 생성되었으며 비밀번호가 없습니다.",
    "must_set_password": "이메일 주소를 변경하려면 먼저 비밀번호를 만들어야 합니다.",
    "set_password_new_password": "새 비밀번호",
    "confirm_new_password": "비밀번호 확인",
    "set_password": "비밀번호 설정",
    "please_enter_a_password": "비밀번호를 입력하세요.",
    "passwords_must_match": "비밀번호가 일치해야 합니다.",
    "new_email": "새 이메일",
    "current_password": "현재 비밀번호",
    "enter_your_current_password": "현재 비밀번호를 입력하세요.",
    "confirmation_link_sent": "새로운 이메일 주소로 확인 링크가 발송되었습니다. 해당 링크를 눌러 이메일 변경을 완료하세요.",
    "your_request_was_cancelled": "이메일 변경 요청이 취소되었습니다.",
    "unable_to_cancel_request": "요청을 취소할 수 없습니다. 이미 처리 완료되었을 수 있습니다.",
    "something_went_wrong": "문제가 발생했습니다. 다시 시도해 주세요."
  },
  "pt": {
    "change_email": "Alterar Email",
    "checking_current_email_settings": "Verificando as configurações de email atuais...",
    "your_current_email_is": "Seu endereço de email atual é:",
    "your_requested_email_is": "Você solicitou a alteração do seu endereço de email para:",
    "check_your_new_email": "Por favor, verifique seu novo endereço de email para confirmar a alteração. Você pode precisar atualizar esta página depois.",
    "you_can_cancel": "Você também pode cancelar sua solicitação de alteração de email para manter seu email atual.",
    "cancel_request": "Cancelar Solicitação",
    "enter_new_email": "Insira seu novo email juntamente com sua senha atual.",
    "you_will_receive_an_email": "Você receberá um email no novo endereço para confirmar a alteração.",
    "no_password_message": "Sua conta foi criada com o Google e não possui senha.",
    "must_set_password": "Para alterar seu endereço de email, você primeiro precisa criar uma senha.",
    "set_password_new_password": "Nova Senha",
    "confirm_new_password": "Confirmar Senha",
    "set_password": "Definir Senha",
    "please_enter_a_password": "Por favor insira uma senha.",
    "passwords_must_match": "As senhas devem ser iguais.",
    "new_email": "Novo E-mail",
    "current_password": "Senha Atual",
    "enter_your_current_password": "Digite sua senha atual.",
    "confirmation_link_sent": "Um link de confirmação foi enviado para o seu novo endereço de e-mail. Clique no link para concluir a alteração do seu e-mail.",
    "your_request_was_cancelled": "Seu pedido de alteração de e-mail foi cancelado.",
    "unable_to_cancel_request": "Não foi possível cancelar o pedido. Pode já ter sido concluído.",
    "something_went_wrong": "Algo deu errado. Por favor, tente novamente."
  },
  "uk": {
    "change_email": "Змінити Email",
    "checking_current_email_settings": "Перевірка поточних налаштувань електронної пошти...",
    "your_current_email_is": "Ваш поточний електронний адреса:",
    "your_requested_email_is": "Ви подали запит на зміну електронної адреси на:",
    "check_your_new_email": "Будь ласка, перевірте свою нову електронну адресу для підтвердження змін. Можливо, вам доведеться оновити цю сторінку після цього.",
    "you_can_cancel": "Ви також можете відмінити запит на зміну електронної адреси, щоб залишити ваш поточний електронний адресу.",
    "cancel_request": "Скасувати запит",
    "enter_new_email": "Введіть свою нову електронну адресу разом з вашим поточним паролем.",
    "you_will_receive_an_email": "Ви отримаєте лист на новій адресі для підтвердження змін.",
    "no_password_message": "Ваш обліковий запис було створено через Google і не має пароля.",
    "must_set_password": "Щоб змінити електронну адресу, вам спочатку потрібно створити пароль.",
    "set_password_new_password": "Новий Пароль",
    "confirm_new_password": "Підтвердити Пароль",
    "set_password": "Встановити Пароль",
    "please_enter_a_password": "Будь ласка, введіть пароль.",
    "passwords_must_match": "Паролі повинні співпадати.",
    "new_email": "Новий Email",
    "current_password": "Поточний Пароль",
    "enter_your_current_password": "Введіть свій поточний пароль.",
    "confirmation_link_sent": "Посилання для підтвердження було відправлено на вашу нову електронну адресу. Клацніть по посиланню, щоб завершити зміну електронної адреси.",
    "your_request_was_cancelled": "Ваш запит на зміну електронної адреси було скасовано.",
    "unable_to_cancel_request": "Не вдалося скасувати запит. Можливо, він вже виконаний.",
    "something_went_wrong": "Щось пішло не так. Будь ласка, спробуйте знову."
  }
}
</i18n>
