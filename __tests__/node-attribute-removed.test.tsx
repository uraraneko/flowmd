import { mount, type MountingOptions } from "@vue/test-utils";
import { h, type Component, type VNodeChild } from "vue";
import { describe, expect, it } from "vitest";
import { StreamdownKey, type StreamdownContextType } from "../index";
import { components } from "../lib/components";
import { Table } from "../lib/table";
import { createStreamdownContext } from "./helpers/vue";

const mockHastNode = {
  type: "element",
  tagName: "ul",
  properties: {
    className: ["test-class"],
  },
  children: [
    {
      type: "element",
      tagName: "li",
      properties: {},
      children: [{ type: "text", value: "Item 1" }],
    },
  ],
  position: {
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 3, column: 1, offset: 15 },
  },
};

const streamdownProvide = (context: Partial<StreamdownContextType> = {}) => ({
  [StreamdownKey as symbol]: createStreamdownContext(context),
});

const mountMarkdownComponent = (
  component: Component | string,
  props: Record<string, unknown> = {},
  children?: VNodeChild,
  options: MountingOptions<Record<string, unknown>> = {},
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

describe("Node Attribute Fix", () => {
  describe("List Components - No node attribute in HTML", () => {
    it("should NOT render node attribute in OL element", () => {
      const wrapper = mountMarkdownComponent(
        components.ol as Component,
        {
          node: mockHastNode,
        },
        [h("li", "Item 1"), h("li", "Item 2")],
      );

      const ol = queryElement(wrapper.element, "ol");
      expect(ol).toBeTruthy();
      expect(ol?.getAttribute("node")).toBeNull();
      expect(ol?.hasAttribute("node")).toBe(false);
      expect(ol?.getAttribute("data-streamdown")).toBe("ordered-list");
      expect(ol?.className).toContain("list-inside");
    });

    it("should NOT render node attribute in UL element", () => {
      const wrapper = mountMarkdownComponent(
        components.ul as Component,
        {
          node: mockHastNode,
        },
        [h("li", "Item 1"), h("li", "Item 2")],
      );

      const ul = queryElement(wrapper.element, "ul");
      expect(ul).toBeTruthy();
      expect(ul?.getAttribute("node")).toBeNull();
      expect(ul?.hasAttribute("node")).toBe(false);
      expect(ul?.getAttribute("data-streamdown")).toBe("unordered-list");
      expect(ul?.className).toContain("list-disc");
    });

    it("should NOT render node attribute in LI element", () => {
      const wrapper = mountMarkdownComponent(
        components.li as Component,
        { node: mockHastNode },
        "List item content",
      );

      const li = queryElement(wrapper.element, "li");
      expect(li).toBeTruthy();
      expect(li?.getAttribute("node")).toBeNull();
      expect(li?.hasAttribute("node")).toBe(false);
      expect(li?.getAttribute("data-streamdown")).toBe("list-item");
      expect(li?.className).toContain("py-1");
    });
  });

  describe("Heading Components - No node attribute in HTML", () => {
    it("should NOT render node attribute in H1 element", () => {
      const wrapper = mountMarkdownComponent(
        components.h1 as Component,
        { node: mockHastNode },
        "Heading 1",
      );

      const h1 = queryElement(wrapper.element, "h1");
      expect(h1).toBeTruthy();
      expect(h1?.getAttribute("node")).toBeNull();
      expect(h1?.hasAttribute("node")).toBe(false);
      expect(h1?.getAttribute("data-streamdown")).toBe("heading-1");
      expect(h1?.className).toContain("text-3xl");
    });

    it("should NOT render node attribute in H2 element", () => {
      const wrapper = mountMarkdownComponent(
        components.h2 as Component,
        { node: mockHastNode },
        "Heading 2",
      );

      const h2 = queryElement(wrapper.element, "h2");
      expect(h2).toBeTruthy();
      expect(h2?.getAttribute("node")).toBeNull();
      expect(h2?.hasAttribute("node")).toBe(false);
      expect(h2?.getAttribute("data-streamdown")).toBe("heading-2");
      expect(h2?.className).toContain("text-2xl");
    });

    it("should NOT render node attribute in H3 element", () => {
      const wrapper = mountMarkdownComponent(
        components.h3 as Component,
        { node: mockHastNode },
        "Heading 3",
      );

      const h3 = queryElement(wrapper.element, "h3");
      expect(h3).toBeTruthy();
      expect(h3?.getAttribute("node")).toBeNull();
      expect(h3?.hasAttribute("node")).toBe(false);
      expect(h3?.getAttribute("data-streamdown")).toBe("heading-3");
      expect(h3?.className).toContain("text-xl");
    });
  });

  describe("Link Component - No node attribute in HTML", () => {
    it("should NOT render node attribute in A element", () => {
      const wrapper = mountMarkdownComponent(
        components.a as Component,
        { href: "https://example.com", node: mockHastNode },
        "Link text",
        {
          global: {
            provide: streamdownProvide({ linkSafety: undefined }),
          },
        },
      );

      const a = queryElement(wrapper.element, "a");
      expect(a).toBeTruthy();
      expect(a?.getAttribute("node")).toBeNull();
      expect(a?.hasAttribute("node")).toBe(false);
      expect(a?.getAttribute("data-streamdown")).toBe("link");
      expect(a?.getAttribute("href")).toBe("https://example.com");
      expect(a?.className).toContain("text-primary");
    });
  });

  describe("Image Component - No node attribute in HTML", () => {
    it("should NOT render node attribute in IMG element", () => {
      const wrapper = mountMarkdownComponent(components.img as Component, {
        alt: "Test image",
        node: mockHastNode,
        src: "https://example.com/image.png",
      });

      const img = queryElement(wrapper.element, "img");
      expect(img).toBeTruthy();
      expect(img?.getAttribute("node")).toBeNull();
      expect(img?.hasAttribute("node")).toBe(false);
      expect(img?.getAttribute("data-streamdown")).toBe("image");
      expect(img?.getAttribute("src")).toBe("https://example.com/image.png");
      expect(img?.getAttribute("alt")).toBe("Test image");
    });
  });

  describe("Code Component - No node attribute in HTML", () => {
    it("should NOT render node attribute in inline CODE element", () => {
      const wrapper = mountMarkdownComponent(
        components.code as Component,
        {
          node: {
            position: {
              start: { line: 1, column: 1 },
              end: { line: 1, column: 10 },
            },
          },
        },
        "inline code",
      );

      const code = queryElement(wrapper.element, "code");
      expect(code).toBeTruthy();
      expect(code?.getAttribute("node")).toBeNull();
      expect(code?.hasAttribute("node")).toBe(false);
      expect(code?.getAttribute("data-streamdown")).toBe("inline-code");
      expect(code?.className).toContain("font-mono");
    });
  });

  describe("Comprehensive Node Attribute Check", () => {
    it("should verify NO components render node='[object Object]' attribute", () => {
      const testComponents = [
        { name: "ol", component: components.ol, element: "ol" },
        { name: "ul", component: components.ul, element: "ul" },
        { name: "li", component: components.li, element: "li" },
        { name: "h1", component: components.h1, element: "h1" },
        { name: "h2", component: components.h2, element: "h2" },
        { name: "h3", component: components.h3, element: "h3" },
        {
          name: "a",
          component: components.a,
          element: "a",
          props: { href: "https://example.com" },
        },
        {
          name: "img",
          component: components.img,
          element: "img",
          props: { src: "test.png", alt: "test" },
        },
      ];

      for (const { name, component, element, props = {} } of testComponents) {
        const children =
          element !== "img" && element !== "hr" ? "Test content" : undefined;
        const wrapper = mountMarkdownComponent(
          component as Component,
          { node: mockHastNode, ...props },
          children,
          name === "a"
            ? {
                global: {
                  provide: streamdownProvide({ linkSafety: undefined }),
                },
              }
            : {},
        );

        const domElement = queryElement(wrapper.element, element);
        expect(domElement, `${name} component should render`).toBeTruthy();
        expect(
          domElement?.getAttribute("node"),
          `${name} component should NOT have node attribute`,
        ).toBeNull();
        expect(
          domElement?.hasAttribute("node"),
          `${name} component should NOT have node attribute`,
        ).toBe(false);
        expect(
          domElement?.getAttribute("data-streamdown"),
          `${name} component should have data-streamdown attribute`,
        ).toBeTruthy();
      }
    });

    it("should keep component output stable when node prop is retained internally", async () => {
      const Host = {
        props: {
          node: { type: Object, required: true },
        },
        setup(props: { node: object }) {
          return () =>
            h(components.ul as Component, {
              node: props.node,
              children: [h("li", "Item 1")],
            });
        },
      } as Component;

      const wrapper = mount(Host, { props: { node: mockHastNode } });

      const ul1 = queryElement(wrapper.element, "ul");
      expect(ul1).toBeTruthy();

      await wrapper.setProps({ node: mockHastNode });

      const ul2 = queryElement(wrapper.element, "ul");
      expect(ul2).toBeTruthy();
      expect(ul2?.getAttribute("node")).toBeNull();
      expect(ul2?.getAttribute("data-streamdown")).toBe("unordered-list");
    });
  });

  describe("Table Component - Correct data-streamdown attributes", () => {
    it("should have table-wrapper on div and table on table element", () => {
      const wrapper = mount(Table, {
        slots: {
          default: () => [
            h("thead", [h("tr", [h("th", "Header")])]),
            h("tbody", [h("tr", [h("td", "Cell")])]),
          ],
        },
      });

      const wrapperElement = queryElement(
        wrapper.element,
        '[data-streamdown="table-wrapper"]',
      );
      expect(wrapperElement).toBeTruthy();
      expect(wrapperElement?.tagName.toLowerCase()).toBe("div");

      const table = queryElement(wrapper.element, '[data-streamdown="table"]');
      expect(table).toBeTruthy();
      expect(table?.tagName.toLowerCase()).toBe("table");
    });

    it("should NOT have table-wrapper attribute on table element", () => {
      const wrapper = mount(Table, {
        slots: {
          default: () => h("tbody", [h("tr", [h("td", "Cell")])]),
        },
      });

      const table = queryElement(wrapper.element, "table");
      expect(table).toBeTruthy();
      expect(table?.getAttribute("data-streamdown")).toBe("table");
      expect(table?.getAttribute("data-streamdown")).not.toBe("table-wrapper");
    });

    it("MemoTable should NOT pass table-wrapper to inner table element", () => {
      const wrapper = mountMarkdownComponent(
        components.table as Component,
        { node: mockHastNode },
        [h("tbody", [h("tr", [h("td", "Cell")])])],
        {
          global: {
            provide: streamdownProvide(),
          },
        },
      );

      const wrapperElement = queryElement(
        wrapper.element,
        '[data-streamdown="table-wrapper"]',
      );
      expect(wrapperElement).toBeTruthy();
      expect(wrapperElement?.tagName.toLowerCase()).toBe("div");

      const table = queryElement(wrapper.element, "table");
      expect(table).toBeTruthy();
      expect(table?.getAttribute("data-streamdown")).toBe("table");
    });
  });
});
