import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // server-only throws outside the React server runtime; tests import server modules directly.
      "server-only": path.resolve(import.meta.dirname, "src/test/server-only-stub.ts"),
    },
  },
  test: { environment: "node", include: ["src/**/*.test.ts"], env: { AI_MOCK: "1" } },
});
