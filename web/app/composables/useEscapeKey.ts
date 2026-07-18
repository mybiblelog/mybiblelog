import type { Ref } from 'vue';

/**
 * Calls `onEscape` when the Escape key is pressed. If `isActiveRef` is
 * provided, the callback only fires while it is `true` (e.g. while a
 * modal/dropdown is open) — pass it whenever the owning component stays
 * mounted after closing, to avoid firing on a no-op/closed target.
 */
export function useEscapeKey(onEscape: () => void, isActiveRef?: Ref<boolean>) {
  const handler = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') { return; }
    if (isActiveRef && !isActiveRef.value) { return; }
    onEscape();
  };

  onMounted(() => {
    document.addEventListener('keydown', handler);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handler);
  });
}
