# Validation record

Verified locally on 2026-10-21 against Streamdown **2.7.1**, upstream commit
`a9fb2a2c2431e5e32af920795b9c49c075ee7c6e`.

## Gates

| Check                                                                            | Result                                                                 |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Frozen pnpm installation                                                         | Pass; pnpm 10.32.1                                                     |
| Formatting, source verification, strict TypeScript including unused declarations | Pass                                                                   |
| Full suite on Node 22.22.0                                                       | 114 modules, **1,423 tests passed**                                    |
| Full suite on Node 24.22.0                                                       | **1,423 tests passed**                                                 |
| Chromium browser suite                                                           | **10 tests passed**                                                    |
| Packed consumer without React, Shiki or Mermaid                                  | ESM import, strict NodeNext declarations and Vue SSR passed            |
| Packed consumer with all optional peers                                          | All four plugin entry points and strict types passed without React     |
| Package content / publish dry run                                                | Passed; development/reference files excluded; no publication performed |

Development comparison uses Vue 3.5.44 and React 19.3.1 with the same locked parser
and plugin dependencies. The production package has no React dependency.

Coverage applies to shipped implementation sources, including plugins. Tests,
browser fixtures and the vendored React oracle are excluded **after source-map
remapping**:

| Metric     | Coverage | Enforced minimum |
| ---------- | -------: | ---------------: |
| Statements |   97.05% |              90% |
| Lines      |   97.00% |              90% |
| Functions  |   98.11% |              90% |
| Branches   |   89.62% |              85% |

## Feature evidence

| Requirement                             | Evidence                                                                                                                                                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Upstream public surface                 | `test/parity/surface.test.ts` checks every runtime/type export, Streamdown-specific prop and inherited Markdown pipeline option; packed TypeScript tests cover composition through `defaultComponents`, public control props and highlighter/CSV types |
| Repair, blocks and ASTs                 | `test/parity/core.test.ts` compares Remend and block splitting at every character prefix, and mdast/hast after intermediate chunks across 19 fixture documents                                                                                         |
| Stable streaming updates                | `test/parity/streaming.test.ts` compares live DOM for growth, truncation, replacement, completion, code fences, placeholders and dynamic math configuration; stable code blocks do not re-parse or re-highlight on unrelated tail updates              |
| Vue template and slot regressions       | `test/parity/review-regressions.test.ts` verifies unchanged-content streaming completion from compiled SFC kebab-case props, live class/line/height/raw-language options and both inline/block code override slots during updates                      |
| Default components and extension points | Native equivalents of all 97 upstream test modules, plus paired option tests for tag filtering, custom renderers, raw fences, custom tags, metadata, RTL, prefixes, translations and root attributes                                                   |
| Animation and caret lifecycle           | Paired deterministic animation tests, stable host identity assertions, native upstream issue regressions, caret SSR/hydration tests and callback-after-commit/SSR suppression tests                                                                    |
| Async behavior and cleanup              | Stale highlighter rejection; Mermaid renders serialize and coalesce chunks, wake at stream completion, keep the last valid diagram and ignore results after unmount; custom async renderer skeletons are tested                                        |
| Controls and overlays                   | Paired menu/dialog markup; native copy/download/image/link tests; real browser clipboard formats, exact downloaded code/table/image bytes and filenames, loaded/broken image states, portal targets, fullscreens and body scroll locks                 |
| Scrolling and diagram interaction       | Native pinned-frame/scroll-up tests, upstream auto-fit tests, real browser bounded code scrolling, Mermaid zoom/reset and resizing with preserved user zoom                                                                                            |
| Official plugins                        | Preserved runtime source and adapted upstream tests for code, math, Mermaid and CJK; actual browser rendering uses the real plugins                                                                                                                    |
| Package readiness                       | Build plus isolated npm-tarball consumers, no React installation, strict declarations with `skipLibCheck: false`, all ESM subpaths, SSR, package whitelist and dry runs                                                                                |

`verify:upstream` compares the transpiled runtime of 18 independent core modules,
the Mermaid fit helpers, animation CSS and all four plugin implementations to the
pinned source. A second source audit checks class tokens, native tags and
accessibility/data attributes across 50 corresponding modules. These checks
supplement the behavioral tests.

The Mermaid side-by-side browser screenshot was inspected: diagram geometry,
toolbars, icons and fitting matched. Browser failure artifacts and the coverage
report are produced locally and uploaded by CI.

## Framework boundaries

The Markdown AST pipeline and feature behavior are preserved. React components,
contexts, effects, portals and Suspense are implemented with Vue primitives.
`useIsCodeFenceIncomplete` therefore returns a Vue computed ref; custom renderers
and icons are Vue components. Default slots and `class` are supported alongside
the applicable `children` and `className` interfaces.

Framework comment anchors, React server image-preload hints and framework-specific
SSR async scheduling are not byte-for-byte output contracts. Vue can also omit an
empty style attribute that React DOM leaves after removing its final declaration;
this does not change built-in styling. The paired DOM tests retain actual classes,
text, attributes and CSS values; comments and React-generated image preload hints
are normalized explicitly.

Initializing configuration and stable-block invalidation follow the pinned
upstream comparator. In particular, changing a portal or renderer configuration
independently of Markdown should use a changed Vue `key`, as described in README.

GitHub Actions is configured for Node 22 and 24. Its equivalent commands were run
locally; a remote GitHub run requires pushing this repository. No GitHub or npm
publication is part of this validation.
