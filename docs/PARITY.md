# Upstream parity contract

Target: `vercel/streamdown` commit
`a9fb2a2c2431e5e32af920795b9c49c075ee7c6e` (`streamdown` package version 2.7.1).

The goal is the complete public feature surface and observable behavior of that
snapshot. Passing a subset of the tests is not a declaration of full parity.

## Implementation boundaries

- Reuse remend 1.4.0 and the exact parser/plugin dependency versions in the lockfile.
- Preserve framework-independent upstream runtime logic. `verify:upstream` compares
  transpiled implementations; type annotations and ESM import extensions can differ.
- Render the same HAST through hast-util-to-jsx-runtime using a Vue runtime adapter.
- Replace React state, contexts, lifecycle effects and portals with Vue primitives.
- Reuse the official plugin implementations through optional package subpath exports.
  Consumers can also supply compatible upstream plugin objects. The core has no React
  runtime dependency.

## Verification layers

1. `test/parity/core.test.ts`: every-character remend/block boundaries, intermediate
   mdast/hast, framework-neutral HTML and representative built-in markup.
2. `test/parity/streaming.test.ts`: live React/Vue DOM comparison after successive
   chunks, completion, truncation, replacement, open/closed fences and placeholders.
3. `__tests__`: native Vue component/interaction tests plus tests adapted from the
   upstream implementation. Test changes for newer upstream behavior retain the
   behavior assertion (for example logical-direction classes and portal destinations).
4. `test/browser`: actual browser behavior with the pinned React reference alongside
   the Vue port, including real optional plugins, overlays and scrolling.
5. Package consumer checks: build, packed exports, strict declaration compilation,
   server rendering and an installation without React.

DOM comparison ignores framework comment anchors and React DOM server's automatic
image-preload hints. CSS style strings are compared through DOM CSS serialization.
Visible markup, text, attributes, classes and state are otherwise retained.

## Completed local release audit

The audit below is backed by the feature evidence and results in
[VALIDATION.md](./VALIDATION.md). It applies to the pinned snapshot.

- [x] Audit every upstream public prop and runtime export against the Vue surface.
- [x] Complete native and differential tests for all controls and custom components.
- [x] Verify dynamic plugin/context replacements, async races and unmount cleanup.
- [x] Verify bounded code/table scrolling, auto-fit, zoom/pan and all portals.
- [x] Verify animation timing and stable-block reuse against the pinned reference.
- [x] Run real-browser tests and inspect rendered results.
- [x] Run strict packed-consumer type/SSR/import tests without React installed.
- [x] Run coverage, formatting, build and CI-equivalent checks.
- [x] Finish package usage, maintenance and release documentation.

## Updating the reference

Update the vendored snapshot and `upstream.json` together, inspect every changed
source module, update only tests whose expected upstream behavior changed, then
run all verification layers. Never replace the reference merely to make a failing
parity test pass.

## Native Vue interfaces

Custom renderers, icons and components use Vue component types and slots.
`useIsCodeFenceIncomplete()` returns a computed ref. The root comparator and
stable-block reuse follow upstream, including its initializing options; README
describes remounting with a key for independent configuration changes.

Framework DOM bookkeeping and SSR scheduling differences are recorded in
[VALIDATION.md](./VALIDATION.md). They do not replace any Markdown, plugin or
control feature. GitHub CI is configured; remote execution and publication happen
when a maintainer pushes/releases the repository.
