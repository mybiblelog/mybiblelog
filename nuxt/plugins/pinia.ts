import Vue from 'vue';
import { PiniaVuePlugin, createPinia, setActivePinia } from 'pinia';
import type { HttpClient, Translator } from '@mybiblelog/shared';

import type { Pinia } from 'pinia';
import type { Context, Plugin } from '@nuxt/types';

Vue.use(PiniaVuePlugin);

const plugin: Plugin = (context, inject) => {
  type I18nLike = Translator;

  type NuxtStateWithPinia = {
    pinia?: Record<string, unknown>;
  };

  type ContextWithInjections = Context & {
    $http?: unknown;
    nuxtState?: NuxtStateWithPinia;
    app: Context['app'] & { pinia?: Pinia; i18n?: I18nLike };
  };

  const ctx = context as ContextWithInjections;

  const pinia = createPinia();

  // Mirror Nuxt injections (e.g. `$http`) into Pinia stores.
  pinia.use(() => ({
    $http: ctx.$http as unknown as HttpClient,
    $i18n: ctx.app.i18n ?? { locale: 'en', t: key => key },
  }));

  // Make Pinia available in Nuxt context/app and as this.$pinia.
  ctx.app.pinia = pinia;
  inject('pinia', pinia);

  // Ensure stores can be created without explicitly passing the instance.
  setActivePinia(pinia);

  // SSR: serialize state into nuxtState; Client: hydrate it back.
  if (process.server) {
    ctx.beforeNuxtRender(({ nuxtState }) => {
      (nuxtState as NuxtStateWithPinia).pinia = (pinia as Pinia).state.value as unknown as Record<string, unknown>;
    });
  }
  else if (process.client && ctx.nuxtState?.pinia) {
    (pinia as Pinia).state.value = ctx.nuxtState.pinia as unknown as (Pinia['state']['value']);
  }
};

export default plugin;
