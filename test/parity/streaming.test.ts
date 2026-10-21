import { describe, expect, it, vi } from "vitest";
import { harness } from "./harness";
import { fixtures } from "./fixtures";

describe("live React/Vue streaming parity", () => {
  it("rebuilds the parser when math plugins are enabled, replaced and removed", async () => {
    const { math, createMathPlugin } = await import("../../plugins/math");
    const run = await harness({ mode: "streaming" });
    const source = "$x$ and $$y^2$$";
    try {
      await run.update(source);
      run.compare();
      await run.update(source, { plugins: { math } });
      run.compare();
      expect(run.vueHost.querySelector(".katex")).not.toBeNull();
      await run.update(source, {
        plugins: { math: createMathPlugin({ singleDollarTextMath: true }) },
      });
      run.compare();
      expect(run.vueHost.querySelectorAll(".katex")).toHaveLength(2);
      await run.update(source, { plugins: {} });
      run.compare();
      expect(run.vueHost.querySelector(".katex")).toBeNull();
      await run.update(source, { mode: "static", plugins: { math } });
      run.compare();
      await run.update(source, { plugins: {} });
      run.compare();
    } finally {
      await run.dispose();
    }
  });

  it("matches DOM at successive stream chunks, completion, replacement and truncation", async () => {
    const run = await harness({ isAnimating: true, controls: false });
    try {
      for (const source of [
        ...fixtures.slice(0, 5),
        ...fixtures.slice(7, 11),
        fixtures[13],
        fixtures[14],
        fixtures[15],
      ]) {
        for (let end = 0; end < source.length; end += 7) {
          await run.update(source.slice(0, end));
          run.compare();
        }
        await run.update(source, { isAnimating: false });
        run.compare();
        await run.update(source.slice(0, 4), { isAnimating: true });
        run.compare();
      }
      await run.update("**aaaa**");
      run.compare();
      await run.update("**bbbb**");
      run.compare();
    } finally {
      await run.dispose();
    }
  });

  it("matches code blocks as they open, grow and close", async () => {
    const run = await harness({ isAnimating: true, controls: false });
    try {
      for (const source of [
        "```ts\nconst a",
        "```ts\nconst a = 1;",
        "```ts\nconst b = 2;\n",
        "```ts\nconst b = 2;\n```",
        "~~~text\nhello\n~~~",
      ]) {
        await run.update(source);
        await vi.waitFor(run.compare, { timeout: 2500 });
      }
      await run.update("```ts\nconst b = 2;\n```", { isAnimating: false });
      await vi.waitFor(run.compare);
    } finally {
      await run.dispose();
    }
  });

  it("matches placeholders for incomplete images and links", async () => {
    const run = await harness({ isAnimating: true });
    try {
      for (const source of [
        "![alt",
        "![alt](https://exa",
        "[link",
        "[link](https://exa",
        "[link](https://example.com)",
      ]) {
        await run.update(source);
        run.compare();
      }
    } finally {
      await run.dispose();
    }
  });
});

it("does not re-highlight a stable code block when only the tail and plugin container change", async () => {
  const highlight = vi.fn((options: { code: string }) => ({
    bg: "transparent",
    fg: "inherit",
    tokens: [[{ content: options.code, color: "inherit", offset: 0 }]],
  }));
  const plugin = {
    name: "shiki",
    type: "code-highlighter",
    highlight,
    supportsLanguage: () => true,
    getSupportedLanguages: () => ["js"],
    getThemes: () => ["github-light", "github-dark"],
  };
  let passes = 0;
  const recordStablePrefixRuns = () => () => {
    passes++;
  };
  const { defaultRemarkPlugins } = await import("../../index");
  const run = await harness({
    plugins: { code: plugin },
    remarkPlugins: [
      ...Object.values(defaultRemarkPlugins),
      recordStablePrefixRuns,
    ],
  });
  const source = "```js\nconst x = 1;\n```\n\nTail";
  try {
    await run.update(source);
    await vi.waitFor(() => expect(highlight).toHaveBeenCalledTimes(2));
    run.compare();
    expect(passes).toBe(4);
    await run.update(source + " grows", { plugins: { code: plugin } });
    run.compare();
    expect(highlight).toHaveBeenCalledTimes(2);
    expect(passes).toBe(6);
  } finally {
    await run.dispose();
  }
});
