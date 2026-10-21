import { act, render } from "./helpers/testing-library-vue";
import { createSSRApp, nextTick, type VNode, type VNodeChild } from "vue";
import { renderToString as renderVueToString } from "@vue/server-renderer";
const renderToString = (node: VNode) =>
  renderVueToString(createSSRApp({ render: () => node }));
const renderToStaticMarkup = renderToString;
import { describe, expect, it, vi } from "vitest";
import { Streamdown } from "../index";
import type { CustomRendererProps } from "../lib/plugin-types";

const SUPPRESSION_ATTRIBUTE = /:not\(\[([a-z-]+)\]\)/;

const streamdownContainer = (container: HTMLElement) =>
  container.firstElementChild as HTMLElement | null;

// The attribute is read out of the shipped class rather than written here, so a
// rename that reaches only one of the two fails instead of passing vacuously.
const suppressionAttribute = (container: HTMLElement) => {
  const className = streamdownContainer(container)?.className ?? "";
  const match = SUPPRESSION_ATTRIBUTE.exec(className);
  if (!match) {
    throw new Error(
      `no suppression attribute in container class: ${className}`,
    );
  }
  return match[1];
};

const isCaretSuppressed = (container: HTMLElement) =>
  streamdownContainer(container)?.lastElementChild?.hasAttribute(
    suppressionAttribute(container),
  ) ?? false;

const caretVariable = (container: HTMLElement) =>
  streamdownContainer(container)?.style.getPropertyValue("--streamdown-caret");

const VegaRenderer = ({ code }: CustomRendererProps) => (
  <div data-testid="vega-renderer">Vega Chart: {code}</div>
);

