import type { Ref, ComputedRef } from 'vue';

/**
 * Calls `onOutside` when a click lands outside the element currently
 * returned by `targetRef`. Pass a computed that resolves to `null`/`undefined`
 * while inactive (e.g. `computed(() => open.value ? el.value : null)`) to gate
 * when outside-clicks should be observed.
 *
 * Attaching the capture-phase document listener is deferred by a tick so the
 * same click that reveals the target (e.g. a toggle button) can't immediately
 * trigger its own outside-click close.
 */
export function useClickOutside(
  targetRef: Ref<HTMLElement | null | undefined> | ComputedRef<HTMLElement | null | undefined>,
  onOutside: () => void,
) {
  let listener: ((e: MouseEvent) => void) | null = null;
  let attachTimer: ReturnType<typeof setTimeout> | null = null;

  const detach = () => {
    if (listener) {
      document.removeEventListener('click', listener, true);
      listener = null;
    }
    if (attachTimer !== null) {
      clearTimeout(attachTimer);
      attachTimer = null;
    }
  };

  watch(targetRef, (el) => {
    if (typeof document === 'undefined') { return; }
    detach();
    if (!el) { return; }
    attachTimer = setTimeout(() => {
      attachTimer = null;
      listener = (e: MouseEvent) => {
        const current = targetRef.value;
        if (current && !current.contains(e.target as Node)) {
          onOutside();
        }
      };
      document.addEventListener('click', listener, true);
    }, 0);
  }, { immediate: true });

  onBeforeUnmount(detach);
}
