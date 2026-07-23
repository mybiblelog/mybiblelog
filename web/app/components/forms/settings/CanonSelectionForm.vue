<template>
  <div>
    <h2 class="mbl-title mbl-title--5">
      {{ t('start_page.canon.title') }}
    </h2>
    <div class="mbl-content">
      <p>
        {{ t('start_page.canon.description') }}
      </p>
    </div>

    <div class="option-cards">
      <!-- Protestant canon (66 books) -->
      <div
        class="option-card"
        :class="{ 'is-selected': selectedCanon === 'protestant' }"
        data-testid="start-canon-protestant"
        @click="selectedCanon = 'protestant'"
      >
        <div class="option-card-radio">
          <input v-model="selectedCanon" type="radio" value="protestant" @click.stop>
        </div>
        <div class="option-mbl-card__content">
          <div class="option-card-title">
            {{ t('start_page.canon.protestant.title') }}
          </div>
          <div class="option-card-details">
            <p class="option-card-subtitle">
              {{ t('start_page.canon.protestant.description') }}
            </p>
            <div class="detail-row">
              <span class="detail-label">{{ t('start_page.canon.total_verses') }}:</span>
              <span class="detail-value">{{ protestantVerseCount.toLocaleString(locale) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Full canon including deuterocanonical books -->
      <div
        class="option-card"
        :class="{ 'is-selected': selectedCanon === 'deuterocanonical' }"
        data-testid="start-canon-deuterocanonical"
        @click="selectedCanon = 'deuterocanonical'"
      >
        <div class="option-card-radio">
          <input v-model="selectedCanon" type="radio" value="deuterocanonical" @click.stop>
        </div>
        <div class="option-mbl-card__content">
          <div class="option-card-title">
            {{ t('start_page.canon.deuterocanonical.title') }}
          </div>
          <div class="option-card-details">
            <p class="option-card-subtitle">
              {{ t('start_page.canon.deuterocanonical.description') }}
            </p>
            <div class="detail-row">
              <span class="detail-label">{{ t('start_page.canon.total_verses') }}:</span>
              <span class="detail-value">{{ deuterocanonicalVerseCount.toLocaleString(locale) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="mbl-help mbl-help--danger">
      {{ error }}
    </div>

    <div class="mbl-content">
      <p class="mbl-help">
        {{ t('start_page.canon.change_hint') }}
      </p>
    </div>

    <div class="mbl-field">
      <div class="mbl-control mbl-button-group">
        <button class="mbl-button" :disabled="isSaving" @click="handlePrevious">
          {{ previousButtonText }}
        </button>
        <button class="mbl-button mbl-button--primary" data-testid="start-canon-next" :disabled="isSaving" @click="handleSubmit">
          {{ nextButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bible } from '@mybiblelog/shared';
import { useUserSettingsStore } from '~/stores/user-settings';

type Canon = 'protestant' | 'deuterocanonical';

const props = withDefaults(defineProps<{
  initialValue?: boolean;
  nextButtonText?: string;
  previousButtonText?: string;
  showToast?: boolean;
}>(), {
  initialValue: false,
  nextButtonText: 'Save and Continue',
  previousButtonText: 'Back',
  showToast: true,
});

const emit = defineEmits<{
  next: [];
  previous: [];
  saved: [value: boolean];
}>();

const { t, locale } = useI18n();

const selectedCanon = ref<Canon>(props.initialValue ? 'deuterocanonical' : 'protestant');

// Total verses per canon, so the reader sees how their choice changes the
// amount of Scripture their progress is measured against.
const protestantVerseCount = Bible.getTotalVerseCount(false);
const deuterocanonicalVerseCount = Bible.getTotalVerseCount(true);

const { isSaving, error, submit: handleSubmit } = useSettingsWizardStep({
  save: () => useUserSettingsStore().updateSettings({
    includeDeuterocanonical: selectedCanon.value === 'deuterocanonical',
  }),
  successMessage: () => t('messaging.canon_saved_successfully'),
  errorMessage: () => t('messaging.unable_to_save_canon'),
  showToast: () => props.showToast,
  onSuccess: () => {
    emit('saved', selectedCanon.value === 'deuterocanonical');
    emit('next');
  },
});

watch(() => props.initialValue, (value) => {
  selectedCanon.value = value ? 'deuterocanonical' : 'protestant';
});

function handlePrevious() {
  emit('previous');
}
</script>

<style scoped>
.option-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.option-card {
  display: flex;
  align-items: flex-start;
  border: 2px solid var(--mbl-border);
  border-radius: 4px;
  padding: 1rem;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}

.option-card:hover {
  border-color: var(--mbl-secondary);
  background-color: var(--mbl-bg-muted);
}

.option-card.is-selected {
  border-color: var(--mbl-secondary);
  background-color: var(--mbl-message-info-bg);
}

.option-card-radio {
  margin-right: 1rem;
  margin-top: 0.25rem;
  flex-shrink: 0;
}

.option-card-radio input[type="radio"] {
  cursor: pointer;
}

.option-mbl-card__content {
  flex: 1;
  min-width: 0;
}

.option-card-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.option-card-subtitle {
  margin-bottom: 0.75rem;
  color: var(--mbl-text-subtle);
  font-size: 0.9rem;
}

.option-card-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.detail-label {
  font-weight: 500;
  min-width: fit-content;
}

.detail-value {
  color: var(--secondary-color);
  font-weight: 600;
}
</style>

<i18n lang="json">
{
  "en": {
    "start_page": {
      "canon": {
        "title": "Choose Your Canon",
        "description": "Which books of the Bible would you like to track? This determines the books shown and the total amount of Scripture your progress is measured against.",
        "total_verses": "Total verses",
        "protestant": {
          "title": "Protestant (66 books)",
          "description": "The 66 books of the Protestant canon, from Genesis to Revelation."
        },
        "deuterocanonical": {
          "title": "Include deuterocanonical books",
          "description": "Adds the deuterocanonical (apocryphal) books among the Old Testament books, following the NRSVUE order."
        },
        "change_hint": "You can change this setting at any time."
      }
    },
    "messaging": {
      "canon_saved_successfully": "Canon saved successfully.",
      "unable_to_save_canon": "Unable to save."
    }
  },
  "de": {
    "start_page": {
      "canon": {
        "title": "Wählen Sie Ihren Kanon",
        "description": "Welche Bücher der Bibel möchten Sie verfolgen? Dies bestimmt die angezeigten Bücher und die Gesamtmenge der Schrift, an der Ihr Fortschritt gemessen wird.",
        "total_verses": "Verse insgesamt",
        "protestant": {
          "title": "Protestantisch (66 Bücher)",
          "description": "Die 66 Bücher des protestantischen Kanons, von Genesis bis Offenbarung."
        },
        "deuterocanonical": {
          "title": "Deuterokanonische Bücher einschließen",
          "description": "Fügt die deuterokanonischen (apokryphen) Bücher gemäß der NRSVUE-Reihenfolge zwischen die Bücher des Alten Testaments ein."
        },
        "change_hint": "Sie können diese Einstellung jederzeit ändern."
      }
    },
    "messaging": {
      "canon_saved_successfully": "Kanon erfolgreich gespeichert.",
      "unable_to_save_canon": "Nicht gespeichert."
    }
  },
  "es": {
    "start_page": {
      "canon": {
        "title": "Elija Su Canon",
        "description": "¿Qué libros de la Biblia le gustaría seguir? Esto determina los libros que se muestran y la cantidad total de Escritura con la que se mide su progreso.",
        "total_verses": "Versículos totales",
        "protestant": {
          "title": "Protestante (66 libros)",
          "description": "Los 66 libros del canon protestante, de Génesis a Apocalipsis."
        },
        "deuterocanonical": {
          "title": "Incluir libros deuterocanónicos",
          "description": "Agrega los libros deuterocanónicos (apócrifos) entre los libros del Antiguo Testamento, siguiendo el orden de la NRSVUE."
        },
        "change_hint": "Puede cambiar esta configuración en cualquier momento."
      }
    },
    "messaging": {
      "canon_saved_successfully": "Canon guardado con éxito.",
      "unable_to_save_canon": "No se puede guardar."
    }
  },
  "fr": {
    "start_page": {
      "canon": {
        "title": "Choisissez Votre Canon",
        "description": "Quels livres de la Bible souhaitez-vous suivre ? Cela détermine les livres affichés et la quantité totale d'Écriture par rapport à laquelle votre progression est mesurée.",
        "total_verses": "Total des versets",
        "protestant": {
          "title": "Protestant (66 livres)",
          "description": "Les 66 livres du canon protestant, de la Genèse à l'Apocalypse."
        },
        "deuterocanonical": {
          "title": "Inclure les livres deutérocanoniques",
          "description": "Ajoute les livres deutérocanoniques (apocryphes) parmi les livres de l'Ancien Testament, selon l'ordre de la NRSVUE."
        },
        "change_hint": "Vous pouvez modifier ce paramètre à tout moment."
      }
    },
    "messaging": {
      "canon_saved_successfully": "Canon enregistré avec succès.",
      "unable_to_save_canon": "Impossible d'enregistrer."
    }
  },
  "ko": {
    "start_page": {
      "canon": {
        "title": "정경 선택",
        "description": "성경의 어떤 책을 추적하시겠습니까? 이 선택은 표시되는 책과 진도를 측정하는 성경 전체 분량을 결정합니다.",
        "total_verses": "전체 구절 수",
        "protestant": {
          "title": "개신교 (66권)",
          "description": "창세기부터 요한계시록까지 개신교 정경 66권입니다."
        },
        "deuterocanonical": {
          "title": "제2경전 포함",
          "description": "NRSVUE 순서에 따라 구약 책들 사이에 제2경전(외경)을 추가합니다."
        },
        "change_hint": "이 설정은 언제든지 바꿀 수 있습니다."
      }
    },
    "messaging": {
      "canon_saved_successfully": "정경이 저장되었습니다.",
      "unable_to_save_canon": "저장할 수 없습니다."
    }
  },
  "pt": {
    "start_page": {
      "canon": {
        "title": "Escolha Seu Cânon",
        "description": "Quais livros da Bíblia você gostaria de acompanhar? Isso determina os livros exibidos e a quantidade total de Escritura com a qual seu progresso é medido.",
        "total_verses": "Total de versículos",
        "protestant": {
          "title": "Protestante (66 livros)",
          "description": "Os 66 livros do cânon protestante, de Gênesis a Apocalipse."
        },
        "deuterocanonical": {
          "title": "Incluir livros deuterocanônicos",
          "description": "Adiciona os livros deuterocanônicos (apócrifos) entre os livros do Antigo Testamento, seguindo a ordem da NRSVUE."
        },
        "change_hint": "Você pode alterar esta configuração a qualquer momento."
      }
    },
    "messaging": {
      "canon_saved_successfully": "Cânon salvo com sucesso.",
      "unable_to_save_canon": "Não foi possível salvar."
    }
  },
  "uk": {
    "start_page": {
      "canon": {
        "title": "Виберіть свій канон",
        "description": "Які книги Біблії ви хочете відстежувати? Це визначає, які книги показуються та загальний обсяг Писання, за яким вимірюється ваш прогрес.",
        "total_verses": "Усього віршів",
        "protestant": {
          "title": "Протестантський (66 книг)",
          "description": "66 книг протестантського канону, від Буття до Об'явлення."
        },
        "deuterocanonical": {
          "title": "Включити второканонічні книги",
          "description": "Додає второканонічні (апокрифічні) книги серед книг Старого Завіту за порядком NRSVUE."
        },
        "change_hint": "Ви можете змінити це налаштування в будь-який час."
      }
    },
    "messaging": {
      "canon_saved_successfully": "Канон успішно збережено.",
      "unable_to_save_canon": "Не вдалося зберегти."
    }
  }
}
</i18n>