describe("caret suppression", () => {
  it("suppresses the caret while a code fence is incomplete", async () => {
    const { container } = render(
      <Streamdown caret="block" isAnimating={true}>
        {"```javascript\nconst x = 1;"}
      </Streamdown>,
    );
    await nextTick();

    expect(isCaretSuppressed(container)).toBe(true);
  });

  it("restores the caret once the code fence completes", async () => {
    const { container, rerender } = render(
      <Streamdown caret="block" isAnimating={true}>
        {"```javascript\nconst x = 1;"}
      </Streamdown>,
    );
    await nextTick();

    expect(isCaretSuppressed(container)).toBe(true);

    await rerender(
      <Streamdown caret="block" isAnimating={true}>
        {"```javascript\nconst x = 1;\n```"}
      </Streamdown>,
    );

    expect(isCaretSuppressed(container)).toBe(false);
  });

  it("suppresses the caret when the last block is a table", async () => {
    const { container } = render(
      <Streamdown caret="block" isAnimating={true}>
        {"| Name | Age |\n| --- | --- |\n| Alice | 30 |"}
      </Streamdown>,
    );
    await nextTick();

    expect(isCaretSuppressed(container)).toBe(true);
  });

  it("suppresses the caret while a table is still streaming", async () => {
    const { container } = render(
      <Streamdown caret="block" isAnimating={true}>
        {"| Name | Age |\n| --- | --- |"}
      </Streamdown>,
    );
    await nextTick();

    expect(isCaretSuppressed(container)).toBe(true);
  });

  it("shows the caret when a table is followed by regular text", async () => {
    const { container } = render(
      <Streamdown caret="block" isAnimating={true}>
        {
          "| Name | Age |\n| --- | --- |\n| Alice | 30 |\n\nText after the table"
        }
      </Streamdown>,
    );
    await nextTick();

    expect(isCaretSuppressed(container)).toBe(false);
  });

  it("shows the caret after a completed code block", async () => {
    const { container } = render(
      <Streamdown caret="block" isAnimating={true}>
        {"```javascript\nconst x = 1;\n```"}
      </Streamdown>,
    );
    await nextTick();

    expect(isCaretSuppressed(container)).toBe(false);
  });

  it("suppresses the caret when blocks are wrapped for text direction", async () => {
    const { container } = render(
      <Streamdown caret="block" dir="auto" isAnimating={true}>
        {"| Name | Age |\n| --- | --- |\n| Alice | 30 |"}
      </Streamdown>,
    );
    await nextTick();

    expect(isCaretSuppressed(container)).toBe(true);
  });

  it("clears the mark from a block that is no longer last", async () => {
    const { container, rerender } = render(
      <Streamdown caret="block" isAnimating={true}>
        {"| Name | Age |\n| --- | --- |\n| Alice | 30 |"}
      </Streamdown>,
    );
    await nextTick();

    const table = streamdownContainer(container)?.lastElementChild;
    expect(table?.hasAttribute(suppressionAttribute(container))).toBe(true);

    await rerender(
      <Streamdown caret="block" isAnimating={true}>
        {"| Name | Age |\n| --- | --- |\n| Alice | 30 |\n\nText after."}
      </Streamdown>,
    );

    expect(table?.hasAttribute(suppressionAttribute(container))).toBe(false);
  });

  it("does not mark anything when the caret is not animating", async () => {
    const { container } = render(
      <Streamdown caret="block" isAnimating={false}>
        {"| Name | Age |\n| --- | --- |\n| Alice | 30 |"}
      </Streamdown>,
    );
    await nextTick();

    expect(isCaretSuppressed(container)).toBe(false);
  });

  // Suppression is derived from the block's markdown source, so it holds for
  // markup Streamdown did not render. A rule selecting Streamdown's own
  // data-streamdown markers would miss every case below, because the consumer's
  // component replaces the element carrying the marker.
  describe("with consumer-supplied renderers", () => {
    it("suppresses the caret under a custom fence renderer", async () => {
      const { container } = render(
        <Streamdown
          caret="block"
          isAnimating={true}
          plugins={{
            renderers: [{ language: "vega-lite", component: VegaRenderer }],
          }}
        >
          {'```vega-lite\n{"mark": "bar"}'}
        </Streamdown>,
      );
      await nextTick();

      expect(
        container.querySelector('[data-testid="vega-renderer"]'),
      ).toBeTruthy();
      expect(isCaretSuppressed(container)).toBe(true);
    });

    it("suppresses the caret under a replaced table component", async () => {
      const { container } = render(
        <Streamdown
          caret="block"
          components={{
            table: (props) => <table data-testid="plain-table" {...props} />,
          }}
          isAnimating={true}
        >
          {"| Name | Age |\n| --- | --- |\n| Alice | 30 |"}
        </Streamdown>,
      );
      await nextTick();

      expect(
        container.querySelector('[data-testid="plain-table"]'),
      ).toBeTruthy();
      expect(isCaretSuppressed(container)).toBe(true);
    });

    it("suppresses the caret under a replaced code component", async () => {
      const { container } = render(
        <Streamdown
          caret="block"
          components={{
            code: (props) => <code data-testid="plain-code" {...props} />,
          }}
          isAnimating={true}
        >
          {"```javascript\nconst x = 1;"}
        </Streamdown>,
      );
      await nextTick();

      expect(isCaretSuppressed(container)).toBe(true);
    });
  });

  // Effects do not run on the server, so the attribute cannot be there to
  // suppress anything and the markup has to omit the caret instead. Without
  // this, a document ending in a table ships a caret that only disappears once
  // hydration runs.
  describe("on the server", () => {
    it("omits the caret when the last block is a table", async () => {
      const markup = await renderToStaticMarkup(
        <Streamdown caret="block" isAnimating={true}>
          {"| Name | Age |\n| --- | --- |\n| Alice | 30 |"}
        </Streamdown>,
      );

      expect(markup).not.toContain("after:content-[var(--streamdown-caret)]");
    });

    it("omits the caret while a code fence is incomplete", async () => {
      const markup = await renderToStaticMarkup(
        <Streamdown caret="block" isAnimating={true}>
          {"```javascript\nconst x = 1;"}
        </Streamdown>,
      );

      expect(markup).not.toContain("after:content-[var(--streamdown-caret)]");
    });

    it("keeps the caret after ordinary prose", async () => {
      const markup = await renderToStaticMarkup(
        <Streamdown caret="block" isAnimating={true}>
          {"Just some prose."}
        </Streamdown>,
      );

      expect(markup).toContain("after:content-[var(--streamdown-caret)]");
    });

    it("hydrates without a mismatch when the caret is suppressed", async () => {
      const element = (
        <Streamdown caret="block" isAnimating={true}>
          {"| Name | Age |\n| --- | --- |\n| Alice | 30 |"}
        </Streamdown>
      );
      const container = document.createElement("div");
      container.innerHTML = await renderToString(element);
      document.body.appendChild(container);
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      const recoverableErrors: unknown[] = [];

      try {
        const root = createSSRApp({ render: () => element });
        root.mount(container);
        await nextTick();

        expect(recoverableErrors).toEqual([]);
        expect(consoleError).not.toHaveBeenCalled();
        expect(isCaretSuppressed(container)).toBe(true);

        root.unmount();
      } finally {
        consoleError.mockRestore();
        container.remove();
      }
    });
  });

  it("renders a static document once on mount", async () => {
    let renders = 0;
    const P = ({ children }: { children?: VNodeChild }) => {
      renders += 1;
      return <p>{children}</p>;
    };
    const components = { p: P };

    render(
      <Streamdown components={components} mode="static">
        {"First paragraph.\n\nSecond paragraph."}
      </Streamdown>,
    );

    expect(renders).toBe(2);
  });

  it("keeps the container's className and style constant across block types", async () => {
    const chunks = [
      "Some prose to start with.",
      "Some prose to start with.\n\n```javascript\nconst x = 1;",
      "Some prose to start with.\n\n```javascript\nconst x = 1;\n```",
      "Some prose to start with.\n\n```javascript\nconst x = 1;\n```\n\n| Name | Age |\n| --- | --- |",
      "Some prose to start with.\n\n```javascript\nconst x = 1;\n```\n\n| Name | Age |\n| --- | --- |\n| Alice | 30 |",
      "Some prose to start with.\n\n```javascript\nconst x = 1;\n```\n\n| Name | Age |\n| --- | --- |\n| Alice | 30 |\n\nAnd some more prose.",
    ];

    const { container, rerender } = render(
      <Streamdown caret="block" isAnimating={true}>
        {chunks[0]}
      </Streamdown>,
    );
    await nextTick();

    const wrapper = streamdownContainer(container);
    const className = wrapper?.className;
    const style = wrapper?.getAttribute("style");

    expect(className).toBeTruthy();
    expect(caretVariable(container)).toBe('" ▋"');

    for (const chunk of chunks.slice(1)) {
      await rerender(
        <Streamdown caret="block" isAnimating={true}>
          {chunk}
        </Streamdown>,
      );

      const next = streamdownContainer(container);
      expect(next?.className).toBe(className);
      expect(next?.getAttribute("style")).toBe(style);
    }
  });
});
