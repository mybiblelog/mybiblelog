// `useLocalePath()` stand-in for the unit suite. Components pass route names
// (`'settings-email'`, `{ name: 'books-book', params }`), so the stub resolves
// them to the default-locale path the real composable returns. The route table
// is derived from app/pages with Nuxt's file-based naming, so it can't drift
// from the real routes.
const routePaths = new Map<string, string>();

for (const file of Object.keys(import.meta.glob('/app/pages/**/*.vue'))) {
  const segments = file.replace(/^\/app\/pages\//, '').replace(/\.vue$/, '').split('/');
  if (segments.at(-1) === 'index') { segments.pop(); }
  const name = segments.map(s => s.replace(/^\[(\w+)\]$/, '$1')).join('-') || 'index';
  routePaths.set(name, '/' + segments.map(s => s.replace(/^\[(\w+)\]$/, ':$1')).join('/'));
}

type LocalePathInput = string | {
  name?: string;
  path?: string;
  params?: Record<string, string | number>;
  query?: Record<string, string>;
};

export function stubLocalePath(input: LocalePathInput): string {
  const route = typeof input === 'string'
    ? (input.startsWith('/') ? { path: input } : { name: input })
    : input;
  const pattern = route.path ?? routePaths.get(route.name ?? '');
  if (pattern === undefined) {
    throw new Error(`stubLocalePath: unknown route name "${route.name}"`);
  }
  const path = pattern.replace(/:(\w+)/g, (_, key: string) => encodeURIComponent(String(route.params?.[key])));
  const query = new URLSearchParams(route.query).toString();
  return query ? `${path}?${query}` : path;
}
