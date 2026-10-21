import { mount, type MountingOptions } from "@vue/test-utils";
import { h, type Component, type VNodeChild } from "vue";
import { describe, expect, it, vi } from "vitest";
import { StreamdownKey, type StreamdownContextType } from "../index";
import { components as importedComponents } from "../lib/components";
import type { Options } from "../lib/markdown";
import { PluginKey } from "../lib/plugin-context";
import { createStreamdownContext } from "./helpers/vue";

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

const components = importedComponents as Required<
  NonNullable<Options["components"]>
>;
const Ol = components.ol;
const Li = components.li;
const Ul = components.ul;
const Hr = components.hr;
const Strong = components.strong;
const A = components.a;
const H1 = components.h1;
const H2 = components.h2;
const H3 = components.h3;
const H4 = components.h4;
const H5 = components.h5;
const H6 = components.h6;
const MemoTable = components.table;
const Thead = components.thead;
const Tbody = components.tbody;
const Tr = components.tr;
const Th = components.th;
const Td = components.td;
const Blockquote = components.blockquote;
const Code = components.code;
const Img = components.img;
const Sup = components.sup;
const Sub = components.sub;
const P = components.p;
const Section = components.section;

type MountOptions = MountingOptions<Record<string, unknown>>;

const mountMarkdownComponent = (
  component: Component | string,
  props: Record<string, unknown> = {},
  children?: VNodeChild,
  options: MountOptions = {},
) =>
  mount(component as Component, {
    ...options,
    props: {
      ...props,
      children,
    },
  });

const queryElement = (root: Element, selector: string) =>
  root.matches(selector) ? root : root.querySelector(selector);

const streamdownProvide = (context: Partial<StreamdownContextType> = {}) => ({
  [StreamdownKey as symbol]: createStreamdownContext(context),
});

const mountRerenderHost = async (
  renderChild: () => VNodeChild,
  options: MountOptions = {},
) => {
  const Host = {
    props: {
      count: { type: Number, required: true },
    },
    setup(props: { count: number }) {
      return () => h("div", { "data-count": props.count }, renderChild());
    },
  } as Component;

  const wrapper = mount(Host, {
    ...options,
    props: { count: 0 },
  });

  await wrapper.setProps({ count: 1 });
  return wrapper;
};

describe("Memo comparators - re-render triggers", () => {
  it("MemoOl comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(() =>
      h(Ol as Component, { children: [h("li", "item")] }),
    );

    expect(queryElement(wrapper.element, "ol")).toBeTruthy();
  });

  it("MemoLi comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(() =>
      h("ul", [h(Li as Component, { children: "item" })]),
    );

    expect(queryElement(wrapper.element, "li")).toBeTruthy();
  });

  it("MemoUl comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(() =>
      h(Ul as Component, { children: [h("li", "item")] }),
    );

    expect(queryElement(wrapper.element, "ul")).toBeTruthy();
  });

  it("MemoHr comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(() => h(Hr as Component));

    expect(queryElement(wrapper.element, "hr")).toBeTruthy();
  });

  it("MemoStrong comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(() =>
      h(Strong as Component, { children: "bold" }),
    );

    expect(
      queryElement(wrapper.element, '[data-streamdown="strong"]'),
    ).toBeTruthy();
  });

  it("MemoA comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(
      () =>
        h(A as Component, { href: "https://example.com", children: "link" }),
      {
        global: {
          provide: streamdownProvide({ linkSafety: undefined }),
        },
      },
    );

    expect(
      queryElement(wrapper.element, '[data-streamdown="link"]'),
    ).toBeTruthy();
  });

  it("MemoH1-H6 comparators fire on parent re-render", async () => {
    const headings = [H1, H2, H3, H4, H5, H6];

    for (const Heading of headings) {
      const wrapper = await mountRerenderHost(() =>
        h(Heading as Component, { children: "heading" }),
      );

      expect(
        queryElement(wrapper.element, "h1, h2, h3, h4, h5, h6"),
      ).toBeTruthy();
    }
  });

  it("MemoTable comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(
      () =>
        h(MemoTable as Component, {
          children: [h("tbody", [h("tr", [h("td", "cell")])])],
        }),
      {
        global: {
          provide: streamdownProvide(),
        },
      },
    );

    expect(queryElement(wrapper.element, "table")).toBeTruthy();
  });

  it("MemoThead/Tbody/Tr/Th/Td comparators fire on parent re-render", async () => {
    const wrapper = await mountRerenderHost(() =>
      h("table", [
        h(Thead as Component, {
          children: [h("tr", [h(Th as Component, { children: "header" })])],
        }),
        h(Tbody as Component, {
          children: [
            h(Tr as Component, {
              children: [h(Td as Component, { children: "cell" })],
            }),
          ],
        }),
      ]),
    );

    expect(queryElement(wrapper.element, "table")).toBeTruthy();
  });

  it("MemoBlockquote comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(() =>
      h(Blockquote as Component, { children: "quote" }),
    );

    expect(queryElement(wrapper.element, "blockquote")).toBeTruthy();
  });

  it("MemoSup/MemoSub comparators fire on parent re-render", async () => {
    const wrapper = await mountRerenderHost(() => [
      h(Sup as Component, { children: "sup" }),
      h(Sub as Component, { children: "sub" }),
    ]);

    expect(queryElement(wrapper.element, "sup")).toBeTruthy();
    expect(queryElement(wrapper.element, "sub")).toBeTruthy();
  });

  it("MemoCode comparator fires on parent re-render (inline)", async () => {
    const wrapper = await mountRerenderHost(
      () => h(Code as Component, { children: "inline code" }),
      {
        global: {
          provide: {
            ...streamdownProvide(),
            [PluginKey as symbol]: {},
          },
        },
      },
    );

    expect(queryElement(wrapper.element, "code")).toBeTruthy();
  });

  it("MemoImg comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(
      () =>
        h(Img as Component, {
          alt: "test",
          src: "https://example.com/img.png",
        }),
      {
        global: {
          provide: streamdownProvide(),
        },
      },
    );

    expect(queryElement(wrapper.element, "img")).toBeTruthy();
  });

  it("MemoParagraph comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(() =>
      h(P as Component, { children: "paragraph" }),
    );

    expect(queryElement(wrapper.element, "p")).toBeTruthy();
  });

  it("MemoSection comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(() =>
      h(Section as Component, { children: "content" }),
    );

    expect(queryElement(wrapper.element, "section")).toBeTruthy();
  });
});

