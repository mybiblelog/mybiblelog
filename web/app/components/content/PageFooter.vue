<template>
  <footer v-if="columns.length > 0" class="page-footer">
    <div class="footer-container">
      <nav class="footer-nav">
        <div class="footer-columns">
          <ul
            v-for="(column, columnIndex) in columns"
            :key="columnIndex"
            class="footer-column"
          >
            <li v-for="(link, linkIndex) in column" :key="linkIndex" class="footer-link-item">
              <component
                :is="isExternal(link.destination) ? 'a' : NuxtLink"
                :href="isExternal(link.destination) ? link.destination : undefined"
                :to="isExternal(link.destination) ? undefined : localePath(link.destination)"
                :target="isExternal(link.destination) ? '_blank' : undefined"
                :rel="isExternal(link.destination) ? 'noopener noreferrer' : undefined"
                class="footer-link"
              >
                {{ link.text }}
              </component>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components';

const { t } = useI18n();
const localePath = useLocalePath();

const columns = computed(() => [
  [
    { text: t('home'), destination: '/' },
    { text: t('faq'), destination: '/faq' },
  ],
  [
    { text: t('give_feedback'), destination: '/feedback' },
    { text: t('contribute'), destination: '/contribute' },
  ],
  [
    { text: t('donate_ko_fi'), destination: 'https://ko-fi.com/mybiblelog' },
    { text: t('code_on_github'), destination: 'https://github.com/mybiblelog/mybiblelog-nuxt' },
  ],
  [
    { text: t('privacy_policy'), destination: '/policy/privacy' },
    { text: t('terms_and_conditions'), destination: '/policy/terms' },
  ],
]);

function isExternal(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:');
}
</script>

<style scoped>
.page-footer {
  min-height: 20vh;
  margin: 4rem 0 0;
  padding: 3rem 0;
  background: linear-gradient(135deg, var(--mbl-primary-soft) 0%, var(--mbl-secondary-soft) 50%, var(--mbl-tertiary-soft) 100%);
  border-top: 1px solid var(--mbl-primary-soft-border);
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.footer-nav { width: 100%; }

.footer-columns {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(max-content, 1fr);
  justify-content: center;
  gap: 3rem;
}

@media screen and (max-width: 768px) {
  .footer-columns { grid-auto-flow: row; grid-auto-columns: 1fr; gap: 2rem; }
}

.footer-column {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

.footer-link-item { margin: 0; }

.footer-link {
  color: var(--mbl-text-soft);
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
  padding: 0.5rem 0;
}

@media screen and (max-width: 768px) {
  .footer-link { font-size: 0.9375rem; }
}

.footer-link:hover { color: var(--primary-color); transform: translateY(-1px); }
.footer-link:active { color: var(--secondary-color); }

.footer-link::after {
  content: '';
  position: absolute;
  bottom: 0.25rem;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  transition: width 0.3s ease;
}

.footer-link:hover::after { width: 100%; }
</style>

<i18n lang="json">
{
  "en": {
    "home": "Home",
    "faq": "FAQ",
    "give_feedback": "Give Feedback",
    "contribute": "Contribute",
    "donate_ko_fi": "Donate via Ko-fi",
    "code_on_github": "Code on GitHub",
    "privacy_policy": "Privacy Policy",
    "terms_and_conditions": "Terms and Conditions"
  },
  "de": {
    "home": "Startseite",
    "faq": "FAQ",
    "give_feedback": "Feedback geben",
    "contribute": "Mitwirken",
    "donate_ko_fi": "Mitwirken via Ko-fi",
    "code_on_github": "Code auf GitHub",
    "privacy_policy": "Datenschutzrichtlinie",
    "terms_and_conditions": "Nutzungsbedingungen"
  },
  "es": {
    "home": "Inicio",
    "faq": "FAQ",
    "give_feedback": "Enviar feedback",
    "contribute": "Contribuir",
    "donate_ko_fi": "Donar via Ko-fi",
    "code_on_github": "Código en GitHub",
    "privacy_policy": "Política de privacidad",
    "terms_and_conditions": "Términos y condiciones"
  },
  "fr": {
    "home": "Accueil",
    "faq": "FAQ",
    "give_feedback": "Donner un feedback",
    "contribute": "Contribuer",
    "donate_ko_fi": "Donner via Ko-fi",
    "code_on_github": "Code sur GitHub",
    "privacy_policy": "Politique de confidentialité",
    "terms_and_conditions": "Conditions d'utilisation"
  },
  "ko": {
    "home": "홈페이지",
    "faq": "자주 묻는 질문",
    "give_feedback": "피드백 보내기",
    "contribute": "기여하기",
    "donate_ko_fi": "Ko-fi를 통해 기부",
    "code_on_github": "GitHub 코드",
    "privacy_policy": "개인정보처리방침",
    "terms_and_conditions": "이용약관"
  },
  "pt": {
    "home": "Início",
    "faq": "FAQ",
    "give_feedback": "Enviar feedback",
    "contribute": "Contribuir",
    "donate_ko_fi": "Doar via Ko-fi",
    "code_on_github": "Código em GitHub",
    "privacy_policy": "Política de privacidade",
    "terms_and_conditions": "Termos e condições"
  },
  "uk": {
    "home": "Головна",
    "faq": "FAQ",
    "give_feedback": "Надіслати відгук",
    "contribute": "Допомога",
    "donate_ko_fi": "Зробити подарунок через Ko-fi",
    "code_on_github": "Код на GitHub",
    "privacy_policy": "Політика конфіденційності",
    "terms_and_conditions": "Умови використання"
  }
}
</i18n>
