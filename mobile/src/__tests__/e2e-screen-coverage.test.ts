import fs from "fs";
import path from "path";

const mobileRoot = path.resolve(__dirname, "../..");
const appDir = path.join(mobileRoot, "app");
const flowsDir = path.join(mobileRoot, ".maestro/flows");

// Rendered only when the API rejects the app version; no navigation reaches it.
const UNREACHABLE_BY_NAVIGATION = new Set(["upgrade-required.tsx"]);

function routeFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return routeFiles(full);
    if (!entry.name.endsWith(".tsx") || entry.name === "_layout.tsx") return [];
    return [path.relative(appDir, full)];
  });
}

const flowsText = fs
  .readdirSync(flowsDir)
  .filter((f) => f.endsWith(".yaml"))
  .map((f) => fs.readFileSync(path.join(flowsDir, f), "utf8"))
  .join("\n");

const routes = routeFiles(appDir).filter((r) => !UNREACHABLE_BY_NAVIGATION.has(r));

describe("e2e screen coverage", () => {
  it("finds the route files", () => {
    expect(routes).toContain(path.join("(tabs)", "(today)", "calendar.tsx"));
  });

  it.each(routes)("%s is asserted by a Maestro flow", (route) => {
    const source = fs.readFileSync(path.join(appDir, route), "utf8");
    const ids = [...source.matchAll(/testID="(screen\.[^"]+)"/g)].map((m) => m[1]);
    expect(ids).not.toHaveLength(0);
    for (const id of ids) {
      expect(flowsText).toContain(`id: "${id}"`);
    }
  });
});
