# Public API

The authoritative type definitions are exported from the package root. This port targets the upstream revision in `upstream.json`; it does not automatically track future Streamdown releases.

## Streamdown props

Props use camelCase in JavaScript and can use kebab-case in Vue templates.

| Props                                                                       | Purpose / default                                                                          |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `children`, default slot                                                    | Complete accumulated Markdown string                                                       |
| `mode`                                                                      | `streaming` (default) or `static`                                                          |
| `isAnimating`                                                               | Active stream flag; defaults to `false`                                                    |
| `parseIncompleteMarkdown`, `remend`                                         | Enable repair (default `true`) and customize Remend options                                |
| `parseMarkdownIntoBlocksFn`, `BlockComponent`                               | Override the block splitter or Vue block renderer                                          |
| `normalizeHtmlIndentation`                                                  | Normalize deeply indented HTML; defaults to `false`                                        |
| `components`, `fallbackComponent`                                           | Override tag renderers or provide a renderer for unmapped tags                             |
| `allowedTags`, `literalTagContent`                                          | Extend the sanitizer and optionally treat tag children as literal text                     |
| `remarkPlugins`, `rehypePlugins`, `remarkRehypeOptions`                     | Customize the unified pipeline                                                             |
| `allowElement`, `allowedElements`, `disallowedElements`, `unwrapDisallowed` | Filter output elements                                                                     |
| `skipHtml`, `urlTransform`                                                  | Control raw HTML output and URL transformations                                            |
| `disableAutolinkProtocols`                                                  | Disable selected automatic link protocols while preserving explicit links                  |
| `plugins`                                                                   | Code, math, CJK, Mermaid and custom language renderers                                     |
| `shikiTheme`                                                                | Light/dark themes; explicit pair overrides code-plugin themes                              |
| `mermaid`                                                                   | Mermaid configuration and optional Vue error component receiving `chart`, `error`, `retry` |
| `codeBlockMaxHeight`, `tableMaxHeight`                                      | 400 / 300 pixels; number or CSS length, `0` / `Infinity` disables                          |
| `codeBlockRawLanguages`                                                     | Fence languages rendered as verbatim text; defaults to `[]`                                |
| `lineNumbers`                                                               | Defaults to `true`; fences also support `startLine` metadata and `noLineNumbers`           |
| `controls`                                                                  | Boolean or per-feature control settings; defaults to `true`                                |
| `animated`                                                                  | Boolean or `AnimateOptions` (animation, duration, easing, separator, stagger, backlog)     |
| `caret`                                                                     | Optional `block` or `circle` streaming caret                                               |
| `onAnimationStart`, `onAnimationEnd`                                        | Stream lifecycle callbacks, suppressed in static mode                                      |
| `linkSafety`                                                                | `enabled` defaults to `true`; optional async check and custom modal renderer               |
| `portal`                                                                    | Overlay target element, getter, or `null` for `document.body`                              |
| `dir`                                                                       | `ltr`, `rtl` or per-block `auto` detection                                                 |
| `prefix`, `className`                                                       | Tailwind v4 prefix and root classes                                                        |
| `translations`, `icons`                                                     | Partial UI string and Vue icon component overrides                                         |
| `locale`                                                                    | Vue addition: `en` (default) or `zh-CN`                                                    |
| `data-*`, `aria-*`                                                          | Forwarded to the root container                                                            |

See README's configuration section for upstream-compatible invalidation rules. Use a changed Vue `key` for an independent reconfiguration of initializing options.

## Root runtime exports

- Rendering: `Streamdown`, `Block`, `defaultComponents`.
- Defaults and parsing: `defaultRemarkPlugins`, `defaultRehypePlugins`, `defaultUrlTransform`, `parseMarkdownIntoBlocks`, `normalizeHtmlIndentation`, `detectTextDirection`, `createAnimatePlugin`.
- Code controls: `CodeBlock`, `CodeBlockContainer`, `CodeBlockHeader`, `CodeBlockSkeleton`, `CodeBlockCopyButton`, `CodeBlockDownloadButton`.
- Table controls: `TableCopyDropdown`, `TableDownloadButton`, `TableDownloadDropdown`.
- Table utilities: `escapeMarkdownTableCell`, `extractTableDataFromElement`, `tableDataToCSV`, `tableDataToMarkdown`, `tableDataToTSV`.
- Vue context: `StreamdownContext.Provider`, `StreamdownKey`, `useStreamdownContext`, `useIsCodeFenceIncomplete`.
- Translations: `defaultTranslations`, `enTranslations`, `zhCnTranslations`, `localeTranslations`.

`useIsCodeFenceIncomplete()` returns a readonly computed ref. `useStreamdownContext()` returns a context object whose values remain reactive under supported updates. Native Vue icon overrides can be functional components or `defineComponent` / SFC objects.

The package exports types for all root props, controls, custom renderers, plugin contracts, animation options, translations, icons, table data, component maps and URL/element filters.

## Plugin subpaths

| Import        | Exports                                                                     |
| ------------- | --------------------------------------------------------------------------- |
| `/code`       | `code`, `createCodePlugin`, associated options and highlight result types   |
| `/math`       | `math`, `createMathPlugin`, `MathPlugin`, `MathPluginOptions`               |
| `/mermaid`    | `mermaid`, `createMermaidPlugin`, associated configuration and plugin types |
| `/cjk`        | `cjk`, `createCjkPlugin`, `CjkPlugin`                                       |
| `/styles.css` | Caret and streaming animation styles                                        |

The implementations match the pinned official plugins. Their dependencies and supported versions are declared in `package.json` and fixed for development by `pnpm-lock.yaml`.
