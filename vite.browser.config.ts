import path from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { transform } from "esbuild";

export default defineConfig({
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
  root: path.resolve(import.meta.dirname, "test/browser/fixture"),
  plugins: [
    tailwindcss(),
    {
      name: "upstream-react-jsx",
      enforce: "pre",
      async transform(code, id) {
        if (!id.endsWith(".tsx")) return;
        return transform(code, {
          loader: "tsx",
          jsx: "automatic",
          jsxImportSource: "react",
          sourcefile: id,
          sourcemap: "inline",
        });
      },
    },
  ],
  server: {
    host: "127.0.0.1",
    port: 4175,
    strictPort: true,
    fs: { allow: [import.meta.dirname] },
  },
});
