<template>
  <div>
    <h2 class="mbl-title mbl-title--4">
      {{ t('import') }}
    </h2>
    <p>{{ t('you_can_import') }}</p>
    <div class="mbl-file-block">
      <label v-if="hydrated" class="mbl-file">
        <input class="mbl-file__input" type="file" multiple data-testid="import-file-input" @change="onFileChange">
        <span class="mbl-file__cta">
          <span class="mbl-file__text">{{ t('choose_a_file') }}</span>
        </span>
      </label>
      <label v-else class="mbl-file">
        <span class="mbl-file__cta">
          <span class="mbl-file__text">{{ t('choose_a_file') }}</span>
        </span>
      </label>
    </div>
    <hr>
    <div v-if="showLookBackReset" class="mbl-message mbl-message--info">
      <div class="mbl-message__body">
        <p>{{ t('look_back_message_1') }}</p>
        <p>{{ t('look_back_message_2', { lookBackDate: earliestDate }) }}</p>
        <div class="mbl-button-group">
          <button class="mbl-button mbl-button--primary" :disabled="savingLookBackDate" @click="updateLookBackDate">
            {{ t('update_look_back_date') }}
          </button>
          <button class="mbl-button" @click="showLookBackReset = false">
            {{ t('keep_look_back_date') }}
          </button>
        </div>
      </div>
    </div>
    <h3 class="mbl-title mbl-title--5">
      {{ t('import_progress') }}
    </h3>
    <table class="mbl-table mbl-table--full">
      <thead>
        <tr>
          <th>{{ t('date') }}</th>
          <th>{{ t('passage') }}</th>
          <th>{{ t('status') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!importRows.length">
          <td colspan="3">
            {{ t('no_entries') }}
          </td>
        </tr>
        <tr v-for="(row, i) in importRows" :key="i" data-testid="import-row">
          <td>{{ row.date }}</td>
          <td>
            <span v-if="row.startVerseId !== null">
              {{ displayVerseRange(row.startVerseId!, row.endVerseId!) }}
            </span>
            <span v-else>{{ row.verseRange }}</span>
          </td>
          <td data-testid="import-row-status">
            {{ row.status }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Bible } from '@mybiblelog/shared';
import { useToastStore } from '~/stores/toast';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useUserSettingsStore } from '~/stores/user-settings';
import { useAppInitStore } from '~/stores/app-init';
import { runWithConcurrencyLimit } from '~/helpers/run-with-concurrency-limit';

dayjs.extend(customParseFormat);

definePageMeta({ middleware: ['auth'] });
const { t, locale } = useI18n();
useHead({ title: () => t('import'), meta: [{ name: 'robots', content: 'noindex' }] });

const toastStore = useToastStore();
const logEntriesStore = useLogEntriesStore();
const userSettingsStore = useUserSettingsStore();

type ImportRow = {
  date: string | null;
  startVerseId: number | null;
  endVerseId: number | null;
  verseRange: string;
  status: string;
};

const importRows = ref<ImportRow[]>([]);
const earliestDate = ref<string | null>(null);
const showLookBackReset = ref(false);
const savingLookBackDate = ref(false);

const MAX_IMPORT_ROWS = 1000;
const IMPORT_CONCURRENCY = 4;

const hydrated = useHydrated();
onMounted(async () => {
  await useAppInitStore().loadUserData();
});

function displayVerseRange(startVerseId: number, endVerseId: number) {
  return Bible.displayVerseRange(startVerseId, endVerseId, locale.value);
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', e => resolve(e.target!.result as string));
    reader.addEventListener('error', reject);
    reader.readAsText(file);
  });
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { fields.push(field); field = ''; }
    else { field += char; }
  }
  fields.push(field);
  return fields;
}

function splitCsvLines(csvText: string): string[] {
  return csvText.trim().split('\n').filter(l => l.trim());
}

function parseCsvToRows(csvText: string): ImportRow[] {
  let rows: string[][];
  try {
    rows = splitCsvLines(csvText).map(parseCsvLine);
  }
  catch {
    return [];
  }
  return rows.map(([inputDate = '', verseRange = '']) => {
    const isValidDate = dayjs(inputDate, 'YYYY-MM-DD', true).isValid();
    const date = isValidDate ? inputDate : null;
    let startVerseId: number | null = null;
    let endVerseId: number | null = null;
    let status: string;
    try {
      const parsed = Bible.parseVerseRange(verseRange, locale.value);
      if (!parsed) { throw new Error('Invalid verse range'); }
      startVerseId = parsed.startVerseId;
      endVerseId = parsed.endVerseId;
      status = t('status_todo');
    }
    catch {
      status = t('status_invalid');
    }
    return { date, startVerseId, endVerseId, verseRange, status };
  });
}

