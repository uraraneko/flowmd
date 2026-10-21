import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import ts from "typescript";

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const url = new URL(
      entry.name + (entry.isDirectory() ? "/" : ""),
      directory,
    );
    if (entry.isDirectory()) result.push(...(await files(url)));
    else if (/\.tsx?$/.test(entry.name)) result.push(url);
  }
  return result;
}
function inspect(source, file) {
  const tree = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  assert.equal(
    tree.parseDiagnostics.length,
    0,
    `Cannot audit an unparsed module: ${file}`,
  );
  const literals = new Set();
  const expectedClasses = new Set();
  const attributes = new Set();
  const tags = new Set();
  const strings = (node, output) => {
    if (ts.isStringLiteralLike(node))
      for (const token of node.text.split(/\s+/)) if (token) output.add(token);
    ts.forEachChild(node, (child) => strings(child, output));
  };
  strings(tree, literals);
  const walk = (node) => {
    if (ts.isCallExpression(node) && node.expression.getText(tree) === "cn")
      strings(node, expectedClasses);
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(tree);
      if (name === "className") strings(node, expectedClasses);
      if (
        name.startsWith("aria-") ||
        name.startsWith("data-") ||
        name === "role"
      )
        attributes.add(name);
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(tree);
      if (/^[a-z][a-z0-9-]*$/.test(tag)) tags.add(tag);
    }
    ts.forEachChild(node, walk);
  };
  walk(tree);
  return { literals, expectedClasses, attributes, tags };
}
const root = new URL("../", import.meta.url);
const upstream = new URL("vendor/upstream/packages/streamdown/", root);
const pairs = (await files(new URL("lib/", upstream))).map((original) => [
  original,
  new URL(
    "lib/" + original.href.split("/lib/")[1].replace(/\.tsx$/, ".ts"),
    root,
  ),
]);
pairs.push([new URL("index.tsx", upstream), new URL("index.ts", root)]);
for (const [original, port] of pairs) {
  const reference = inspect(
    await readFile(original, "utf8"),
    original.pathname,
  );
  const native = inspect(await readFile(port, "utf8"), port.pathname);
  const source = await readFile(port, "utf8");
  for (const token of reference.expectedClasses)
    assert(
      native.literals.has(token),
      `Missing upstream class ${token} in ${port.pathname}`,
    );
  for (const name of reference.attributes)
    assert(
      source.includes(name),
      `Missing upstream attribute ${name} in ${port.pathname}`,
    );
  for (const tag of reference.tags)
    assert(
      native.literals.has(tag),
      `Missing native tag ${tag} in ${port.pathname}`,
    );
}
console.log(
  `Verified upstream UI classes, native tags and accessibility/data attribute coverage in ${pairs.length} modules.`,
);
