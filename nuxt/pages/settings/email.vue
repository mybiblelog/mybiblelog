<template>
  <div>
    <h2 class="mbl-title mbl-title--4">
      {{ $t('change_email') }}
    </h2>
    <template v-if="checkingForEmailChangeRequest">
      <div class="mbl-content">
        <p>{{ $t('checking_current_email_settings') }}</p>
      </div>
    </template>
    <template v-else-if="currentChangeEmailRequest">
      <div class="mbl-content">
        <p>
          {{ $t('current_request.your_current_email_is') }}
          <br>
          <strong>{{ authStore.user?.email }}</strong>
        </p>
        <p>
          {{ $t('current_request.your_requested_email_is') }}
          <br>
          <strong>{{ currentChangeEmailRequest.newEmail }}</strong>
        </p>
        <p>{{ $t('current_request.check_your_new_email') }}</p>
        <p>{{ $t('current_request.you_can_cancel') }}</p>
        <button class="mbl-button mbl-button--danger" :disabled="formBusy" @click="cancelChangeEmailRequest">
          {{ $t('current_request.cancel_request') }}
        </button>
      </div>
    </template>
    <template v-else-if="!authStore.user?.hasLocalAccount">
      <div class="mbl-content">
        <p>{{ $t('set_password.no_password_message') }}</p>
        <p>{{ $t('set_password.must_set_password') }}</p>
      </div>
      <form :disabled="formBusy" @submit.prevent="submitSetPassword()">
        <div v-if="setPasswordErrors._form" class="mbl-help mbl-help--danger">
          {{ $terr(setPasswordErrors._form) }}
        </div>
        <div class="mbl-field">
          <label class="mbl-label" for="setPasswordPassword">{{ $t('set_password.form.password') }}</label>
          <div class="mbl-control">
            <input id="setPasswordPassword" v-model="setPasswordModel.password" class="mbl-input" type="password" name="setPasswordPassword">
          </div>
          <div v-if="setPasswordErrors.password" class="mbl-help mbl-help--danger">
            {{ $terr(setPasswordErrors.password, { field: $t('set_password.form.password') }) }}
          </div>
        </div>
        <div class="mbl-field">
          <label class="mbl-label" for="setPasswordConfirmPassword">{{ $t('set_password.form.confirm_password') }}</label>
          <div class="mbl-control">
            <input id="setPasswordConfirmPassword" v-model="setPasswordModel.confirmPassword" class="mbl-input" type="password" name="setPasswordConfirmPassword">
          </div>
          <div v-if="setPasswordErrors.confirmPassword" class="mbl-help mbl-help--danger">
            {{ $terr(setPasswordErrors.confirmPassword, { field: $t('set_password.form.confirm_password') }) }}
          </div>
        </div>
        <div class="mbl-field">
          <div class="mbl-control">
            <button class="mbl-button mbl-button--primary" type="submit" :disabled="formBusy">
              {{ $t('set_password.form.set_password') }}
            </button>
          </div>
        </div>
      </form>
    </template>
    <template v-else>
      <div class="mbl-content">
        <p>{{ $t('new_request.enter_new_email') }}</p>
        <p>{{ $t('new_request.you_will_receive_an_email') }}</p>
      </div>
      <form :disabled="formBusy" @submit.prevent="submitChangeEmail()">
        <div v-if="changeEmailErrors._form" class="mbl-help mbl-help--danger">
          {{ $terr(changeEmailErrors._form) }}
        </div>
        <div class="mbl-field">
          <label class="mbl-label" for="newEmail">{{ $t('form.new_email') }}</label>
          <div class="mbl-control">
            <input v-model="changeEmailModel.newEmail" class="mbl-input" type="email" name="newEmail">
          </div>
          <div v-if="changeEmailErrors.newEmail" class="mbl-help mbl-help--danger">
            {{ $terr(changeEmailErrors.newEmail, { field: $t('form.new_email') }) }}
          </div>
        </div>
        <div class="mbl-field">
          <label class="mbl-label" for="password">{{ $t('form.password') }}</label>
          <div class="mbl-control">
            <input v-model="changeEmailModel.password" class="mbl-input" type="password" name="password">
          </div>
          <div v-if="changeEmailErrors.password" class="mbl-help mbl-help--danger">
            {{ $terr(changeEmailErrors.password, { field: $t('form.password') }) }}
          </div>
        </div>
        <div class="mbl-field">
          <div class="mbl-control">
            <button class="mbl-button mbl-button--primary" type="submit" :disabled="formBusy">
              {{ $t('form.change_email') }}
            </button>
          </div>
        </div>
      </form>
    </template>
  </div>
