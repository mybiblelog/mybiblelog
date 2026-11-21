import type { Ref } from 'vue';

/** Tracks an element's rendered height in whole pixels; 0 while it isn't mounted. */
export function useElementHeight(el: Ref<HTMLElement | null>) {
  const height = ref(0);
  let observer: ResizeObserver | null = null;

  function measure(target: Element) {
    height.value = Math.max(0, Math.ceil(target.getBoundingClientRect().height));
  }

  function disconnect() {
    observer?.disconnect();
    observer = null;
    height.value = 0;
  }

  watch(el, (target) => {
    disconnect();
    if (!target || typeof ResizeObserver === 'undefined') { return; }
    observer = new ResizeObserver(([entry]) => { if (entry) { measure(entry.target); } });
    observer.observe(target);
    measure(target);
  }, { flush: 'post', immediate: true });

  onBeforeUnmount(disconnect);

  return height;
}