describe("sameNodePosition edge cases", () => {
  it("should return false when one has position and other doesn't", async () => {
    const nodeWithPos = {
      position: { start: { line: 1, column: 1 }, end: { line: 1, column: 5 } },
    };
    const nodeWithoutPos = {};

    const wrapper = mountMarkdownComponent(
      Ol as Component,
      { node: nodeWithPos },
      [h("li", "item")],
    );

    await wrapper.setProps({ node: nodeWithoutPos });

    expect(queryElement(wrapper.element, "ol")).toBeTruthy();
  });
});

describe("MemoParagraph block code unwrapping with data-block", () => {
  it("should unwrap block code child from paragraph", () => {
    const codeChild = h(
      "code",
      {
        class: "language-js",
        "data-block": "true",
        node: { tagName: "code" },
      },
      "const x = 1;",
    );

    const wrapper = mountMarkdownComponent(P as Component, {}, codeChild);

    expect(queryElement(wrapper.element, "p")).toBeFalsy();
    expect(queryElement(wrapper.element, "code")?.textContent).toBe(
      "const x = 1;",
    );
  });
});

describe("Markdown Components", () => {
  describe("List Components", () => {
    it("should render ordered list with correct classes", () => {
      const wrapper = mountMarkdownComponent(Ol as Component, { node: null }, [
        h("li", "Item 1"),
        h("li", "Item 2"),
      ]);
      const ol = queryElement(wrapper.element, "ol");

      expect(ol).toBeTruthy();
      expect(ol?.className).toContain("list-inside");
      expect(ol?.className).toContain("list-decimal");
      expect(ol?.className).toContain("whitespace-normal");
    });

    it("should render unordered list with correct classes", () => {
      const wrapper = mountMarkdownComponent(Ul as Component, { node: null }, [
        h("li", "Item 1"),
        h("li", "Item 2"),
      ]);
      const ul = queryElement(wrapper.element, "ul");

      expect(ul).toBeTruthy();
      expect(ul?.className).toContain("list-inside");
      expect(ul?.className).toContain("list-disc");
      expect(ul?.className).toContain("whitespace-normal");
    });

    it("should render list item with correct classes", () => {
      const wrapper = mountMarkdownComponent(
        Li as Component,
        { node: null },
        "List item content",
      );
      const li = queryElement(wrapper.element, "li");

      expect(li).toBeTruthy();
      expect(li?.className).toContain("py-1");
    });
  });

  describe("Heading Components", () => {
    it("should render h1 with correct classes", () => {
      const wrapper = mountMarkdownComponent(
        H1 as Component,
        { node: null },
        "Heading 1",
      );
      const h1 = queryElement(wrapper.element, "h1");

      expect(h1).toBeTruthy();
      expect(h1?.className).toContain("mt-6");
      expect(h1?.className).toContain("mb-2");
      expect(h1?.className).toContain("font-semibold");
      expect(h1?.className).toContain("text-3xl");
    });

    it("should render h2 with correct classes", () => {
      const wrapper = mountMarkdownComponent(
        H2 as Component,
        { node: null },
        "Heading 2",
      );
      const h2 = queryElement(wrapper.element, "h2");

      expect(h2).toBeTruthy();
      expect(h2?.className).toContain("text-2xl");
    });

    it("should render h3 with correct classes", () => {
      const wrapper = mountMarkdownComponent(
        H3 as Component,
        { node: null },
        "Heading 3",
      );
      const h3 = queryElement(wrapper.element, "h3");

      expect(h3).toBeTruthy();
      expect(h3?.className).toContain("text-xl");
    });

    it("should render h4 with correct classes", () => {
      const wrapper = mountMarkdownComponent(
        H4 as Component,
        { node: null },
        "Heading 4",
      );
      const h4 = queryElement(wrapper.element, "h4");

      expect(h4).toBeTruthy();
      expect(h4?.className).toContain("text-lg");
    });

    it("should render h5 with correct classes", () => {
      const wrapper = mountMarkdownComponent(
        H5 as Component,
        { node: null },
        "Heading 5",
      );
      const h5 = queryElement(wrapper.element, "h5");

      expect(h5).toBeTruthy();
      expect(h5?.className).toContain("text-base");
    });

    it("should render h6 with correct classes", () => {
      const wrapper = mountMarkdownComponent(
        H6 as Component,
        { node: null },
        "Heading 6",
      );
      const h6 = queryElement(wrapper.element, "h6");

      expect(h6).toBeTruthy();
      expect(h6?.className).toContain("text-sm");
    });
  });

  describe("Text Formatting Components", () => {
    it("should render strong with correct classes", () => {
      const wrapper = mountMarkdownComponent(
        Strong as Component,
        { node: null },
        "Bold text",
      );
      const span = queryElement(wrapper.element, "span");

      expect(span).toBeTruthy();
      expect(span?.className).toContain("font-semibold");
    });

    it("should render link with correct attributes and classes", () => {
      const wrapper = mountMarkdownComponent(
        A as Component,
        { href: "https://example.com", node: null },
        "Link text",
        {
          global: {
            provide: streamdownProvide({ linkSafety: undefined }),
          },
        },
      );
      const link = queryElement(wrapper.element, "a");

      expect(link).toBeTruthy();
      expect(link?.className).toContain("wrap-anywhere");
      expect(link?.className).toContain("font-medium");
      expect(link?.className).toContain("text-primary");
      expect(link?.className).toContain("underline");
      expect(link?.getAttribute("rel")).toBe("noreferrer");
      expect(link?.getAttribute("target")).toBe("_blank");
    });

    it("should mark incomplete links with data attribute", () => {
      const wrapper = mountMarkdownComponent(
        A as Component,
        { href: "streamdown:incomplete-link", node: null },
        "Incomplete link text",
        {
          global: {
            provide: streamdownProvide({ linkSafety: undefined }),
          },
        },
      );
      const link = queryElement(wrapper.element, 'a[data-streamdown="link"]');

      expect(link).toBeTruthy();
      expect(link?.getAttribute("data-incomplete")).toBe("true");
      expect(link?.getAttribute("href")).toBe("streamdown:incomplete-link");
      expect(link?.textContent).toBe("Incomplete link text");
    });

    it("should render blockquote with correct classes", () => {
      const wrapper = mountMarkdownComponent(
        Blockquote as Component,
        { node: null },
        "Quote text",
      );
      const blockquote = queryElement(wrapper.element, "blockquote");

      expect(blockquote).toBeTruthy();
      expect(blockquote?.className).toContain("my-4");
      expect(blockquote?.className).toContain("border-s-4");
      expect(blockquote?.className).toContain("ps-4");
      expect(blockquote?.className).toContain("italic");
    });
  });

  describe("Code Components", () => {
    it("should render inline code with correct classes", () => {
      const wrapper = mountMarkdownComponent(
        Code as Component,
        { node: null },
        "code",
      );
      const code = queryElement(wrapper.element, "code");

      expect(code).toBeTruthy();
      expect(code?.className).toContain("rounded");
      expect(code?.className).toContain("bg-muted");
      expect(code?.className).toContain("px-1.5");
      expect(code?.className).toContain("py-0.5");
      expect(code?.className).toContain("font-mono");
      expect(code?.className).toContain("text-sm");
      expect(code?.getAttribute("data-streamdown")).toBe("inline-code");
    });

    it("should render block code when data-block is set", async () => {
      const wrapper = mountMarkdownComponent(
        Code as Component,
        { dataBlock: "true", node: null },
        "code",
      );

      await vi.waitFor(() => {
        expect(
          queryElement(wrapper.element, '[data-streamdown="code-block"]'),
        ).toBeTruthy();
      });

      const codeBlock = queryElement(
        wrapper.element,
        '[data-streamdown="code-block"]',
      );
      expect(codeBlock?.getAttribute("data-language")).toBe("");
      expect(queryElement(wrapper.element, "button")).toBeTruthy();
    });

    it("should render pre with code block and add data-block marker", () => {
      const Pre = components.pre;
      const codeElement = h("code", {}, "const x = 1;");
      const wrapper = mountMarkdownComponent(
        Pre as Component,
        { node: null },
        codeElement,
      );
      const code = queryElement(wrapper.element, "code");

      expect(code).toBeTruthy();
      expect(code?.textContent).toBe("const x = 1;");
      expect(code?.getAttribute("data-block")).toBe("true");
    });

    it("should extract language from code className", async () => {
      const wrapper = mountMarkdownComponent(
        Code as Component,
        { className: "language-javascript", dataBlock: "true", node: null },
        "const x = 1;",
      );

      await vi.waitFor(() => {
        expect(
          queryElement(wrapper.element, '[data-streamdown="code-block"]'),
        ).toBeTruthy();
      });

      const codeBlock = queryElement(
        wrapper.element,
        '[data-streamdown="code-block"]',
      );
      expect(codeBlock?.getAttribute("data-language")).toBe("javascript");
    });

    it("should extract code from children in pre component", () => {
      const Pre = components.pre;
      const wrapper = mountMarkdownComponent(
        Pre as Component,
        { node: null },
        "plain text code",
      );

      expect(wrapper.text()).toBe("plain text code");
    });

    it("should render mermaid code as regular code block when plugin not provided", async () => {
      const wrapper = mountMarkdownComponent(
        Code as Component,
        { className: "language-mermaid", dataBlock: "true", node: null },
        "graph TD; A-->B;",
      );

      await vi.waitFor(() => {
        expect(
          queryElement(wrapper.element, '[data-streamdown="code-block"]'),
        ).toBeTruthy();
      });

      const codeBlock = queryElement(
        wrapper.element,
        '[data-streamdown="code-block"]',
      );
      expect(codeBlock?.getAttribute("data-language")).toBe("mermaid");
      expect(
        queryElement(wrapper.element, '[data-streamdown="mermaid-block"]'),
      ).toBeNull();
    });

    it("should render mermaid block with correct structure when plugin is provided", async () => {
      const mockMermaidPlugin = {
        name: "mermaid" as const,
        type: "diagram" as const,
        language: "mermaid",
        getMermaid: vi.fn().mockReturnValue({
          initialize: vi.fn(),
          render: vi.fn().mockResolvedValue({ svg: "<svg>Test</svg>" }),
        }),
      };

      const wrapper = mountMarkdownComponent(
        Code as Component,
        { className: "language-mermaid", dataBlock: "true", node: null },
        "graph TD; A-->B;",
        {
          global: {
            provide: {
              [PluginKey as symbol]: { mermaid: mockMermaidPlugin },
              ...streamdownProvide(),
            },
          },
        },
      );

      await vi.waitFor(() => {
        expect(
          queryElement(wrapper.element, '[data-streamdown="mermaid-block"]'),
        ).toBeTruthy();
      });

      const mermaidBlock = queryElement(
        wrapper.element,
        '[data-streamdown="mermaid-block"]',
      );
      expect(mermaidBlock?.className).toContain("group");
      expect(mermaidBlock?.className).toContain("relative");
      expect(mermaidBlock?.className).toContain("rounded-xl");
      expect(mermaidBlock?.className).toContain("border");
    });
  });

  describe("Table Components", () => {
    it("should render table with wrapper div", () => {
      const wrapper = mountMarkdownComponent(
        MemoTable as Component,
        { node: null },
        [h("tbody", [h("tr", [h("td", "Cell")])])],
        {
          global: {
            provide: streamdownProvide(),
          },
        },
      );
      const root = queryElement(wrapper.element, "div");

      expect(root).toBeTruthy();
      expect(root?.className).toContain("my-4");
      expect(root?.className).toContain("flex");
      expect(root?.className).toContain("flex-col");

      const tableWrapper = root?.querySelector("div.overflow-x-auto");
      expect(tableWrapper).toBeTruthy();

      const table = tableWrapper?.querySelector("table");
      expect(table).toBeTruthy();
      expect(table?.className).toContain("w-full");
      expect(table?.className).toContain("divide-y");
      expect(table?.className).toContain("divide-border");
    });

    it("should render thead with correct classes", () => {
      const wrapper = mountMarkdownComponent(
        Thead as Component,
        { node: null },
        [h("tr", [h("th", "Header")])],
      );
      const thead = queryElement(wrapper.element, "thead");

      expect(thead).toBeTruthy();
      expect(thead?.className).toContain("bg-muted/80");
    });

    it("should render tbody with correct classes", () => {
      const wrapper = mountMarkdownComponent(
        Tbody as Component,
        { node: null },
        [h("tr", [h("td", "Cell")])],
      );
      const tbody = queryElement(wrapper.element, "tbody");

      expect(tbody).toBeTruthy();
      expect(tbody?.className).toContain("divide-y");
      expect(tbody?.className).toContain("divide-border");
    });

    it("should render tr with correct classes", () => {
      const wrapper = mountMarkdownComponent(Tr as Component, { node: null }, [
        h("td", "Cell"),
      ]);
      const tr = queryElement(wrapper.element, "tr");

      expect(tr).toBeTruthy();
      expect(tr?.className).toContain("border-border");
    });

    it("should render th with correct classes", () => {
      const wrapper = mountMarkdownComponent(
        Th as Component,
        { node: null },
        "Header",
      );
      const th = queryElement(wrapper.element, "th");

      expect(th).toBeTruthy();
      expect(th?.className).toContain("whitespace-nowrap");
      expect(th?.className).toContain("px-4");
      expect(th?.className).toContain("py-2");
      expect(th?.className).toContain("text-start");
      expect(th?.className).toContain("font-semibold");
      expect(th?.className).toContain("text-sm");
    });

    it("should render td with correct classes", () => {
      const wrapper = mountMarkdownComponent(
        Td as Component,
        { node: null },
        "Cell",
      );
      const td = queryElement(wrapper.element, "td");

      expect(td).toBeTruthy();
      expect(td?.className).toContain("px-4");
      expect(td?.className).toContain("py-2");
      expect(td?.className).toContain("text-sm");
    });
  });

  describe("Other Components", () => {
    it("should render hr with correct classes", () => {
      const wrapper = mountMarkdownComponent(Hr as Component, { node: null });
      const hr = queryElement(wrapper.element, "hr");

      expect(hr).toBeTruthy();
      expect(hr?.className).toContain("my-6");
      expect(hr?.className).toContain("border-border");
    });

    it("should render sup with correct classes", () => {
      const wrapper = mountMarkdownComponent(
        Sup as Component,
        { node: null },
        "superscript",
      );
      const sup = queryElement(wrapper.element, "sup");

      expect(sup).toBeTruthy();
      expect(sup?.className).toContain("text-sm");
    });

    it("should render sub with correct classes", () => {
      const wrapper = mountMarkdownComponent(
        Sub as Component,
        { node: null },
        "subscript",
      );
      const sub = queryElement(wrapper.element, "sub");

      expect(sub).toBeTruthy();
      expect(sub?.className).toContain("text-sm");
    });
  });

  describe("Custom className prop", () => {
    it("should merge custom className with default classes", () => {
      const wrapper = mountMarkdownComponent(
        H1 as Component,
        { className: "custom-class", node: null },
        "Heading",
      );
      const h1 = queryElement(wrapper.element, "h1");

      expect(h1?.className).toContain("custom-class");
      expect(h1?.className).toContain("mt-6");
      expect(h1?.className).toContain("mb-2");
    });
  });
});
