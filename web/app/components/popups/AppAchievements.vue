<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="achievement.open" class="mbl-popup-modal" data-testid="achievements-modal">
        <div class="mbl-popup-modal__card" role="dialog">
          <div class="star-container">
            <div class="star-wrapper" :class="{ 'star-stamped': starStamped }">
              <shimmer-star-icon width="64px" height="64px" />
            </div>
            <particle-burst :delay-ms="BURST_DELAY_MS" spin>
              <star-icon width="32px" height="32px" fill="var(--mbl-message-info-accent)" />
            </particle-burst>
          </div>
          <div class="mbl-title mbl-title--4 mbl-text-center">
            {{ achievementTitle }}
          </div>
          <div class="mbl-content mbl-text-center app-achievements__message">
            <p>{{ achievementMessage }}</p>
          </div>
          <div class="mbl-button-group mbl-button-group--center">
            <button class="mbl-button mbl-button--primary" data-testid="achievements-ok" @click="_close">
              {{ t('ok') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Bible } from '@mybiblelog/shared';
import { ACHIEVEMENT, useAchievementsStore } from '~/stores/achievements';
import StarIcon from '~/components/svg/StarIcon.vue';
import ShimmerStarIcon from '~/components/svg/ShimmerStarIcon.vue';
import ParticleBurst from '~/components/ui/ParticleBurst.vue';

const { t, locale } = useI18n();
const achievement = useAchievementsStore();

const starStamped = ref(false);
let stampTimer: ReturnType<typeof setTimeout> | null = null;

// Timing constants below must stay in sync with the CSS transition/animation
// durations in the <style> block:
// - MODAL_ENTER_MS matches `--transition-modal` (0.3s, tokens.css) used by the popup's fade-in
// - BURST_DELAY_MS lands the particles ~halfway through `.star-wrapper`'s 0.5s transform transition
// The burst itself needs no timer: <particle-burst> mounts with the modal, sits
// invisible until BURST_DELAY_MS elapses, and unmounts when the modal closes.
const MODAL_ENTER_MS = 300;
const BURST_DELAY_MS = MODAL_ENTER_MS + 250;

const achievementTitle = computed(() => {
  if (achievement.achievementType === ACHIEVEMENT.BOOK_COMPLETE) {
    const bookName = Bible.getBookName(achievement.achievementData as number, locale.value);
    return t('achievement.book_complete.title', { bookName });
  }
  if (achievement.achievementType === ACHIEVEMENT.BIBLE_COMPLETE) {
    return t('achievement.bible_complete.title');
  }
  return '';
});

const achievementMessage = computed(() => {
  if (achievement.achievementType === ACHIEVEMENT.BOOK_COMPLETE) {
    const bookName = Bible.getBookName(achievement.achievementData as number, locale.value);
    return t('achievement.book_complete.message', { bookName });
  }
  if (achievement.achievementType === ACHIEVEMENT.BIBLE_COMPLETE) {
    return t('achievement.bible_complete.message');
  }
  return '';
});

const clearStampTimer = () => {
  if (stampTimer) {
    clearTimeout(stampTimer);
    stampTimer = null;
  }
};

watch(() => achievement.open, (isOpen) => {
  clearStampTimer();
  starStamped.value = false;

  if (isOpen) {
    // Wait for the modal enter animation to finish, then stamp the star.
    stampTimer = setTimeout(() => {
      starStamped.value = true;
      stampTimer = null;
    }, MODAL_ENTER_MS);
  }
});

onUnmounted(clearStampTimer);

const _close = () => {
  achievement.closeAchievement();
};
</script>

<style scoped>
.star-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: var(--mbl-space-md);
  height: 80px;
  overflow: visible;
}

.star-wrapper {
  position: relative;
  z-index: 2;
  transform: scale(2);
  opacity: 0;

  /* 0.5s transform duration — PARTICLE_TRIGGER_MS in <script> depends on this */
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 0.4s ease-out;
}

.star-wrapper.star-stamped {
  transform: scale(1);
  opacity: 1;
}

.app-achievements__message {
  margin-bottom: var(--mbl-space-md);
}
</style>

<i18n lang="json">
{
  "en": {
    "ok": "OK",
    "achievement": {
      "book_complete": {
        "title": "Book Complete!",
        "message": "Congratulations! You have completed {bookName}!"
      },
      "bible_complete": {
        "title": "Bible Complete!",
        "message": "🎉 Amazing! You have completed reading the entire Bible! 🎉"
      }
    }
  },
  "de": {
    "ok": "OK",
    "achievement": {
      "book_complete": {
        "title": "Buch abgeschlossen!",
        "message": "Glückwunsch! Sie haben {bookName} vollständig gelesen!"
      },
      "bible_complete": {
        "title": "Bibel abgeschlossen!",
        "message": "🎉 Unglaublich! Sie haben die gesamte Bibel gelesen! 🎉"
      }
    }
  },
  "es": {
    "ok": "OK",
    "achievement": {
      "book_complete": {
        "title": "¡Libro completado!",
        "message": "¡Felicitaciones! Has completado {bookName}!"
      },
      "bible_complete": {
        "title": "¡Biblia completada!",
        "message": "🎉 ¡Increíble! Has completado la lectura de toda la Biblia! 🎉"
      }
    }
  },
  "fr": {
    "ok": "D'accord",
    "achievement": {
      "book_complete": {
        "title": "Livre terminé!",
        "message": "Félicitations! Vous avez terminé {bookName}!"
      },
      "bible_complete": {
        "title": "Bible terminée!",
        "message": "🎉 Incroyable! Vous avez terminé de lire toute la Bible! 🎉"
      }
    }
  },
  "ko": {
    "ok": "확인",
    "achievement": {
      "book_complete": {
        "title": "한 권을 다 읽으셨네요!",
        "message": "축하드립니다! {bookName}을(를) 모두 읽으셨군요!"
      },
      "bible_complete": {
        "title": "성경을 다 읽으셨네요!",
        "message": "🎉 대단합니다! 성경 전체를 1독하셨군요! 🎉"
      }
    }
  },
  "pt": {
    "ok": "OK",
    "achievement": {
      "book_complete": {
        "title": "Livro completo!",
        "message": "Parabéns! Você completou {bookName}!"
      },
      "bible_complete": {
        "title": "Bíblia completa!",
        "message": "🎉 Incrível! Você completou a leitura de toda a Bíblia! 🎉"
      }
    }
  },
  "uk": {
    "ok": "OK",
    "achievement": {
      "book_complete": {
        "title": "Книга завершена!",
        "message": "Вітаємо! Ви завершили {bookName}!"
      },
      "bible_complete": {
        "title": "Біблія завершена!",
        "message": "🎉 Дивовижно! Ви завершили читання всієї Біблії! 🎉"
      }
    }
  }
}
</i18n>
