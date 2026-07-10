/**
 * Shared helpers for Crowdin bundle export/import (inline SFC i18n blocks).
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** api/services/email/locales/strings.json — merged into each Crowdin locale bundle as `email`. */
export function emailLocaleStringsPath(nuxtRoot: string): string {
  return path.join(nuxtRoot, '..', 'api', 'services', 'email', 'locales', 'strings.json');
}

/**
 * First inline block: no locale= and no src= (multi-locale JSON object).
 * The `(?![-\w])` guard keeps this from matching the vue-i18n v9 component tags
 * `<i18n-t>` / `<i18n-n>` / `<i18n-d>` used in the web app's Vue templates.
 */
export const INLINE_I18N_RE =
  /<i18n(?![-\w])(?![^>]*\blocale=)(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/i18n>/m;

export async function* walkVueFiles(dir: string): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      yield * walkVueFiles(full);
    }
    else if (ent.isFile() && ent.name.endsWith('.vue')) {
      yield full;
    }
  }
}

export function toRelKey(vueFilePath: string, rootDir: string): string {
  const rel = path.relative(rootDir, vueFilePath);
  return rel.replace(/\.vue$/i, '').split(path.sep).join('/');
}

export function isLegacySrcI18n(source: string): boolean {
  return /<i18n(?![-\w])[^>]*\blocale=/.test(source) && /<i18n(?![-\w])[^>]*\bsrc=/.test(source);
}

export type InlineI18nMatch = {
  bodyStart: number;
  bodyEnd: number;
};

/** Locates the first inline <i18n> block body span for replacement. */
export function findInlineI18nBodySpan(source: string): InlineI18nMatch | null {
  const m = INLINE_I18N_RE.exec(source);
  if (!m || m.index === undefined) {
    return null;
  }
  const full = m[0];
  const body = m[1];
  const start = m.index;
  const bodyStart = start + full.indexOf(body);
  const bodyEnd = bodyStart + body.length;
  return { bodyStart, bodyEnd };
}

export function findInlineI18nBody(source: string): string | null {
  const span = findInlineI18nBodySpan(source);
  if (!span) {
    return null;
  }
  return source.slice(span.bodyStart, span.bodyEnd).trim();
}

export function replaceInlineI18nBody(source: string, newBody: string): string {
  const span = findInlineI18nBodySpan(source);
  if (!span) {
    throw new Error('No inline <i18n> block found (expected block without locale= / src=)');
  }
  return source.slice(0, span.bodyStart) + newBody + source.slice(span.bodyEnd);
}

/**
 * ESLint's `no-irregular-whitespace` flags invisible whitespace (e.g. NBSP U+00A0, common in
 * French/Korean copy) when it appears raw in an SFC `<i18n>` block. `JSON.stringify` emits such
 * characters literally, so re-escape them as `\uXXXX` to keep the written blocks lint-clean and
 * the whitespace visible in source (matching how they were originally authored). Codepoints
 * mirror ESLint's irregular-whitespace list, minus those `JSON.stringify` already escapes
 * (control chars below U+0020, which include \v and \f).
 */
const IRREGULAR_WHITESPACE = new Set<number>([
  0x0085, 0x00A0, 0x1680, 0x180E,
  0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007,
  0x2008, 0x2009, 0x200A, 0x200B, 0x2028, 0x2029, 0x202F, 0x205F,
  0x3000, 0xFEFF,
]);

export function escapeIrregularWhitespace(json: string): string {
  let out = '';
  for (const ch of json) {
    const cp = ch.codePointAt(0)!;
    out += IRREGULAR_WHITESPACE.has(cp)
      ? `\\u${cp.toString(16).padStart(4, '0')}`
      : ch;
  }
  return out;
}

/** Parse trimmed JSON body of an inline multi-locale <i18n> block (top-level keys = locale codes). */
export function parseInlineI18nBlockJson(raw: string, filePath: string): Record<string, unknown> {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error(`Empty <i18n> block in ${filePath}`);
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Expected a JSON object keyed by locale codes');
    }
    return parsed as Record<string, unknown>;
  }
  catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`${filePath}: ${msg}`);
  }
}
