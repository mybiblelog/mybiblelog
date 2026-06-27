<template>
  <div>
      <h2 class="mbl-title mbl-title--4">
        {{ t('reading') }}
      </h2>
      <h3 class="mbl-title mbl-title--5">
        {{ t('daily_verse_count_goal_title') }}
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
          <button class="mbl-button mbl-button--primary" data-testid="settings-daily-goal-save" :disabled="!mounted" @click="saveDailyVerseCountGoal">
            {{ t('save') }}
          </button>
        </div>
      </div>
      <div v-if="errors.dailyVerseCountGoal" class="mbl-help mbl-help--danger">
        {{ errors.dailyVerseCountGoal }}
      </div>
      <hr>
      <h3 class="mbl-title mbl-title--5">
        {{ t('look_back_date_title') }}
      </h3>
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
          <button class="mbl-button mbl-button--primary" data-testid="settings-look-back-date-save" :disabled="!mounted" @click="saveLookBackDate">
            {{ t('save') }}
          </button>
        </div>
      </div>
      <div v-if="errors.lookBackDate" class="mbl-help mbl-help--danger">
        {{ errors.lookBackDate }}
      </div>
      <hr>
      <h3 class="mbl-title mbl-title--5">
        {{ t('preferred_bible_version_title') }}
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
          <button class="mbl-button mbl-button--primary" data-testid="settings-bible-version-save" :disabled="!mounted" @click="savePreferredBibleVersion">
            {{ t('save') }}
          </button>
        </div>
      </div>
      <div v-if="errors.preferredBibleVersion" class="mbl-help mbl-help--danger">
        {{ errors.preferredBibleVersion }}
      </div>
      <hr>
      <h3 class="mbl-title mbl-title--5">
        {{ t('preferred_bible_app_title') }}
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
          <button class="mbl-button mbl-button--primary" data-testid="settings-bible-app-save" :disabled="!mounted" @click="savePreferredBibleApp">
            {{ t('save') }}
          </button>
        </div>
      </div>
      <div v-if="errors.preferredBibleApp" class="mbl-help mbl-help--danger">
        {{ errors.preferredBibleApp }}
      </div>
  </div>
</template>

<script setup lang="ts">
import { bibleVersionOptions as allBibleVersionOptions, bibleAppOptions, localeVersionGroups } from '@mybiblelog/shared';
import { useUserSettingsStore } from '~/stores/user-settings';
import { useToastStore } from '~/stores/toast';

definePageMeta({ middleware: ['auth'] });
useHead({ meta: [{ name: 'robots', content: 'noindex' }] });

const mounted = ref(false);
onMounted(() => { mounted.value = true; });

const { t, locale } = useI18n();
const userSettingsStore = useUserSettingsStore();
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

async function saveDailyVerseCountGoal() {
  errors.dailyVerseCountGoal = '';
  const success = await userSettingsStore.updateSettings({ dailyVerseCountGoal: form.dailyVerseCountGoal });
  if (success) {
    toastStore.add({ type: 'success', text: t('daily_verse_count_goal_saved') });
  }
  else {
    errors.dailyVerseCountGoal = t('unable_to_save_daily_verse_count_goal');
  }
}

async function saveLookBackDate() {
  errors.lookBackDate = '';
  const success = await userSettingsStore.updateSettings({ lookBackDate: form.lookBackDate });
  if (success) {
    toastStore.add({ type: 'success', text: t('look_back_date_saved') });
  }
  else {
    errors.lookBackDate = t('unable_to_save_look_back_date');
  }
}

async function savePreferredBibleVersion() {
  errors.preferredBibleVersion = '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const success = await userSettingsStore.updateSettings({ preferredBibleVersion: form.preferredBibleVersion as any });
  if (success) {
    toastStore.add({ type: 'success', text: t('preferred_bible_version_saved') });
  }
  else {
    errors.preferredBibleVersion = t('unable_to_save_preferred_bible_version');
  }
}

async function savePreferredBibleApp() {
  errors.preferredBibleApp = '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const success = await userSettingsStore.updateSettings({ preferredBibleApp: form.preferredBibleApp as any });
  if (success) {
    toastStore.add({ type: 'success', text: t('preferred_bible_app_saved') });
  }
  else {
    errors.preferredBibleApp = t('unable_to_save_preferred_bible_app');
  }
}
</script>