</template>

<script>
import { ApiError, UnknownApiError } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';
import { useDialogStore } from '~/stores/dialog';
import { useToastStore } from '~/stores/toast';
import { useAuthStore } from '~/stores/auth';

export default {
  name: 'EmailSettingsPage',
  middleware: ['auth'],
  data() {
    return {
      formBusy: false, // if any form was submitted and is awaiting response
      changeEmailModel: { // 'Change Email' form data
        password: '',
        newEmail: '',
      },
      changeEmailErrors: { // 'Change Email' form errors
        _form: '',
        password: '',
        newEmail: '',
      },
      setPasswordModel: {
        password: '',
        confirmPassword: '',
      },
      setPasswordErrors: {
        _form: '',
        password: '',
        confirmPassword: '',
      },

      checkingForEmailChangeRequest: true,
      currentChangeEmailRequest: null, // { newEmail: string, expires: number }
    };
  },
  head() {
    return {
      meta: [
        { hid: 'robots', name: 'robots', content: 'noindex' },
      ],
    };
  },
  computed: {
    authStore() {
      return useAuthStore();
    },
  },
  async mounted() {
    await this.checkChangeEmailRequestState();

    window.addEventListener('focus', this.checkChangeEmailRequestState);
  },
  beforeDestroy() {
    window.removeEventListener('focus', this.checkChangeEmailRequestState);
  },
  methods: {
    // Resets 'Change Email' form fields and errors.
    resetChangeEmailForm() {
      Object.assign(this.changeEmailModel, {
        password: '',
        newEmail: '',
      });
      this.resetChangeEmailErrors();
    },

    // Resets 'Change Email' form errors.
    resetChangeEmailErrors() {
      Object.assign(this.changeEmailErrors, {
        _form: '',
        password: '',
        newEmail: '',
      });
    },

    resetSetPasswordForm() {
      Object.assign(this.setPasswordModel, { password: '', confirmPassword: '' });
      this.resetSetPasswordErrors();
    },

    resetSetPasswordErrors() {
      Object.assign(this.setPasswordErrors, { _form: '', password: '', confirmPassword: '' });
    },

    // Checks if there is an email change request in progress
    async checkChangeEmailRequestState() {
      try {
        const { data } = await this.$http.get('/api/auth/change-email');
        if (data?.newEmail) {
          // no `newEmail` means there is no email change request in progress
          this.currentChangeEmailRequest = data;
        }
        else {
          this.currentChangeEmailRequest = null;
        }
      }
      catch {
        this.currentChangeEmailRequest = null;
      }
      finally {
        this.checkingForEmailChangeRequest = false;
      }
    },

    // Submits 'Change Email' form data and handles response.
    async submitChangeEmail() {
      if (this.formBusy) {
        return;
      }
      // Disable form and remove previous errors
      this.formBusy = true;
      this.resetChangeEmailErrors();

      const { password, newEmail } = this.changeEmailModel;

      if (!password.length) {
        this.changeEmailErrors.password = this.$t('messaging.enter_your_current_password');
        this.formBusy = false;
        return;
      }

      try {
        await this.$http.post('/api/auth/change-email', {
          password,
          newEmail,
        });
        this.resetChangeEmailForm();
        const toastStore = useToastStore();
        toastStore.add({
          type: 'success',
          text: this.$t('messaging.confirmation_link_sent'),
        });
      }
      catch (err) {
        if (err instanceof ApiError) {
          Object.assign(this.changeEmailErrors, mapFormErrors(err));
        }
        else {
          Object.assign(this.changeEmailErrors, mapFormErrors(new UnknownApiError()));
        }
      }
      finally {
      // Re-enable the form
        this.formBusy = false;
        this.checkChangeEmailRequestState();
      }
    },

    async submitSetPassword() {
      if (this.formBusy) {
        return;
      }
      this.formBusy = true;
      this.resetSetPasswordErrors();

      const { password, confirmPassword } = this.setPasswordModel;

      if (!password.length) {
        this.setPasswordErrors.password = this.$t('set_password.messaging.enter_password');
        this.formBusy = false;
        return;
      }

      if (password !== confirmPassword) {
        this.setPasswordErrors.confirmPassword = this.$t('set_password.messaging.passwords_must_match');
        this.formBusy = false;
        return;
      }

      try {
        await this.$http.post('/api/auth/password/set', { password, confirmPassword });
        this.resetSetPasswordForm();
        await this.authStore.refreshUser();
      }
      catch (err) {
        if (err instanceof ApiError) {
          Object.assign(this.setPasswordErrors, mapFormErrors(err));
        }
        else {
          Object.assign(this.setPasswordErrors, mapFormErrors(new UnknownApiError()));
        }
      }
      finally {
        this.formBusy = false;
      }
    },

    async cancelChangeEmailRequest() {
      if (this.formBusy) {
        return;
      }
      const dialogStore = useDialogStore();
      const toastStore = useToastStore();
      this.formBusy = true;
      try {
        const { data } = await this.$http.delete('/api/auth/change-email');
        if (data === true) {
          this.currentChangeEmailRequest = null;
          await dialogStore.alert({ message: this.$t('messaging.your_request_was_cancelled') });
        }
        else {
          toastStore.add({
            type: 'error',
            text: this.$t('messaging.unable_to_cancel_request'),
          });
        }
      }
      catch (err) {
        toastStore.add({
          type: 'error',
          text: this.$t('messaging.something_went_wrong'),
        });
      }
      this.formBusy = false;
    },
  },
};
</script>

