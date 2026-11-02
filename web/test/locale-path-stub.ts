// `useLocalePath()` stand-in for the unit suite. Components pass route names
// (`'settings-email'`, `{ name: 'books-book', params }`), so the stub resolves
// them to the default-locale path the real composable returns. The route table
// is derived from app/pages with Nuxt's file-based naming, so it can't drift
// from the real routes.

// `[param]`, `[[optional]]` and `[...catchAll]` segments, as Nuxt names them.
const DYNAMIC_SEGMENT = /^\[{1,2}(?:\.\.\.)?(\w+)\]{1,2}$/;

export function buildRouteTable(pageFiles: string[]): Map<string, string> {
  const table = new Map<string, string>();
  for (const file of pageFiles) {
    const segments = file.replace(/^\/app\/pages\//, '').replace(/\.vue$/, '').split('/');
    if (segments.at(-1) === 'index') { segments.pop(); }
    const name = segments.map(s => s.replace(DYNAMIC_SEGMENT, '$1')).join('-') || 'index';
    table.set(name, '/' + segments.map(s => s.replace(DYNAMIC_SEGMENT, ':$1')).join('/'));
  }
  return table;
}

const routePaths = buildRouteTable(Object.keys(import.meta.glob('/app/pages/**/*.vue')));

type LocalePathInput = string | {
  name?: string;
  path?: string;
  params?: Record<string, string | number>;
  query?: Record<string, string | string[]>;
};

export function stubLocalePath(input: LocalePathInput): string {
  const route = typeof input === 'string'
    ? (input.startsWith('/') ? { path: input } : { name: input })
    : input;
  const pattern = route.path ?? routePaths.get(route.name ?? '');
  if (pattern === undefined) {
    throw new Error(`stubLocalePath: unknown route name "${route.name}"`);
  }
  const path = pattern.replace(/:(\w+)/g, (_, key: string) => {
    const value = route.params?.[key];
    if (value === undefined) {
      throw new Error(`stubLocalePath: missing param "${key}" for route "${route.name ?? route.path}"`);
    }
    return encodeURIComponent(String(value));
  });
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(route.query ?? {})) {
    for (const v of Array.isArray(value) ? value : [value]) { query.append(key, v); }
  }
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}
