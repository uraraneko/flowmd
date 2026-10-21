import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { transform } from "esbuild";
import ts from "typescript";

const manifest = JSON.parse(
  await readFile(new URL("../upstream.json", import.meta.url), "utf8"),
);
const normalize = async (url) => {
  const text = await readFile(url, "utf8");
  const { code } = await transform(text, {
    loader: "ts",
    target: "es2022",
    minifyWhitespace: true,
    minifySyntax: true,
    minifyIdentifiers: false,
    legalComments: "none",
  });
  return code.replace(/(from["']\.[^"']*)\.js(["'])/g, "$1$2");
};

for (const file of manifest.unchangedCoreFiles) {
  const original = file === "parse-blocks.ts" ? "parse-blocks.tsx" : file;
  assert.equal(
    await normalize(new URL(`../lib/${file}`, import.meta.url)),
    await normalize(
      new URL(
        `../vendor/upstream/packages/streamdown/lib/${original}`,
        import.meta.url,
      ),
    ),
    `Framework-independent runtime diverged from the pinned upstream: ${file}`,
  );
}
for (const name of ["code", "math", "mermaid", "cjk"]) {
  assert.equal(
    await normalize(new URL(`../plugins/${name}.ts`, import.meta.url)),
    await normalize(
      new URL(
        `../vendor/upstream/packages/streamdown-${name}/index.ts`,
        import.meta.url,
      ),
    ),
    `Plugin runtime diverged: ${name}`,
  );
}
// Auto-fit helpers are extracted from the React component without changing runtime logic.
const fitNames = new Set([
  "positiveOrNull",
  "parseLengthPx",
  "resolveMaxHeightPx",
  "MIN_MAX_HEIGHT_REGEX",
  "resolveComplexMaxHeightPx",
  "computeFit",
]);
async function fitSource(url) {
  const source = await readFile(url, "utf8");
  const tree = ts.createSourceFile(
    url.pathname,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const statements = tree.statements.filter(
    (node) =>
      ts.isVariableStatement(node) &&
      node.declarationList.declarations.some((item) =>
        fitNames.has(item.name.getText(tree)),
      ),
  );
  assert.equal(
    statements.length,
    fitNames.size,
    "Missing fit helper in the reference or port",
  );
  const code = statements
    .map((node) => node.getText(tree).replace(/^export /, ""))
    .join("\n");
  return (
    await transform(code, {
      loader: "ts",
      minifyWhitespace: true,
      minifySyntax: true,
      minifyIdentifiers: false,
    })
  ).code;
}
assert.equal(
  await fitSource(new URL("../lib/mermaid/fit.ts", import.meta.url)),
  await fitSource(
    new URL(
      "../vendor/upstream/packages/streamdown/lib/mermaid/pan-zoom.tsx",
      import.meta.url,
    ),
  ),
  "Mermaid auto-fit logic diverged",
);
assert.equal(
  await readFile(new URL("../styles.css", import.meta.url), "utf8"),
  await readFile(
    new URL(
      "../vendor/upstream/packages/streamdown/styles.css",
      import.meta.url,
    ),
    "utf8",
  ),
  "Animation CSS diverged",
);
console.log(
  `Verified ${manifest.unchangedCoreFiles.length} core modules, Mermaid fit helpers, animation CSS and 4 plugin implementations against ${manifest.commit}.`,
);
