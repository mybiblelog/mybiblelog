<template>
  <div>
    <h2 class="mbl-title mbl-title--5">
      {{ $t('start_page.preferred_bible_version.title') }}
    </h2>

    <div class="mbl-box field-box">
      <div class="mbl-field">
        <label class="mbl-label">{{ $t('start_page.preferred_bible_version.translation_label') }}</label>
        <div class="mbl-control">
          <div class="mbl-select">
            <select v-model="preferredBibleVersion">
              <option value="" selected="selected" disabled="disabled">
                {{ $t('select_an_option') }}
              </option>
              <option
                v-for="option in bibleVersionOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.text }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="mbl-box field-box">
      <div class="mbl-field">
        <label class="mbl-label">{{ $t('start_page.preferred_bible_version.app_label') }}</label>
        <div class="mbl-control">
          <div class="mbl-select">
            <select v-model="preferredBibleApp">
              <option value="" selected="selected" disabled="disabled">
                {{ $t('select_an_option') }}
              </option>
              <option
                v-for="option in bibleAppOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.text }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="mbl-help mbl-help--danger">
      {{ error }}
    </div>

    <div class="mbl-content">
      <p class="mbl-help">
        {{ $t('start_page.preferred_bible_version.change_hint') }}
      </p>
    </div>

    <div class="mbl-field">
      <div class="mbl-control mbl-button-group">
        <button class="mbl-button" :disabled="isSaving" @click="handlePrevious">
          {{ previousButtonText }}
        </button>
        <button class="mbl-button mbl-button--primary" :disabled="isSaving || !preferredBibleVersion || !preferredBibleApp" @click="handleSubmit">
          {{ nextButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { bibleVersionOptions as allBibleVersionOptions, bibleAppOptions, localeVersionGroups } from '@mybiblelog/shared';
import { useToastStore } from '~/stores/toast';
import { useUserSettingsStore } from '~/stores/user-settings';

export default {
  name: 'PreferredBibleVersionForm',
  props: {
    initialValue: {
      type: String,
      default: '',
    },
    initialBibleApp: {
      type: String,
      default: '',
    },
    nextButtonText: {
      type: String,
      default: 'Save and Continue',
    },
    previousButtonText: {
      type: String,
      default: 'Back',
    },
    showToast: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      preferredBibleVersion: this.initialValue || '',
      preferredBibleApp: this.initialBibleApp || '',
      bibleAppOptions,
      error: '',
      isSaving: false,
    };
  },
  computed: {
    bibleVersionOptions() {
      const locale = this.$i18n?.locale || 'en';
      const group = localeVersionGroups[locale] || [];
      return [...allBibleVersionOptions].sort((a, b) => {
        const aLocal = group.includes(a.value);
        const bLocal = group.includes(b.value);
        if (aLocal === bLocal) { return 0; }
        return aLocal ? -1 : 1;
      });
    },
  },
  watch: {
    initialValue(newValue) {
      if (newValue) {
        this.preferredBibleVersion = newValue;
      }
    },
    initialBibleApp(newValue) {
      if (newValue) {
        this.preferredBibleApp = newValue;
      }
    },
  },
  methods: {
    handlePrevious() {
      this.$emit('previous');
    },
    async handleSubmit() {
      if (this.isSaving) {
        return;
      }
      this.error = '';

      if (!this.preferredBibleVersion) {
        this.error = this.$t('messaging.unable_to_save_preferred_bible_version');
        return;
      }

      if (!this.preferredBibleApp) {
        this.error = this.$t('messaging.unable_to_save_preferred_bible_app');
        return;
      }

      this.isSaving = true;
      const success = await useUserSettingsStore().updateSettings({
        preferredBibleVersion: this.preferredBibleVersion,
        preferredBibleApp: this.preferredBibleApp,
      });

      if (success) {
        if (this.showToast) {
          const toastStore = useToastStore();
          toastStore.add({
            type: 'success',
            text: this.$t('messaging.preferred_bible_settings_saved_successfully'),
          });
        }
        this.$emit('saved', {
          preferredBibleVersion: this.preferredBibleVersion,
          preferredBibleApp: this.preferredBibleApp,
        });
        this.$emit('next');
      }
      else {
        this.error = this.$t('messaging.unable_to_save_preferred_bible_settings');
      }

      this.isSaving = false;
    },
  },
};
</script>

<style scoped>
.field-box {
  margin-bottom: 1.5rem;
}

.field-box .label {
  font-weight: normal;
  margin-bottom: 0.75rem;
}

select {
  max-width: 65vw;
}
</style>

<i18n lang="json">
{
  "en": {
    "start_page": {
      "preferred_bible_version": {
        "title": "Bible Settings",
        "translation_label": "When I open the Bible from My Bible Log, I want to read this translation:",
        "app_label": "When I open a passage from My Bible Log, I want it to open in this app or website:",
        "change_hint": "You can change these settings at any time."
      }
    },
    "select_an_option": "Select an Option",
    "messaging": {
      "preferred_bible_settings_saved_successfully": "Bible settings saved successfully.",
      "unable_to_save_preferred_bible_settings": "Unable to save.",
      "unable_to_save_preferred_bible_version": "Unable to save.",
      "unable_to_save_preferred_bible_app": "Unable to save."
    }
  },
  "de": {
    "start_page": {
      "preferred_bible_version": {
        "title": "Bibel-Einstellungen",
        "translation_label": "Wenn ich die Bibel von My Bible Log öffne, möchte ich diese Übersetzung lesen:",
        "app_label": "Wenn ich eine Passage von My Bible Log öffne, möchte ich, dass sie in dieser App oder Website geöffnet wird:",
        "change_hint": "Sie können diese Einstellungen jederzeit ändern."
      }
    },
    "select_an_option": "Eine Option auswählen",
    "messaging": {
      "preferred_bible_settings_saved_successfully": "Bibel-Einstellungen erfolgreich gespeichert.",
      "unable_to_save_preferred_bible_settings": "Nicht gespeichert.",
      "unable_to_save_preferred_bible_version": "Nicht gespeichert.",
      "unable_to_save_preferred_bible_app": "Nicht gespeichert."
    }
  },
  "es": {
    "start_page": {
      "preferred_bible_version": {
        "title": "Configuración de la Biblia",
        "translation_label": "Cuando abro la Biblia desde My Bible Log, quiero leer esta traducción:",
        "app_label": "Cuando abro un pasaje desde My Bible Log, quiero que se abra en esta aplicación o sitio web:",
        "change_hint": "Puede cambiar esta configuración en cualquier momento."
      }
    },
    "select_an_option": "Seleccionar una opción",
    "messaging": {
      "preferred_bible_settings_saved_successfully": "Configuración de la Biblia guardada con éxito.",
      "unable_to_save_preferred_bible_settings": "No se puede guardar.",
      "unable_to_save_preferred_bible_version": "No se puede guardar.",
      "unable_to_save_preferred_bible_app": "No se puede guardar."
    }
  },
  "fr": {
    "start_page": {
      "preferred_bible_version": {
        "title": "Paramètres de la Bible",
        "translation_label": "Lorsque j'ouvre la Bible depuis My Bible Log, je veux lire cette traduction :",
        "app_label": "Lorsque j'ouvre un passage depuis My Bible Log, je veux qu'il s'ouvre dans cette application ou ce site web :",
        "change_hint": "Vous pouvez modifier ces paramètres à tout moment."
      }
    },
    "select_an_option": "Sélectionner une option",
    "messaging": {
      "preferred_bible_settings_saved_successfully": "Paramètres de la Bible enregistrés avec succès.",
      "unable_to_save_preferred_bible_settings": "Impossible d'enregistrer.",
      "unable_to_save_preferred_bible_version": "Impossible d'enregistrer.",
      "unable_to_save_preferred_bible_app": "Impossible d'enregistrer."
    }
  },
  "ko": {
    "start_page": {
      "preferred_bible_version": {
        "title": "성경 설정",
        "translation_label": "My Bible Log에서 성경을 열 때, 이 번역본으로 읽고 싶습니다:",
        "app_label": "My Bible Log에서 성경 구절을 열 때 이 앱 또는 성경 사이트에서 열고 싶습니다:",
        "change_hint": "이 설정은 언제든지 바꿀 수 있습니다."
      }
    },
    "select_an_option": "옵션 선택",
    "messaging": {
      "preferred_bible_settings_saved_successfully": "성경 설정이 저장되었습니다.",
      "unable_to_save_preferred_bible_settings": "저장할 수 없습니다.",
      "unable_to_save_preferred_bible_version": "저장할 수 없습니다.",
      "unable_to_save_preferred_bible_app": "저장할 수 없습니다."
    }
  },
  "pt": {
    "start_page": {
      "preferred_bible_version": {
        "title": "Configurações da Bíblia",
        "translation_label": "Quando abro a Bíblia do My Bible Log, quero ler esta tradução:",
        "app_label": "Quando abro uma passagem do My Bible Log, quero que ela abra neste aplicativo ou site:",
        "change_hint": "Você pode alterar essas configurações a qualquer momento."
      }
    },
    "select_an_option": "Selecionar uma Opção",
    "messaging": {
      "preferred_bible_settings_saved_successfully": "Configurações da Bíblia salvas com sucesso.",
      "unable_to_save_preferred_bible_settings": "Não é possível salvar.",
      "unable_to_save_preferred_bible_version": "Não é possível salvar.",
      "unable_to_save_preferred_bible_app": "Não é possível salvar."
    }
  },
  "uk": {
    "start_page": {
      "preferred_bible_version": {
        "title": "Налаштування Біблії",
        "translation_label": "Коли я відкриваю Біблію з My Bible Log, я хочу читати цей переклад:",
        "app_label": "Коли я відкриваю уривок з My Bible Log, я хочу, щоб він відкрився в цій програмі або на веб-сайті:",
        "change_hint": "Ви можете змінити ці налаштування в будь-який час."
      }
    },
    "select_an_option": "Вибрати опцію",
    "messaging": {
      "preferred_bible_settings_saved_successfully": "Налаштування Біблії успішно збережено.",
      "unable_to_save_preferred_bible_settings": "Не вдалося зберегти.",
      "unable_to_save_preferred_bible_version": "Не вдалося зберегти.",
      "unable_to_save_preferred_bible_app": "Не вдалося зберегти."
    }
  }
}
</i18n>
