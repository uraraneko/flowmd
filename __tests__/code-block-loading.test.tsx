import { mount } from "@vue/test-utils";
import { h, nextTick, type VNodeChild } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, waitFor } from "./helpers/testing-library-vue";
import type { HighlightOptions, HighlightResult } from "../lib/plugin-types";

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const createStreamdownContext = (defaultStreamdownContext: any) => ({
  ...defaultStreamdownContext,
  shikiTheme: ["github-light", "github-dark"] as [string, string],
  controls: true,
  isAnimating: false,
  mode: "streaming" as const,
});

describe("Code block loading behavior", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doUnmock("../lib/code-block/highlighted-body");
  });

  it("renders readable text and no loader before lazy module resolves", async () => {
    const lazyModule = createDeferred<{
      HighlightedCodeBlockBody: (props: {
        code: string;
        language: string;
        raw: HighlightResult;
      }) => VNodeChild;
    }>();

    let lazyLoaded = false;
    vi.doMock("../lib/code-block/highlighted-body", () =>
      lazyModule.promise.then((mod) => {
        lazyLoaded = true;
        return mod;
      }),
    );

    const { CodeBlock } = await import("../lib/code-block");
    const { StreamdownKey, defaultStreamdownContext } =
      await import("../lib/streamdown-context");

    const wrapper = mount(CodeBlock, {
      props: { code: "const x = 1;\n", language: "javascript" },
      global: {
        provide: {
          [StreamdownKey as symbol]: createStreamdownContext(
            defaultStreamdownContext,
          ),
        },
      },
    });

    const body = wrapper.element.querySelector(
      '[data-streamdown="code-block-body"]',
    );
    expect(body?.textContent).toContain("const x = 1;");
    expect(wrapper.element.querySelector(".animate-spin")).toBeNull();
    expect(lazyLoaded).toBe(false);

    lazyModule.resolve({
      HighlightedCodeBlockBody: () =>
        h(
          "pre",
          { "data-streamdown": "code-block-body" },
          "lazy module resolved",
        ),
    });

    await waitFor(() => {
      expect(wrapper.text()).toContain("lazy module resolved");
      expect(lazyLoaded).toBe(true);
    });
  }, 10_000);

  it("applies highlight styles only after manual callback resolution", async () => {
    const { HighlightedCodeBlockBody } =
      await import("../lib/code-block/highlighted-body");
    const { PluginKey } = await import("../lib/plugin-context");
    const { StreamdownKey, defaultStreamdownContext } =
      await import("../lib/streamdown-context");

    let resolveHighlight: ((result: HighlightResult) => void) | null = null;

    const rawResult: HighlightResult = {
      bg: "transparent",
      fg: "inherit",
      tokens: [
        [
          {
            content: "const x = 1;",
            color: "inherit",
            bgColor: "transparent",
            htmlStyle: {},
            offset: 0,
          },
        ],
      ],
    };

    const highlightedResult: HighlightResult = {
      ...rawResult,
      tokens: [
        [
          {
            ...rawResult.tokens[0][0],
            color: "#ff0000",
          },
        ],
      ],
    };

    const codePlugin = {
      name: "shiki" as const,
      type: "code-highlighter" as const,
      highlight: vi.fn(
        (_: HighlightOptions, callback?: (result: HighlightResult) => void) => {
          resolveHighlight = callback ?? null;
          return null;
        },
      ),
      supportsLanguage: vi.fn().mockReturnValue(true),
      getSupportedLanguages: vi.fn().mockReturnValue(["javascript"]),
      getThemes: vi.fn().mockReturnValue(["github-light", "github-dark"]),
    };

    const wrapper = mount(HighlightedCodeBlockBody, {
      props: {
        code: "const x = 1;",
        language: "javascript",
        raw: rawResult,
      },
      global: {
        provide: {
          [PluginKey as symbol]: { code: codePlugin as any },
          [StreamdownKey as symbol]: createStreamdownContext(
            defaultStreamdownContext,
          ),
        },
      },
    });

    const initialToken = wrapper.element.querySelector(
      '[data-streamdown="code-block-body"] code > span > span',
    ) as HTMLElement | null;
    expect(initialToken).toBeTruthy();
    expect(initialToken?.style.getPropertyValue("--sdm-c")).toBe("inherit");

    await waitFor(() => {
      expect(codePlugin.highlight).toHaveBeenCalledTimes(1);
      expect(resolveHighlight).toBeTruthy();
    });

    await act(() => {
      resolveHighlight?.(highlightedResult);
    });
    await nextTick();

    await waitFor(() => {
      const updatedToken = wrapper.element.querySelector(
        '[data-streamdown="code-block-body"] code > span > span',
      ) as HTMLElement | null;
      expect(updatedToken?.style.getPropertyValue("--sdm-c")).toBe("#ff0000");
    });
  }, 10_000);
});
