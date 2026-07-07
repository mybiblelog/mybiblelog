<template>
  <div>
    <h2 class="mbl-title mbl-title--4">
      {{ t('reminder') }}
    </h2>
    <p>
      {{ t('info.p1a') }}
      {{ t('info.p1b') }}
    </p>
    <p>
      {{ t('info.p2a') }}
      {{ t('info.p2b') }}
    </p>
    <div class="mbl-field">
      <div class="mbl-control">
        <label class="mbl-checkbox">
          <input v-model="reminderForm.active" type="checkbox" data-testid="settings-reminder-active" :disabled="!mounted"> {{ t('form.i_want_to_receive_a_daily_reminder_email') }}
        </label>
      </div>
    </div>
    <div class="mbl-field">
      <div class="mbl-control">
        <label class="mbl-label">{{ t('form.reminder_time') }}</label>
        <input v-model="reminderForm.time" class="mbl-input mbl-input--short" type="time" data-testid="settings-reminder-time" :disabled="!mounted">
      </div>
    </div>
    <div class="mbl-field">
      <div class="mbl-control">
        <button class="mbl-button mbl-button--primary" data-testid="settings-reminder-save" :disabled="!mounted || saving" @click="handleReminderSubmit">
          {{ t('form.save_preferences') }}
        </button>
      </div>
    </div>
    <div v-if="formError" class="mbl-help mbl-help--danger">
      {{ formError }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '~/stores/toast';

type Http = {
  get: <T = unknown>(path: string) => Promise<T>;
  patch: <T = unknown>(path: string, body?: unknown) => Promise<T>;
};

definePageMeta({ middleware: ['auth'] });
const { t } = useI18n();
useHead({ title: () => t('reminder'), meta: [{ name: 'robots', content: 'noindex' }] });

const toastStore = useToastStore();

const mounted = ref(false);
const saving = ref(false);
const formError = ref('');

const reminderForm = reactive({
  time: '',
  active: false,
});

onMounted(async () => {
  const { $http } = useNuxtApp() as unknown as { $http: Http };
  try {
    const { data } = await $http.get<{ data: { hour: number; minute: number; active: boolean } }>('/api/reminders/daily-reminder');
    const { hour, minute, active } = data;
    reminderForm.time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    reminderForm.active = active;
  }
  catch {
    formError.value = t('messaging.an_unknown_error_occurred');
  }
  finally {
    mounted.value = true;
  }
});

async function handleReminderSubmit() {
  if (saving.value) { return; }
  saving.value = true;
  formError.value = '';

  const { time, active } = reminderForm;
  const hourMinuteRE = /(\d+):(\d+)/;
  if (!hourMinuteRE.test(time)) {
    formError.value = t('messaging.please_choose_a_time');
    saving.value = false;
    return;
  }
  const match = hourMinuteRE.exec(time);
  const hour = Number(match?.[1] ?? 0);
  const minute = Number(match?.[2] ?? 0);
  const timezoneOffset = new Date().getTimezoneOffset();

  try {
    const { $http } = useNuxtApp() as unknown as { $http: Http };
    await $http.patch('/api/reminders/daily-reminder', {
      hour,
      minute,
      timezoneOffset,
      active,
    });
    toastStore.add({
      type: 'success',
      text: t('messaging.reminder_settings_updated_successfully'),
    });
  }
  catch {
    formError.value = t('messaging.an_unknown_error_occurred');
  }
  finally {
    saving.value = false;
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
    "reminder": "Reminder",
    "info": {
      "p1a": "You can set a time to receive a daily reminder email.",
      "p1b": "You must check the checkbox below and save your preferences to begin receiving emails.",
      "p2a": "If you no longer wish to receive these emails, simply uncheck the box below and save your preferences.",
      "p2b": "You can also click the \"unsubscribe\" link in an email to opt out."
    },
    "form": {
      "i_want_to_receive_a_daily_reminder_email": "I want to receive a daily reminder email.",
      "reminder_time": "Reminder Time",
      "save_preferences": "Save Preferences"
    },
    "messaging": {
      "please_choose_a_time": "Please choose a time to receive a reminder",
      "reminder_settings_updated_successfully": "Reminder settings updated successfully.",
      "an_unknown_error_occurred": "An unknown error occurred."
    }
  },
  "de": {
    "reminder": "Erinnerung",
    "info": {
      "p1a": "Sie können eine Uhrzeit für die tägliche Erinnerungs-E-Mail festlegen.",
      "p1b": "Sie müssen das Kästchen unten ankreuzen und Ihre Einstellungen speichern, um E-Mails zu erhalten.",
      "p2a": "Wenn Sie diese E-Mails nicht mehr erhalten möchten, entfernen Sie einfach das Kästchen unten und speichern Sie Ihre Einstellungen.",
      "p2b": "Sie können auch den Link \"abbestellen\" in einer E-Mail klicken, um sich abzumelden."
    },
    "form": {
      "i_want_to_receive_a_daily_reminder_email": "Ich möchte eine tägliche Erinnerungs-E-Mail erhalten.",
      "reminder_time": "Erinnerungszeit",
      "save_preferences": "Einstellungen speichern"
    },
    "messaging": {
      "please_choose_a_time": "Bitte wählen Sie eine Uhrzeit für die Erinnerung.",
      "reminder_settings_updated_successfully": "Erinnerungseinstellungen erfolgreich aktualisiert.",
      "an_unknown_error_occurred": "Ein unbekannter Fehler ist aufgetreten."
    }
  },
  "es": {
    "reminder": "Recordatorio",
    "info": {
      "p1a": "Puede establecer una hora para recibir un correo electrónico de recordatorio diario.",
      "p1b": "Debe marcar la casilla de abajo y guardar sus preferencias para comenzar a recibir correos electrónicos.",
      "p2a": "Si ya no desea recibir estos correos electrónicos, simplemente desmarque la casilla de abajo y guarde sus preferencias.",
      "p2b": "También puede hacer clic en el enlace \"cancelar suscripción\" en un correo electrónico para cancelar la suscripción."
    },
    "form": {
      "i_want_to_receive_a_daily_reminder_email": "Quiero recibir un correo electrónico de recordatorio diario.",
      "reminder_time": "Hora del recordatorio",
      "save_preferences": "Guardar preferencias"
    },
    "messaging": {
      "please_choose_a_time": "Por favor, elija una hora para recibir un recordatorio",
      "reminder_settings_updated_successfully": "Configuración de recordatorio actualizada correctamente.",
      "an_unknown_error_occurred": "Ocurrió un error desconocido."
    }
  },
  "fr": {
    "reminder": "Rappel",
    "info": {
      "p1a": "Vous pouvez définir une heure pour recevoir un email de rappel quotidien.",
      "p1b": "Vous devez cocher la case ci-dessous et enregistrer vos préférences pour commencer à recevoir des emails.",
      "p2a": "Si vous ne souhaitez plus recevoir ces emails, il vous suffit de décocher la case ci-dessous et d'enregistrer vos préférences.",
      "p2b": "Vous pouvez également cliquer sur le lien \"se désabonner\" dans un email pour vous désinscrire."
    },
    "form": {
      "i_want_to_receive_a_daily_reminder_email": "Je veux recevoir un email de rappel quotidien.",
      "reminder_time": "Heure de rappel",
      "save_preferences": "Enregistrer les préférences"
    },
    "messaging": {
      "please_choose_a_time": "Veuillez choisir une heure pour recevoir un rappel",
      "reminder_settings_updated_successfully": "Paramètres de rappel mis à jour avec succès.",
      "an_unknown_error_occurred": "Une erreur inconnue est survenue."
    }
  },
  "ko": {
    "reminder": "알림",
    "info": {
      "p1a": "매일 알림 이메일을 받을 시간을 설정할 수 있습니다.",
      "p1b": "이메일을 수신하기 위해서는 아래 확인란을 체크하고 설정을 저장해야 합니다.",
      "p2a": "더 이상 메일을 수신하지 않기 위해서는 아래 확인란을 해제하고 설정을 저장하세요.",
      "p2b": "이메일에 포함된 \"수신 거부\" 링크를 눌러 처리할 수도 있습니다."
    },
    "form": {
      "i_want_to_receive_a_daily_reminder_email": "매일 알림 이메일을 받고 싶습니다.",
      "reminder_time": "알림 시간",
      "save_preferences": "설정 저장"
    },
    "messaging": {
      "please_choose_a_time": "알림을 받을 시간을 선택해 주세요",
      "reminder_settings_updated_successfully": "알림 설정이 업데이트되었습니다.",
      "an_unknown_error_occurred": "알 수 없는 오류가 발생했습니다."
    }
  },
  "pt": {
    "reminder": "Lembrete",
    "info": {
      "p1a": "Você pode definir um horário para receber um e-mail de lembrete diário.",
      "p1b": "Você deve marcar a caixa abaixo e salvar suas preferências para começar a receber e-mails.",
      "p2a": "Se você não deseja mais receber esses e-mails, basta desmarcar a caixa abaixo e salvar suas preferências.",
      "p2b": "Você também pode clicar no link \"cancelar inscrição\" em um e-mail para cancelar."
    },
    "form": {
      "i_want_to_receive_a_daily_reminder_email": "Desejo receber um e-mail de lembrete diário.",
      "reminder_time": "Horário do Lembrete",
      "save_preferences": "Salvar Preferências"
    },
    "messaging": {
      "please_choose_a_time": "Por favor, escolha um horário para receber um lembrete",
      "reminder_settings_updated_successfully": "Configurações de lembrete atualizadas com sucesso.",
      "an_unknown_error_occurred": "Ocorreu um erro desconhecido."
    }
  },
  "uk": {
    "reminder": "Нагадування",
    "info": {
      "p1a": "Ви можете встановити час для отримання щоденного листа нагадування.",
      "p1b": "Ви повинні відмітити прапорець нижче та зберегти свої налаштування, щоб почати отримувати електронну пошту.",
      "p2a": "Якщо ви більше не бажаєте отримувати ці листи, просто зніміть прапорець нижче та збережіть свої налаштування.",
      "p2b": "Ви також можете натиснути посилання \"відписатися\" в електронному листі, щоб відмовитися."
    },
    "form": {
      "i_want_to_receive_a_daily_reminder_email": "Я хочу отримувати щоденний лист нагадування.",
      "reminder_time": "Час нагадування",
      "save_preferences": "Зберегти налаштування"
    },
    "messaging": {
      "please_choose_a_time": "Будь ласка, виберіть час для отримання нагадування",
      "reminder_settings_updated_successfully": "Налаштування нагадування успішно оновлено.",
      "an_unknown_error_occurred": "Сталася невідома помилка."
    }
  }
}
</i18n>
