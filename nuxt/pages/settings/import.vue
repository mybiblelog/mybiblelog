<template>
  <div>
    <h2 class="mbl-title mbl-title--4">
      {{ $t('import') }}
    </h2>
    <p>{{ $t('you_can_import_a_csv') }}</p>
    <div class="mbl-file-block">
      <label class="mbl-file">
        <input class="mbl-file__input" type="file" multiple="multiple" data-testid="import-file-input" @change="uploadCSVFilesChange">
        <span class="mbl-file__cta">
          <span class="mbl-file__text">{{ $t('choose_a_file') }}</span>
        </span>
      </label>
    </div>
    <hr>
    <div v-if="showLookBackDateResetMessage" class="mbl-message mbl-message--info">
      <div class="mbl-message__body">
        <p>{{ $t('messaging.look_back_date_reset_message.1') }}</p>
        <p>{{ $t('messaging.look_back_date_reset_message.2', { lookBackDate: displayDate(userSettings.lookBackDate, $i18n.locale) }) }}</p>
        <div class="mbl-button-group">
          <button class="mbl-button mbl-button--primary" @click="updateLookBackDate">
            {{ $t('messaging.update_look_back_date_yes') }}
          </button>
          <button class="mbl-button" @click="() => showLookBackDateResetMessage = false">
            {{ $t('messaging.update_look_back_date_no') }}
          </button>
        </div>
      </div>
    </div>
    <h3 class="mbl-title mbl-title--5">
      {{ $t('log_import_progress') }}
    </h3>
    <table class="mbl-table mbl-table--full">
      <thead>
        <tr>
          <th>{{ $t('date') }}</th>
          <th>{{ $t('passage') }}</th>
          <th>{{ $t('status') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!importLogEntries.length">
          <td colspan="3">
            {{ $t('no_log_entries_to_show') }}
          </td>
        </tr>
        <tr v-for="entry in importLogEntries" :key="entry.id" data-testid="import-row">
          <td>{{ entry.date }}</td>
          <td>
            <span v-if="entry.startVerseId !== null">
              {{ displayVerseRange(entry.startVerseId, entry.endVerseId) }}
            </span>
            <span v-else>{{ entry.verseRange }}</span>
          </td>
          <td data-testid="import-row-status">
            {{ entry.status }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
// Import csv-parse directly: the `csv` meta-package also loads csv-generate,
// which crashes in strict-mode browser bundles ("Generator is not defined").
import parse from 'csv-parse';
import dayjs from 'dayjs';
import { Bible, displayDate } from '@mybiblelog/shared';
import { useToastStore } from '~/stores/toast';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useUserSettingsStore } from '~/stores/user-settings';
import { useAppInitStore } from '~/stores/app-init';

const delimiter = ',';

export default {
  name: 'ImportPage',
  middleware: ['auth'],
  data() {
    return {
      logEntryUploadFormData: null,
      importLogEntries: [],

      earliestLogEntryDate: null,
      showLookBackDateResetMessage: false,
    };
  },
  async fetch() {
    await useAppInitStore().loadUserData();
  },
  head() {
    return {
      meta: [
        { hid: 'robots', name: 'robots', content: 'noindex' },
      ],
    };
  },
  computed: {
    logEntriesStore() {
      return useLogEntriesStore();
    },
    logEntries() {
      return this.logEntriesStore.logEntries;
    },
    activeLocale() {
      return this.$i18n.locales.find(locale => locale.code === this.$i18n.locale).name;
    },
    userSettings() {
      return useUserSettingsStore().settings;
    },
  },
  methods: {
    displayDate,
    displayVerseRange(startVerseId, endVerseId) {
      return Bible.displayVerseRange(startVerseId, endVerseId, this.$i18n.locale);
    },
    readFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('load', (event) => {
          resolve(event.target.result);
        });
        reader.addEventListener('error', reject);
        reader.readAsText(file);
      });
    },
    parseCsv(csvText) {
      return new Promise((resolve, reject) => {
        const parser = parse({ delimiter });
        const output = [];
        parser.on('readable', () => {
          let record;
          while (record = parser.read()) { // eslint-disable-line
            output.push(record);
          }
        });
        parser.on('error', reject);
        parser.on('end', () => resolve(output));
        parser.write(csvText);
        parser.end();
      });
    },
    async parseCsvToLogEntries(csvText) {
      // If unable to parse CSV, return empty array (indicates error)
      let csvRows;
      try {
        csvRows = await this.parseCsv(csvText);
      }
      catch (err) {
        return [];
      }

      const logEntries = csvRows.map((row) => {
        const [inputDate, verseRange] = row;
        let date = inputDate;

        // If date is invalid, set to null (indicates error)
        if (!dayjs(date, 'YYYY-MM-DD', true).isValid()) {
          date = null;
        }

        // If passage is invalid, set to null (indicates error)
        let startVerseId, endVerseId, status;
        try {
          const parsed = Bible.parseVerseRange(verseRange, this.$i18n.locale);
          startVerseId = parsed.startVerseId;
          endVerseId = parsed.endVerseId;
          status = this.$t('log_entry_status.to_do');
        }
        catch (err) {
          startVerseId = null;
          endVerseId = null;
          status = this.$t('log_entry_status.invalid');
        }
        return { date, startVerseId, endVerseId, status, verseRange };
      });

      return logEntries;
    },
    async createLogEntries() {
      // ensure the log entry is not yet created
      for (const newLogEntry of this.importLogEntries) {
        if (newLogEntry.status === this.$t('log_entry_status.invalid')) {
          // skip invalid log entries
          continue;
        }
        newLogEntry.status = this.$t('log_entry_status.checking');
        const existingLogEntry = this.logEntries.find((existingLogEntry) => {
          return (
            existingLogEntry.date === newLogEntry.date &&
            existingLogEntry.startVerseId === newLogEntry.startVerseId &&
            existingLogEntry.endVerseId === newLogEntry.endVerseId
          );
        });

        // Check date to see if it's before the earliest log entry date
        if (!this.earliestLogEntryDate || newLogEntry.date < this.earliestLogEntryDate) {
          this.earliestLogEntryDate = newLogEntry.date;
        }

        if (existingLogEntry) {
          newLogEntry.status = this.$t('log_entry_status.already_exists');
        }
        else {
          newLogEntry.status = this.$t('log_entry_status.importing_now');
          await this.logEntriesStore.createLogEntry({
            date: newLogEntry.date,
            startVerseId: newLogEntry.startVerseId,
            endVerseId: newLogEntry.endVerseId,
          });
          newLogEntry.status = this.$t('log_entry_status.imported');
        }
      }
    },
    async uploadCSVFilesChange(event) {
      const toastStore = useToastStore();
      const files = event.target.files;
      if (!files.length) { return; }

      // parse all CSV file uploads into log entries
      this.importLogEntries = [];
      for (const file of files) {
        if (file.type && !file.type.includes('csv')) {
          toastStore.add({
            type: 'error',
            text: this.$t('messaging.file_not_a_csv', { filename: file.name, filetype: file.type }),
          });
          return;
        }
        const textContent = await this.readFile(file);
        await this.parseCsvToLogEntries(textContent)
          .then((fileLogEntries) => {
            if (!fileLogEntries.length) {
              throw new Error(' ');
            }
            return fileLogEntries;
          })
          .then(fileLogEntries => this.importLogEntries.push(...fileLogEntries))
          .catch(() => {
            toastStore.add({
              type: 'error',
              text: this.$t('messaging.unable_to_parse_file', { filename: file.name }),
            });
          });
      }

      // Ensure there were valid entries
      if (!this.importLogEntries.length) {
        toastStore.add({
          type: 'error',
          text: this.$t('messaging.unable_to_parse_any_log_entries'),
        });
        return;
      }

      await this.createLogEntries()
        .then(() => {
          toastStore.add({
            type: 'success',
            text: this.$t('messaging.successfully_processed_log_entries', { count: this.importLogEntries.length }),
          });

          if (this.earliestLogEntryDate && this.earliestLogEntryDate < this.userSettings.lookBackDate) {
            this.showLookBackDateResetMessage = true;
          }
        })
        .catch(() => {
          toastStore.add({
            type: 'error',
            text: this.$t('messaging.there_was_a_problem_creating_the_log_entries'),
          });
        });
    },
    async updateLookBackDate() {
      const toastStore = useToastStore();
      await useUserSettingsStore().updateSettings({ lookBackDate: this.earliestLogEntryDate });
      toastStore.add({
        type: 'success',
        text: this.$t('messaging.look_back_date_updated_successfully'),
      });
      this.showLookBackDateResetMessage = false;
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
    "import": "Import",
    "you_can_import_a_csv": "You can import a reading log CSV file to My Bible Log.",
    "choose_a_file": "Choose a file...",
    "log_import_progress": "Log Import Progress",
    "date": "Date",
    "passage": "Passage",
    "status": "Status",
    "no_log_entries_to_show": "No log entries to show.",
    "log_entry_status": {
      "invalid": "Invalid",
      "to_do": "To Do",
      "checking": "Checking",
      "already_exists": "Already Exists",
      "importing_now": "Importing Now",
      "imported": "Imported"
    },
    "messaging": {
      "file_not_a_csv": "File {filename} is not in CSV format. It is {filetype}.",
      "unable_to_parse_file": "Unable to parse file {filename}. Make sure the format is correct.",
      "unable_to_parse_any_log_entries": "Unable to parse any log entries from uploaded files.",
      "successfully_processed_log_entries": "Successfully processed {count} log entries.",
      "there_was_a_problem_creating_the_log_entries": "There was a problem creating the log entries.",
      "look_back_date_reset_message": {
        "1": "Your imported file includes log entries before your Look Back Date. Most pages will ignore these entries when showing your progress.",
        "2": "Would you like to update your Look Back Date to {lookBackDate} to include these entries?"
      },
      "update_look_back_date_yes": "Update Look Back Date",
      "update_look_back_date_no": "Keep Current Look Back Date",
      "look_back_date_updated_successfully": "Look back date updated successfully."
    }
  },
  "de": {
    "import": "Import",
    "you_can_import_a_csv": "Sie können ein CSV-Datei mit Journal-Einträgen in My Bible Log importieren.",
    "choose_a_file": "Datei auswählen...",
    "log_import_progress": "Journal-Import-Fortschritt",
    "date": "Datum",
    "passage": "Passage",
    "status": "Status",
    "no_log_entries_to_show": "Keine Journal-Einträge zum Anzeigen.",
    "log_entry_status": {
      "invalid": "Ungültig",
      "to_do": "Zu tun",
      "checking": "Überprüfen",
      "already_exists": "Bereits vorhanden",
      "importing_now": "Wird importiert",
      "imported": "Importiert"
    },
    "messaging": {
      "file_not_a_csv": "Die Datei {filename} ist nicht im CSV-Format. Es ist {filetype}.",
      "unable_to_parse_file": "Die Datei {filename} kann nicht analysiert werden. Stellen Sie sicher, dass das Format korrekt ist.",
      "unable_to_parse_any_log_entries": "Die Journal-Einträge aus den hochgeladenen Dateien können nicht analysiert werden.",
      "successfully_processed_log_entries": "Erfolgreich verarbeitet {count} Journal-Einträge.",
      "there_was_a_problem_creating_the_log_entries": "Es gab ein Problem beim Erstellen der Journal-Einträge.",
      "look_back_date_reset_message": {
        "1": "Ihre importierte Datei enthält Journal-Einträge vor Ihrem Rückblickdatum. Die meisten Seiten werden diese Einträge beim Anzeigen Ihres Fortschritts ignorieren.",
        "2": "Möchten Sie Ihr Rückblickdatum auf {lookBackDate} aktualisieren, um diese Einträge zu berücksichtigen?"
      },
      "update_look_back_date_yes": "Rückblickdatum aktualisieren",
      "update_look_back_date_no": "Aktuelles Rückblickdatum beibehalten",
      "look_back_date_updated_successfully": "Rückblickdatum erfolgreich aktualisiert."
    }
  },
  "es": {
    "import": "Importar",
    "you_can_import_a_csv": "Puede importar un archivo CSV de registro de lectura a My Bible Log.",
    "choose_a_file": "Elija un archivo...",
    "log_import_progress": "Progreso de importación de registro",
    "date": "Fecha",
    "passage": "Pasaje",
    "status": "Estado",
    "no_log_entries_to_show": "No hay entradas de registro para mostrar.",
    "log_entry_status": {
      "invalid": "Inválido",
      "to_do": "Por Hacer",
      "checking": "Comprobando",
      "already_exists": "Ya Existe",
      "importing_now": "Importando Ahora",
      "imported": "Importado"
    },
    "messaging": {
      "file_not_a_csv": "El archivo {filename} no está en formato CSV. Es {filetype}.",
      "unable_to_parse_file": "No se puede analizar el archivo {filename}. Asegúrese de que el formato sea correcto.",
      "unable_to_parse_any_log_entries": "No se pueden analizar las entradas de registro de los archivos cargados.",
      "successfully_processed_log_entries": "Se procesaron correctamente {count} entradas de registro.",
      "there_was_a_problem_creating_the_log_entries": "Hubo un problema al crear las entradas de registro.",
      "look_back_date_reset_message": {
        "1": "Su archivo importado incluye entradas de registro anteriores a su Fecha de Retroceso. La mayoría de las páginas ignorarán estas entradas al mostrar su progreso.",
        "2": "¿Le gustaría actualizar su Fecha de Retroceso a {lookBackDate} para incluir estas entradas?"
      },
      "update_look_back_date_yes": "Actualizar Fecha de Retroceso",
      "update_look_back_date_no": "Mantener Fecha de Retroceso Actual",
      "look_back_date_updated_successfully": "Fecha de retroceso actualizada correctamente."
    }
  },
  "fr": {
    "import": "Importer",
    "you_can_import_a_csv": "Vous pouvez importer un fichier CSV de journal de lecture dans My Bible Log.",
    "choose_a_file": "Choisissez un fichier...",
    "log_import_progress": "Progression de l'importation du journal",
    "date": "Date",
    "passage": "Passage",
    "status": "Statut",
    "no_log_entries_to_show": "Aucune entrée de journal à afficher.",
    "log_entry_status": {
      "invalid": "Invalide",
      "to_do": "À faire",
      "checking": "Vérification",
      "already_exists": "Déjà Existant",
      "importing_now": "Importation en Cours",
      "imported": "Importé"
    },
    "messaging": {
      "file_not_a_csv": "Le fichier {filename} n'est pas au format CSV. Il est de type {filetype}.",
      "unable_to_parse_file": "Impossible d'analyser le fichier {filename}. Assurez-vous que le format est correct.",
      "unable_to_parse_any_log_entries": "Impossible d'analyser des entrées de journal à partir des fichiers téléchargés.",
      "successfully_processed_log_entries": "Traitement réussi de {count} entrées de journal.",
      "there_was_a_problem_creating_the_log_entries": "Un problème est survenu lors de la création des entrées de journal.",
      "look_back_date_reset_message": {
        "1": "Votre fichier importé contient des entrées de journal antérieures à votre Date de Rétrospection. La plupart des pages ignoreront ces entrées lors de l'affichage de votre progression.",
        "2": "Souhaitez-vous mettre à jour votre Date de Rétrospection à {lookBackDate} pour inclure ces entrées ?"
      },
      "update_look_back_date_yes": "Mettre à jour la Date de Rétrospection",
      "update_look_back_date_no": "Conserver la Date de Rétrospection Actuelle",
      "look_back_date_updated_successfully": "Date de rétrospection mise à jour avec succès."
    }
  },
  "ko": {
    "import": "불러오기",
    "you_can_import_a_csv": "읽기 기록 CSV 파일을 My Bible Log로 불러올 수 있습니다.",
    "choose_a_file": "파일 선택…",
    "log_import_progress": "불러오기 진행률",
    "date": "일자",
    "passage": "구절",
    "status": "비고",
    "no_log_entries_to_show": "표시할 읽기 기록이 없습니다.",
    "log_entry_status": {
      "invalid": "올바르지 않음",
      "to_do": "대기",
      "checking": "확인 중",
      "already_exists": "중복값 존재",
      "importing_now": "불러오는 중",
      "imported": "불러오기 완료"
    },
    "messaging": {
      "file_not_a_csv": "{filename} 파일은 CSV 형식이 아닙니다. {filetype} 형식입니다.",
      "unable_to_parse_file": "{filename} 파일을 해석할 수 없습니다. 형식이 올바른지 확인해주세요.",
      "unable_to_parse_any_log_entries": "업로드된 파일에서 읽기 기록을 찾을 수 없습니다.",
      "successfully_processed_log_entries": "{count}개의 읽기 기록을 처리했습니다.",
      "there_was_a_problem_creating_the_log_entries": "읽기 기록을 만드는 중 문제가 발생했습니다.",
      "look_back_date_reset_message": {
        "1": "불러온 파일에 기준 시작일 이전 기록이 포함되어 있습니다. 대부분의 페이지에서는 해당 기록이 진도에 반영되지 않습니다.",
        "2": "기준 시작일을 {lookBackDate}로 바꿔 해당 기록을 포함시킬까요?"
      },
      "update_look_back_date_yes": "기준 시작일 업데이트",
      "update_look_back_date_no": "현재 기준 시작일 유지",
      "look_back_date_updated_successfully": "기준 시작일이 업데이트되었습니다."
    }
  },
  "pt": {
    "import": "Import",
    "you_can_import_a_csv": "Você pode importar um arquivo CSV de registro de leitura para o My Bible Log.",
    "choose_a_file": "Escolha um arquivo...",
    "log_import_progress": "Progresso da importação de registros",
    "date": "Data",
    "passage": "Passagem",
    "status": "Status",
    "no_log_entries_to_show": "Nenhum registro para mostrar.",
    "log_entry_status": {
      "invalid": "Inválido",
      "to_do": "A fazer",
      "checking": "Verificando",
      "already_exists": "Já Existe",
      "importing_now": "Importando Agora",
      "imported": "Importado"
    },
    "messaging": {
      "file_not_a_csv": "O arquivo {filename} não está no formato CSV. É {filetype}.",
      "unable_to_parse_file": "Não é possível analisar o arquivo {filename}. Certifique-se de que o formato está correto.",
      "unable_to_parse_any_log_entries": "Não é possível analisar nenhuma entrada de log dos arquivos enviados.",
      "successfully_processed_log_entries": "Entradas de log processadas com sucesso: {count}.",
      "there_was_a_problem_creating_the_log_entries": "Houve um problema ao criar as entradas de log.",
      "look_back_date_reset_message": {
        "1": "Seu arquivo importado inclui entradas de log anteriores à sua Data de Retrocesso. A maioria das páginas ignorará essas entradas ao mostrar seu progresso.",
        "2": "Gostaria de atualizar sua Data de Retrocesso para {lookBackDate} para incluir essas entradas?"
      },
      "update_look_back_date_yes": "Atualizar Data de Retrocesso",
      "update_look_back_date_no": "Manter Data de Retrocesso Atual",
      "look_back_date_updated_successfully": "Data de retrocesso atualizada com sucesso."
    }
  },
  "uk": {
    "import": "Імпорт",
    "you_can_import_a_csv": "Ви можете імпортувати файл CSV журналу читання до My Bible Log.",
    "choose_a_file": "Виберіть файл...",
    "log_import_progress": "Прогрес імпорту журналу",
    "date": "Дата",
    "passage": "Пасаж",
    "status": "Статус",
    "no_log_entries_to_show": "Немає записів журналу для відображення.",
    "log_entry_status": {
      "invalid": "Недійсний",
      "to_do": "Зробити",
      "checking": "Перевірка",
      "already_exists": "Вже існує",
      "importing_now": "Імпорт зараз",
      "imported": "Імпортовано"
    },
    "messaging": {
      "file_not_a_csv": "Файл {filename} не у форматі CSV. Це {filetype}.",
      "unable_to_parse_file": "Не вдалося проаналізувати файл {filename}. Переконайтеся, що формат правильний.",
      "unable_to_parse_any_log_entries": "Не вдалося проаналізувати жодного запису журналу з завантажених файлів.",
      "successfully_processed_log_entries": "Успішно оброблено {count} записів журналу.",
      "there_was_a_problem_creating_the_log_entries": "Виникла проблема при створенні записів журналу.",
      "look_back_date_reset_message": {
        "1": "Ваш імпортований файл містить записи журналу до вашої Дати Огляду. Більшість сторінок ігноруватимуть ці записи під час відображення вашого прогресу.",
        "2": "Чи хочете ви оновити вашу Дату Огляду до {lookBackDate}, щоб включити ці записи?"
      },
      "update_look_back_date_yes": "Оновити Дату Огляду",
      "update_look_back_date_no": "Залишити Поточну Дату Огляду",
      "look_back_date_updated_successfully": "Дату огляду успішно оновлено."
    }
  }
}
</i18n>
