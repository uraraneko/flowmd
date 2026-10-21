import { act } from "react";
import { nextTick } from "vue";
import { describe, expect, it, vi } from "vitest";
import { harness } from "./harness";

async function click(react: HTMLElement, vue: HTMLElement) {
  expect(react).toBeTruthy();
  expect(vue).toBeTruthy();
  await act(async () => react.click());
  vue.click();
  await nextTick();
}
const titled = (root: Element, title: string) =>
  root.querySelector<HTMLElement>(`button[title="${title}"]`)!;

describe("interactive markup parity", () => {
  it("matches table copy/download menus, fullscreen and close", async () => {
    const run = await harness();
    try {
      await run.update("| Name | Age |\n| - | - |\n| Alice | 30 |");
      run.compare();
      for (const title of [
        "Copy table",
        "Copy table",
        "Download table",
        "Download table",
        "View fullscreen",
      ]) {
        await click(titled(run.reactHost, title), titled(run.vueHost, title));
        run.compare();
      }
      expect(run.vueOverlays.querySelector("table")).not.toBeNull();
      await click(
        titled(run.reactOverlays, "Copy table"),
        titled(run.vueOverlays, "Copy table"),
      );
      run.compare();
      await click(
        titled(run.reactOverlays, "Exit fullscreen"),
        titled(run.vueOverlays, "Exit fullscreen"),
      );
      run.compare();
    } finally {
      await run.dispose();
    }
  });
  it("matches link confirmation markup and dismisses through its close button", async () => {
    const run = await harness();
    try {
      await run.update("[Example](https://example.com)");
      await click(
        run.reactHost.querySelector("button")!,
        run.vueHost.querySelector("button")!,
      );
      run.compare();
      const close = (root: Element) =>
        root.querySelector<HTMLElement>('button[title="Close"]')!;
      await click(close(run.reactOverlays), close(run.vueOverlays));
      run.compare();
    } finally {
      await run.dispose();
    }
  });
  it("matches Mermaid menus and fullscreen control availability", async () => {
    const plugin = {
      name: "mermaid",
      type: "diagram",
      language: "mermaid",
      getMermaid: () => ({
        initialize() {},
        render: async () => ({
          svg: '<svg viewBox="0 0 100 50"><text>Diagram</text></svg>',
        }),
      }),
    };
    const run = await harness({ plugins: { mermaid: plugin } });
    try {
      await run.update("```mermaid\ngraph TD; A-->B\n```");
      await vi.waitFor(run.compare);
      await click(
        titled(run.reactHost, "Download diagram"),
        titled(run.vueHost, "Download diagram"),
      );
      run.compare();
      await click(
        titled(run.reactHost, "Download diagram"),
        titled(run.vueHost, "Download diagram"),
      );
      await click(
        titled(run.reactHost, "View fullscreen"),
        titled(run.vueHost, "View fullscreen"),
      );
      await vi.waitFor(run.compare);
      expect(titled(run.vueOverlays, "Download diagram")).toBeTruthy();
      await click(
        titled(run.reactOverlays, "Exit fullscreen"),
        titled(run.vueOverlays, "Exit fullscreen"),
      );
      run.compare();
    } finally {
      await run.dispose();
    }
  });
});

it("announces code-copy completion with the same live output", async () => {
  const previous = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  const run = await harness();
  try {
    await run.update("```js\nconst x = 1;\n```");
    await vi.waitFor(run.compare);
    await click(
      titled(run.reactHost, "Copy Code"),
      titled(run.vueHost, "Copy Code"),
    );
    await vi.waitFor(run.compare);
    expect(
      run.vueHost.querySelector('output[aria-live="polite"]')?.textContent,
    ).toBe("Copied");
  } finally {
    await run.dispose();
    if (previous) Object.defineProperty(navigator, "clipboard", previous);
    else delete (navigator as any).clipboard;
  }
});
