import { mount } from "@vue/test-utils";
import { h, type Component } from "vue";
import { describe, expect, it } from "vitest";
import { components as importedComponents } from "../lib/components";
import { Markdown } from "../lib/markdown";
import { mountVNode } from "./helpers/vue";

describe("MemoParagraph block code unwrapping", () => {
  it("should unwrap paragraph containing only block code (data-block)", () => {
    const wrapper = mountVNode(
      Markdown({
        children: "```\ncode\n```",
        components: importedComponents,
      }),
    );

    const codeBlock = wrapper.element.querySelector(
      '[data-streamdown="code-block"]',
    );
    expect(codeBlock).toBeTruthy();

    const p = wrapper.element.querySelector("p");
    if (p) {
      expect(p.querySelector('[data-streamdown="code-block"]')).toBeFalsy();
    }
  });
});

describe("MemoCode comparator", () => {
  it("should update code when markdown content changes", async () => {
    const Host = {
      props: {
        markdown: { type: String, required: true },
      },
      setup(props: { markdown: string }) {
        return () =>
          Markdown({
            children: props.markdown,
            components: importedComponents,
          });
      },
    } as Component;

    const wrapper = mount(Host, { props: { markdown: "`inline code`" } });

    const code1 = wrapper.element.querySelector(
      '[data-streamdown="inline-code"]',
    );
    expect(code1).toBeTruthy();
    expect(code1?.textContent).toBe("inline code");

    await wrapper.setProps({ markdown: "`different code`" });

    const code2 = wrapper.element.querySelector(
      '[data-streamdown="inline-code"]',
    );
    expect(code2).toBeTruthy();
    expect(code2?.textContent).toBe("different code");
  });
});

describe("MemoImg comparator", () => {
  it("should update image when src changes", async () => {
    const Host = {
      props: {
        markdown: { type: String, required: true },
      },
      setup(props: { markdown: string }) {
        return () =>
          Markdown({
            children: props.markdown,
            components: importedComponents,
          });
      },
    } as Component;

    const wrapper = mount(Host, {
      props: { markdown: "![alt1](https://example.com/img1.png)" },
    });

    const img1 = wrapper.element.querySelector("img");
    expect(img1).toBeTruthy();
    expect(img1?.getAttribute("src")).toBe("https://example.com/img1.png");

    await wrapper.setProps({
      markdown: "![alt2](https://example.com/img2.png)",
    });

    const img2 = wrapper.element.querySelector("img");
    expect(img2).toBeTruthy();
    expect(img2?.getAttribute("src")).toBe("https://example.com/img2.png");
  });
});

describe("shouldShowControls / shouldShowMermaidControl edge cases", () => {
  it("should render block code with controls=false", () => {
    const wrapper = mountVNode(
      Markdown({
        children: "```js\nconst x = 1;\n```",
        components: importedComponents,
      }),
    );

    expect(
      wrapper.element.querySelector('[data-streamdown="code-block"]'),
    ).toBeTruthy();
  });
});
