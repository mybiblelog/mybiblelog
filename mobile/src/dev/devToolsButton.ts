import { useCallback, useEffect, useState } from "react";
import { appStorage } from "@/src/storage/keys";

/**
 * Dev-only control over `expo-dev-menu`'s floating dev tools button — the
 * overlay that sits above every screen and lands in the middle of local
 * screenshots. Toggled from Settings → About in development builds.
 *
 * The JS side owns the state because the dev-menu API is a setter with no
 * matching getter: without a persisted copy, the toggle's label would be a
 * guess after every reload. The preference is stored here and re-applied on
 * launch (`initDevToolsButton`), which makes this module authoritative no
 * matter what the native layer remembers on its own.
 *
 * Two reasons the module is reached lazily and defensively rather than
 * imported at the top:
 *
 * - `expo-dev-menu` ships with `expo-dev-client` and is only linked into
 *   development builds, so a production bundle must never load it.
 * - `setToolsButtonVisible` landed *after* the version this app pins
 *   (expo-dev-menu 57.x has the floating button, but exposes no JS toggle for
 *   it — only the switch inside the dev menu's own Tools section). Feature
 *   detection lets the screen say so instead of throwing, and the toggle
 *   starts working the moment the SDK upgrade brings the setter with it.
 */

type DevMenuModule = { setToolsButtonVisible?: (visible: boolean) => void };

let cached: DevMenuModule | null | undefined;

function devMenu(): DevMenuModule | null {
  if (!__DEV__) return null;
  if (cached === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      cached = require("expo-dev-menu") as DevMenuModule;
    } catch {
      cached = null;
    }
  }
  return cached;
}

/** False when the linked `expo-dev-menu` has no JS toggle for the button. */
export function isDevToolsButtonToggleSupported(): boolean {
  return typeof devMenu()?.setToolsButtonVisible === "function";
}

/** The dev tools button is visible unless it has been explicitly hidden. */
export const DEFAULT_DEV_TOOLS_BUTTON_VISIBLE = true;

export async function loadDevToolsButtonVisible(): Promise<boolean> {
  const stored = await appStorage.get("devToolsButtonVisible");
  return typeof stored === "boolean" ? stored : DEFAULT_DEV_TOOLS_BUTTON_VISIBLE;
}

/** Applies and persists the preference. Returns false when unsupported. */
export async function setDevToolsButtonVisible(visible: boolean): Promise<boolean> {
  const module = devMenu();
  if (typeof module?.setToolsButtonVisible !== "function") return false;
  module.setToolsButtonVisible(visible);
  await appStorage.set("devToolsButtonVisible", visible);
  return true;
}

/** Re-apply the persisted preference at launch. No-op outside dev builds. */
export function initDevToolsButton(): void {
  if (!isDevToolsButtonToggleSupported()) return;
  void loadDevToolsButtonVisible().then((visible) => {
    devMenu()?.setToolsButtonVisible?.(visible);
  });
}

/**
 * Screen-side view of the preference: the stored value once it loads, whether
 * the toggle can do anything at all, and the flip itself.
 */
export function useDevToolsButton(): {
  visible: boolean;
  supported: boolean;
  toggle: () => void;
} {
  const [visible, setVisible] = useState(DEFAULT_DEV_TOOLS_BUTTON_VISIBLE);
  const [supported] = useState(isDevToolsButtonToggleSupported);

  useEffect(() => {
    if (!supported) return;
    let active = true;
    void loadDevToolsButtonVisible().then((stored) => {
      if (active) setVisible(stored);
    });
    return () => {
      active = false;
    };
  }, [supported]);

  const toggle = useCallback(() => {
    setVisible((current) => {
      const next = !current;
      void setDevToolsButtonVisible(next);
      return next;
    });
  }, []);

  return { visible, supported, toggle };
}

/** Test-only: the `require` above is memoized for the life of the module. */
export function __resetDevMenuCacheForTest(): void {
  cached = undefined;
}
