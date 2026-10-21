# Development record

The initial Vue adaptation and Vercel source are pinned in `upstream.json` and
credited in NOTICE. The port targets Streamdown 2.7.1 with native Vue components,
contexts, lifecycle management, portals and asynchronous rendering.

The final audit added full public-surface checks, every-character repair/block
and AST comparisons, live React/Vue streaming and interaction tests, native
regressions, the upstream plugin suites and real-browser verification. It found
and corrected mutable-props processor caching, forwarded code attributes,
default SVG icons, list wrapping, fullscreens, CSV separators, live copy announcements, RTL image controls, callback timing,
redundant highlighting and consumer declaration compatibility.

JavaScript is built through tsup. Declarations use tsc directly to retain valid,
portable NodeNext types. Strict packed-consumer tests exercise both the React-free
core and all plugin entry points.

See VALIDATION.md for the authoritative final results, PARITY.md for the scope and
framework boundaries, and RELEASING.md for the publication procedure.
