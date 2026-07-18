import type { Ref } from 'vue';

/**
 * Returns a ref that is `false` during SSR and the initial client render, then
 * flips to `true` once mounted. Use it to gate interactive controls until the
 * client has hydrated, avoiding hydration mismatches and premature clicks.
 * Standardizes the ad-hoc `mounted`/`hydrated` refs that pages used to declare.
 */
export function useHydrated(): Ref<boolean> {
  const hydrated = ref(false);
  onMounted(() => { hydrated.value = true; });
  return hydrated;
}
