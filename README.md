# Streamdown Vue

A native Vue 3 port of [Vercel Streamdown](https://github.com/vercel/streamdown), targeting **Streamdown 2.7.1** at the commit recorded in [upstream.json](./upstream.json).

Render incomplete Markdown as it streams, with the same repair, block parsing, AST pipeline, default components and interactive controls as the pinned reference. The production package does not depend on React. The vendored React implementation is used only for development and differential tests.

The pinned port has passed native and differential tests on Node 22 and 24, real-browser tests, and strict packed-consumer checks. See [docs/VALIDATION.md](./docs/VALIDATION.md) for evidence and framework boundaries.

## Installation

The package name is `@chenenci/streamdown-vue`. Until it is published, install a local tarball:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm pack --pack-destination .cache
# In your application:
pnpm add /path/to/streamdown-vue/.cache/chenenci-streamdown-vue-0.1.0.tgz
```

Vue 3.5 or later is required. Development and builds require Node.js 22 or later.

## Basic streaming

```vue
<script setup lang="ts">
import { ref } from "vue";
import { Streamdown } from "@chenenci/streamdown-vue";
import "@chenenci/streamdown-vue/styles.css";

const markdown = ref("");
const isStreaming = ref(false);

async function consume(chunks: AsyncIterable<string>) {
  markdown.value = "";
  isStreaming.value = true;
  try {
    for await (const chunk of chunks) markdown.value += chunk;
  } finally {
    isStreaming.value = false;
  }
}
</script>

<template>
  <Streamdown
    :children="markdown"
    :is-animating="isStreaming"
    mode="streaming"
    caret="block"
  />
</template>
```

Pass the **full accumulated source**, rather than only the newest chunk. Repair applies to a derived display string; retain the original source in your application. Keep `mode="streaming"` when the response finishes and set `isAnimating` to `false`. Use `mode="static"` for complete documents that do not need streaming repair.

A default slot is also supported: `<Streamdown>{{ markdown }}</Streamdown>`.

## Styling

The built-in components use Tailwind utility classes and semantic color tokens. Importing `styles.css` supplies animation styles; your application must also generate the utility classes.

With Tailwind CSS v4, add this to your application stylesheet (adjust the relative path to your stylesheet):

```css
@import "tailwindcss";
@source '../node_modules/@chenenci/streamdown-vue/dist';
@import "@chenenci/streamdown-vue/styles.css";

@theme {
  --color-background: #fff;
  --color-foreground: #202020;
  --color-muted: #f0f1f3;
  --color-muted-foreground: #686b73;
  --color-border: #dddfe4;
  --color-primary: #2857cf;
  --color-primary-foreground: #fff;
  --color-sidebar: #f7f8fa;
}
```

For Tailwind v3, include `node_modules/@chenenci/streamdown-vue/dist/**/*.js` in `content` and map the same semantic colors in your theme. `prefix="tw"` supports Tailwind v4's `prefix(tw)` convention. Override default components or styles for a different design system.

## Plugins

Plugin implementations are preserved from the pinned upstream and exposed as subpaths. Only import those you use:

```ts
import { Streamdown } from "@chenenci/streamdown-vue";
import { code } from "@chenenci/streamdown-vue/code";
import { math } from "@chenenci/streamdown-vue/math";
import { mermaid } from "@chenenci/streamdown-vue/mermaid";
import { cjk } from "@chenenci/streamdown-vue/cjk";
import "katex/dist/katex.min.css";

const plugins = { code, math, mermaid, cjk };
```

```vue
<Streamdown :children="markdown" :plugins="plugins" />
```

Install `shiki` for syntax highlighting and `mermaid` for diagrams. These are optional peer dependencies. KaTeX is also installed transitively by the math parser dependency; its CSS must be imported by applications that enable math. Neither diagrams nor highlighting is loaded by the core entry point.

The default math plugin recognizes `$$...$$`. To also recognize `$...$`, use `createMathPlugin({ singleDollarTextMath: true })`. The code plugin supports dual themes and incremental tokenization. Compatible upstream plugin objects can also be supplied; renderer components must be Vue components.

## Controls and custom rendering

```ts
const controls = {
  code: {
    copy: { onCopy: () => console.log("Copied") },
    download: { filename: "snippet" },
  },
  table: {
    copy: true,
    download: { filename: "report" },
    csvSeparator: ";",
    fullscreen: true,
  },
  mermaid: { copy: true, download: true, fullscreen: true, panZoom: true },
  image: { download: true },
};
```

Set `controls={false}` in JSX, or `:controls="false"` in a template, to hide controls. Code/table height limits default to 400/300 pixels; use `0` or `Infinity` to remove the limit. Streaming containers follow the bottom until the user scrolls up.

Override Markdown tags with `components`. Custom components receive the HAST `node`, HTML properties, `className`, and content both through a `children` prop and a default slot:

```ts
import { defineComponent, h } from "vue";
import { defaultComponents } from "@chenenci/streamdown-vue";

const Heading = defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(defaultComponents.h2, { ...attrs, className: "text-blue-500" }, slots);
  },
});
const components = { h2: Heading };
```

Use `plugins.renderers` to render a fence language with a Vue component. It receives `code`, `language`, `isIncomplete` and `meta`. `components.inlineCode` overrides only inline code. `codeBlockRawLanguages` renders selected languages verbatim without highlighting or controls; custom renderers and Mermaid take precedence.

`useIsCodeFenceIncomplete()` returns a readonly **computed ref** in this Vue package. Call it once in `setup()` and read `.value` in JavaScript (templates unwrap it automatically).

## Configuration and SSR

See [docs/API.md](./docs/API.md) for the public options and exports.

The upstream update comparator is preserved: content and supported live inputs invalidate rendering, while options such as `portal`, `components`, `controls`, `icons`, parser plugin arrays and element filters should be treated as initializing configuration. To replace those independently of content, remount with a changed Vue `key`. Stable earlier blocks reuse their parsed render result.

The core supports Vue server rendering. Diagrams and browser interactions are deferred to the client. A `portal` can be an element or a function returning an element; it is resolved when an overlay opens, not while rendering on the server. Supply a target inside your modal or shadow root when needed.

Raw HTML follows the upstream `rehype-raw` → sanitization → hardening pipeline. `allowedTags`, `literalTagContent`, element filters and explicit remark/rehype plugins provide the same extension points. Supplying custom parser plugins replaces the corresponding default list, so include the defaults when you want to retain them. External links use the link confirmation UI by default.

## Development and verification

```sh
pnpm install --frozen-lockfile
pnpm verify:upstream
pnpm typecheck
pnpm test:coverage
pnpm build
pnpm test:package
pnpm exec playwright install chromium
pnpm test:browser
pnpm format:check
```

`pnpm preview:parity` opens a local fixture rendering the pinned React implementation and Vue port side by side. The browser suite also checks real plugin rendering, clipboard formats, downloaded bytes, overlays, scrolling and zoom controls.

The source origin, framework boundaries, verification scope and remaining audit are recorded in [docs/PARITY.md](./docs/PARITY.md). See [CONTRIBUTING.md](./CONTRIBUTING.md) for changes and [docs/RELEASING.md](./docs/RELEASING.md) for release gates.

## License

Apache-2.0. See [LICENSE](./LICENSE), [NOTICE](./NOTICE) and [upstream.json](./upstream.json) for attribution and pinned source provenance.
