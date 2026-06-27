<template>
  <div>
    <h2 class="mbl-title mbl-title--4">{{ t('export') }}</h2>
    <p>{{ t('you_can_download') }}</p>
    <br>

    <h2 class="mbl-title mbl-title--5">{{ t('reading_log_title') }}</h2>
    <p>{{ t('reading_log_info_1') }}</p>
    <p>{{ t('reading_log_info_2') }}</p>
    <button class="mbl-button mbl-button--primary" data-testid="export-log-csv-button" :disabled="!mounted" @click="downloadLogEntriesCSV">
      {{ t('reading_log_cta') }}
    </button>
    <hr>

    <h2 class="mbl-title mbl-title--5">{{ t('notes_title') }}</h2>
    <div class="mbl-message">
      <div class="mbl-message__body">{{ t('notes_info') }}</div>
    </div>

    <h2 class="mbl-title mbl-title--6">{{ t('notes_text_title') }}</h2>
    <p>{{ t('notes_text_info') }}</p>
    <p>
      <button class="mbl-button mbl-button--primary" data-testid="export-notes-text-button" :disabled="!mounted" @click="downloadNotesTextFile">
        {{ t('notes_text_cta') }}
      </button>
    </p>

    <h2 class="mbl-title mbl-title--6">{{ t('notes_json_title') }}</h2>
    <p>{{ t('notes_json_info') }}</p>
    <p>
      <button class="mbl-button mbl-button--primary" data-testid="export-notes-json-button" :disabled="!mounted" @click="downloadNotesJsonFile">
        {{ t('notes_json_cta') }}
      </button>
    </p>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { Bible } from '@mybiblelog/shared';
import { UnknownApiError } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';
import { useToastStore } from '~/stores/toast';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useAppInitStore } from '~/stores/app-init';

definePageMeta({ middleware: ['auth'] });
const { t, locale } = useI18n();
useHead({ title: () => t('export'), meta: [{ name: 'robots', content: 'noindex' }] });

const logEntriesStore = useLogEntriesStore();

let logCsvCache = '';
let notesTextCache = '';
let notesJsonCache = '';

const mounted = ref(false);
onMounted(async () => {
  await useAppInitStore().loadUserData();
  mounted.value = true;
});

function generateDownload(filename: string, dataString: string) {
  const blob = new Blob([dataString], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.cssText = 'display:none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  // Delay cleanup so the browser can initiate the download before the URL is revoked
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.parentElement?.removeChild(a);
  }, 5000);
}

