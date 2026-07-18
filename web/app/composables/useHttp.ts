import type { HttpClient } from '@mybiblelog/shared';

/**
 * Injected HTTP client, mirroring the `(http, ...) => ...` shape the
 * `shared/`-side API functions expect. Stores should hold this reference
 * rather than reaching for `useNuxtApp().$http` inline, so those functions
 * stay swappable/testable the same way the shared API layer is.
 */
export const useHttp = (): HttpClient => useNuxtApp().$http;
