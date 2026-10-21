# Release checklist

A release is manual. CI validates the repository but does not publish to npm or GitHub.

1. Complete every item in `docs/PARITY.md` against the pinned source. Resolve differences or document an explicitly accepted framework adaptation.
2. Update `CHANGELOG.md`, package version and lockfile together. Ensure README examples use the actual package name/version.
3. From a clean installation, run `pnpm check` and `pnpm test:browser`. Review coverage, browser artifacts and warnings; do not silently exclude failing behavior.
4. Run `npm pack --dry-run --ignore-scripts` and inspect files, licenses, ESM exports, declaration paths and package size. Development references and tests must not ship.
5. Confirm the isolated packed consumer passes strict NodeNext TypeScript, ESM imports and SSR without React. Verify optional plugin subpaths with their peers installed.
6. Confirm CI passes on every supported Node version. Check attribution, pinned upstream revision and release notes.
7. Review `npm publish --dry-run` output. Publishing, tagging and pushing are separate maintainer actions; this repository does not perform them automatically.

When updating upstream, refresh source provenance and the behavior inventory first, then rerun the complete audit. A newer upstream version is not implied by a compatible-looking API.
