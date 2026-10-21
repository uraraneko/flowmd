import { h, type Component } from "vue";
import { describe, expect, it } from "vitest";
import { components as importedComponents } from "../lib/components";
import type { Options } from "../lib/markdown";
import { Markdown } from "../lib/markdown";
import { mountVNode } from "./helpers/vue";

const components = importedComponents as Required<
  NonNullable<Options["components"]>
>;
const Section = components.section;
const Ol = components.ol;

describe("MemoSection footnote filtering", () => {
  it("should render footnotes through the full pipeline", () => {
    const markdown = `Text with footnote[^1].

[^1]: This is the footnote definition.`;

    const wrapper = mountVNode(
      Markdown({
        children: markdown,
        components,
      }),
    );

    expect(wrapper.text()).toContain("Text with footnote");
  });

  it("should filter out empty footnote list items", () => {
    const emptyFootnoteItem = h("li", { id: "user-content-fn-1" }, [
      h(
        "a",
        {
          "data-footnote-backref": true,
          href: "#user-content-fnref-1",
        },
        "↩",
      ),
    ]);

    const footnoteOl = h(Ol as Component, {
      children: [emptyFootnoteItem],
    });

    const wrapper = mountVNode(
      h(Section as Component, {
        className: "footnotes",
        "data-footnotes": true,
        children: [footnoteOl],
      }),
    );

    expect(wrapper.element.querySelector("li")).toBeFalsy();
  });

  it("should keep non-empty footnote items with text content", () => {
    const contentFootnoteItem = h("li", { id: "user-content-fn-1" }, [
      h("p", [
        "This is footnote content",
        h(
          "a",
          {
            "data-footnote-backref": true,
            href: "#user-content-fnref-1",
          },
          "↩",
        ),
      ]),
    ]);

    const footnoteOl = h(Ol as Component, {
      children: [contentFootnoteItem],
    });

    const wrapper = mountVNode(
      h(Section as Component, {
        className: "footnotes",
        "data-footnotes": true,
        children: [footnoteOl],
      }),
    );

    expect(wrapper.text()).toContain("This is footnote content");
  });

  it("should detect content via grandchild VNodeChild that is not backref", () => {
    const contentFootnoteItem = h("li", { id: "user-content-fn-1" }, [
      h("p", [
        h("strong", "Bold content"),
        h(
          "a",
          {
            "data-footnote-backref": true,
            href: "#user-content-fnref-1",
          },
          "↩",
        ),
      ]),
    ]);

    const footnoteOl = h(Ol as Component, {
      children: [contentFootnoteItem],
    });

    const wrapper = mountVNode(
      h(Section as Component, {
        className: "footnotes",
        "data-footnotes": true,
        children: [footnoteOl],
      }),
    );

    expect(wrapper.text()).toContain("Bold content");
  });

  it("should return null when all footnotes are empty", () => {
    const emptyFootnoteItem = h(
      "li",
      { id: "user-content-fn-1", key: "fn-1" },
      [
        "\n",
        h(
          "a",
          {
            key: "backref",
            "data-footnote-backref": "",
            href: "#user-content-fnref-1",
          },
          "↩",
        ),
      ],
    );

    const footnoteOl = h(Ol as Component, {
      children: [emptyFootnoteItem],
      key: "ol",
    });

    const wrapper = mountVNode(
      h(Section as Component, {
        className: "footnotes",
        "data-footnotes": "",
        children: [footnoteOl],
      }),
    );

    expect(wrapper.element.querySelector("section")).toBeFalsy();
  });

  it("should handle section with non-array children", () => {
    const wrapper = mountVNode(
      h(Section as Component, {
        className: "footnotes",
        "data-footnotes": true,
        children: h("span", "single child"),
      }),
    );

    expect(wrapper.text()).toContain("single child");
  });

  it("should handle non-footnotes section normally", () => {
    const wrapper = mountVNode(
      h(Section as Component, {
        className: "custom",
        children: h("p", "Normal section content"),
      }),
    );

    expect(wrapper.text()).toContain("Normal section content");
  });
});

describe("CodeComponent code extraction from VNodeChild", () => {
  it("should extract code from element children via pre wrapper", () => {
    const wrapper = mountVNode(
      Markdown({
        children: "```javascript\nconst x = 42;\n```",
        components,
      }),
    );

    expect(wrapper.element).toBeTruthy();
  });
});

describe("MemoParagraph block code unwrapping", () => {
  it("should unwrap when child has node with tagName code and data-block", () => {
    const P = components.p;
    const mockCodeElement = h(
      "code",
      {
        "data-block": "true",
        node: { tagName: "code" },
      },
      "console.log('hello');",
    );

    const wrapper = mountVNode(
      h(P as Component, {
        children: mockCodeElement,
      }),
    );

    expect(wrapper.element.querySelector("p")).toBeFalsy();
    expect(wrapper.element.querySelector("code")?.textContent).toBe(
      "console.log('hello');",
    );
  });
});
