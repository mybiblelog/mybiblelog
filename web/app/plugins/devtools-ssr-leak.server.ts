// In dev, vue-i18n registers its Vue devtools plugin on every app it's installed
// into — including each SSR request's app. With no devtools hook on the server,
// @vue/devtools-api v6 queues the registration on
// `globalThis.__VUE_DEVTOOLS_PLUGINS__` for a devtools that never connects, so
// every rendered request's whole Vue app (stores, payload, head tags) stays
// reachable forever. The Nitro dev worker then runs out of heap roughly a
// thousand renders in (partway through an e2e run) and answers everything with
// 500s. Drop this request's entries once it has rendered. Production builds
// never register the plugin.
// TECH-DEBT(vue-i18n-ssr-devtools-leak): delete once vue-i18n skips devtools
// setup during SSR.
export default defineNuxtPlugin({
  name: 'devtools-ssr-leak',
  enforce: 'pre',
  setup(nuxtApp) {
    if (!import.meta.dev) {
      return;
    }
    nuxtApp.hooks.hook('app:rendered', () => {
      const target = globalThis as { __VUE_DEVTOOLS_PLUGINS__?: { pluginDescriptor: { app: unknown } }[] };
      const queued = target.__VUE_DEVTOOLS_PLUGINS__;
      if (!queued) {
        return;
      }
      target.__VUE_DEVTOOLS_PLUGINS__ = queued.filter(({ pluginDescriptor }) => pluginDescriptor.app !== nuxtApp.vueApp);
    });
  },
});