<style scoped>
main p {
  margin-bottom: 1rem;
}
</style>

<i18n lang="json">
{
  "en": {
    "change_email": "Change Email",
    "checking_current_email_settings": "Checking current email settings...",
    "current_request": {
      "your_current_email_is": "Your current email address is:",
      "your_requested_email_is": "You requested to change your email address to:",
      "check_your_new_email": "Please check your new email address to confirm the change. You may need to refresh this page afterward.",
      "you_can_cancel": "You can also cancel your email change request to keep your current email.",
      "cancel_request": "Cancel Request"
    },
    "new_request": {
      "enter_new_email": "Enter your new email along with your current password.",
      "you_will_receive_an_email": "You will receive an email at the new address to confirm the change."
    },
    "set_password": {
      "no_password_message": "Your account was created with Google and does not have a password.",
      "must_set_password": "To change your email address, you first need to create a password.",
      "form": {
        "password": "New Password",
        "confirm_password": "Confirm Password",
        "set_password": "Set Password"
      },
      "messaging": {
        "enter_password": "Please enter a password.",
        "passwords_must_match": "Passwords must match."
      }
    },
    "form": {
      "new_email": "New Email",
      "password": "Current Password",
      "change_email": "Change Email"
    },
    "messaging": {
      "enter_your_current_password": "Enter your current password.",
      "confirmation_link_sent": "A confirmation link has been sent to your new email address. Click the link to finish changing your email.",
      "an_unknown_error_occurred": "An unknown error occurred.",
      "your_request_was_cancelled": "Your email change request was cancelled.",
      "unable_to_cancel_request": "Unable to cancel request. It may already be fulfilled.",
      "something_went_wrong": "Something went wrong. Please try again."
    }
  },
  "de": {
    "change_email": "E-Mail ändern",
    "checking_current_email_settings": "Aktuelle E-Mail-Einstellungen werden überprüft...",
    "current_request": {
      "your_current_email_is": "Ihre aktuelle E-Mail-Adresse ist:",
      "your_requested_email_is": "Sie haben angefragt, Ihre E-Mail-Adresse zu ändern zu:",
      "check_your_new_email": "Bitte überprüfen Sie Ihre neue E-Mail-Adresse, um den Wechsel zu bestätigen. Möglicherweise müssen Sie diese Seite später aktualisieren.",
      "you_can_cancel": "Sie können auch Ihre E-Mail-Änderungsanfrage stornieren, um Ihre aktuelle E-Mail-Adresse beizubehalten.",
      "cancel_request": "Anfrage stornieren"
    },
    "new_request": {
      "enter_new_email": "Geben Sie Ihre neue E-Mail-Adresse sowie Ihr aktuelles Passwort ein.",
      "you_will_receive_an_email": "Sie erhalten eine E-Mail an der neuen Adresse, um den Wechsel zu bestätigen."
    },
    "set_password": {
      "no_password_message": "Ihr Konto wurde mit Google erstellt und hat kein Passwort.",
      "must_set_password": "Um Ihre E-Mail-Adresse zu ändern, müssen Sie zunächst ein Passwort erstellen.",
      "form": {
        "password": "Neues Passwort",
        "confirm_password": "Passwort bestätigen",
        "set_password": "Passwort festlegen"
      },
      "messaging": {
        "enter_password": "Bitte geben Sie ein Passwort ein.",
        "passwords_must_match": "Die Passwörter müssen übereinstimmen."
      }
    },
    "form": {
      "new_email": "Neue E-Mail-Adresse",
      "password": "Aktuelles Passwort",
      "change_email": "E-Mail ändern"
    },
    "messaging": {
      "enter_your_current_password": "Geben Sie Ihr aktuelles Passwort ein.",
      "confirmation_link_sent": "Eine Bestätigungs-E-Mail wurde an Ihre neue E-Mail-Adresse gesendet. Klicken Sie auf den Link, um den Wechsel abzuschließen.",
      "an_unknown_error_occurred": "Ein unbekannter Fehler ist aufgetreten.",
      "your_request_was_cancelled": "Ihre E-Mail-Änderungsanfrage wurde storniert.",
      "unable_to_cancel_request": "Die Anfrage konnte nicht storniert werden. Möglicherweise wurde sie bereits ausgeführt.",
      "something_went_wrong": "Etwas ist schiefgegangen. Bitte versuchen Sie es erneut."
    }
  },
  "es": {
    "change_email": "Cambiar Correo Electrónico",
    "checking_current_email_settings": "Comprobando la configuración de correo electrónico actual...",
    "current_request": {
      "your_current_email_is": "Su dirección de correo electrónico actual es:",
      "your_requested_email_is": "Solicitó cambiar su dirección de correo electrónico a:",
      "check_your_new_email": "Por favor, compruebe su nueva dirección de correo electrónico para confirmar el cambio. Es posible que tenga que actualizar esta página después.",
      "you_can_cancel": "También puede cancelar su solicitud de cambio de correo electrónico para mantener su correo electrónico actual.",
      "cancel_request": "Cancelar Solicitud"
    },
    "new_request": {
      "enter_new_email": "Introduzca su nuevo correo electrónico junto con su contraseña actual.",
      "you_will_receive_an_email": "Recibirá un correo electrónico en la nueva dirección para confirmar el cambio."
    },
    "set_password": {
      "no_password_message": "Su cuenta fue creada con Google y no tiene contraseña.",
      "must_set_password": "Para cambiar su dirección de correo electrónico, primero debe crear una contraseña.",
      "form": {
        "password": "Nueva Contraseña",
        "confirm_password": "Confirmar Contraseña",
        "set_password": "Establecer Contraseña"
      },
      "messaging": {
        "enter_password": "Por favor ingrese una contraseña.",
        "passwords_must_match": "Las contraseñas deben coincidir."
      }
    },
    "form": {
      "new_email": "Nuevo Correo Electrónico",
      "password": "Contraseña Actual",
      "change_email": "Cambiar Correo Electrónico"
    },
    "messaging": {
      "enter_your_current_password": "Introduzca su contraseña actual.",
      "confirmation_link_sent": "Se ha enviado un enlace de confirmación a su nueva dirección de correo electrónico. Haga clic en el enlace para terminar de cambiar su correo electrónico.",
      "an_unknown_error_occurred": "Ocurrió un error desconocido.",
      "your_request_was_cancelled": "Su solicitud de cambio de correo electrónico fue cancelada.",
      "unable_to_cancel_request": "No se puede cancelar la solicitud. Es posible que ya esté cumplida.",
      "something_went_wrong": "Algo salió mal. Por favor, inténtelo de nuevo."
    }
  },
  "fr": {
    "change_email": "Changer Email",
    "checking_current_email_settings": "Vérification des paramètres d'email actuels...",
    "current_request": {
      "your_current_email_is": "Votre adresse email actuelle est :",
      "your_requested_email_is": "Vous avez demandé à changer votre adresse email pour :",
      "check_your_new_email": "Veuillez vérifier votre nouvelle adresse email pour confirmer le changement. Vous devrez peut-être rafraîchir cette page par la suite.",
      "you_can_cancel": "Vous pouvez également annuler votre demande de changement d'email pour conserver votre adresse email actuelle.",
      "cancel_request": "Annuler la Demande"
    },
    "new_request": {
      "enter_new_email": "Entrez votre nouvelle adresse email ainsi que votre mot de passe actuel.",
      "you_will_receive_an_email": "Vous recevrez un email à la nouvelle adresse pour confirmer le changement."
    },
    "set_password": {
      "no_password_message": "Votre compte a été créé avec Google et n'a pas de mot de passe.",
      "must_set_password": "Pour changer votre adresse email, vous devez d'abord créer un mot de passe.",
      "form": {
        "password": "Nouveau Mot de Passe",
        "confirm_password": "Confirmer le Mot de Passe",
        "set_password": "Définir le Mot de Passe"
      },
      "messaging": {
        "enter_password": "Veuillez entrer un mot de passe.",
        "passwords_must_match": "Les mots de passe doivent correspondre."
      }
    },
    "form": {
      "new_email": "Nouvel Email",
      "password": "Mot de passe actuel",
      "change_email": "Changer l'Email"
    },
    "messaging": {
      "enter_your_current_password": "Entrez votre mot de passe actuel.",
      "confirmation_link_sent": "Un lien de confirmation a été envoyé à votre nouvelle adresse e-mail. Cliquez sur le lien pour terminer la modification de votre e-mail.",
      "an_unknown_error_occurred": "Une erreur inconnue s'est produite.",
      "your_request_was_cancelled": "Votre demande de changement d'e-mail a été annulée.",
      "unable_to_cancel_request": "Impossible d'annuler la demande. Elle peut déjà être satisfaite.",
      "something_went_wrong": "Quelque chose s'est mal passé. Veuillez réessayer."
    }
  },
  "ko": {
    "change_email": "이메일 변경",
    "checking_current_email_settings": "현재 이메일 설정을 확인하는 중…",
    "current_request": {
      "your_current_email_is": "현재 이메일 주소:",
      "your_requested_email_is": "다음 주소로 변경을 요청하셨습니다:",
      "check_your_new_email": "변경을 완료하려면 새 이메일 주소로 보낸 메일을 확인하세요. 이후 이 페이지를 새로고침해야 할 수 있습니다.",
      "you_can_cancel": "이메일 변경 요청을 취소하고 현재 이메일을 유지할 수도 있습니다.",
      "cancel_request": "요청 취소"
    },
    "new_request": {
      "enter_new_email": "새 이메일과 현재 비밀번호를 입력하세요.",
      "you_will_receive_an_email": "새로운 주소로 확인 메일이 발송됩니다."
    },
    "set_password": {
      "no_password_message": "귀하의 계정은 Google로 생성되었으며 비밀번호가 없습니다.",
      "must_set_password": "이메일 주소를 변경하려면 먼저 비밀번호를 만들어야 합니다.",
      "form": {
        "password": "새 비밀번호",
        "confirm_password": "비밀번호 확인",
        "set_password": "비밀번호 설정"
      },
      "messaging": {
        "enter_password": "비밀번호를 입력하세요.",
        "passwords_must_match": "비밀번호가 일치해야 합니다."
      }
    },
    "form": {
      "new_email": "새 이메일",
      "password": "현재 비밀번호",
      "change_email": "이메일 변경"
    },
    "messaging": {
      "enter_your_current_password": "현재 비밀번호를 입력하세요.",
      "confirmation_link_sent": "새로운 이메일 주소로 확인 링크가 발송되었습니다. 해당 링크를 눌러 이메일 변경을 완료하세요.",
      "an_unknown_error_occurred": "알 수 없는 오류가 발생했습니다.",
      "your_request_was_cancelled": "이메일 변경 요청이 취소되었습니다.",
      "unable_to_cancel_request": "요청을 취소할 수 없습니다. 이미 처리 완료되었을 수 있습니다.",
      "something_went_wrong": "문제가 발생했습니다. 다시 시도해 주세요."
    }
  },
  "pt": {
    "change_email": "Alterar Email",
    "checking_current_email_settings": "Verificando as configurações de email atuais...",
    "current_request": {
      "your_current_email_is": "Seu endereço de email atual é:",
      "your_requested_email_is": "Você solicitou a alteração do seu endereço de email para:",
      "check_your_new_email": "Por favor, verifique seu novo endereço de email para confirmar a alteração. Você pode precisar atualizar esta página depois.",
      "you_can_cancel": "Você também pode cancelar sua solicitação de alteração de email para manter seu email atual.",
      "cancel_request": "Cancelar Solicitação"
    },
    "new_request": {
      "enter_new_email": "Insira seu novo email juntamente com sua senha atual.",
      "you_will_receive_an_email": "Você receberá um email no novo endereço para confirmar a alteração."
    },
    "set_password": {
      "no_password_message": "Sua conta foi criada com o Google e não possui senha.",
      "must_set_password": "Para alterar seu endereço de email, você primeiro precisa criar uma senha.",
      "form": {
        "password": "Nova Senha",
        "confirm_password": "Confirmar Senha",
        "set_password": "Definir Senha"
      },
      "messaging": {
        "enter_password": "Por favor insira uma senha.",
        "passwords_must_match": "As senhas devem ser iguais."
      }
    },
    "form": {
      "new_email": "Novo E-mail",
      "password": "Senha Atual",
      "change_email": "Alterar E-mail"
    },
    "messaging": {
      "enter_your_current_password": "Digite sua senha atual.",
      "confirmation_link_sent": "Um link de confirmação foi enviado para o seu novo endereço de e-mail. Clique no link para concluir a alteração do seu e-mail.",
      "an_unknown_error_occurred": "Ocorreu um erro desconhecido.",
      "your_request_was_cancelled": "Seu pedido de alteração de e-mail foi cancelado.",
      "unable_to_cancel_request": "Não foi possível cancelar o pedido. Pode já ter sido concluído.",
      "something_went_wrong": "Algo deu errado. Por favor, tente novamente."
    }
  },
  "uk": {
    "change_email": "Змінити Email",
    "checking_current_email_settings": "Перевірка поточних налаштувань електронної пошти...",
    "current_request": {
      "your_current_email_is": "Ваш поточний електронний адреса:",
      "your_requested_email_is": "Ви подали запит на зміну електронної адреси на:",
      "check_your_new_email": "Будь ласка, перевірте свою нову електронну адресу для підтвердження змін. Можливо, вам доведеться оновити цю сторінку після цього.",
      "you_can_cancel": "Ви також можете відмінити запит на зміну електронної адреси, щоб залишити ваш поточний електронний адресу.",
      "cancel_request": "Скасувати запит"
    },
    "new_request": {
      "enter_new_email": "Введіть свою нову електронну адресу разом з вашим поточним паролем.",
      "you_will_receive_an_email": "Ви отримаєте лист на новій адресі для підтвердження змін."
    },
    "set_password": {
      "no_password_message": "Ваш обліковий запис було створено через Google і не має пароля.",
      "must_set_password": "Щоб змінити електронну адресу, вам спочатку потрібно створити пароль.",
      "form": {
        "password": "Новий Пароль",
        "confirm_password": "Підтвердити Пароль",
        "set_password": "Встановити Пароль"
      },
      "messaging": {
        "enter_password": "Будь ласка, введіть пароль.",
        "passwords_must_match": "Паролі повинні співпадати."
      }
    },
    "form": {
      "new_email": "Новий Email",
      "password": "Поточний Пароль",
      "change_email": "Змінити Email"
    },
    "messaging": {
      "enter_your_current_password": "Введіть свій поточний пароль.",
      "confirmation_link_sent": "Посилання для підтвердження було відправлено на вашу нову електронну адресу. Клацніть по посиланню, щоб завершити зміну електронної адреси.",
      "an_unknown_error_occurred": "Сталася невідома помилка.",
      "your_request_was_cancelled": "Ваш запит на зміну електронної адреси було скасовано.",
      "unable_to_cancel_request": "Не вдалося скасувати запит. Можливо, він вже виконаний.",
      "something_went_wrong": "Щось пішло не так. Будь ласка, спробуйте знову."
    }
  }
}
</i18n>
