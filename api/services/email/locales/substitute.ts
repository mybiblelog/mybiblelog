// Every current template placeholder holds a leaf value (plain text or a
// URL), never a pre-built HTML fragment — so it's safe and correct to
// HTML-escape every interpolated value here at the source. If a future
// caller genuinely needs to splice in trusted HTML, add an explicit
// raw/trusted opt-in then rather than weakening this default.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function substitute(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => escapeHtml(values[key] ?? ''));
}