async function createImportedRows() {
  const pendingKeys = new Set<string>();

  await runWithConcurrencyLimit(importRows.value, IMPORT_CONCURRENCY, async (row) => {
    if (row.status === t('status_invalid') || row.startVerseId === null) { return; }
    row.status = t('status_checking');

    const key = `${row.date}|${row.startVerseId}|${row.endVerseId}`;
    const existing = pendingKeys.has(key) || logEntriesStore.logEntries.find(e =>
      e.date === row.date && e.startVerseId === row.startVerseId && e.endVerseId === row.endVerseId,
    );

    if (row.date && (!earliestDate.value || row.date < earliestDate.value)) {
      earliestDate.value = row.date;
    }

    if (existing) {
      row.status = t('status_already_exists');
      return;
    }

    pendingKeys.add(key);
    row.status = t('status_importing');
    await logEntriesStore.createLogEntry({
      date: row.date as string,
      startVerseId: row.startVerseId as number,
      endVerseId: row.endVerseId as number,
    });
    row.status = t('status_imported');
  });
}

async function onFileChange(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (!files?.length) { return; }

  importRows.value = [];
  const fileEntries = await Promise.all(
    Array.from(files).map(async file => ({ file, text: await readFile(file) })),
  );

  const totalRows = fileEntries.reduce((sum, { text }) => sum + splitCsvLines(text).length, 0);
  if (totalRows > MAX_IMPORT_ROWS) {
    toastStore.add({ type: 'error', text: t('too_many_rows', { count: totalRows, max: MAX_IMPORT_ROWS }) });
    return;
  }

  for (const { file, text } of fileEntries) {
    const rows = parseCsvToRows(text);
    if (!rows.length) {
      toastStore.add({ type: 'error', text: t('unable_to_parse', { filename: file.name }) });
      return;
    }
    importRows.value.push(...rows);
  }

  if (!importRows.value.length) {
    toastStore.add({ type: 'error', text: t('unable_to_parse_any') });
    return;
  }

  try {
    await createImportedRows();
    toastStore.add({ type: 'success', text: t('success', { count: importRows.value.length }) });
    const lookBackDate = userSettingsStore.settings?.lookBackDate;
    if (earliestDate.value && lookBackDate && earliestDate.value < lookBackDate) {
      showLookBackReset.value = true;
    }
  }
  catch {
    toastStore.add({ type: 'error', text: t('error_creating') });
  }
}

async function updateLookBackDate() {
  if (savingLookBackDate.value) { return; }
  savingLookBackDate.value = true;
  try {
    await userSettingsStore.updateSettings({ lookBackDate: earliestDate.value! });
    toastStore.add({ type: 'success', text: t('look_back_updated') });
    showLookBackReset.value = false;
  }
  finally {
    savingLookBackDate.value = false;
  }
}
</script>

<style scoped>
p { margin-bottom: 1rem; }
</style>

