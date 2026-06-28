import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Minimal vitest setup for pure, platform-agnostic logic (e.g. the offline
 * mutation queue). React Native components/stores are exercised on-device, not
 * here; only modules free of native imports should be included.
 */
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
