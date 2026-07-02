<template>
  <client-only>
    <div class="pwa-prompt no-print">
      <!-- Update available: a new service worker is waiting -->
      <div
        v-if="pwa?.needRefresh"
        class="mbl-notification mbl-notification--info pwa-prompt__card"
        role="alert"
        data-testid="pwa-refresh-prompt"
      >
        <span class="pwa-prompt__text">{{ t('new_version') }}</span>
        <div class="pwa-prompt__actions">
          <button
            class="mbl-button mbl-button--primary mbl-button--small"
            type="button"
            data-testid="pwa-reload"
            @click="pwa?.updateServiceWorker()"
          >
            {{ t('reload') }}
          </button>
          <button
            class="mbl-button mbl-button--small"
            type="button"
            data-testid="pwa-refresh-dismiss"
            @click="pwa?.cancelPrompt()"
          >
            {{ t('dismiss') }}
          </button>
        </div>
      </div>

      <!-- Ready to work offline -->
      <div
        v-else-if="pwa?.offlineReady"
        class="mbl-notification mbl-notification--success pwa-prompt__card"
        role="status"
        data-testid="pwa-offline-ready"
      >
        <span class="pwa-prompt__text">{{ t('offline_ready') }}</span>
        <button
          class="mbl-delete"
          type="button"
          :aria-label="t('dismiss')"
          data-testid="pwa-offline-dismiss"
          @click="pwa?.cancelPrompt()"
        />
      </div>

      <!-- Install prompt available (not yet installed) -->
      <div
        v-if="pwa?.showInstallPrompt && !pwa?.needRefresh && !pwa?.offlineReady"
        class="mbl-notification pwa-prompt__card"
        role="status"
        data-testid="pwa-install-prompt"
      >
        <span class="pwa-prompt__text">{{ t('install_prompt') }}</span>
        <div class="pwa-prompt__actions">
          <button
            class="mbl-button mbl-button--primary mbl-button--small"
            type="button"
            data-testid="pwa-install"
            @click="pwa?.install()"
          >
            {{ t('install') }}
          </button>
          <button
            class="mbl-button mbl-button--small"
            type="button"
            data-testid="pwa-install-dismiss"
            @click="pwa?.cancelInstall()"
          >
            {{ t('dismiss') }}
          </button>
        </div>
      </div>
    </div>
  </client-only>
</template>

<script setup lang="ts">
const { t } = useI18n();

// $pwa is injected by @vite-pwa/nuxt on the client only; it's undefined during
// SSR and until the plugin runs, so every access is optional-chained.
const { $pwa } = useNuxtApp();
const pwa = $pwa;
</script>

<style scoped>
.pwa-prompt {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  z-index: var(--z-index-toast);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.pwa-prompt__card {
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  box-shadow: 0 0 0 2px var(--mbl-bg), 0 0 5px var(--mbl-text-stronger);
  pointer-events: auto;
}

.pwa-prompt__text {
  flex: 1;
}

.pwa-prompt__actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}
</style>

<i18n lang="json">
{
  "en": {
    "new_version": "A new version is available.",
    "reload": "Reload",
    "dismiss": "Dismiss",
    "offline_ready": "App ready to work offline.",
    "install_prompt": "Install My Bible Log on your device.",
    "install": "Install"
  },
  "de": {
    "new_version": "Eine neue Version ist verfügbar.",
    "reload": "Neu laden",
    "dismiss": "Schließen",
    "offline_ready": "App ist offline einsatzbereit.",
    "install_prompt": "Installieren Sie My Bible Log auf Ihrem Gerät.",
    "install": "Installieren"
  },
  "es": {
    "new_version": "Hay una nueva versión disponible.",
    "reload": "Recargar",
    "dismiss": "Descartar",
    "offline_ready": "La aplicación está lista para funcionar sin conexión.",
    "install_prompt": "Instala My Bible Log en tu dispositivo.",
    "install": "Instalar"
  },
  "fr": {
    "new_version": "Une nouvelle version est disponible.",
    "reload": "Recharger",
    "dismiss": "Ignorer",
    "offline_ready": "L'application est prête à fonctionner hors ligne.",
    "install_prompt": "Installez My Bible Log sur votre appareil.",
    "install": "Installer"
  },
  "ko": {
    "new_version": "새 버전이 있습니다.",
    "reload": "새로고침",
    "dismiss": "닫기",
    "offline_ready": "앱이 오프라인에서 사용할 준비가 되었습니다.",
    "install_prompt": "기기에 My Bible Log를 설치하세요.",
    "install": "설치"
  },
  "pt": {
    "new_version": "Uma nova versão está disponível.",
    "reload": "Recarregar",
    "dismiss": "Dispensar",
    "offline_ready": "O aplicativo está pronto para funcionar offline.",
    "install_prompt": "Instale o My Bible Log no seu dispositivo.",
    "install": "Instalar"
  },
  "uk": {
    "new_version": "Доступна нова версія.",
    "reload": "Перезавантажити",
    "dismiss": "Закрити",
    "offline_ready": "Застосунок готовий до роботи офлайн.",
    "install_prompt": "Встановіть My Bible Log на свій пристрій.",
    "install": "Встановити"
  }
}
</i18n>
