import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/app": path.resolve(__dirname, "app"),
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    setupFiles: ["./tests/setup/vitest.ts"],
  },
});
