import { describe, expect, it, vi } from "vitest";
import { harness } from "./harness";

const source =
  "# Title\n\nשלום **עולם**\n\n> quote\n\n- first\n- second\n\n`inline`\n\n```ts startLine=4\nconst x = 1;\n```\n\n| A | B |\n| - | -: |\n| x | y |\n\n[Example](https://example.com)";
const cases: [string, Record<string, unknown>][] = [
  ["defaults", {}],
  ["static", { mode: "static" }],
  ["controls disabled", { controls: false }],
  [
    "copy only",
    {
      controls: {
        code: { download: false },
        table: { download: false, fullscreen: false },
      },
    },
  ],
  [
    "downloads only",
    {
      controls: {
        code: { copy: false },
        table: { copy: false, fullscreen: false },
      },
    },
  ],
  ["table controls disabled", { controls: { table: false } }],
  ["code controls disabled", { controls: { code: false } }],
  ["pending", { isAnimating: true }],
  ["raw language", { codeBlockRawLanguages: ["ts"] }],
  ["no line numbers", { lineNumbers: false }],
  ["bounded containers", { codeBlockMaxHeight: "20rem", tableMaxHeight: 100 }],
  ["unbounded containers", { codeBlockMaxHeight: 0, tableMaxHeight: Infinity }],
  ["left-to-right", { dir: "ltr" }],
  ["right-to-left", { dir: "rtl" }],
  ["automatic direction", { dir: "auto" }],
  ["static automatic direction", { dir: "auto", mode: "static" }],
  ["class prefix", { prefix: "tw", className: "p-4" }],
  [
    "root attributes",
    { "data-message-id": "42", "aria-busy": true, "aria-label": "Reply" },
  ],
  ["link safety disabled", { linkSafety: { enabled: false } }],
  [
    "translations",
    {
      translations: {
        copyCode: "Copy source",
        viewFullscreen: "Expand",
        downloadFile: "Save",
      },
    },
  ],
  [
    "element filtering",
    { disallowedElements: ["strong"], unwrapDisallowed: true },
  ],
  ["allow elements", { allowedElements: ["p", "strong"] }],
  ["without incomplete repair", { parseIncompleteMarkdown: false }],
];

describe("paired public options", () => {
  it.each(cases)(
    "matches %s and reverts dynamically",
    async (_name, options) => {
      const run = await harness();
      try {
        await run.update(source, options);
        await vi.waitFor(run.compare);
        // Replacing options while keeping the same Markdown exercises live contexts.
        const reset = Object.fromEntries(
          Object.keys(options).map((key) => [key, undefined]),
        );
        await run.update(source, {
          ...reset,
          mode: "streaming",
          controls: true,
          isAnimating: false,
        });
        await vi.waitFor(run.compare);
      } finally {
        await run.dispose();
      }
    },
  );
});