function csvRow(values: string[]): string {
  return values.map(v => (/[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(',');
}

async function downloadLogEntriesCSV() {
  if (!logCsvCache) {
    const rows = logEntriesStore.logEntries.map((entry: Record<string, unknown>) => [
      String(entry.date),
      Bible.displayVerseRange(entry.startVerseId as number, entry.endVerseId as number, locale.value),
    ]);
    logCsvCache = rows.map(csvRow).join('\n') + '\n';
  }
  const today = dayjs().format('YYYY-MM-DD');
  generateDownload(t('reading_log_filename', { today }), logCsvCache);
}

async function loadAllNotes() {
  const allNotes: unknown[] = [];
  let offset = 0;
  while (true) {
    const res = await $fetch<{ data: unknown[]; meta: { pagination: { size: number } } }>(`/api/passage-notes?offset=${offset}`);
    allNotes.push(...res.data);
    if (allNotes.length >= res.meta.pagination.size) { break; }
    offset += 10;
  }
  return allNotes;
}

async function downloadNotesTextFile() {
  const toastStore = useToastStore();
  if (!notesTextCache) {
    try {
      const tags = (await $fetch<{ data: unknown[] }>('/api/passage-note-tags')).data;
      const notes = await loadAllNotes() as Array<Record<string, unknown>>;
      const NOTES_HEADING = t('notes_export_heading_notes');
      const TAGS_HEADING = t('notes_export_heading_tags');
      const noteTexts = notes.map(note => generateNoteText(note, tags as Array<Record<string, unknown>>));
      const tagTexts = (tags as Array<Record<string, unknown>>).map(generateTagText);
      notesTextCache = [
        t('notes_export_title'),
        `\n\n===========\n${NOTES_HEADING}\n===========\n\n`,
        noteTexts.join('\n\n---------------\n\n'),
        `\n\n===========\n${TAGS_HEADING}\n===========\n\n`,
        tagTexts.join('\n\n---------------\n\n'),
      ].join('');
    }
    catch {
      toastStore.add({ type: 'error', text: String(mapFormErrors(new UnknownApiError())?._form ?? '') });
      return;
    }
  }
  const today = dayjs().format('YYYY-MM-DD');
  generateDownload(t('notes_text_filename', { today }), notesTextCache);
}

async function downloadNotesJsonFile() {
  const toastStore = useToastStore();
  if (!notesJsonCache) {
    try {
      const tags = (await $fetch<{ data: unknown[] }>('/api/passage-note-tags')).data;
      const notes = await loadAllNotes();
      notesJsonCache = JSON.stringify({ notes, tags });
    }
    catch {
      toastStore.add({ type: 'error', text: String(mapFormErrors(new UnknownApiError())?._form ?? '') });
      return;
    }
  }
  const today = dayjs().format('YYYY-MM-DD');
  generateDownload(t('notes_json_filename', { today }), notesJsonCache);
}

function generateNoteText(note: Record<string, unknown>, tags: Array<Record<string, unknown>>) {
  const dateTimeFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'long' } as Intl.DateTimeFormatOptions);
  const noteDate = dateTimeFormat.format(new Date(note.createdAt as string));
  const PASSAGES_HEADING = t('notes_export_heading_passages');
  const TAGS_HEADING = t('notes_export_heading_tags');
  let result = noteDate;
  if ((note.passages as unknown[]).length) {
    result += '\n\n' + `${PASSAGES_HEADING}:\n`;
    const passages = (note.passages as Array<Record<string, unknown>>).map(p =>
      Bible.displayVerseRange(p.startVerseId as number, p.endVerseId as number));
    result += passages.map(p => `* ${p}`).join('\n');
  }
  if ((note.tags as unknown[]).length) {
    const tagLabels = (note.tags as Array<string | number>)
      .map(tagId => {
        const tag = tags.find(t => t.id === tagId || t._id === tagId);
        return tag ? tag.label : null;
      })
      .filter(Boolean);
    if (tagLabels.length) {
      result += '\n\n' + `${TAGS_HEADING}:\n`;
      result += tagLabels.map(tag => `* ${tag}`).join('\n');
    }
  }
  if ((note.content as string).length) {
    result += '\n\n- - - - -\n\n' + note.content;
  }
  return result;
}

function generateTagText(tag: Record<string, unknown>) {
  let result = String(tag.label);
  if (tag.description) { result += '\n\n' + tag.description; }
  return result;
}
</script>

<i18n lang="json">
{
  "en": {
    "export": "Export",
    "you_can_download": "You can download your data in different formats.",
    "reading_log_title": "Reading Log",
    "reading_log_info_1": "You can export your log entries as a spreadsheet (CSV file).",
    "reading_log_info_2": "This file can be imported into My Bible Log or opened in a spreadsheet program.",
    "reading_log_cta": "Export Reading Log CSV",
    "reading_log_filename": "My_Bible_Log_Reading_Log_Export_{today}.csv",
    "notes_title": "Notes",
    "notes_info": "While exported notes cannot be automatically imported into My Bible Log, you can always re-create notes and tags manually.",
    "notes_text_title": "Notes Text File",
    "notes_text_info": "You can export your notes in a text file.",
    "notes_text_cta": "Export Notes Text",
    "notes_text_filename": "My_Bible_Log_Notes_Export_{today}.txt",
    "notes_json_title": "Notes JSON File",
    "notes_json_info": "You also have the option of exporting your notes as a JSON file.",
    "notes_json_cta": "Export Notes JSON",
    "notes_json_filename": "My_Bible_Log_Notes_Export_{today}.json",
    "notes_export_title": "My Bible Log Notes Export",
    "notes_export_heading_notes": "NOTES",
    "notes_export_heading_tags": "TAGS",
    "notes_export_heading_passages": "PASSAGES"
  },
  "de": { "export": "Export", "you_can_download": "Sie können Ihre Daten in verschiedenen Formaten herunterladen.", "reading_log_title": "Journal", "reading_log_info_1": "Sie können Ihre Journal-Einträge als Tabelle (CSV-Datei) exportieren.", "reading_log_info_2": "Diese Datei kann in My Bible Log importiert oder in einem Tabellenkalkulationsprogramm geöffnet werden.", "reading_log_cta": "Journal als CSV exportieren", "reading_log_filename": "My_Bible_Log_Journal_Export_{today}.csv", "notes_title": "Notizen", "notes_info": "Obwohl exportierte Notizen nicht automatisch in My Bible Log importiert werden können, können Sie Notizen und Tags immer manuell neu erstellen.", "notes_text_title": "Notizen Textdatei", "notes_text_info": "Sie können Ihre Notizen in einer Textdatei exportieren.", "notes_text_cta": "Notizen Text exportieren", "notes_text_filename": "My_Bible_Log_Notizen_Export_{today}.txt", "notes_json_title": "Notizen JSON Datei", "notes_json_info": "Sie können Ihre Notizen auch als JSON-Datei exportieren.", "notes_json_cta": "Notizen JSON exportieren", "notes_json_filename": "My_Bible_Log_Notizen_Export_{today}.json", "notes_export_title": "My Bible Log Notizen Export", "notes_export_heading_notes": "NOTIZEN", "notes_export_heading_tags": "TAGS", "notes_export_heading_passages": "PASSAGES" },
  "es": { "export": "Exportar", "you_can_download": "Puede descargar sus datos en diferentes formatos.", "reading_log_title": "Registro de Lectura", "reading_log_info_1": "Puede exportar sus entradas de registro como un tableur (CSV).", "reading_log_info_2": "Este archivo puede ser importado en My Bible Log o abierto en un programa de tableur.", "reading_log_cta": "Exportar Registro de Lectura CSV", "reading_log_filename": "My_Bible_Log_Reading_Log_Export_{today}.csv", "notes_title": "Notas", "notes_info": "Aunque las notas exportadas no se pueden importar automáticamente en My Bible Log, siempre puede volver a crear notas y etiquetas manualmente.", "notes_text_title": "Archivo de Texto de Notas", "notes_text_info": "Puede exportar sus notas en un archivo de texto.", "notes_text_cta": "Exportar Texto de Notas", "notes_text_filename": "My_Bible_Log_Notes_Export_{today}.txt", "notes_json_title": "Archivo JSON de Notas", "notes_json_info": "También tiene la opción de exportar sus notas como un archivo JSON.", "notes_json_cta": "Exportar Notas JSON", "notes_json_filename": "My_Bible_Log_Notes_Export_{today}.json", "notes_export_title": "Exportación de Notas de My Bible Log", "notes_export_heading_notes": "NOTAS", "notes_export_heading_tags": "ETIQUETAS", "notes_export_heading_passages": "PASAJES" },
  "fr": { "export": "Export", "you_can_download": "Vous pouvez télécharger vos données dans différents formats.", "reading_log_title": "Journal de lecture", "reading_log_info_1": "Vous pouvez exporter vos entrées de journal comme un tableur (CSV).", "reading_log_info_2": "Ce fichier peut être importé dans My Bible Log ou ouvert dans un programme de tableur.", "reading_log_cta": "Exporter le journal en CSV", "reading_log_filename": "My_Bible_Log_Reading_Log_Export_{today}.csv", "notes_title": "Notes", "notes_info": "Bien que les notes exportées ne puissent pas être importées automatiquement dans My Bible Log, vous pouvez toujours recréer manuellement les notes et les tags.", "notes_text_title": "Fichier de texte des notes", "notes_text_info": "Vous pouvez exporter vos notes dans un fichier texte.", "notes_text_cta": "Exporter le texte des notes", "notes_text_filename": "My_Bible_Log_Notes_Export_{today}.txt", "notes_json_title": "Fichier JSON des notes", "notes_json_info": "Vous avez également la possibilité d'exporter vos notes sous forme de fichier JSON.", "notes_json_cta": "Exporter les notes en JSON", "notes_json_filename": "My_Bible_Log_Notes_Export_{today}.json", "notes_export_title": "Exportation des notes de My Bible Log", "notes_export_heading_notes": "NOTES", "notes_export_heading_tags": "ÉTIQUETTES", "notes_export_heading_passages": "PASSAGES" },
  "ko": { "export": "내보내기", "you_can_download": "데이터를 여러 형식으로 다운로드 할 수 있습니다.", "reading_log_title": "읽기 기록", "reading_log_info_1": "읽기 기록을 스프레드시트(CSV)로 내보낼 수 있습니다.", "reading_log_info_2": "이 파일은 My Bible Log로 다시 불러오거나 스프레드시트 프로그램에서 열 수 있습니다.", "reading_log_cta": "CSV로 읽기 기록 내보내기", "reading_log_filename": "My_Bible_Log_Reading_Log_Export_{today}.csv", "notes_title": "노트", "notes_info": "내보내기한 노트를 My Bible Log로 자동으로 불러올 수는 없지만, 노트와 태그는 언제든 수동으로 재생성 할 수 있습니다.", "notes_text_title": "노트 텍스트 파일", "notes_text_info": "노트를 텍스트 파일로 내보낼 수 있습니다.", "notes_text_cta": "텍스트 파일로 노트 내보내기", "notes_text_filename": "My_Bible_Log_Notes_Export_{today}.txt", "notes_json_title": "노트 JSON 파일", "notes_json_info": "노트를 JSON 파일로도 내보낼 수 있습니다.", "notes_json_cta": "JSON으로 노트 내보내기", "notes_json_filename": "My_Bible_Log_Notes_Export_{today}.json", "notes_export_title": "My Bible Log 노트 내보내기", "notes_export_heading_notes": "노트", "notes_export_heading_tags": "태그", "notes_export_heading_passages": "구절" },
  "pt": { "export": "Exportar", "you_can_download": "Você pode baixar seus dados em diferentes formatos.", "reading_log_title": "Registro de Leitura", "reading_log_info_1": "Você pode exportar suas entradas de registro como uma planilha (CSV).", "reading_log_info_2": "Este arquivo pode ser importado para My Bible Log ou aberto em um programa de planilha.", "reading_log_cta": "Exportar Registro de Leitura CSV", "reading_log_filename": "My_Bible_Log_Reading_Log_Export_{today}.csv", "notes_title": "Notas", "notes_info": "Embora as notas exportadas não possam ser importadas automaticamente para My Bible Log, você sempre pode recriar as notas e etiquetas manualmente.", "notes_text_title": "Arquivo de Texto das Notas", "notes_text_info": "Você pode exportar suas notas em um arquivo de texto.", "notes_text_cta": "Exportar Notas de Texto", "notes_text_filename": "My_Bible_Log_Notes_Export_{today}.txt", "notes_json_title": "Arquivo JSON de Notas", "notes_json_info": "Você também tem a opção de exportar suas notas como um arquivo JSON.", "notes_json_cta": "Exportar Notas JSON", "notes_json_filename": "My_Bible_Log_Notes_Export_{today}.json", "notes_export_title": "Exportação de Notas do My Bible Log", "notes_export_heading_notes": "NOTAS", "notes_export_heading_tags": "TAGS", "notes_export_heading_passages": "PASSAGENS" },
  "uk": { "export": "Експорт", "you_can_download": "Ви можете завантажити свої дані у різних форматах.", "reading_log_title": "Журнал читання", "reading_log_info_1": "Ви можете експортувати ваші записи у вигляді електронної таблиці (CSV).", "reading_log_info_2": "Цей файл можна імпортувати в My Bible Log або відкрити в програмі для роботи з електронними таблицями.", "reading_log_cta": "Експорт Журналу читання у CSV", "reading_log_filename": "My_Bible_Log_Reading_Log_Export_{today}.csv", "notes_title": "Нотатки", "notes_info": "Хоча експортовані нотатки не можна автоматично імпортувати в My Bible Log, ви завжди можете вручну відновити нотатки та теги.", "notes_text_title": "Текстовий файл нотаток", "notes_text_info": "Ви можете експортувати свої нотатки у текстовому файлі.", "notes_text_cta": "Експорт Текстового файлу нотаток", "notes_text_filename": "My_Bible_Log_Notes_Export_{today}.txt", "notes_json_title": "JSON-файл нотаток", "notes_json_info": "Ви також можете експортувати свої нотатки у форматі JSON.", "notes_json_cta": "Експорт JSON-файлу нотаток", "notes_json_filename": "My_Bible_Log_Notes_Export_{today}.json", "notes_export_title": "Експорт нотаток My Bible Log", "notes_export_heading_notes": "НОТАТКИ", "notes_export_heading_tags": "ТЕГИ", "notes_export_heading_passages": "ВІРШІ" }
}
</i18n>
