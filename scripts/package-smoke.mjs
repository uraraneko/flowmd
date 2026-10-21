import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const scratch = await mkdtemp(path.join(tmpdir(), "streamdown-vue-consumer-"));
const run = (command, args, cwd = scratch) =>
  execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

try {
  const packed = JSON.parse(
    run(
      "npm",
      ["pack", "--ignore-scripts", "--json", "--pack-destination", scratch],
      root,
    ),
  )[0];
  assert(
    !packed.files.some(({ path: name }) =>
      /^(vendor|test|__tests__|node_modules)\//.test(name),
    ),
    "Development/reference files leaked into the package",
  );
  for (const name of [
    "LICENSE",
    "NOTICE",
    "upstream.json",
    "dist/index.js",
    "dist/index.d.ts",
  ]) {
    assert(
      packed.files.some((file) => file.path === name),
      `Missing package file: ${name}`,
    );
  }
  const archive = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(scratch, packed.filename);
  const vueVersion = JSON.parse(
    await readFile(path.join(root, "node_modules/vue/package.json"), "utf8"),
  ).version;
  await writeFile(
    path.join(scratch, "package.json"),
    JSON.stringify({
      private: true,
      type: "module",
      dependencies: {
        [pkg.name]: `file:${archive}`,
        vue: vueVersion,
        "@vue/server-renderer": vueVersion,
      },
    }),
  );
  console.log(
    "Installing the packed package in an isolated consumer (without React, Shiki or Mermaid)…",
  );
  run("npm", [
    "install",
    "--ignore-scripts",
    "--omit=optional",
    "--no-audit",
    "--no-fund",
    "--registry=https://registry.npmjs.org/",
  ]);
  const installedManifest = JSON.parse(
    await readFile(
      path.join(scratch, "node_modules", pkg.name, "package.json"),
      "utf8",
    ),
  );
  assert.equal(installedManifest.name, pkg.name);
  assert.equal(installedManifest.version, pkg.version);
  assert.deepEqual(installedManifest.exports, pkg.exports);
  const names = await readdir(path.join(scratch, "node_modules"));
  assert(
    !names.includes("react") && !names.includes("react-dom"),
    "React was installed by the production package",
  );
  // KaTeX is also a transitive dependency of rehype-katex in the math subpath.
  for (const optional of ["shiki", "mermaid"])
    assert(!names.includes(optional), `${optional} should remain optional`);
  await writeFile(
    path.join(scratch, "consumer.ts"),
    `
import { h, type VNodeChild } from "vue";
import { Streamdown, CodeBlock, defaultComponents, TableCopyDropdown, type TableCopyDropdownProps, type DefaultComponents, type ExtraProps, type StreamdownProps, type PluginConfig, type HighlightResult, type HighlightToken, type CSVSeparator } from ${JSON.stringify(pkg.name)};
const plugins: PluginConfig = {};
const token: HighlightToken = { content: "answer", color: "inherit" };
const result: HighlightResult = { tokens: [[token]] };
const separator: CSVSeparator = ";";
void result;
const tableProps: TableCopyDropdownProps = {};
h(TableCopyDropdown, tableProps);
const props: StreamdownProps = { children: "# Hello", plugins, mode: "streaming", isAnimating: false, controls: { table: { csvSeparator: separator, download: { filename: "report" } }, code: { copy: { onCopy() {} } } } };
h(Streamdown, props);
h(defaultComponents.h2, { children: "Heading" });
const componentMap: DefaultComponents = defaultComponents;
const overrides = {
  h2: (props: ExtraProps & { children?: VNodeChild; className?: string }) => h(componentMap.h2, { ...props, className: "custom-heading" }),
  a: (props: ExtraProps & { children?: VNodeChild; href?: string }) => h(componentMap.a, props),
};
h(Streamdown, { components: overrides, children: "## Custom" });
h(CodeBlock, { code: "const answer = 42", language: "ts", className: "custom-code" });
`,
  );
  await writeFile(
    path.join(scratch, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        skipLibCheck: false,
        noEmit: true,
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        types: [],
      },
      include: ["consumer.ts"],
    }),
  );
  run(process.execPath, [
    path.join(root, "node_modules/typescript/bin/tsc"),
    "-p",
    "tsconfig.json",
  ]);
  await writeFile(
    path.join(scratch, "consumer.mjs"),
    `
import assert from "node:assert/strict";
import { createSSRApp, h } from "vue";
import { renderToString } from "@vue/server-renderer";
import { Streamdown, parseMarkdownIntoBlocks } from ${JSON.stringify(pkg.name)};
const html = await renderToString(createSSRApp({ render: () => h(Streamdown, { children: "# Hello\\n\\n**world**", mode: "static" }) }));
assert.match(html, /<h1[^>]*>Hello<\\/h1>/);
assert.match(html, /data-streamdown="strong"/);
assert.equal(parseMarkdownIntoBlocks("# Hello").length, 1);
console.log("Packed consumer: ESM imports, strict NodeNext declarations and SSR passed without React, Shiki or Mermaid.");
`,
  );
  process.stdout.write(run(process.execPath, ["consumer.mjs"]));
  const peers = await Promise.all(
    ["shiki", "mermaid", "katex"].map(async (name) => {
      const version = JSON.parse(
        await readFile(
          path.join(root, "node_modules", name, "package.json"),
          "utf8",
        ),
      ).version;
      return `${name}@${version}`;
    }),
  );
  console.log("Checking optional plugin subpaths with their peers installed…");
  run("npm", [
    "install",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--registry=https://registry.npmjs.org/",
    ...peers,
  ]);
  await writeFile(
    path.join(scratch, "consumer.ts"),
    `
import { h } from "vue";
import { Streamdown, type PluginConfig } from ${JSON.stringify(pkg.name)};
import { code } from ${JSON.stringify(pkg.name + "/code")};
import { math } from ${JSON.stringify(pkg.name + "/math")};
import { mermaid } from ${JSON.stringify(pkg.name + "/mermaid")};
import { cjk } from ${JSON.stringify(pkg.name + "/cjk")};
const plugins: PluginConfig = { code, math, mermaid, cjk };
h(Streamdown, { children: "# Plugins", plugins });
`,
  );
  run(process.execPath, [
    path.join(root, "node_modules/typescript/bin/tsc"),
    "-p",
    "tsconfig.json",
  ]);
  await writeFile(
    path.join(scratch, "plugins.mjs"),
    `
import assert from "node:assert/strict";
const name = ${JSON.stringify(pkg.name)};
const plugins = {};
for (const plugin of ["code", "math", "mermaid", "cjk"]) {
  const module = await import(name + "/" + plugin);
  assert(module[plugin], "Missing plugin export: " + plugin);
  plugins[plugin] = module[plugin];
}
const { Streamdown } = await import(name);
const { createSSRApp, h } = await import("vue");
const { renderToString } = await import("@vue/server-renderer");
const markdown = ${JSON.stringify("中文**强调**文字\n\n$$\nx^2\n$$\n\n```js\nconst x = 42;\n```\n\n```mermaid\ngraph TD; A-->B\n```")};
const html = await renderToString(createSSRApp({ render: () => h(Streamdown, { children: markdown, mode: "static", controls: false, plugins }) }));
assert(html.includes('data-streamdown="code-block-body"'), "Packed async code renderer did not load");
assert(html.includes('class="katex"'), "Packed math renderer did not load");
assert(html.includes('data-streamdown="strong"'), "Packed CJK parser did not run");
assert(html.includes('min-h-[200px]'), "Packed Mermaid chunk did not defer server rendering");
`,
  );
  run(process.execPath, ["plugins.mjs"]);
  const installed = await readdir(path.join(scratch, "node_modules"));
  assert(
    !installed.includes("react") && !installed.includes("react-dom"),
    "A plugin introduced React",
  );
  console.log(
    "All plugin entry points, lazy renderer chunks, strict types and rich SSR passed without React.",
  );
  console.log(
    `Package contents verified: ${packed.files.length} files, ${packed.size} compressed bytes.`,
  );
} catch (error) {
  if (error.stdout) process.stderr.write(error.stdout);
  if (error.stderr) process.stderr.write(error.stderr);
  throw error;
} finally {
  await rm(scratch, { recursive: true, force: true });
}
