# Contributing

Use Node.js 22+ and the pnpm version in `packageManager`. Install with `pnpm install --frozen-lockfile`.

The implementation is a native Vue port of a pinned upstream, not an independent Markdown dialect. Preserve AST processing, plugin order, default markup and observable behavior. Keep framework-specific adaptations in Vue components/composables. Changes to behavior need a reproducing test and a comparison with the pinned React reference.

Do not edit `vendor/upstream` to fix a failing port test. Update the source reference deliberately through the process in `docs/PARITY.md`; preserve license notices and update provenance alongside it.

Run formatting, source verification, type checking, the full coverage suite, browser tests and packed-consumer checks before submitting. Tests that exercise Vue updates must await `nextTick`, the renderer's `rerender`, or the relevant async outcome. Differential tests should compare both implementations after the same user action. Ignore framework bookkeeping only; retain visible attributes, styles and content in comparisons.

The browser fixture is available through `pnpm preview:parity`. Playwright requires Chromium (`pnpm exec playwright install chromium`); on local macOS it can also use the installed Google Chrome. CI uses Playwright's managed Chromium.

Never claim complete compatibility from test counts alone. Inspect the public feature inventory and release checklist, and record limitations with evidence.
