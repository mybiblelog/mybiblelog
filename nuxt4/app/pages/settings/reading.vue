<template>
  <div>
    <h2 class="mbl-title mbl-title--4">
      {{ t('reading') }}
    </h2>
    <h3 class="mbl-title mbl-title--5">
      {{ t('daily_verse_count_goal.title') }}
    </h3>
    <div class="mbl-field mbl-field--addons">
      <div class="mbl-control">
        <input
          v-model.number="form.dailyVerseCountGoal"
          class="mbl-input"
          type="number"
          min="1"
          max="1111"
          data-testid="settings-daily-goal-input"
          :disabled="!mounted"
        >
      </div>
      <div class="mbl-control">
        <button class="mbl-button mbl-button--primary" data-testid="settings-daily-goal-save" :disabled="!mounted || saving" @click="saveDailyVerseCountGoal">
          {{ t('save') }}
        </button>
      </div>
    </div>
    <div v-if="errors.dailyVerseCountGoal" class="mbl-help mbl-help--danger">
      {{ errors.dailyVerseCountGoal }}
    </div>
    <p>{{ t('daily_verse_count_goal.info.1') }}</p>
    <p>{{ t('daily_verse_count_goal.info.2', { dailyVerseCountGoal: form.dailyVerseCountGoal || 0, bibleReadingDays }) }}</p>
    <hr>
    <h3 class="mbl-title mbl-title--5">
      {{ t('look_back_date.title') }}
    </h3>
    <div v-if="showEarlyEntriesAlert" class="mbl-message mbl-message--info">
      <div class="mbl-message__body">
        {{ t('look_back_date.early_entries_alert', { date: displayDate(earliestLogEntryDate, locale) }) }}
      </div>
    </div>
    <div class="mbl-field mbl-field--addons">
      <div class="mbl-control">
        <input
          v-model="form.lookBackDate"
          class="mbl-input"
          type="date"
          data-testid="settings-look-back-date-input"
          :disabled="!mounted"
        >
      </div>
      <div class="mbl-control">
        <button class="mbl-button mbl-button--primary" data-testid="settings-look-back-date-save" :disabled="!mounted || saving" @click="saveLookBackDate">
          {{ t('save') }}
        </button>
      </div>
    </div>
    <div v-if="errors.lookBackDate" class="mbl-help mbl-help--danger">
      {{ errors.lookBackDate }}
    </div>
    <p>
      {{ t('look_back_date.info.1') }}
      {{ t('look_back_date.info.2') }}
      {{ t('look_back_date.info.3') }}
    </p>
    <p>{{ t('look_back_date.info.4') }}</p>
    <hr>
    <h3 class="mbl-title mbl-title--5">
      {{ t('preferred_bible_version.title') }}
    </h3>
    <div class="mbl-field mbl-field--addons">
      <div class="mbl-control">
        <div class="mbl-select">
          <select v-model="form.preferredBibleVersion" data-testid="settings-bible-version-select" :disabled="!mounted">
            <option value="" disabled>
              {{ t('select_an_option') }}
            </option>
            <option v-for="option in sortedBibleVersionOptions" :key="option.value" :value="option.value">
              {{ option.text }}
            </option>
          </select>
        </div>
      </div>
      <div class="mbl-control">
        <button class="mbl-button mbl-button--primary" data-testid="settings-bible-version-save" :disabled="!mounted || saving" @click="savePreferredBibleVersion">
          {{ t('save') }}
        </button>
      </div>
    </div>
    <div v-if="errors.preferredBibleVersion" class="mbl-help mbl-help--danger">
      {{ errors.preferredBibleVersion }}
    </div>
    <p>{{ t('preferred_bible_version.info.1') }}</p>
    <hr>
    <h3 class="mbl-title mbl-title--5">
      {{ t('preferred_bible_app.title') }}
    </h3>
    <div class="mbl-field mbl-field--addons">
      <div class="mbl-control">
        <div class="mbl-select">
          <select v-model="form.preferredBibleApp" data-testid="settings-bible-app-select" :disabled="!mounted">
            <option value="" disabled>
              {{ t('select_an_option') }}
            </option>
            <option v-for="option in bibleAppOptions" :key="option.value" :value="option.value">
              {{ option.text }}
            </option>
          </select>
        </div>
      </div>
      <div class="mbl-control">
        <button class="mbl-button mbl-button--primary" data-testid="settings-bible-app-save" :disabled="!mounted || saving" @click="savePreferredBibleApp">
          {{ t('save') }}
        </button>
      </div>
    </div>
    <div v-if="errors.preferredBibleApp" class="mbl-help mbl-help--danger">
      {{ errors.preferredBibleApp }}
    </div>
    <p>{{ t('preferred_bible_app.info.1') }}</p>
    <div class="mbl-message">
      <div class="mbl-message__body">
        {{ t('preferred_bible_app.callout.1') }}
        {{ t('preferred_bible_app.callout.2') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { bibleVersionOptions as allBibleVersionOptions, bibleAppOptions, localeVersionGroups, displayDate } from '@mybiblelog/shared';
import { useUserSettingsStore } from '~/stores/user-settings';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useToastStore } from '~/stores/toast';

const BIBLE_VERSE_COUNT = 31102;

definePageMeta({ middleware: ['auth'] });
useHead({ meta: [{ name: 'robots', content: 'noindex' }] });

const mounted = ref(false);
const saving = ref(false);
onMounted(() => { mounted.value = true; });

const { t, locale } = useI18n();
const userSettingsStore = useUserSettingsStore();
const logEntriesStore = useLogEntriesStore();
const toastStore = useToastStore();

const settings = computed(() => userSettingsStore.settings);

const form = reactive({
  dailyVerseCountGoal: settings.value.dailyVerseCountGoal,
  lookBackDate: settings.value.lookBackDate,
  preferredBibleVersion: settings.value.preferredBibleVersion,
  preferredBibleApp: settings.value.preferredBibleApp,
});

const errors = reactive({
  dailyVerseCountGoal: '',
  lookBackDate: '',
  preferredBibleVersion: '',
  preferredBibleApp: '',
});

watch(settings, (s) => {
  form.dailyVerseCountGoal = s.dailyVerseCountGoal;
  form.lookBackDate = s.lookBackDate;
  form.preferredBibleVersion = s.preferredBibleVersion;
  form.preferredBibleApp = s.preferredBibleApp;
}, { immediate: true });

const sortedBibleVersionOptions = computed(() => {
  const group = localeVersionGroups[locale.value as keyof typeof localeVersionGroups] || [];
  return [...allBibleVersionOptions].sort((a, b) => {
    const aLocal = group.includes(a.value);
    const bLocal = group.includes(b.value);
    if (aLocal === bLocal) { return 0; }
    return aLocal ? -1 : 1;
  });
});

const bibleReadingDays = computed(() => {
  if (!form.dailyVerseCountGoal) { return '?'; }
  return Math.ceil(BIBLE_VERSE_COUNT / form.dailyVerseCountGoal);
});

const earliestLogEntryDate = computed(() => {
  const entries = logEntriesStore.logEntries;
  if (!entries.length) { return null; }
  return entries.reduce((min, e) => (e.date < min ? e.date : min), entries[0]!.date);
});

const showEarlyEntriesAlert = computed(() => {
  const lookBackDate = settings.value.lookBackDate;
  return Boolean(earliestLogEntryDate.value && lookBackDate && earliestLogEntryDate.value < lookBackDate);
});

async function saveDailyVerseCountGoal() {
  if (saving.value) { return; }
  saving.value = true;
  errors.dailyVerseCountGoal = '';
  try {
    const success = await userSettingsStore.updateSettings({ dailyVerseCountGoal: form.dailyVerseCountGoal });
    if (success) {
      toastStore.add({ type: 'success', text: t('messaging.daily_verse_count_goal_saved_successfully') });
    }
    else {
      errors.dailyVerseCountGoal = t('messaging.unable_to_save_daily_verse_count_goal');
    }
  }
  finally {
    saving.value = false;
  }
}

async function saveLookBackDate() {
  if (saving.value) { return; }
  saving.value = true;
  errors.lookBackDate = '';
  try {
    const success = await userSettingsStore.updateSettings({ lookBackDate: form.lookBackDate });
    if (success) {
      toastStore.add({ type: 'success', text: t('messaging.look_back_date_saved_successfully') });
    }
    else {
      errors.lookBackDate = t('messaging.unable_to_save_look_back_date');
    }
  }
  finally {
    saving.value = false;
  }
}

async function savePreferredBibleVersion() {
  if (saving.value) { return; }
  saving.value = true;
  errors.preferredBibleVersion = '';
  try {
    const success = await userSettingsStore.updateSettings({ preferredBibleVersion: form.preferredBibleVersion as any });
    if (success) {
      toastStore.add({ type: 'success', text: t('messaging.preferred_bible_version_saved_successfully') });
    }
    else {
      errors.preferredBibleVersion = t('messaging.unable_to_save_preferred_bible_version');
    }
  }
  finally {
    saving.value = false;
  }
}

async function savePreferredBibleApp() {
  if (saving.value) { return; }
  saving.value = true;
  errors.preferredBibleApp = '';
  try {
    const success = await userSettingsStore.updateSettings({ preferredBibleApp: form.preferredBibleApp as any });
    if (success) {
      toastStore.add({ type: 'success', text: t('messaging.preferred_bible_app_saved_successfully') });
    }
    else {
      errors.preferredBibleApp = t('messaging.unable_to_save_preferred_bible_app');
    }
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

select {
  max-width: 65vw;
}
</style>

<i18n lang="json">
{
  "en": {
    "reading": "Reading",
    "save": "Save",
    "select_an_option": "Select an Option",
    "daily_verse_count_goal": {
      "title": "Daily Verse Count Goal",
      "info": {
        "1": "This is the number of verses you want to read each day.",
        "2": "If you read {dailyVerseCountGoal} verses a day, you will read the whole Bible in {bibleReadingDays} days."
      }
    },
    "look_back_date": {
      "title": "Tracker Start Date",
      "early_entries_alert": "Your earliest log entry is on {date}. Log entries before your Tracker Start Date are not counted in your progress.",
      "info": {
        "1": "My Bible Log will ignore your log entries before this date when counting your progress.",
        "2": "Log entries before this date still exist, and can be viewed and updated at any time.",
        "3": "This allows you to restart your Bible reading progress at any time.",
        "4": "For example, if you just read the entire Bible once, you can set your Tracker Start Date to today to start reading it again."
      }
    },
    "preferred_bible_version": {
      "title": "Preferred Bible Version",
      "info": {
        "1": "External reading links will open this Bible translation in your preferred reading app."
      }
    },
    "preferred_bible_app": {
      "title": "Preferred Bible App",
      "info": {
        "1": "External reading links will open this website or app."
      },
      "callout": {
        "1": "This setting is saved on this device rather than on your account.",
        "2": "This means you can use different apps or websites for different devices."
      }
    },
    "messaging": {
      "daily_verse_count_goal_saved_successfully": "Daily verse count goal saved successfully.",
      "unable_to_save_daily_verse_count_goal": "Unable to save. Please enter a number between 1 and 1111.",
      "look_back_date_saved_successfully": "Tracker start date saved successfully.",
      "unable_to_save_look_back_date": "Unable to save. Please enter a date no later than tomorrow.",
      "preferred_bible_version_saved_successfully": "Preferred Bible version saved successfully.",
      "unable_to_save_preferred_bible_version": "Unable to save.",
      "preferred_bible_app_saved_successfully": "Preferred Bible app saved successfully for this device.",
      "unable_to_save_preferred_bible_app": "Unable to save."
    }
  },
  "de": {
    "reading": "Lesen",
    "save": "Speichern",
    "select_an_option": "Eine Option auswählen",
    "daily_verse_count_goal": {
      "title": "Tägliche Verszahl Ziel",
      "info": {
        "1": "Dies ist die Anzahl der Versetze, die Sie jeden Tag lesen möchten.",
        "2": "Wenn Sie {dailyVerseCountGoal} Versetze jeden Tag lesen, lesen Sie die ganze Bibel in {bibleReadingDays} Tagen."
      }
    },
    "look_back_date": {
      "title": "Tracker-Startdatum",
      "early_entries_alert": "Ihr frühester Journaleintrag ist vom {date}. Einträge vor Ihrem Tracker-Startdatum werden nicht in Ihrem Fortschritt gezählt.",
      "info": {
        "1": "My Bible Log wird Ihre Einträge im Journal vor diesem Datum nicht beim Berechnen Ihres Fortschritts berücksichtigen.",
        "2": "Einträge im Journal vor diesem Datum existieren weiterhin und können jederzeit angesehen und aktualisiert werden.",
        "3": "Dies ermöglicht es Ihnen, Ihren Bibel-Lesefortschritt jederzeit neu zu starten.",
        "4": "Wenn Sie beispielsweise gerade die ganze Bibel einmal gelesen haben, können Sie Ihr Tracker-Startdatum auf heute setzen, um sie erneut zu lesen."
      }
    },
    "preferred_bible_version": {
      "title": "Bibelversion bevorzugt",
      "info": {
        "1": "Externe Leselinks öffnen diese Bibelübersetzung in Ihrer bevorzugten Lese-App."
      }
    },
    "preferred_bible_app": {
      "title": "Bibel-App bevorzugt",
      "info": {
        "1": "Externe Leselinks öffnen diese Website oder App."
      },
      "callout": {
        "1": "Diese Einstellung wird auf diesem Gerät gespeichert, anstatt auf Ihrem Konto.",
        "2": "Dies bedeutet, dass Sie für verschiedene Geräte verschiedene Apps oder Websites verwenden können."
      }
    },
    "messaging": {
      "daily_verse_count_goal_saved_successfully": "Tägliche Verszahl Ziel erfolgreich gespeichert.",
      "unable_to_save_daily_verse_count_goal": "Nicht gespeichert. Bitte geben Sie eine Zahl zwischen 1 und 1111 ein.",
      "look_back_date_saved_successfully": "Tracker-Startdatum erfolgreich gespeichert.",
      "unable_to_save_look_back_date": "Nicht gespeichert. Bitte geben Sie ein Datum nicht später als morgen ein.",
      "preferred_bible_version_saved_successfully": "Bibelversion bevorzugt erfolgreich gespeichert.",
      "unable_to_save_preferred_bible_version": "Nicht gespeichert.",
      "preferred_bible_app_saved_successfully": "Bibel-App bevorzugt erfolgreich für dieses Gerät gespeichert.",
      "unable_to_save_preferred_bible_app": "Nicht gespeichert."
    }
  },
  "es": {
    "reading": "Lectura",
    "save": "Guardar",
    "select_an_option": "Seleccionar una opción",
    "daily_verse_count_goal": {
      "title": "Meta de Versículos Diarios",
      "info": {
        "1": "Este es el número de versículos que desea leer cada día.",
        "2": "Si lee {dailyVerseCountGoal} versículos al día, leerá toda la Biblia en {bibleReadingDays} días."
      }
    },
    "look_back_date": {
      "title": "Fecha de Inicio del Rastreador",
      "early_entries_alert": "Tu entrada de registro más antigua es del {date}. Las entradas anteriores a tu Fecha de Inicio del Rastreador no se cuentan en tu progreso.",
      "info": {
        "1": "My Bible Log ignorará sus entradas de registro antes de esta fecha al contar su progreso.",
        "2": "Las entradas de registro antes de esta fecha aún existen y se pueden ver y actualizar en cualquier momento.",
        "3": "Esto le permite reiniciar su progreso de lectura de la Biblia en cualquier momento.",
        "4": "Por ejemplo, si acaba de leer toda la Biblia una vez, puede establecer su Fecha de Inicio del Rastreador para hoy para comenzar a leerla nuevamente."
      }
    },
    "preferred_bible_version": {
      "title": "Versión de la Biblia Preferida",
      "info": {
        "1": "Los enlaces de lectura externos abrirán esta traducción de la Biblia en su aplicación de lectura preferida."
      }
    },
    "preferred_bible_app": {
      "title": "Aplicación de Biblia Preferida",
      "info": {
        "1": "Los enlaces de lectura externos abrirán este sitio web o aplicación."
      },
      "callout": {
        "1": "Esta configuración se guarda en este dispositivo en lugar de en su cuenta.",
        "2": "Esto significa que puede usar aplicaciones o sitios web diferentes para dispositivos diferentes."
      }
    },
    "messaging": {
      "daily_verse_count_goal_saved_successfully": "Meta de versículos diarios guardada con éxito.",
      "unable_to_save_daily_verse_count_goal": "No se puede guardar. Por favor ingrese un número entre 1 y 1111.",
      "look_back_date_saved_successfully": "Fecha de inicio del rastreador guardada con éxito.",
      "unable_to_save_look_back_date": "No se puede guardar. Por favor ingrese una fecha no posterior a mañana.",
      "preferred_bible_version_saved_successfully": "Versión de la Biblia preferida guardada con éxito.",
      "unable_to_save_preferred_bible_version": "No se puede guardar.",
      "preferred_bible_app_saved_successfully": "Aplicación de Biblia preferida guardada con éxito para este dispositivo.",
      "unable_to_save_preferred_bible_app": "No se puede guardar."
    }
  },
  "fr": {
    "reading": "Lecture",
    "save": "Enregistrer",
    "select_an_option": "Sélectionner une option",
    "daily_verse_count_goal": {
      "title": "Objectif de nombre de versets quotidiens",
      "info": {
        "1": "Il s'agit du nombre de versets que vous souhaitez lire chaque jour.",
        "2": "Si vous lisez {dailyVerseCountGoal} versets par jour, vous lirez toute la Bible en {bibleReadingDays} jours."
      }
    },
    "look_back_date": {
      "title": "Date de Début du Suivi",
      "early_entries_alert": "Votre entrée de journal la plus ancienne date du {date}. Les entrées antérieures à votre Date de Début du Suivi ne sont pas comptées dans votre progression.",
      "info": {
        "1": "My Bible Log ignorera vos entrées de journal avant cette date lors du calcul de votre progression.",
        "2": "Les entrées de journal antérieures à cette date existent toujours et peuvent être consultées et mises à jour à tout moment.",
        "3": "Cela vous permet de recommencer votre progression de lecture de la Bible à tout moment.",
        "4": "Par exemple, si vous avez lu toute la Bible une fois, vous pouvez définir votre Date de Début du Suivi à aujourd'hui pour la relire."
      }
    },
    "preferred_bible_version": {
      "title": "Version de la Bible préférée",
      "info": {
        "1": "Les liens de lecture externe ouvriront cette traduction de la Bible dans votre application de lecture préférée."
      }
    },
    "preferred_bible_app": {
      "title": "Application de la Bible préférée",
      "info": {
        "1": "Les liens de lecture externe ouvriront ce site web ou cette application."
      },
      "callout": {
        "1": "Ce paramètre est enregistré sur cet appareil plutôt que sur votre compte.",
        "2": "Cela signifie que vous pouvez utiliser différentes applications ou sites web pour différents appareils."
      }
    },
    "messaging": {
      "daily_verse_count_goal_saved_successfully": "Objectif de nombre de versets quotidiens enregistré avec succès.",
      "unable_to_save_daily_verse_count_goal": "Impossible d'enregistrer. Veuillez entrer un nombre entre 1 et 1111.",
      "look_back_date_saved_successfully": "Date de début du suivi enregistrée avec succès.",
      "unable_to_save_look_back_date": "Impossible d'enregistrer. Veuillez saisir une date au plus tard demain.",
      "preferred_bible_version_saved_successfully": "Version préférée de la Bible enregistrée avec succès.",
      "unable_to_save_preferred_bible_version": "Impossible d'enregistrer.",
      "preferred_bible_app_saved_successfully": "Application de la Bible préférée enregistrée avec succès pour cet appareil.",
      "unable_to_save_preferred_bible_app": "Impossible d'enregistrer."
    }
  },
  "ko": {
    "reading": "읽기",
    "save": "저장",
    "select_an_option": "옵션 선택",
    "daily_verse_count_goal": {
      "title": "일일 구절 목표",
      "info": {
        "1": "매일 읽고자 하는 구절 수입니다.",
        "2": "하루에 {dailyVerseCountGoal}절을 읽으면 {bibleReadingDays}일 만에 성경 전체를 완독할 수 있습니다."
      }
    },
    "look_back_date": {
      "title": "추적기 시작일",
      "early_entries_alert": "가장 오래된 기록은 {date}입니다. 추적기 시작일 이전의 기록은 진도에 포함되지 않습니다.",
      "info": {
        "1": "My Bible Log가 진도를 계산할 때 위 날짜 이전 기록을 무시합니다.",
        "2": "해당 날짜 이전 기록도 삭제되지 않으며, 언제든 조회하거나 수정할 수 있습니다.",
        "3": "이를 통해 언제든지 성경읽기 진도를 새로 시작할 수 있습니다.",
        "4": "예를 들어 성경 전체를 완독한 이후, 추적기 시작일을 오늘로 설정해 읽기를 다시 시작할 수 있습니다."
      }
    },
    "preferred_bible_version": {
      "title": "선호 성경 번역본",
      "info": {
        "1": "외부 읽기 링크를 누를 때 선택한 번역본이 선호하는 성경 앱에서 열립니다."
      }
    },
    "preferred_bible_app": {
      "title": "선호 성경 앱",
      "info": {
        "1": "외부 읽기 링크가 이 홈페이지 또는 앱에서 열립니다."
      },
      "callout": {
        "1": "이 설정은 계정이 아닌 이 기기에 저장됩니다.",
        "2": "각 기기마다 서로 다른 앱이나 웹사이트를 사용할 수 있습니다."
      }
    },
    "messaging": {
      "daily_verse_count_goal_saved_successfully": "일일 구절 수 목표가 저장되었습니다.",
      "unable_to_save_daily_verse_count_goal": "저장할 수 없습니다. 1~1111 사이의 숫자를 입력해 주세요.",
      "look_back_date_saved_successfully": "추적기 시작일이 저장되었습니다.",
      "unable_to_save_look_back_date": "저장할 수 없습니다. 내일 안쪽의 날짜를 입력해 주세요.",
      "preferred_bible_version_saved_successfully": "선호 성경 번역본이 저장되었습니다.",
      "unable_to_save_preferred_bible_version": "저장할 수 없습니다.",
      "preferred_bible_app_saved_successfully": "선호 성경 앱이 이 기기에 저장되었습니다.",
      "unable_to_save_preferred_bible_app": "저장할 수 없습니다."
    }
  },
  "pt": {
    "reading": "Leitura",
    "save": "Salvar",
    "select_an_option": "Selecionar uma Opção",
    "daily_verse_count_goal": {
      "title": "Meta Diária de Versículos",
      "info": {
        "1": "Este é o número de versículos que deseja ler a cada dia.",
        "2": "Se você ler {dailyVerseCountGoal} versículos por dia, você lerá toda a Bíblia em {bibleReadingDays} dias."
      }
    },
    "look_back_date": {
      "title": "Data de Início do Rastreador",
      "early_entries_alert": "Sua entrada de registro mais antiga é em {date}. Entradas anteriores à sua Data de Início do Rastreador não são contadas no seu progresso.",
      "info": {
        "1": "Meu registro da Bíblia ignorará suas entradas de log antes desta data ao contar seu progresso.",
        "2": "As entradas de log antes desta data ainda existem e podem ser visualizadas e atualizadas a qualquer momento.",
        "3": "Isso permite que você reinicie seu progresso na leitura da Bíblia a qualquer momento.",
        "4": "Por exemplo, se você acabou de ler a Bíblia inteira uma vez, pode definir sua Data de Início do Rastreador como hoje para começar a lê-la novamente."
      }
    },
    "preferred_bible_version": {
      "title": "Versão da Bíblia Preferida",
      "info": {
        "1": "Links externos de leitura abrirão esta tradução da Bíblia em seu aplicativo de leitura preferido."
      }
    },
    "preferred_bible_app": {
      "title": "Aplicativo da Bíblia Preferido",
      "info": {
        "1": "Links externos de leitura abrirão este site ou aplicativo."
      },
      "callout": {
        "1": "Esta configuração é salva neste dispositivo em vez de em sua conta.",
        "2": "Isso significa que você pode usar aplicativos ou sites diferentes para dispositivos diferentes."
      }
    },
    "messaging": {
      "daily_verse_count_goal_saved_successfully": "Meta de versículos diários salva com sucesso.",
      "unable_to_save_daily_verse_count_goal": "Não foi possível salvar. Por favor, insira um número entre 1 e 1111.",
      "look_back_date_saved_successfully": "Data de início do rastreador salva com sucesso.",
      "unable_to_save_look_back_date": "Não é possível salvar. Por favor, insira uma data até amanhã no máximo.",
      "preferred_bible_version_saved_successfully": "Versão preferida da Bíblia salva com sucesso.",
      "unable_to_save_preferred_bible_version": "Não é possível salvar.",
      "preferred_bible_app_saved_successfully": "Aplicativo preferido da Bíblia salvo com sucesso para este dispositivo.",
      "unable_to_save_preferred_bible_app": "Não é possível salvar."
    }
  },
  "uk": {
    "reading": "Читання",
    "save": "Зберегти",
    "select_an_option": "Вибрати опцію",
    "daily_verse_count_goal": {
      "title": "Мета щоденної кількості віршів",
      "info": {
        "1": "Це кількість віршів, яку ви хочете читати кожен день.",
        "2": "Якщо ви читаєте {dailyVerseCountGoal} віршів на день, ви прочитаєте всю Біблію за {bibleReadingDays} днів."
      }
    },
    "look_back_date": {
      "title": "Дата початку відстеження",
      "early_entries_alert": "Ваш найстаріший запис датований {date}. Записи до дати початку відстеження не враховуються у вашому прогресі.",
      "info": {
        "1": "My Bible Log ігноруватиме ваші записи до цієї дати під час обчислення вашого прогресу.",
        "2": "Записи до цієї дати все ще існують і можуть бути переглянуті та оновлені у будь-який час.",
        "3": "Це дозволяє вам перезапустити свій прогрес у читанні Біблії у будь-який момент.",
        "4": "Наприклад, якщо ви вже прочитали всю Біблію один раз, ви можете встановити свою дату початку відстеження на сьогодні, щоб почати читати її знову."
      }
    },
    "preferred_bible_version": {
      "title": "Обрана версія Біблії",
      "info": {
        "1": "Зовнішні посилання для читання відкриватимуть цей переклад Біблії у вашому улюбленому читальному додатку."
      }
    },
    "preferred_bible_app": {
      "title": "Обрана програма для читання Біблії",
      "info": {
        "1": "Зовнішні посилання для читання відкриватимуть цей веб-сайт або додаток."
      },
      "callout": {
        "1": "Це налаштування зберігається на цьому пристрої, а не на вашому обліковому записі.",
        "2": "Це означає, що ви можете використовувати різні програми або веб-сайти для різних пристроїв."
      }
    },
    "messaging": {
      "daily_verse_count_goal_saved_successfully": "Мету щоденної кількості віршів успішно збережено.",
      "unable_to_save_daily_verse_count_goal": "Не вдалося зберегти. Будь ласка, введіть число від 1 до 1111.",
      "look_back_date_saved_successfully": "Дата початку відстеження успішно збережена.",
      "unable_to_save_look_back_date": "Не вдалося зберегти. Будь ласка, введіть дату, яка не пізніше завтра.",
      "preferred_bible_version_saved_successfully": "Обрану версію Біблії успішно збережено.",
      "unable_to_save_preferred_bible_version": "Не вдалося зберегти.",
      "preferred_bible_app_saved_successfully": "Обрану програму для читання Біблії успішно збережено для цього пристрою.",
      "unable_to_save_preferred_bible_app": "Не вдалося зберегти."
    }
  }
}
</i18n>