<style scoped>
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
    "daily_verse_count_goal_title": "Daily Verse Count Goal",
    "look_back_date_title": "Tracker Start Date",
    "preferred_bible_version_title": "Preferred Bible Version",
    "preferred_bible_app_title": "Preferred Bible App",
    "daily_verse_count_goal_saved": "Daily verse count goal saved successfully.",
    "unable_to_save_daily_verse_count_goal": "Unable to save. Please enter a number between 1 and 1111.",
    "look_back_date_saved": "Tracker start date saved successfully.",
    "unable_to_save_look_back_date": "Unable to save. Please enter a date no later than tomorrow.",
    "preferred_bible_version_saved": "Preferred Bible version saved successfully.",
    "unable_to_save_preferred_bible_version": "Unable to save.",
    "preferred_bible_app_saved": "Preferred Bible app saved successfully for this device.",
    "unable_to_save_preferred_bible_app": "Unable to save."
  },
  "de": {
    "reading": "Lesen",
    "save": "Speichern",
    "select_an_option": "Eine Option auswählen",
    "daily_verse_count_goal_title": "Tägliche Verszahl Ziel",
    "look_back_date_title": "Tracker-Startdatum",
    "preferred_bible_version_title": "Bibelversion bevorzugt",
    "preferred_bible_app_title": "Bibel-App bevorzugt",
    "daily_verse_count_goal_saved": "Tägliche Verszahl Ziel erfolgreich gespeichert.",
    "unable_to_save_daily_verse_count_goal": "Nicht gespeichert. Bitte geben Sie eine Zahl zwischen 1 und 1111 ein.",
    "look_back_date_saved": "Tracker-Startdatum erfolgreich gespeichert.",
    "unable_to_save_look_back_date": "Nicht gespeichert. Bitte geben Sie ein Datum nicht später als morgen ein.",
    "preferred_bible_version_saved": "Bibelversion bevorzugt erfolgreich gespeichert.",
    "unable_to_save_preferred_bible_version": "Nicht gespeichert.",
    "preferred_bible_app_saved": "Bibel-App bevorzugt erfolgreich für dieses Gerät gespeichert.",
    "unable_to_save_preferred_bible_app": "Nicht gespeichert."
  },
  "es": {
    "reading": "Lectura",
    "save": "Guardar",
    "select_an_option": "Seleccionar una opción",
    "daily_verse_count_goal_title": "Meta de Versículos Diarios",
    "look_back_date_title": "Fecha de Inicio del Rastreador",
    "preferred_bible_version_title": "Versión de la Biblia Preferida",
    "preferred_bible_app_title": "Aplicación de Biblia Preferida",
    "daily_verse_count_goal_saved": "Meta de versículos diarios guardada con éxito.",
    "unable_to_save_daily_verse_count_goal": "No se puede guardar. Por favor ingrese un número entre 1 y 1111.",
    "look_back_date_saved": "Fecha de inicio del rastreador guardada con éxito.",
    "unable_to_save_look_back_date": "No se puede guardar. Por favor ingrese una fecha no posterior a mañana.",
    "preferred_bible_version_saved": "Versión de la Biblia preferida guardada con éxito.",
    "unable_to_save_preferred_bible_version": "No se puede guardar.",
    "preferred_bible_app_saved": "Aplicación de Biblia preferida guardada con éxito para este dispositivo.",
    "unable_to_save_preferred_bible_app": "No se puede guardar."
  },
  "fr": {
    "reading": "Lecture",
    "save": "Enregistrer",
    "select_an_option": "Sélectionner une option",
    "daily_verse_count_goal_title": "Objectif de nombre de versets quotidiens",
    "look_back_date_title": "Date de Début du Suivi",
    "preferred_bible_version_title": "Version de la Bible préférée",
    "preferred_bible_app_title": "Application de la Bible préférée",
    "daily_verse_count_goal_saved": "Objectif de nombre de versets quotidiens enregistré avec succès.",
    "unable_to_save_daily_verse_count_goal": "Impossible d'enregistrer. Veuillez entrer un nombre entre 1 et 1111.",
    "look_back_date_saved": "Date de début du suivi enregistrée avec succès.",
    "unable_to_save_look_back_date": "Impossible d'enregistrer. Veuillez saisir une date au plus tard demain.",
    "preferred_bible_version_saved": "Version préférée de la Bible enregistrée avec succès.",
    "unable_to_save_preferred_bible_version": "Impossible d'enregistrer.",
    "preferred_bible_app_saved": "Application de la Bible préférée enregistrée avec succès pour cet appareil.",
    "unable_to_save_preferred_bible_app": "Impossible d'enregistrer."
  },
  "ko": {
    "reading": "읽기",
    "save": "저장",
    "select_an_option": "옵션 선택",
    "daily_verse_count_goal_title": "일일 구절 목표",
    "look_back_date_title": "추적기 시작일",
    "preferred_bible_version_title": "선호 성경 번역본",
    "preferred_bible_app_title": "선호 성경 앱",
    "daily_verse_count_goal_saved": "일일 구절 수 목표가 저장되었습니다.",
    "unable_to_save_daily_verse_count_goal": "저장할 수 없습니다. 1~1111 사이의 숫자를 입력해 주세요.",
    "look_back_date_saved": "추적기 시작일이 저장되었습니다.",
    "unable_to_save_look_back_date": "저장할 수 없습니다. 내일 안쪽의 날짜를 입력해 주세요.",
    "preferred_bible_version_saved": "선호 성경 번역본이 저장되었습니다.",
    "unable_to_save_preferred_bible_version": "저장할 수 없습니다.",
    "preferred_bible_app_saved": "선호 성경 앱이 이 기기에 저장되었습니다.",
    "unable_to_save_preferred_bible_app": "저장할 수 없습니다."
  },
  "pt": {
    "reading": "Leitura",
    "save": "Salvar",
    "select_an_option": "Selecionar uma Opção",
    "daily_verse_count_goal_title": "Meta Diária de Versículos",
    "look_back_date_title": "Data de Início do Rastreador",
    "preferred_bible_version_title": "Versão da Bíblia Preferida",
    "preferred_bible_app_title": "Aplicativo da Bíblia Preferido",
    "daily_verse_count_goal_saved": "Meta de versículos diários salva com sucesso.",
    "unable_to_save_daily_verse_count_goal": "Não foi possível salvar. Por favor, insira um número entre 1 e 1111.",
    "look_back_date_saved": "Data de início do rastreador salva com sucesso.",
    "unable_to_save_look_back_date": "Não é possível salvar. Por favor, insira uma data até amanhã no máximo.",
    "preferred_bible_version_saved": "Versão preferida da Bíblia salva com sucesso.",
    "unable_to_save_preferred_bible_version": "Não é possível salvar.",
    "preferred_bible_app_saved": "Aplicativo preferido da Bíblia salvo com sucesso para este dispositivo.",
    "unable_to_save_preferred_bible_app": "Não é possível salvar."
  },
  "uk": {
    "reading": "Читання",
    "save": "Зберегти",
    "select_an_option": "Вибрати опцію",
    "daily_verse_count_goal_title": "Мета щоденної кількості віршів",
    "look_back_date_title": "Дата початку відстеження",
    "preferred_bible_version_title": "Обрана версія Біблії",
    "preferred_bible_app_title": "Обрана програма для читання Біблії",
    "daily_verse_count_goal_saved": "Мету щоденної кількості віршів успішно збережено.",
    "unable_to_save_daily_verse_count_goal": "Не вдалося зберегти. Будь ласка, введіть число від 1 до 1111.",
    "look_back_date_saved": "Дата початку відстеження успішно збережена.",
    "unable_to_save_look_back_date": "Не вдалося зберегти. Будь ласка, введіть дату, яка не пізніше завтра.",
    "preferred_bible_version_saved": "Обрану версію Біблії успішно збережено.",
    "unable_to_save_preferred_bible_version": "Не вдалося зберегти.",
    "preferred_bible_app_saved": "Обрану програму для читання Біблії успішно збережено для цього пристрою.",
    "unable_to_save_preferred_bible_app": "Не вдалося зберегти."
  }
}
</i18n>
