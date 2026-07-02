<template>
  <main>
    <div class="content-column">
      <h1 class="mbl-title">
        {{ $t('signing_in_with_google') }}
      </h1>
    </div>
  </main>
</template>

<script>
import { useAuthStore } from '~/stores/auth';

export default {
  name: 'GoogleLoginPage',
  middleware: ['auth'],
  data() {
    return {
      //
    };
  },
  head() {
    return {
      title: this.$t('page_title'),
    };
  },
  async mounted() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (code && state) {
      try {
        // Get the user's preferred locale to save as their user settings
        // We saved the user's locale to localStorage on the Login page,
        // allowing us to redirect to the correct locale after login
        // without changing the OAuth2 redirect URL.
        // Otherwise we would need to add a language prefix to the OAuth2 redirect URL,
        // as i18n will interpret the OAuth2 redirect URL as an intentional language switch.
        const defaultLocale = this.$i18n.defaultLocale;
        const loginLocale = localStorage.getItem('login_language');
        const userLocale = loginLocale || defaultLocale;

        await this.$http.post('/api/auth/oauth2/google/verify', {
          code,
          state,
          locale: userLocale,
        });

        // Reload user now that auth cookie should be set
        await useAuthStore().refreshUser();

        // Redirect to the user's preferred locale.
        const redirectUrl = this.localePath('/start', userLocale);
        await this.$router.push(redirectUrl);
      }
      catch (error) {
        // eslint-disable-next-line no-console
        console.error('Google OAuth verification failed:', error);
        // Redirect to login page with error
        await this.$router.push(this.localePath('/login?error=oauth_failed'));
      }
    }
    else {
      // Missing required parameters, redirect to login
      await this.$router.push(this.localePath('/login?error=invalid_oauth_response'));
    }
  },
  methods: {
    //
  },
  meta: {
    auth: 'guest',
  },
};
</script>

<style scoped>

</style>

<i18n lang="json">
{
  "en": {
    "page_title": "Sign In - Google",
    "signing_in_with_google": "Signing in with Google..."
  },
  "de": {
    "page_title": "Anmelden – Google",
    "signing_in_with_google": "Mit Google anmelden..."
  },
  "es": {
    "page_title": "Iniciar sesión - Google",
    "signing_in_with_google": "Iniciando sesión con Google..."
  },
  "fr": {
    "page_title": "Connexion - Google",
    "signing_in_with_google": "Connexion avec Google en cours..."
  },
  "ko": {
    "page_title": "Google 계정으로 로그인",
    "signing_in_with_google": "Google로 로그인하는 중…"
  },
  "pt": {
    "page_title": "Entrar - Google",
    "signing_in_with_google": "Entrando com Google..."
  },
  "uk": {
    "page_title": "Увійти - Google",
    "signing_in_with_google": "Увійти через Google..."
  }
}
</i18n>
