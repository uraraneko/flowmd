import path from "node:path";
import { defineConfig } from "vitest/config";
import { transform } from "esbuild";

export default defineConfig({
  plugins: [
    {
      name: "framework-specific-test-jsx",
      enforce: "pre",
      async transform(code, id) {
        if (!id.endsWith(".tsx")) return;
        return transform(code, {
          loader: "tsx",
          jsx: "automatic",
          jsxImportSource: id.includes("/vendor/upstream/") ? "react" : "vue",
          sourcemap: "inline",
          sourcefile: id,
        });
      },
    },
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./__tests__/setup.ts"],
    include: ["__tests__/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
    maxWorkers: 4,
    coverage: {
      include: ["index.ts", "lib/**/*.ts", "hooks/**/*.ts", "plugins/**/*.ts"],
      exclude: [
        "vendor/**",
        "test/**",
        "__tests__/**",
        "node_modules/**",
        "dist/**",
      ],
      excludeAfterRemap: true,
      reporter: ["text", "json-summary", "html", "lcov"],
      thresholds: { statements: 90, lines: 90, functions: 90, branches: 85 },
    },
  },
  resolve: {
    alias: {
      "@streamdown/math": path.resolve(import.meta.dirname, "plugins/math.ts"),
      "@streamdown/cjk": path.resolve(import.meta.dirname, "plugins/cjk.ts"),
    },
  },
});
