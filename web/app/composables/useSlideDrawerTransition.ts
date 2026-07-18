export interface SlideDrawerTransitionOptions {
  drawerSelector: string;
  backdropSelector: string;
  durationMs: number;
}

/**
 * JS-driven enter/leave handlers for a `<Transition :css="false">` wrapping
 * a side drawer + backdrop: slides the drawer in from the right while
 * fading the backdrop, finishing on `transitionend` (with a timeout
 * fallback) rather than a fixed delay.
 */
export function useSlideDrawerTransition(options: SlideDrawerTransitionOptions) {
  const { drawerSelector, backdropSelector, durationMs } = options;

  const queryElements = (el: Element) => ({
    drawer: el.querySelector(drawerSelector) as HTMLElement | null,
    backdrop: el.querySelector(backdropSelector) as HTMLElement | null,
  });

  const clearInlineStyles = (el: Element) => {
    const { drawer, backdrop } = queryElements(el);
    if (drawer) { drawer.style.transition = ''; drawer.style.transform = ''; }
    if (backdrop) { backdrop.style.transition = ''; backdrop.style.opacity = ''; }
  };

  const onBeforeEnter = (el: Element) => {
    const { drawer, backdrop } = queryElements(el);
    if (drawer) { drawer.style.transition = 'none'; drawer.style.transform = 'translateX(100%)'; }
    if (backdrop) { backdrop.style.transition = 'none'; backdrop.style.opacity = '0'; }
  };

  const onEnter = (el: Element, done: () => void) => {
    const { drawer, backdrop } = queryElements(el);
    if (!drawer || !backdrop) { done(); return; }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        drawer.style.transition = `transform ${durationMs}ms ease`;
        backdrop.style.transition = `opacity ${durationMs}ms ease`;
        drawer.style.transform = 'translateX(0)';
        backdrop.style.opacity = '1';
        const finish = (e: TransitionEvent) => {
          if (!e || e.target !== drawer || e.propertyName !== 'transform') { return; }
          drawer.removeEventListener('transitionend', finish);
          clearTimeout(fallback);
          done();
        };
        drawer.addEventListener('transitionend', finish);
        const fallback = setTimeout(() => {
          drawer.removeEventListener('transitionend', finish);
          done();
        }, durationMs + 100);
      });
    });
  };

  const onAfterEnter = (el: Element) => { clearInlineStyles(el); };

  const onLeave = (el: Element, done: () => void) => {
    const { drawer, backdrop } = queryElements(el);
    if (!drawer || !backdrop) { done(); return; }
    drawer.style.transition = `transform ${durationMs}ms ease`;
    backdrop.style.transition = `opacity ${durationMs}ms ease`;
    requestAnimationFrame(() => {
      drawer.style.transform = 'translateX(100%)';
      backdrop.style.opacity = '0';
      const finish = (e: TransitionEvent) => {
        if (!e || e.target !== drawer || e.propertyName !== 'transform') { return; }
        drawer.removeEventListener('transitionend', finish);
        clearTimeout(fallback);
        done();
      };
      drawer.addEventListener('transitionend', finish);
      const fallback = setTimeout(() => {
        drawer.removeEventListener('transitionend', finish);
        done();
      }, durationMs + 100);
    });
  };

  const onAfterLeave = (el: Element) => { clearInlineStyles(el); };

  return { onBeforeEnter, onEnter, onAfterEnter, onLeave, onAfterLeave };
}
