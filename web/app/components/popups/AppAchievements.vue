<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="achievement.open" class="mbl-popup-modal" data-testid="achievements-modal">
        <div class="mbl-popup-modal__card" role="dialog">
          <div class="star-container">
            <div class="star-wrapper" :class="{ 'star-stamped': starStamped }">
              <shimmer-star-icon width="64px" height="64px" />
            </div>
            <div
              v-for="(particle, index) in particles"
              :key="index"
              class="particle"
              :style="particle.style"
            >
              <star-icon width="32px" height="32px" fill="var(--mbl-message-info-accent)" />
            </div>
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

type Particle = { style: Record<string, string> };

const { t, locale } = useI18n();
const achievement = useAchievementsStore();

const starStamped = ref(false);
const particles = ref<Particle[]>([]);

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

const createParticles = () => {
  const particleCount = 7;
  const created: Particle[] = [];

  for (let i = 0; i < particleCount; i++) {
    // Random angle for particle direction
    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
    // Random distance (80-120px)
    const distance = 60 + Math.random() * 20;
    // Calculate x and y positions
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    // Random delay (0-100ms)
    const delay = Math.random() * 100;
    // Random rotation speed
    const rotationSpeed = (Math.random() - 0.5) * 720; // -360 to +360 degrees

    created.push({
      style: {
        '--x': `${x}px`,
        '--y': `${y}px`,
        '--delay': `${delay}ms`,
        '--rotation': `${rotationSpeed}deg`,
      },
    });
  }

  particles.value = created;

  // Clean up particles after animation completes
  setTimeout(() => {
    particles.value = [];
  }, 1500);
};

watch(() => achievement.open, (isOpen) => {
  if (isOpen) {
    // Reset animation state
    starStamped.value = false;
    particles.value = [];

    // Wait for modal enter animation to complete (0.3s), then start star animation
    setTimeout(() => {
      starStamped.value = true;

      // After star stamp animation is far enough along (0.3s of 0.5s), trigger particles
      setTimeout(() => {
        createParticles();
      }, 250);
    }, 300);
  }
  else {
    // Clean up when modal closes
    starStamped.value = false;
    particles.value = [];
  }
});

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
  margin-bottom: 1rem;
  height: 80px;
  overflow: visible;
}

.star-wrapper {
  position: relative;
  z-index: 2;
  transform: scale(2);
  opacity: 0;
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 0.4s ease-out;
}

.star-wrapper.star-stamped {
  transform: scale(1);
  opacity: 1;
}

.particle {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  transform: translate(-50%, -50%);
  opacity: 0;
  animation: particle-fly 1s var(--delay) ease-out forwards;
}

@keyframes particle-fly {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) translate(0, 0) rotate(0deg) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%)
              translate(var(--x), var(--y))
              rotate(var(--rotation))
              scale(0.3);
  }
}

.app-achievements__message {
  margin-bottom: 1rem;
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
