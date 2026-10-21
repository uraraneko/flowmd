import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "index.ts",
    "plugins/code.ts",
    "plugins/math.ts",
    "plugins/mermaid.ts",
    "plugins/cjk.ts",
  ],
  dts: false,
  format: ["esm"],
  splitting: true,
  treeshake: true,
  clean: true,
  sourcemap: true,
  external: ["vue", "shiki", "shiki/engine/javascript", "mermaid", "katex"],
  platform: "browser",
  target: "es2022",
});
