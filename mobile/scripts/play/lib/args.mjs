// Argument parsing shared by the Play scripts. Deliberately tiny: these take a
// handful of long options and no positional arguments.

export function parseArgs(argv, { flags = [], values = [] } = {}) {
  const known = new Set([...flags, ...values, "locales", "key"]);
  const result = { locales: null, key: null };
  for (const flag of flags) result[camel(flag)] = false;
  for (const value of values) result[camel(value)] = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) throw new Error(`Unexpected argument "${arg}".`);

    const [name, inline] = splitOption(arg.slice(2));
    if (!known.has(name)) throw new Error(`Unknown option "--${name}".`);

    if (flags.includes(name)) {
      result[camel(name)] = true;
      continue;
    }
    const value = inline ?? argv[(i += 1)];
    if (value === undefined) throw new Error(`Option "--${name}" needs a value.`);
    result[camel(name)] = name === "locales" ? value.split(",").map((s) => s.trim()).filter(Boolean) : value;
  }

  return result;
}

function splitOption(text) {
  const eq = text.indexOf("=");
  return eq === -1 ? [text, undefined] : [text.slice(0, eq), text.slice(eq + 1)];
}

function camel(name) {
  return name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
