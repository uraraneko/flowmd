import { mount } from "@vue/test-utils";
import { h, type Component, type VNodeChild } from "vue";
import { describe, expect, it, vi } from "vitest";
import { StreamdownKey, type StreamdownContextType } from "../index";
import { components as importedComponents } from "../lib/components";
import type { Options } from "../lib/markdown";
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

const streamdownProvide = (context: Partial<StreamdownContextType> = {}) => ({
  [StreamdownKey as symbol]: createStreamdownContext(context),
});

const queryElement = (root: Element, selector: string) =>
  root.matches(selector) ? root : root.querySelector(selector);

const mountRerenderHost = async (
  renderChild: () => VNodeChild,
  provide: Record<symbol, unknown> = {},
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
    props: { count: 0 },
    global: { provide },
  });

  await wrapper.setProps({ count: 1 });
  return wrapper;
};

describe("Memo comparators - re-render triggers", () => {
  it("MemoOl comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(() =>
      h(Ol as Component, { children: [h("li", "item")] }),
    );
    expect(wrapper.element.querySelector("ol")).toBeTruthy();
  });

  it("MemoLi comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(() =>
      h("ul", [h(Li as Component, { children: "item" })]),
    );
    expect(wrapper.element.querySelector("li")).toBeTruthy();
  });

  it("MemoUl comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(() =>
      h(Ul as Component, { children: [h("li", "item")] }),
    );
    expect(wrapper.element.querySelector("ul")).toBeTruthy();
  });

  it("MemoHr comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(() => h(Hr as Component));
    expect(wrapper.element.querySelector("hr")).toBeTruthy();
  });

  it("MemoStrong comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(() =>
      h(Strong as Component, { children: "bold" }),
    );
    expect(
      wrapper.element.querySelector('[data-streamdown="strong"]'),
    ).toBeTruthy();
  });

  it("MemoA comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(
      () =>
        h(A as Component, { href: "https://example.com", children: "link" }),
      streamdownProvide({ linkSafety: undefined }),
    );
    expect(
      wrapper.element.querySelector('[data-streamdown="link"]'),
    ).toBeTruthy();
  });

  it("MemoH1-H6 comparators fire on parent re-render", async () => {
    const headings = [H1, H2, H3, H4, H5, H6];
    for (const Heading of headings) {
      const wrapper = await mountRerenderHost(() =>
        h(Heading as Component, { children: "heading" }),
      );
      expect(
        wrapper.element.querySelector("h1, h2, h3, h4, h5, h6"),
      ).toBeTruthy();
    }
  });

  it("MemoTable comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(
      () =>
        h(MemoTable as Component, {
          children: [h("tbody", [h("tr", [h("td", "cell")])])],
        }),
      streamdownProvide(),
    );
    expect(wrapper.element.querySelector("table")).toBeTruthy();
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
    expect(wrapper.element.querySelector("table")).toBeTruthy();
  });

  it("MemoBlockquote comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(() =>
      h(Blockquote as Component, { children: "quote" }),
    );
    expect(wrapper.element.querySelector("blockquote")).toBeTruthy();
  });

  it("MemoSup/MemoSub comparators fire on parent re-render", async () => {
    const wrapper = await mountRerenderHost(() => [
      h(Sup as Component, { children: "sup" }),
      h(Sub as Component, { children: "sub" }),
    ]);
    expect(wrapper.element.querySelector("sup")).toBeTruthy();
    expect(wrapper.element.querySelector("sub")).toBeTruthy();
  });

  it("MemoCode comparator fires on parent re-render (inline)", async () => {
    const wrapper = await mountRerenderHost(
      () => h(Code as Component, { children: "inline code" }),
      {
        ...streamdownProvide(),
        [PluginKey as symbol]: {},
      },
    );
    expect(wrapper.element.querySelector("code")).toBeTruthy();
  });

  it("MemoImg comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(
      () =>
        h(Img as Component, {
          alt: "test",
          src: "https://example.com/img.png",
        }),
      streamdownProvide(),
    );
    expect(wrapper.element.querySelector("img")).toBeTruthy();
  });

  it("MemoParagraph comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(() =>
      h(P as Component, { children: "paragraph" }),
    );
    expect(wrapper.element.querySelector("p")).toBeTruthy();
  });

  it("MemoSection comparator fires on parent re-render", async () => {
    const wrapper = await mountRerenderHost(() =>
      h(Section as Component, { children: "content" }),
    );
    expect(wrapper.element.querySelector("section")).toBeTruthy();
  });
});

describe("sameNodePosition edge cases", () => {
  it("should return false when one has position and other doesn't", async () => {
    const nodeWithPos = {
      position: { start: { line: 1, column: 1 }, end: { line: 1, column: 5 } },
    };
    const nodeWithoutPos = {};

    const Host = {
      props: {
        node: { type: Object, required: true },
      },
      setup(props: { node: object }) {
        return () =>
          h(Ol as Component, { node: props.node, children: [h("li", "item")] });
      },
    } as Component;

    const wrapper = mount(Host, { props: { node: nodeWithPos } });
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

    const wrapper = mountVNode(h(P as Component, { children: codeChild }));

    expect(wrapper.element.querySelector("p")).toBeFalsy();
    expect(wrapper.element.querySelector("code")?.textContent).toBe(
      "const x = 1;",
    );
  });
});