<i18n lang="json">
{
  "en": {
    "import": "Import",
    "you_can_import": "You can import a reading log CSV file to My Bible Log.",
    "choose_a_file": "Choose a file...",
    "import_progress": "Log Import Progress",
    "date": "Date",
    "passage": "Passage",
    "status": "Status",
    "no_entries": "No log entries to show.",
    "status_invalid": "Invalid",
    "status_todo": "To Do",
    "status_checking": "Checking",
    "status_already_exists": "Already Exists",
    "status_importing": "Importing Now",
    "status_imported": "Imported",
    "file_not_csv": "File {filename} is not in CSV format. It is {filetype}.",
    "unable_to_parse": "Unable to parse file {filename}. Make sure the format is correct.",
    "unable_to_parse_any": "Unable to parse any log entries from uploaded files.",
    "too_many_rows": "Your file has {count} rows, which is more than the maximum of {max}. Please split it into smaller files and try again.",
    "success": "Successfully processed {count} log entries.",
    "error_creating": "There was a problem creating the log entries.",
    "look_back_message_1": "Your imported file includes log entries before your Look Back Date. Most pages will ignore these entries when showing your progress.",
    "look_back_message_2": "Would you like to update your Look Back Date to {lookBackDate} to include these entries?",
    "update_look_back_date": "Update Look Back Date",
    "keep_look_back_date": "Keep Current Look Back Date",
    "look_back_updated": "Look back date updated successfully."
  },
  "de": {
    "import": "Import",
    "you_can_import": "Sie können ein CSV-Datei mit Journal-Einträgen importieren.",
    "choose_a_file": "Datei auswählen...",
    "import_progress": "Import-Fortschritt",
    "date": "Datum",
    "passage": "Passage",
    "status": "Status",
    "no_entries": "Keine Einträge.",
    "status_invalid": "Ungültig",
    "status_todo": "Zu tun",
    "status_checking": "Überprüfen",
    "status_already_exists": "Bereits vorhanden",
    "status_importing": "Wird importiert",
    "status_imported": "Importiert",
    "file_not_csv": "Datei {filename} ist nicht CSV. Es ist {filetype}.",
    "unable_to_parse": "Datei {filename} kann nicht analysiert werden.",
    "unable_to_parse_any": "Keine Einträge gefunden.",
    "too_many_rows": "Ihre Datei enthält {count} Zeilen, mehr als das Maximum von {max}. Bitte teilen Sie sie in kleinere Dateien auf und versuchen Sie es erneut.",
    "success": "{count} Einträge verarbeitet.",
    "error_creating": "Fehler beim Erstellen der Einträge.",
    "look_back_message_1": "Datei enthält Einträge vor dem Rückblickdatum.",
    "look_back_message_2": "Rückblickdatum auf {lookBackDate} aktualisieren?",
    "update_look_back_date": "Rückblickdatum aktualisieren",
    "keep_look_back_date": "Beibehalten",
    "look_back_updated": "Rückblickdatum aktualisiert."
  },
  "es": {
    "import": "Importar",
    "you_can_import": "Puede importar un archivo CSV.",
    "choose_a_file": "Elegir archivo...",
    "import_progress": "Progreso de importación",
    "date": "Fecha",
    "passage": "Pasaje",
    "status": "Estado",
    "no_entries": "No hay entradas.",
    "status_invalid": "Inválido",
    "status_todo": "Por Hacer",
    "status_checking": "Comprobando",
    "status_already_exists": "Ya Existe",
    "status_importing": "Importando",
    "status_imported": "Importado",
    "file_not_csv": "Archivo {filename} no es CSV.",
    "unable_to_parse": "No se puede analizar {filename}.",
    "unable_to_parse_any": "No se encontraron entradas.",
    "too_many_rows": "Su archivo tiene {count} filas, más del máximo de {max}. Divídalo en archivos más pequeños e inténtelo de nuevo.",
    "success": "{count} entradas procesadas.",
    "error_creating": "Error al crear las entradas.",
    "look_back_message_1": "El archivo incluye entradas anteriores a su Fecha de Retroceso.",
    "look_back_message_2": "¿Actualizar Fecha de Retroceso a {lookBackDate}?",
    "update_look_back_date": "Actualizar Fecha de Retroceso",
    "keep_look_back_date": "Mantener",
    "look_back_updated": "Fecha actualizada."
  },
  "fr": {
    "import": "Importer",
    "you_can_import": "Vous pouvez importer un fichier CSV.",
    "choose_a_file": "Choisissez un fichier...",
    "import_progress": "Progression de l'importation",
    "date": "Date",
    "passage": "Passage",
    "status": "Statut",
    "no_entries": "Aucune entrée.",
    "status_invalid": "Invalide",
    "status_todo": "À faire",
    "status_checking": "Vérification",
    "status_already_exists": "Déjà Existant",
    "status_importing": "Importation",
    "status_imported": "Importé",
    "file_not_csv": "Fichier {filename} n'est pas CSV.",
    "unable_to_parse": "Impossible d'analyser {filename}.",
    "unable_to_parse_any": "Aucune entrée trouvée.",
    "too_many_rows": "Votre fichier contient {count} lignes, ce qui dépasse le maximum de {max}. Veuillez le diviser en fichiers plus petits et réessayer.",
    "success": "{count} entrées traitées.",
    "error_creating": "Problème lors de la création.",
    "look_back_message_1": "Le fichier contient des entrées avant votre Date de Rétrospection.",
    "look_back_message_2": "Mettre à jour la Date de Rétrospection à {lookBackDate}?",
    "update_look_back_date": "Mettre à jour",
    "keep_look_back_date": "Conserver",
    "look_back_updated": "Date mise à jour."
  },
  "ko": {
    "import": "불러오기",
    "you_can_import": "CSV 파일을 불러올 수 있습니다.",
    "choose_a_file": "파일 선택…",
    "import_progress": "불러오기 진행률",
    "date": "일자",
    "passage": "구절",
    "status": "비고",
    "no_entries": "표시할 기록이 없습니다.",
    "status_invalid": "올바르지 않음",
    "status_todo": "대기",
    "status_checking": "확인 중",
    "status_already_exists": "중복값 존재",
    "status_importing": "불러오는 중",
    "status_imported": "불러오기 완료",
    "file_not_csv": "{filename}은 CSV 형식이 아닙니다.",
    "unable_to_parse": "{filename}을 해석할 수 없습니다.",
    "unable_to_parse_any": "읽기 기록을 찾을 수 없습니다.",
    "too_many_rows": "파일에 {count}개의 행이 있어 최대 {max}개를 초과합니다. 파일을 더 작게 나누어 다시 시도해 주세요.",
    "success": "{count}개 처리되었습니다.",
    "error_creating": "문제가 발생했습니다.",
    "look_back_message_1": "기준 시작일 이전 기록이 포함되어 있습니다.",
    "look_back_message_2": "기준 시작일을 {lookBackDate}로 바꿀까요?",
    "update_look_back_date": "기준 시작일 업데이트",
    "keep_look_back_date": "유지",
    "look_back_updated": "업데이트되었습니다."
  },
  "pt": {
    "import": "Import",
    "you_can_import": "Você pode importar um arquivo CSV.",
    "choose_a_file": "Escolha um arquivo...",
    "import_progress": "Progresso da importação",
    "date": "Data",
    "passage": "Passagem",
    "status": "Status",
    "no_entries": "Nenhum registro.",
    "status_invalid": "Inválido",
    "status_todo": "A fazer",
    "status_checking": "Verificando",
    "status_already_exists": "Já Existe",
    "status_importing": "Importando",
    "status_imported": "Importado",
    "file_not_csv": "Arquivo {filename} não é CSV.",
    "unable_to_parse": "Não é possível analisar {filename}.",
    "unable_to_parse_any": "Nenhuma entrada encontrada.",
    "too_many_rows": "Seu arquivo tem {count} linhas, mais do que o máximo de {max}. Divida-o em arquivos menores e tente novamente.",
    "success": "{count} entradas processadas.",
    "error_creating": "Houve um problema.",
    "look_back_message_1": "O arquivo inclui entradas antes da Data de Retrocesso.",
    "look_back_message_2": "Atualizar Data de Retrocesso para {lookBackDate}?",
    "update_look_back_date": "Atualizar Data de Retrocesso",
    "keep_look_back_date": "Manter",
    "look_back_updated": "Data atualizada."
  },
  "uk": {
    "import": "Імпорт",
    "you_can_import": "Ви можете імпортувати CSV-файл.",
    "choose_a_file": "Виберіть файл...",
    "import_progress": "Прогрес імпорту",
    "date": "Дата",
    "passage": "Пасаж",
    "status": "Статус",
    "no_entries": "Немає записів.",
    "status_invalid": "Недійсний",
    "status_todo": "Зробити",
    "status_checking": "Перевірка",
    "status_already_exists": "Вже існує",
    "status_importing": "Імпортується",
    "status_imported": "Імпортовано",
    "file_not_csv": "Файл {filename} не CSV.",
    "unable_to_parse": "Не вдалося проаналізувати {filename}.",
    "unable_to_parse_any": "Не вдалося знайти записи.",
    "too_many_rows": "У вашому файлі {count} рядків, що перевищує максимум {max}. Розділіть його на менші файли та спробуйте ще раз.",
    "success": "Оброблено {count} записів.",
    "error_creating": "Виникла проблема.",
    "look_back_message_1": "Файл містить записи до Дати Огляду.",
    "look_back_message_2": "Оновити Дату Огляду до {lookBackDate}?",
    "update_look_back_date": "Оновити Дату Огляду",
    "keep_look_back_date": "Залишити",
    "look_back_updated": "Дату оновлено."
  }
}
</i18n>
