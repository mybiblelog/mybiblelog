<template>
  <div class="content-column">
    <header class="page-header">
      <h1 class="mbl-title">
        {{ t('progress') }}
        <InfoLink :to="localePath('/about/page-features--progress')" />
      </h1>
      <NuxtLink class="mbl-button" :to="localePath('/books')">
        {{ t('bible_books') }}
        <CaretRightIcon style="margin-left: 0.2rem;" />
      </NuxtLink>
    </header>
    <BusyBar :busy="dateVerseCountsBusy" />
    <article class="mbl-message">
      <div class="mbl-message__body">
        <div class="mbl-content">
          <h2 class="mbl-title mbl-title--5">
            {{ t('your_reading_settings.title') }}
          </h2>
          <p>{{ t('your_reading_settings.description') }}</p>
          <div class="mbl-button-group">
            <NuxtLink class="mbl-button" :to="localePath('/settings/reading')">
              {{ t('your_reading_settings.update_settings') }}
            </NuxtLink>
          </div>
          <table class="mbl-table">
            <tbody>
              <tr>
                <td>{{ t('your_reading_settings.look_back_date') }}</td>
                <td>{{ displayDate(userSettings.lookBackDate) }}</td>
              </tr>
              <tr>
                <td>{{ t('your_reading_settings.daily_verse_count_goal') }}</td>
                <td>{{ userSettings.dailyVerseCountGoal }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </article>
    <article class="mbl-message">
      <div class="mbl-message__body">
        <div class="mbl-content">
          <h2 class="mbl-title mbl-title--5">
            {{ t('your_progress_so_far.title') }}
          </h2>
          <table class="mbl-table">
            <tbody>
              <tr>
                <td>{{ t('your_progress_so_far.total_bible_verses') }}</td>
                <td>{{ n(totalBibleVerseCount, 'grouped') }}</td>
              </tr>
              <tr>
                <td>{{ t('your_progress_so_far.verses_read') }}</td>
                <td>{{ n(uniqueVersesReadSinceLookBackDate, 'grouped') }}</td>
              </tr>
              <tr>
                <td>{{ t('your_progress_so_far.verses_remaining') }}</td>
                <td>{{ n(unreadVerses, 'grouped') }}</td>
              </tr>
              <tr>
                <td>{{ t('your_progress_so_far.percent_complete') }}</td>
                <td>{{ n(Math.floor(uniqueVersesReadSinceLookBackDate / totalBibleVerseCount * 100).toFixed() as unknown as number / 100, 'percent') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </article>
    <article class="mbl-message">
      <div class="mbl-message__body">
        <div class="mbl-content">
          <h2 class="mbl-title mbl-title--5">
            {{ t('your_outlook.historical.title') }}
          </h2>
          <i18n-t keypath="your_outlook.historical.description" tag="p">
            <template #lookBackDate><strong>{{ t('your_reading_settings.look_back_date') }}</strong></template>
          </i18n-t>
          <table class="mbl-table">
            <tbody>
              <tr>
                <td>
                  <i18n-t keypath="your_outlook.days_since_look_back_date">
                    <template #lookBackDate><strong>{{ t('your_reading_settings.look_back_date') }}</strong></template>
                  </i18n-t>
                </td>
                <td>{{ n(daysSinceLookBackDate, 'grouped') }}</td>
              </tr>
              <tr>
                <td>{{ t('your_outlook.average_daily_verses_read') }}</td>
                <td>{{ n(averageUniqueVersesReadDailySinceLookBackDate, 'grouped') }}</td>
              </tr>
              <tr>
                <td>{{ t('your_outlook.days_to_finish_at_this_rate') }}</td>
                <td>{{ n(daysToFinishBibleBasedOnLookBackDateAverage, 'grouped') }}</td>
              </tr>
              <tr>
                <td>{{ t('your_outlook.date_to_finish_at_this_rate') }}</td>
                <td>{{ displayDate(dateToFinishBibleBasedOnLookBackDateAverage) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </article>
    <article class="mbl-message">
      <div class="mbl-message__body">
        <div class="mbl-content">
          <h2 class="mbl-title mbl-title--5">
            {{ t('your_outlook.30_day.title') }}
          </h2>
          <p>{{ t('your_outlook.30_day.description') }}</p>
          <table class="mbl-table">
            <tbody>
              <tr>
                <td>{{ t('your_outlook.average_daily_verses_read') }}</td>
                <td>{{ n(averageDailyVersesReadPastXDays(30), 'grouped') }}</td>
              </tr>
              <tr>
                <td>{{ t('your_outlook.days_to_finish_at_this_rate') }}</td>
                <td>{{ n(daysToFinishBibleBasedOnXDayAverage(30), 'grouped') }}</td>
              </tr>
              <tr>
                <td>{{ t('your_outlook.date_to_finish_at_this_rate') }}</td>
                <td>{{ displayDate(dateToFinishBibleBasedOnXDayAverage(30)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </article>
    <article class="mbl-message">
      <div class="mbl-message__body">
        <div class="mbl-content">
          <h2 class="mbl-title mbl-title--5">
            {{ t('your_outlook.7_day.title') }}
          </h2>
          <p>{{ t('your_outlook.7_day.description') }}</p>
          <table class="mbl-table">
            <tbody>
              <tr>
                <td>{{ t('your_outlook.average_daily_verses_read') }}</td>
                <td>{{ n(averageDailyVersesReadPastXDays(7), 'grouped') }}</td>
              </tr>
              <tr>
                <td>{{ t('your_outlook.days_to_finish_at_this_rate') }}</td>
                <td>{{ n(daysToFinishBibleBasedOnXDayAverage(7), 'grouped') }}</td>
              </tr>
              <tr>
                <td>{{ t('your_outlook.date_to_finish_at_this_rate') }}</td>
                <td>{{ displayDate(dateToFinishBibleBasedOnXDayAverage(7)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </article>
    <article class="mbl-message">
      <div class="mbl-message__body">
        <div class="mbl-content">
          <h2 class="mbl-title mbl-title--5">
            {{ t('your_outlook.today.title') }}
          </h2>
          <p>{{ t('your_outlook.today.description') }}</p>
          <table class="mbl-table">
            <tbody>
              <tr>
                <td v-html="t('your_outlook.verses_read')" />
                <td>{{ n(newVersesReadToday, 'grouped') }}</td>
              </tr>
              <tr>
                <td>{{ t('your_outlook.days_to_finish_at_this_rate') }}</td>
                <td>{{ n(daysToFinishBibleBasedOnToday, 'grouped') }}</td>
              </tr>
              <tr>
                <td>{{ t('your_outlook.date_to_finish_at_this_rate') }}</td>
                <td>{{ displayDate(dateToFinishBibleBasedOnToday) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </article>
    <article class="mbl-message">
      <div class="mbl-message__body">
        <div class="mbl-content">
          <h2 class="mbl-title mbl-title--5">
            {{ t('set_a_goal.title') }}
          </h2>
          <p>{{ t('set_a_goal.description') }}</p>
          <table class="mbl-table">
            <tbody>
              <tr>
                <td colspan="2">
                  <label>{{ t('set_a_goal.goal_finish_date') }}
                    <input v-model="goalFinishDate" class="mbl-input" type="date">
                  </label>
                </td>
              </tr>
              <tr v-if="goalFinishDateError">
                <td colspan="2">
                  <span class="mbl-text-danger">{{ goalFinishDateError }}</span>
                </td>
              </tr>
              <tr>
                <td>{{ t('set_a_goal.days_to_finish_by_goal') }}</td>
                <td>{{ daysToFinishByGoalFinishDate }}</td>
              </tr>
              <tr>
                <td>{{ t('set_a_goal.verses_required_each_day') }}</td>
                <td>{{ versesRequiredEachDayForGoal }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { Bible } from '@mybiblelog/shared';
import BusyBar from '~/components/ui/BusyBar.vue';
import InfoLink from '~/components/ui/InfoLink.vue';
import CaretRightIcon from '~/components/svg/CaretRightIcon.vue';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useDateVerseCountsStore } from '~/stores/date-verse-counts';
import { useUserSettingsStore } from '~/stores/user-settings';
import { useAppInitStore } from '~/stores/app-init';

definePageMeta({ middleware: ['auth'] });
const { t, n, locale } = useI18n();
const localePath = useLocalePath();
useHead({ title: () => t('progress') });

const logEntriesStore = useLogEntriesStore();
const dateVerseCountsStore = useDateVerseCountsStore();
const userSettingsStore = useUserSettingsStore();

const goalFinishDate = ref('');
const goalFinishDateError = ref('');
const daysToFinishByGoalFinishDate = ref<string | number>('?');
const versesRequiredEachDayForGoal = ref<string | number>('?');

const dateVerseCountsBusy = computed(() => dateVerseCountsStore.busy);
const logEntries = computed(() => logEntriesStore.currentLogEntries);
const userSettings = computed(() => userSettingsStore.settings);

const totalBibleVerseCount = Bible.getTotalVerseCount();

const newVersesReadToday = computed(() => {
  const today = dayjs().format('YYYY-MM-DD');
  const throughYesterday = logEntries.value.filter(e => e.date < today);
  const throughToday = logEntries.value.filter(e => e.date <= today);
  return Bible.countUniqueRangeVerses(throughToday) - Bible.countUniqueRangeVerses(throughYesterday);
});

const daysSinceLookBackDate = computed(() => {
  const today = dayjs();
  const lookBackDate = dayjs(userSettings.value.lookBackDate);
  return today.diff(lookBackDate, 'day');
});

const uniqueVersesReadSinceLookBackDate = computed(() =>
  Bible.countUniqueRangeVerses(logEntries.value),
);

const averageUniqueVersesReadDailySinceLookBackDate = computed(() =>
  Math.floor(uniqueVersesReadSinceLookBackDate.value / daysSinceLookBackDate.value),
);

const unreadVerses = computed(() =>
  totalBibleVerseCount - uniqueVersesReadSinceLookBackDate.value,
);

const daysToFinishBibleBasedOnLookBackDateAverage = computed(() => {
  const daily = averageUniqueVersesReadDailySinceLookBackDate.value;
  if (!daily) { return Infinity; }
  return Math.ceil(unreadVerses.value / daily);
});

const dateToFinishBibleBasedOnLookBackDateAverage = computed(() => {
  const days = daysToFinishBibleBasedOnLookBackDateAverage.value;
  if (days === Infinity) { return 'Never'; }
  return dayjs().add(days, 'day').format('YYYY-MM-DD');
});

const daysToFinishBibleBasedOnToday = computed(() => {
  const daily = newVersesReadToday.value;
  if (!daily) { return Infinity; }
  return Math.ceil(unreadVerses.value / daily);
});

const dateToFinishBibleBasedOnToday = computed(() => {
  const days = daysToFinishBibleBasedOnToday.value;
  if (days === Infinity) { return 'Never'; }
  return dayjs().add(days, 'day').format('YYYY-MM-DD');
});

function averageDailyVersesReadPastXDays(x: number): number {
  const today = dayjs();
  let targetDate = today.subtract(x, 'day');
  const lookBackDate = dayjs(userSettings.value.lookBackDate);
  if (targetDate.isBefore(lookBackDate)) { targetDate = lookBackDate; }
  const daysAgo = Math.abs(targetDate.diff(today, 'day'));

  let cumulativeUniqueVerses = 0;
  let currentDate = targetDate;
  while (currentDate.isBefore(today)) {
    const { unique } = dateVerseCountsStore.getDateVerseCounts(currentDate.format('YYYY-MM-DD'));
    cumulativeUniqueVerses += unique;
    currentDate = currentDate.add(1, 'day');
  }
  return cumulativeUniqueVerses / daysAgo;
}

function daysToFinishBibleBasedOnXDayAverage(x: number): number {
  const daily = averageDailyVersesReadPastXDays(x);
  if (!daily) { return Infinity; }
  return Math.ceil(unreadVerses.value / daily);
}

function dateToFinishBibleBasedOnXDayAverage(x: number): string {
  const days = daysToFinishBibleBasedOnXDayAverage(x);
  if (days === Infinity) { return 'Never'; }
  return dayjs().add(days, 'day').format('YYYY-MM-DD');
}

function displayDate(dateString: string): string {
  if (dateString === 'Never') { return t('never'); }
  const date = dayjs(dateString).toDate();
  return date.toLocaleDateString(locale.value, { year: 'numeric', month: 'short', day: 'numeric' });
}

watch(goalFinishDate, (newVal) => {
  const today = dayjs().startOf('day');
  const goalDate = dayjs(newVal).startOf('day');
  const difference = goalDate.diff(today, 'day');
  if (difference <= 0) {
    goalFinishDateError.value = t('set_a_goal.goal_finish_date_error');
    daysToFinishByGoalFinishDate.value = '?';
    versesRequiredEachDayForGoal.value = '?';
    return;
  }
  daysToFinishByGoalFinishDate.value = n(difference, 'grouped');
  versesRequiredEachDayForGoal.value = n(Math.ceil(unreadVerses.value / difference), 'grouped');
  goalFinishDateError.value = '';
});

onMounted(async () => {
  await useAppInitStore().loadUserData();
  setTimeout(() => {
    dateVerseCountsStore.cacheDateVerseCounts();
  }, 0);
});
</script>

<style>
td:nth-child(2) {
  white-space: pre;
}
</style>

<i18n lang="json">
{
  "en": {
    "progress": "Progress",
    "bible_books": "Bible Books",
    "your_reading_settings": {
      "title": "Your Reading Settings",
      "description": "These settings are used to calculate and display your progress.",
      "update_settings": "Update Settings",
      "look_back_date": "Look Back Date",
      "daily_verse_count_goal": "Daily Verse Count Goal"
    },
    "your_progress_so_far": {
      "title": "Your Progress So Far",
      "total_bible_verses": "Total Bible Verses",
      "verses_read": "Verses Read",
      "verses_remaining": "Verses Remaining",
      "percent_complete": "Percent Complete"
    },
    "your_outlook": {
      "historical": {
        "title": "Your Historical Outlook",
        "description": "Based on your reading habits since your {lookBackDate}, how long will it take you to finish the Bible?"
      },
      "30_day": {
        "title": "Your 30-Day Outlook",
        "description": "Based on your reading habits from the past 30 days, how long will it take you to finish the Bible?"
      },
      "7_day": {
        "title": "Your 7-Day Outlook",
        "description": "Based on your reading habits from the past 7 days, how long will it take you to finish the Bible?"
      },
      "today": {
        "title": "Today's Outlook",
        "description": "Based on your reading today, how long will it take you to finish the Bible?"
      },
      "days_since_look_back_date": "Days Since {lookBackDate}",
      "verses_read": "Verses Read",
      "average_daily_verses_read": "Average Daily Verses Read",
      "days_to_finish_at_this_rate": "Days to Finish at This Rate",
      "date_to_finish_at_this_rate": "Date to Finish at This Rate"
    },
    "set_a_goal": {
      "title": "Set a Goal",
      "description": "Choose a target date to finish reading the Bible and work backwards to see how many verses you will need to read each day.",
      "goal_finish_date": "Goal Finish Date",
      "goal_finish_date_error": "Goal date must be in the future.",
      "days_to_finish_by_goal": "Days to Finish by Goal",
      "verses_required_each_day": "Verses Required Each Day"
    },
    "never": "Never"
  },
  "de": {
    "progress": "Fortschritt",
    "bible_books": "Bücher der Bibel",
    "your_reading_settings": {
      "title": "Ihre Leseinstellungen",
      "description": "Diese Einstellungen werden verwendet, um Ihren Fortschritt zu berechnen und anzuzeigen.",
      "update_settings": "Einstellungen aktualisieren",
      "look_back_date": "Rückblickdatum",
      "daily_verse_count_goal": "Tägliche Verszahl-Ziel"
    },
    "your_progress_so_far": {
      "title": "Ihr Fortschritt bis jetzt",
      "total_bible_verses": "Gesamte Bibelverszahl",
      "verses_read": "Gelesene Verszahl",
      "verses_remaining": "Verbleibende Verszahl",
      "percent_complete": "Fortschritt in Prozent"
    },
    "your_outlook": {
      "historical": {
        "title": "Ihre historische Perspektive",
        "description": "Basierend auf Ihren Lesegewohnheiten seit Ihrem {lookBackDate}, wie lange wird es dauern, bis Sie die Bibel lesen?"
      },
      "30_day": {
        "title": "Ihre 30-Tage-Perspektive",
        "description": "Basierend auf Ihren Lesegewohnheiten der letzten 30 Tage, wie lange wird es dauern, bis Sie die Bibel lesen?"
      },
      "7_day": {
        "title": "Ihre 7-Tage-Perspektive",
        "description": "Basierend auf Ihren Lesegewohnheiten der letzten 7 Tage, wie lange wird es dauern, bis Sie die Bibel lesen?"
      },
      "today": {
        "title": "Ihre heutige Perspektive",
        "description": "Basierend auf Ihrer heutigen Lesegewohnheit, wie lange wird es dauern, bis Sie die Bibel lesen?"
      },
      "days_since_look_back_date": "Tage seit {lookBackDate}",
      "verses_read": "Gelesene Verszahl",
      "average_daily_verses_read": "Durchschnittliche tägliche Verszahl",
      "days_to_finish_at_this_rate": "Tage bis zum Erreichen dieses Rhythmus",
      "date_to_finish_at_this_rate": "Datum bis zum Erreichen dieses Rhythmus"
    },
    "set_a_goal": {
      "title": "Ziel setzen",
      "description": "Wählen Sie ein Zieldatum, um die Bibel zu lesen, und arbeiten Sie rückwärts, um zu sehen, wie viele Verszahl Sie jeden Tag lesen müssen.",
      "goal_finish_date": "Ziel-Enddatum",
      "goal_finish_date_error": "Das Zieldatum muss in der Zukunft liegen.",
      "days_to_finish_by_goal": "Tage bis zum Erreichen des Ziels",
      "verses_required_each_day": "Verszahl pro Tag"
    },
    "never": "Nie"
  },
  "es": {
    "progress": "Progreso",
    "bible_books": "Libros de la Biblia",
    "your_reading_settings": {
      "title": "Sus Configuraciones de Lectura",
      "description": "Estas configuraciones se utilizan para calcular y mostrar su progreso.",
      "update_settings": "Actualizar Configuraciones",
      "look_back_date": "Fecha de Revisión",
      "daily_verse_count_goal": "Meta de Versos Diarios"
    },
    "your_progress_so_far": {
      "title": "Su Progreso Hasta Ahora",
      "total_bible_verses": "Total de Versos de la Biblia",
      "verses_read": "Versos Leídos",
      "verses_remaining": "Versos Restantes",
      "percent_complete": "Porcentaje Completado"
    },
    "your_outlook": {
      "historical": {
        "title": "Su Perspectiva Histórica",
        "description": "Basado en sus hábitos de lectura desde su {lookBackDate}, ¿cuánto tiempo le tomará terminar la Biblia?"
      },
      "30_day": {
        "title": "Su Perspectiva de 30 Días",
        "description": "Basado en sus hábitos de lectura de los últimos 30 días, ¿cuánto tiempo le tomará terminar la Biblia?"
      },
      "7_day": {
        "title": "Su Perspectiva de 7 Días",
        "description": "Basado en sus hábitos de lectura de los últimos 7 días, ¿cuánto tiempo le tomará terminar la Biblia?"
      },
      "today": {
        "title": "La Perspectiva de Hoy",
        "description": "Basado en su lectura de hoy, ¿cuánto tiempo le tomará terminar la Biblia?"
      },
      "days_since_look_back_date": "Días Desde {lookBackDate}",
      "verses_read": "Versos Leídos",
      "average_daily_verses_read": "Promedio de Versos Leídos Diariamente",
      "days_to_finish_at_this_rate": "Días para Terminar a Este Ritmo",
      "date_to_finish_at_this_rate": "Fecha para Terminar a Este Ritmo"
    },
    "set_a_goal": {
      "title": "Establecer una Meta",
      "description": "Elija una fecha objetivo para terminar de leer la Biblia y trabaje hacia atrás para ver cuántos versos deberá leer cada día.",
      "goal_finish_date": "Fecha de Finalización de la Meta",
      "goal_finish_date_error": "La fecha de finalización de la meta debe ser en el futuro.",
      "days_to_finish_by_goal": "Días para Terminar por Meta",
      "verses_required_each_day": "Versos Requeridos Cada Día"
    },
    "never": "Nunca"
  },
  "fr": {
    "progress": "Progrès",
    "bible_books": "Livres de la Bible",
    "your_reading_settings": {
      "title": "Vos paramètres de lecture",
      "description": "Ces paramètres sont utilisés pour calculer et afficher votre progression.",
      "update_settings": "Mettre à jour les paramètres",
      "look_back_date": "Date de consultation précédente",
      "daily_verse_count_goal": "Objectif de versets quotidiens"
    },
    "your_progress_so_far": {
      "title": "Votre progression jusqu'à présent",
      "total_bible_verses": "Total des versets de la Bible",
      "verses_read": "Versets lus",
      "verses_remaining": "Versets Restants",
      "percent_complete": "Pourcentage Complet"
    },
    "your_outlook": {
      "historical": {
        "title": "Votre Perspective Historique",
        "description": "En fonction de vos habitudes de lecture depuis votre {lookBackDate}, combien de temps vous faudra-t-il pour finir la Bible?"
      },
      "30_day": {
        "title": "Votre Perspective sur 30 Jours",
        "description": "En fonction de vos habitudes de lecture des 30 derniers jours, combien de temps vous faudra-t-il pour finir la Bible?"
      },
      "7_day": {
        "title": "Votre Perspective sur 7 Jours",
        "description": "En fonction de vos habitudes de lecture des 7 derniers jours, combien de temps vous faudra-t-il pour finir la Bible?"
      },
      "today": {
        "title": "Perspective du Jour",
        "description": "En fonction de votre lecture aujourd'hui, combien de temps vous faudra-t-il pour finir la Bible?"
      },
      "days_since_look_back_date": "Jours depuis la {lookBackDate}",
      "verses_read": "Versets lus",
      "average_daily_verses_read": "Moyenne des versets lus par jour",
      "days_to_finish_at_this_rate": "Jours restants à ce rythme",
      "date_to_finish_at_this_rate": "Date de fin à ce rythme"
    },
    "set_a_goal": {
      "title": "Fixer un objectif",
      "description": "Choisissez une date cible pour terminer la lecture de la Bible et travaillez en sens inverse pour voir combien de versets vous devrez lire chaque jour.",
      "goal_finish_date": "Date d'achèvement de l'objectif",
      "goal_finish_date_error": "La date de l'objectif doit être à l'avenir.",
      "days_to_finish_by_goal": "Jours pour terminer avant l'objectif",
      "verses_required_each_day": "Versets requis chaque jour"
    },
    "never": "Jamais"
  },
  "ko": {
    "progress": "진도",
    "bible_books": "성경 일람",
    "your_reading_settings": {
      "title": "나의 읽기 설정",
      "description": "아래 설정에 기반해 읽기 진도를 계산 및 표시합니다.",
      "update_settings": "설정 변경",
      "look_back_date": "기준 시작일",
      "daily_verse_count_goal": "일일 구절 목표"
    },
    "your_progress_so_far": {
      "title": "현재까지의 진도",
      "total_bible_verses": "성경 전체 구절 수",
      "verses_read": "읽은 구절 수",
      "verses_remaining": "남은 구절 수",
      "percent_complete": "완료율"
    },
    "your_outlook": {
      "historical": {
        "title": "전체 기간 전망",
        "description": "{lookBackDate} 이후 읽기 습관을 바탕으로, 성경을 완독하는 데 얼마나 걸릴까요?"
      },
      "30_day": {
        "title": "최근 30일 전망",
        "description": "지난 30일간의 읽기 습관을 바탕으로, 성경을 완독하는 데 얼마나 걸릴까요?"
      },
      "7_day": {
        "title": "최근 7일 전망",
        "description": "지난 7일간의 읽기 습관을 바탕으로, 성경을 완독하는 데 얼마나 걸릴까요?"
      },
      "today": {
        "title": "오늘의 전망",
        "description": "오늘 읽은 분량을 바탕으로, 성경을 완독하는 데 얼마나 걸릴까요?"
      },
      "days_since_look_back_date": "{lookBackDate} 이후 경과일",
      "verses_read": "읽은 구절 수",
      "average_daily_verses_read": "일일 평균 읽은 구절 수",
      "days_to_finish_at_this_rate": "현재 속도로 완독까지 남은 일수",
      "date_to_finish_at_this_rate": "현재 속도로 완독 예상일"
    },
    "set_a_goal": {
      "title": "목표 설정",
      "description": "성경 완독 목표일을 선택하면 매일 몇 구절을 읽어야 하는지 역산하여 표시해줍니다.",
      "goal_finish_date": "목표달성일",
      "goal_finish_date_error": "목표 일자는 미래여야 합니다.",
      "days_to_finish_by_goal": "목표까지 남은 일수",
      "verses_required_each_day": "매일 읽어야 할 구절 수"
    },
    "never": "해당 없음"
  },
  "pt": {
    "progress": "Progress",
    "bible_books": "Bible Books",
    "your_reading_settings": {
      "title": "Suas Configurações de Leitura",
      "description": "Essas configurações são usadas para calcular e exibir seu progresso.",
      "update_settings": "Atualizar Configurações",
      "look_back_date": "Data de Revisão",
      "daily_verse_count_goal": "Meta Diária de Versículos"
    },
    "your_progress_so_far": {
      "title": "Seu Progresso Até Agora",
      "total_bible_verses": "Total de Versículos da Bíblia",
      "verses_read": "Versículos Lidos",
      "verses_remaining": "Versículos Restantes",
      "percent_complete": "Percentual Concluído"
    },
    "your_outlook": {
      "historical": {
        "title": "Seu Histórico de Progresso",
        "description": "Com base nos seus hábitos de leitura desde sua {lookBackDate}, quanto tempo levará para você terminar a Bíblia?"
      },
      "30_day": {
        "title": "Seu Progresso em 30 Dias",
        "description": "Com base nos seus hábitos de leitura nos últimos 30 dias, quanto tempo levará para você terminar a Bíblia?"
      },
      "7_day": {
        "title": "Seu Progresso em 7 Dias",
        "description": "Com base nos seus hábitos de leitura nos últimos 7 dias, quanto tempo levará para você terminar a Bíblia?"
      },
      "today": {
        "title": "Progresso de Hoje",
        "description": "Com base na sua leitura hoje, quanto tempo levará para você terminar a Bíblia?"
      },
      "days_since_look_back_date": "Dias Desde a {lookBackDate}",
      "verses_read": "Versículos Lidos",
      "average_daily_verses_read": "Média Diária de Versículos Lidos",
      "days_to_finish_at_this_rate": "Dias para Terminar a Este Ritmo",
      "date_to_finish_at_this_rate": "Data de Conclusão a Este Ritmo"
    },
    "set_a_goal": {
      "title": "Definir um Objetivo",
      "description": "Escolha uma data alvo para terminar a leitura da Bíblia e trabalhe retroativamente para ver quantos versículos você precisará ler a cada dia.",
      "goal_finish_date": "Data de Conclusão do Objetivo",
      "goal_finish_date_error": "A data do objetivo deve estar no futuro.",
      "days_to_finish_by_goal": "Dias para Concluir até o Objetivo",
      "verses_required_each_day": "Versículos Requeridos por Dia"
    },
    "never": "Nunca"
  },
  "uk": {
    "progress": "Прогрес",
    "bible_books": "Книги Біблії",
    "your_reading_settings": {
      "title": "Ваші налаштування читання",
      "description": "Ці налаштування використовуються для розрахунку та відображення вашого прогресу.",
      "update_settings": "Оновити налаштування",
      "look_back_date": "Дата перегляду",
      "daily_verse_count_goal": "Щоденна ціль кількості віршів"
    },
    "your_progress_so_far": {
      "title": "Ваш прогрес на даний момент",
      "total_bible_verses": "Загальна кількість віршів у Біблії",
      "verses_read": "Прочитані вірші",
      "verses_remaining": "Залишилося віршів",
      "percent_complete": "Відсоток завершення"
    },
    "your_outlook": {
      "historical": {
        "title": "Ваш історичний прогляд",
        "description": "На основі ваших звичок читання з дня вашого {lookBackDate}, скільки часу вам знадобиться, щоб закінчити Біблію?"
      },
      "30_day": {
        "title": "Ваш прогляд за 30 днів",
        "description": "На основі ваших звичок читання з останніх 30 днів, скільки часу вам знадобиться, щоб закінчити Біблію?"
      },
      "7_day": {
        "title": "Ваш прогляд за 7 днів",
        "description": "На основі ваших звичок читання з останніх 7 днів, скільки часу вам знадобиться, щоб закінчити Біблію?"
      },
      "today": {
        "title": "Прогляд на сьогодні",
        "description": "На основі вашого сьогоднішнього читання, скільки часу вам знадобиться, щоб закінчити Біблію?"
      },
      "days_since_look_back_date": "Днів з перегляду",
      "verses_read": "Прочитані вірші",
      "average_daily_verses_read": "Середня кількість віршів за день",
      "days_to_finish_at_this_rate": "Днів до закінчення за цією швидкістю",
      "date_to_finish_at_this_rate": "Дата закінчення за цією швидкістю"
    },
    "set_a_goal": {
      "title": "Встановіть ціль",
      "description": "Оберіть цільову дату для завершення читання Біблії та працюйте в зворотному напрямку, щоб побачити, скільки віршів вам потрібно читати щодня.",
      "goal_finish_date": "Дата завершення цілі",
      "goal_finish_date_error": "Дата цілі повинна бути в майбутньому.",
      "days_to_finish_by_goal": "Днів до завершення за ціллю",
      "verses_required_each_day": "Віршів потрібно щодня"
    },
    "never": "Ніколи"
  }
}
</i18n>
