# FlowMD

Streaming Markdown for Vue 3.

[![CI](https://github.com/uraraneko/flowmd/actions/workflows/ci.yml/badge.svg)](https://github.com/uraraneko/flowmd/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)

FlowMD renders Markdown as it arrives, including unfinished emphasis, links, tables, and code fences. It provides native Vue components, configurable renderers, and optional plugins for syntax highlighting, math, diagrams, and CJK text.

- **Streaming rendering** — repairs incomplete syntax for display and reuses unchanged blocks as content grows.
- **Code and diagrams** — optional Shiki highlighting and Mermaid rendering, with copy, download, and fullscreen controls.
- **Math and CJK** — optional KaTeX rendering and CJK-aware emphasis and strikethrough parsing.
- **Customization** — Vue component overrides, custom fence renderers, remark/rehype plugins, translations, and icons.
- **Layout and interaction** — RTL support, bounded code and table scrolling, and configurable overlay targets.
- **Server rendering** — supports Vue SSR, with diagrams and browser interactions deferred to the client.

## Installation

Install FlowMD in your Vue application:

```sh
npm install @uraraneko/flowmd
```

Requirements: Vue **3.5+**, an ESM-compatible application, and Node.js **22+** for development or server rendering. The default components use Tailwind CSS utilities; see [Styling](#styling) for setup.

## Quick start

```vue
<script setup lang="ts">
import { ref } from "vue";
import { Streamdown } from "@uraraneko/flowmd";
import "@uraraneko/flowmd/styles.css";

const markdown = ref("## Hello\n\nMarkdown rendered with **FlowMD**.");
const isStreaming = ref(false);
</script>

<template>
  <Streamdown :children="markdown" :is-animating="isStreaming" caret="block" />
</template>
```

Pass the complete accumulated Markdown string on each update. When the stream ends, set `isAnimating` to `false` and keep `mode="streaming"`, the default mode.

For an existing source of text chunks, append each chunk to the same value:

```ts
async function consume(chunks: AsyncIterable<string>) {
  markdown.value = "";
  isStreaming.value = true;

  try {
    for await (const chunk of chunks) {
      markdown.value += chunk;
    }
  } finally {
    isStreaming.value = false;
  }
}
```

Syntax repair applies to the displayed content. Keep the original source in application state. For complete documents that do not need streaming repair, use `mode="static"`.

Content can also be supplied through the default slot:

```vue
<Streamdown>{{ markdown }}</Streamdown>
```

## Styling

The package stylesheet provides streaming animations and caret styles. The default components also require Tailwind utilities and semantic color tokens from your application.

For Tailwind CSS v4, include the package's built output in source detection and map the tokens to your theme. Adjust the source path relative to your application stylesheet:

```css
@import "tailwindcss";
@source "../node_modules/@uraraneko/flowmd/dist";

@theme {
  --color-background: #ffffff;
  --color-foreground: #202020;
  --color-muted: #f0f1f3;
  --color-muted-foreground: #686b73;
  --color-border: #dddfe4;
  --color-primary: #2857cf;
  --color-primary-foreground: #ffffff;
  --color-sidebar: #f7f8fa;
}
```

The values above are a minimal light theme. Use your application's existing tokens when available. For Tailwind CSS v3, add `node_modules/@uraraneko/flowmd/dist/**/*.js` to `content` and configure the same colors in your theme.

Use `prefix="tw"` with Tailwind v4's `prefix(tw)` convention. Component overrides allow a different design system to provide its own markup and styling.

## Plugins

Plugins are available as separate entry points. Import and register the features your application needs:

| Feature             | Entry point                 | Additional dependency    |
| ------------------- | --------------------------- | ------------------------ |
| Syntax highlighting | `@uraraneko/flowmd/code`    | Shiki                    |
| Math                | `@uraraneko/flowmd/math`    | KaTeX and its stylesheet |
| Diagrams            | `@uraraneko/flowmd/mermaid` | Mermaid                  |
| CJK text handling   | `@uraraneko/flowmd/cjk`     | None                     |

For all four plugins, install the supported peer versions:

```sh
pnpm add 'shiki@^4.4.3' 'katex@^0.16.27' 'mermaid@^11.16.1'
```

```vue
<script setup lang="ts">
import { Streamdown } from "@uraraneko/flowmd";
import { code } from "@uraraneko/flowmd/code";
import { math } from "@uraraneko/flowmd/math";
import { mermaid } from "@uraraneko/flowmd/mermaid";
import { cjk } from "@uraraneko/flowmd/cjk";
import "@uraraneko/flowmd/styles.css";
import "katex/dist/katex.min.css";

defineProps<{ markdown: string; isStreaming?: boolean }>();

const plugins = { code, math, mermaid, cjk };
</script>

<template>
  <Streamdown
    :children="markdown"
    :is-animating="isStreaming"
    :plugins="plugins"
  />
</template>
```

The math plugin recognizes `$$...$$` by default. Enable single-dollar inline math with `createMathPlugin({ singleDollarTextMath: true })` from `@uraraneko/flowmd/math`. The code plugin supports light/dark theme pairs through `createCodePlugin({ themes: [lightTheme, darkTheme] })` from `@uraraneko/flowmd/code`.

## Configuration

| Prop                 | Default            | Description                                                             |
| -------------------- | ------------------ | ----------------------------------------------------------------------- |
| `children`           | —                  | Complete accumulated Markdown string; a default slot is also supported. |
| `mode`               | `"streaming"`      | Streaming repair or static document rendering.                          |
| `isAnimating`        | `false`            | Indicates an active stream and controls the streaming UI.               |
| `plugins`            | —                  | Optional code, math, Mermaid, CJK, and custom fence renderers.          |
| `components`         | Built-in renderers | Vue component overrides for Markdown elements.                          |
| `controls`           | `true`             | Enable or configure code, table, image, and diagram controls.           |
| `codeBlockMaxHeight` | `400`              | Code block height limit, in pixels or a CSS length.                     |
| `tableMaxHeight`     | `300`              | Table height limit, in pixels or a CSS length.                          |
| `lineNumbers`        | `true`             | Show code line numbers.                                                 |
| `dir`                | —                  | `"ltr"`, `"rtl"`, or per-block `"auto"` detection.                      |

See the [API reference](./docs/API.md) for all props, exports, and plugin options.

### Controls

Use `:controls="false"` to hide all controls, or configure individual features:

```ts
import type { ControlsConfig } from "@uraraneko/flowmd";

const controls: ControlsConfig = {
  code: { copy: true, download: { filename: "snippet" } },
  table: { copy: true, download: true, fullscreen: true, csvSeparator: ";" },
  mermaid: { copy: true, download: true, fullscreen: true, panZoom: true },
  image: { download: true },
};
```

Pass the configuration with `<Streamdown :children="markdown" :controls="controls" />`. Set a height limit to `0` or `Infinity` to remove it. During streaming, bounded containers follow new content until the user scrolls up.

### Custom components

Override individual elements while composing the default renderers:

```ts
import { defineComponent, h } from "vue";
import { defaultComponents } from "@uraraneko/flowmd";

const Heading = defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(defaultComponents.h2, { ...attrs, className: "text-sky-600" }, slots);
  },
});

const components = { h2: Heading };
```

Register the map with `<Streamdown :children="markdown" :components="components" />`. Custom components receive the HAST `node`, HTML properties, `className`, a `children` prop, and a default slot. Use `components.inlineCode` to override only inline code.

For custom fenced languages, register `plugins.renderers`. A renderer receives `code`, `language`, `isIncomplete`, and `meta`. The `useIsCodeFenceIncomplete()` composable returns a readonly computed ref; call it in `setup()` and read `.value` in JavaScript.

### Configuration updates

Content and supported live options update existing blocks. Initializing options—including component maps, controls, icons, parser plugin arrays, and portal configuration—follow the pinned upstream's update behavior. To replace these independently of Markdown content, remount the component with a changed Vue `key`.

## HTML and server rendering

Raw HTML passes through parsing, sanitization, and hardening. Use `allowedTags`, `literalTagContent`, and element filters to customize the output. Supplying `remarkPlugins` or `rehypePlugins` replaces that default plugin list; include the exported defaults when retaining their behavior.

Vue SSR is supported. Diagrams and browser interactions run on the client. A `portal` can be a DOM element or a function returning one; the target is resolved when an overlay opens. External links show a confirmation dialog by default, configurable through `linkSafety`.

## Documentation

| Document                           | Contents                                                       |
| ---------------------------------- | -------------------------------------------------------------- |
| [API reference](./docs/API.md)     | Props, exports, plugins, and Vue interfaces.                   |
| [Compatibility](./docs/PARITY.md)  | Upstream revision, behavioral scope, and framework boundaries. |
| [Validation](./docs/VALIDATION.md) | Test coverage and package verification.                        |
| [Contributing](./CONTRIBUTING.md)  | Local setup and contribution guidelines.                       |
| [Releasing](./docs/RELEASING.md)   | CI operation and release procedure.                            |

## Development

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm exec playwright install chromium
pnpm test:browser
```

`pnpm check` runs formatting, source comparison, type checks, coverage, the build, and isolated package-consumer checks. `pnpm preview:parity` starts a local comparison fixture for the Vue renderer and its React reference.

## Acknowledgements and license

FlowMD is a native Vue adaptation of [Vercel Streamdown](https://github.com/vercel/streamdown), based on Streamdown **2.7.1**, with earlier Vue adaptation work from [brucewar/streamdown-vue](https://github.com/brucewar/streamdown-vue). The package has no React runtime dependency.

Licensed under [Apache-2.0](./LICENSE). See [NOTICE](./NOTICE) for attribution and [upstream.json](./upstream.json) for the pinned source revisions.
