import { mount, type MountingOptions } from "@vue/test-utils";
import { h, type Component, type VNodeChild } from "vue";
import { describe, expect, it, vi } from "vitest";
import { StreamdownKey, type StreamdownContextType } from "../index";
import { components as importedComponents } from "../lib/components";
import { Markdown } from "../lib/markdown";
import { PluginKey } from "../lib/plugin-context";
import { createStreamdownContext, mountVNode } from "./helpers/vue";

vi.mock("../lib/mermaid", async () => {
  const { defineComponent, h } = await import("vue");

  return {
    Mermaid: defineComponent({
      name: "MermaidMock",
      props: {
        chart: { type: String, default: "" },
      },
      setup(props) {
        return () => h("div", { "data-testid": "mermaid-mock" }, props.chart);
      },
    }),
  };
});

const streamdownProvide = (context: Partial<StreamdownContextType> = {}) => ({
  [StreamdownKey as symbol]: createStreamdownContext(context),
});

const mountMarkdown = (markdown: string) =>
  mountVNode(Markdown({ children: markdown, components: importedComponents }));

const mountMarkdownWithProviders = (
  markdown: string,
  options: MountingOptions<Record<string, unknown>> = {},
) =>
  mountVNode(
    Markdown({ children: markdown, components: importedComponents }),
    options,
  );

const mountRerenderHost = async (
  markdown: string,
  options: MountingOptions<Record<string, unknown>> = {},
) => {
  const Host = {
    props: {
      trigger: { type: Number, required: true },
    },
    setup(props: { trigger: number }) {
      return () =>
        h("div", { "data-trigger": props.trigger }, [
          Markdown({ children: markdown, components: importedComponents }),
        ]);
    },
  } as Component;

  const wrapper = mount(Host, {
    ...options,
    props: { trigger: 0 },
  });

  await wrapper.setProps({ trigger: 1 });
  return wrapper;
};

describe("Memo comparator for MemoCode", () => {
  it("keeps inline code rendered when parent props change", async () => {
    const wrapper = await mountRerenderHost("`code`");

    const code = wrapper.element.querySelector(
      '[data-streamdown="inline-code"]',
    );
    expect(code).toBeTruthy();
    expect(code?.textContent).toBe("code");
  });
});

describe("Memo comparator for MemoImg", () => {
  it("keeps image rendered when parent props change", async () => {
    const wrapper = await mountRerenderHost(
      "![alt](https://example.com/img.png)",
    );

    const img = wrapper.element.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toBe("https://example.com/img.png");
  });
});

describe("Memo comparator for MemoSection", () => {
  it("keeps sections stable in markdown output", async () => {
    const wrapper = await mountRerenderHost(
      "# Heading\n\nSome paragraph text.",
    );

    const heading = wrapper.element.querySelector(
      '[data-streamdown="heading-1"]',
    );
    expect(heading).toBeTruthy();
    expect(heading?.textContent).toBe("Heading");
  });
});

describe("MemoParagraph block code unwrapping", () => {
  it("should unwrap block code from paragraph when data-block is present", () => {
    const wrapper = mountMarkdown("```\nsome code\n```");

    const paragraphs = wrapper.element.querySelectorAll("p");
    for (const p of paragraphs) {
      expect(p.querySelector('[data-streamdown="code-block"]')).toBeFalsy();
    }
  });
});

describe("CodeComponent VNodeChild children extraction", () => {
  it("should extract code text from VNodeChild children", () => {
    const wrapper = mountMarkdown("```python\nprint('hello')\n```");

    const codeBlock = wrapper.element.querySelector(
      '[data-streamdown="code-block"]',
    );
    expect(codeBlock).toBeTruthy();
  });
});

describe("shouldShowMermaidControl with nested config", () => {
  it("should handle mermaid config with panZoom specifically disabled", () => {
    const mockMermaidPlugin = {
      name: "mermaid" as const,
      type: "diagram" as const,
      language: "mermaid",
      getMermaid: () => ({
        initialize: vi.fn(),
        render: vi.fn().mockResolvedValue({ svg: "<svg></svg>" }),
      }),
    };

    const wrapper = mountMarkdownWithProviders(
      "```mermaid\ngraph TD; A-->B\n```",
      {
        global: {
          provide: {
            [PluginKey as symbol]: { mermaid: mockMermaidPlugin },
            ...streamdownProvide({
              controls: {
                mermaid: {
                  download: true,
                  copy: true,
                  fullscreen: true,
                  panZoom: false,
                },
              },
            }),
          },
        },
      },
    );

    expect(wrapper.element).toBeTruthy();
  });
});
