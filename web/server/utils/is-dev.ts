// Thin wrapper around Vite/Nitro's `import.meta.dev`.
//
// Isolated into its own module so tests can mock this one seam instead of
// relying on `import.meta.dev` itself: the test runner's esbuild config
// statically replaces `import.meta.dev` with `false` in every transformed
// file (so unit tests exercise production code paths by default), which
// makes the literal impossible to flip to `true` from inside a test. Mocking
// this module bypasses that transform entirely.
export function isDev(): boolean {
  return import.meta.dev;
}
