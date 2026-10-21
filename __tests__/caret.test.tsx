import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { Streamdown, type StreamdownProps } from "../index";

vi.mock("../lib/markdown", async () => {
  const { h } = await import("vue");

  return {
    Markdown: (props: { children?: string }) =>
      props.children
        ? h("div", { "data-testid": "markdown" }, props.children)
        : null,
    defaultUrlTransform: (url: string) => url,
  };
});

const mountStreamdown = (
  props: Partial<StreamdownProps> = {},
  content = "Content",
) => mount(Streamdown, { props: { ...props, children: content } });

const wrapperElement = (wrapper: VueWrapper) => wrapper.element as HTMLElement;

const caretValue = (wrapper: VueWrapper) =>
  wrapperElement(wrapper).style.getPropertyValue("--streamdown-caret");

const wrapperClass = (wrapper: VueWrapper) => wrapperElement(wrapper).className;

describe("Caret Feature", () => {
  describe("Caret Rendering", () => {
    it("should render block caret when caret='block' and isAnimating=true", () => {
      const wrapper = mountStreamdown(
        { caret: "block", isAnimating: true },
        "Streaming content...",
      );

      expect(wrapperClass(wrapper)).toContain(
        "[&>*:last-child:not([data-sd-caret-hidden])]:after:inline",
      );
      expect(wrapperClass(wrapper)).toContain(
        "[&>*:last-child:not([data-sd-caret-hidden])]:after:align-baseline",
      );
      expect(wrapperClass(wrapper)).toContain(
        "[&>*:last-child:not([data-sd-caret-hidden])]:after:content-[var(--streamdown-caret)]",
      );
      expect(caretValue(wrapper)).toBe('" ▋"');
    });

    it("should render circle caret when caret='circle' and isAnimating=true", () => {
      const wrapper = mountStreamdown(
        { caret: "circle", isAnimating: true },
        "Streaming content...",
      );

      expect(wrapperClass(wrapper)).toContain(
        "[&>*:last-child:not([data-sd-caret-hidden])]:after:inline",
      );
      expect(caretValue(wrapper)).toBe('" ●"');
    });

    it("should not render caret when caret is undefined", () => {
      const wrapper = mountStreamdown(
        { isAnimating: true },
        "Streaming content...",
      );

      expect(wrapperClass(wrapper)).not.toContain(
        "[&>*:last-child:not([data-sd-caret-hidden])]:after:inline",
      );
      expect(caretValue(wrapper)).toBe("");
    });

    it("should not render caret when isAnimating=false even with caret set", () => {
      const wrapper = mountStreamdown(
        { caret: "block", isAnimating: false },
        "Completed content...",
      );

      expect(caretValue(wrapper)).toBe("");
    });

    it("should not render caret when isAnimating is not provided", () => {
      const wrapper = mountStreamdown({ caret: "block" }, "Content...");

      expect(caretValue(wrapper)).toBe("");
    });
  });

  describe("Caret State Changes", () => {
    it("should add caret when isAnimating changes from false to true", async () => {
      const wrapper = mountStreamdown({ caret: "block", isAnimating: false });

      expect(caretValue(wrapper)).toBe("");

      await wrapper.setProps({ isAnimating: true });

      expect(caretValue(wrapper)).toBe('" ▋"');
    });

    it("should remove caret when isAnimating changes from true to false", async () => {
      const wrapper = mountStreamdown({ caret: "block", isAnimating: true });

      expect(caretValue(wrapper)).toBe('" ▋"');

      await wrapper.setProps({ isAnimating: false });

      expect(caretValue(wrapper)).toBe("");
    });

    it("should change caret style when caret prop changes with content change", async () => {
      const wrapper = mountStreamdown({ caret: "block", isAnimating: true });

      expect(caretValue(wrapper)).toBe('" ▋"');

      await wrapper.setProps({ caret: "circle", children: "Content updated" });

      expect(caretValue(wrapper)).toBe('" ●"');
    });

    it("should remove caret when caret prop is set to undefined with content change", async () => {
      const wrapper = mountStreamdown({ caret: "block", isAnimating: true });

      expect(caretValue(wrapper)).toBe('" ▋"');

      await wrapper.setProps({ caret: undefined, children: "Content updated" });

      expect(caretValue(wrapper)).toBe("");
    });
  });

  describe("Caret with Different Modes", () => {
    it("should render caret in streaming mode", () => {
      const wrapper = mountStreamdown({
        caret: "block",
        isAnimating: true,
        mode: "streaming",
      });

      expect(caretValue(wrapper)).toBe('" ▋"');
    });

    it("should not render caret in static mode even when isAnimating=true", () => {
      const wrapper = mountStreamdown({
        caret: "block",
        isAnimating: true,
        mode: "static",
      });

      expect(wrapperClass(wrapper)).not.toContain(
        "[&>*:last-child:not([data-sd-caret-hidden])]:after:inline",
      );
    });
  });

  describe("Caret with Streaming Content", () => {
    it("should maintain caret during content updates", async () => {
      const wrapper = mountStreamdown(
        { caret: "block", isAnimating: true },
        "Initial content",
      );

      expect(caretValue(wrapper)).toBe('" ▋"');

      await wrapper.setProps({ children: "Initial content with more text" });

      expect(caretValue(wrapper)).toBe('" ▋"');
    });

    it("should work with empty content", () => {
      const wrapper = mountStreamdown(
        { caret: "block", isAnimating: true },
        "",
      );

      expect(caretValue(wrapper)).toBe('" ▋"');
    });

    it("should render placeholder span for caret when content is empty", () => {
      const wrapper = mountStreamdown(
        { caret: "block", isAnimating: true },
        "",
      );

      expect(wrapper.find("span").exists()).toBe(true);
    });

    it("should not render placeholder span when not animating", () => {
      const wrapper = mountStreamdown(
        { caret: "block", isAnimating: false },
        "",
      );

      expect(wrapper.find("span").exists()).toBe(false);
    });

    it("should not render placeholder span when caret is not set", () => {
      const wrapper = mountStreamdown({ isAnimating: true }, "");

      expect(wrapper.find("span").exists()).toBe(false);
    });

    it("should work with markdown content", () => {
      const wrapper = mountStreamdown(
        { caret: "block", isAnimating: true },
        "# Heading\n\nThis is **bold** text",
      );

      expect(caretValue(wrapper)).toBe('" ▋"');
    });

    it("should work with complete code blocks", () => {
      const wrapper = mountStreamdown(
        { caret: "circle", isAnimating: true },
        "```javascript\nconst x = 1;\n```",
      );

      expect(caretValue(wrapper)).toBe('" ●"');
    });

    it("should hide caret when last block has incomplete code fence", () => {
      const wrapper = mountStreamdown(
        { caret: "block", isAnimating: true },
        "```javascript\nconst x = 1;",
      );

      expect(
        wrapperElement(wrapper).lastElementChild?.hasAttribute(
          "data-sd-caret-hidden",
        ),
      ).toBe(true);
      expect(caretValue(wrapper)).toBe('" ▋"');
    });

    it("should restore caret when code fence completes", async () => {
      const wrapper = mountStreamdown(
        { caret: "block", isAnimating: true },
        "```javascript\nconst x = 1;",
      );

      expect(
        wrapperElement(wrapper).lastElementChild?.hasAttribute(
          "data-sd-caret-hidden",
        ),
      ).toBe(true);

      await wrapper.setProps({ children: "```javascript\nconst x = 1;\n```" });

      expect(caretValue(wrapper)).toBe('" ▋"');
    });

    it("should hide caret when last block contains a table", () => {
      const wrapper = mountStreamdown(
        { caret: "block", isAnimating: true },
        "| Name | Age |\n| --- | --- |\n| Alice | 30 |",
      );

      expect(
        wrapperElement(wrapper).lastElementChild?.hasAttribute(
          "data-sd-caret-hidden",
        ),
      ).toBe(true);
      expect(caretValue(wrapper)).toBe('" ▋"');
    });

    it("should hide caret when streaming an incomplete table", () => {
      const wrapper = mountStreamdown(
        { caret: "block", isAnimating: true },
        "| Name | Age |\n| --- | --- |",
      );

      expect(
        wrapperElement(wrapper).lastElementChild?.hasAttribute(
          "data-sd-caret-hidden",
        ),
      ).toBe(true);
    });

    it("should show caret when table is followed by regular text", () => {
      const wrapper = mountStreamdown(
        { caret: "block", isAnimating: true },
        "| Name | Age |\n| --- | --- |\n| Alice | 30 |\n\nHere is some text after the table",
      );

      expect(caretValue(wrapper)).toBe('" ▋"');
    });
  });

  describe("Caret updates", () => {
    it("applies a new caret on the next content update", async () => {
      const wrapper = mountStreamdown({ caret: "block", isAnimating: true });

      expect(caretValue(wrapper)).toBe('" ▋"');

      await wrapper.setProps({ caret: "circle" });

      expect(caretValue(wrapper)).toBe('" ▋"');
      await wrapper.setProps({ children: "Updated content" });
      expect(caretValue(wrapper)).toBe('" ●"');
    });

    it("should update when isAnimating changes", async () => {
      const wrapper = mountStreamdown({ caret: "block", isAnimating: false });

      expect(caretValue(wrapper)).toBe("");

      await wrapper.setProps({ isAnimating: true });

      expect(caretValue(wrapper)).toBe('" ▋"');
    });
  });

  describe("Caret with Custom Components", () => {
    it("should work with custom components", () => {
      const customComponents = {
        h1: defineComponent({
          props: { children: { type: null, default: undefined } },
          setup(props) {
            return () => h("h1", { class: "custom-h1" }, props.children);
          },
        }),
      };

      const wrapper = mountStreamdown(
        { caret: "block", components: customComponents, isAnimating: true },
        "# Custom Heading",
      );

      expect(caretValue(wrapper)).toBe('" ▋"');
    });
  });

  describe("Caret CSS Classes", () => {
    it("should apply correct CSS classes for caret when enabled", () => {
      const wrapper = mountStreamdown({ caret: "block", isAnimating: true });

      expect(wrapperClass(wrapper)).toContain(
        "[&>*:last-child:not([data-sd-caret-hidden])]:after:inline",
      );
      expect(wrapperClass(wrapper)).toContain(
        "[&>*:last-child:not([data-sd-caret-hidden])]:after:align-baseline",
      );
      expect(wrapperClass(wrapper)).toContain(
        "[&>*:last-child:not([data-sd-caret-hidden])]:after:content-[var(--streamdown-caret)]",
      );
    });

    it("should not apply caret CSS classes when caret is disabled", () => {
      const wrapper = mountStreamdown({ isAnimating: true });

      expect(wrapperClass(wrapper)).not.toContain(
        "[&>*:last-child:not([data-sd-caret-hidden])]:after:inline",
      );
      expect(wrapperClass(wrapper)).not.toContain(
        "[&>*:last-child:not([data-sd-caret-hidden])]:after:align-baseline",
      );
      expect(wrapperClass(wrapper)).not.toContain(
        "[&>*:last-child:not([data-sd-caret-hidden])]:after:content-[var(--streamdown-caret)]",
      );
    });

    it("should preserve other classNames when caret is enabled", () => {
      const wrapper = mountStreamdown({
        caret: "block",
        className: "custom-class another-class",
        isAnimating: true,
      });

      expect(wrapperClass(wrapper)).toContain("custom-class");
      expect(wrapperClass(wrapper)).toContain("another-class");
      expect(wrapperClass(wrapper)).toContain(
        "[&>*:last-child:not([data-sd-caret-hidden])]:after:inline",
      );
    });
  });

  describe("Caret Type Safety", () => {
    it("should accept 'block' as valid caret value", () => {
      expect(() =>
        mountStreamdown({ caret: "block", isAnimating: true }),
      ).not.toThrow();
    });

    it("should accept 'circle' as valid caret value", () => {
      expect(() =>
        mountStreamdown({ caret: "circle", isAnimating: true }),
      ).not.toThrow();
    });

    it("should accept undefined as valid caret value", () => {
      expect(() => mountStreamdown({ isAnimating: true })).not.toThrow();
    });
  });

  describe("Real-world Usage Scenarios", () => {
    it("should simulate streaming chat message with caret", async () => {
      const wrapper = mountStreamdown(
        { caret: "block", isAnimating: true },
        "Hello",
      );

      expect(caretValue(wrapper)).toBe('" ▋"');

      await wrapper.setProps({ children: "Hello, how can I help" });
      expect(caretValue(wrapper)).toBe('" ▋"');

      await wrapper.setProps({
        children: "Hello, how can I help you today?",
        isAnimating: false,
      });
      expect(caretValue(wrapper)).toBe("");
    });

    it("should support conditional caret for assistant messages only", () => {
      const messageRole = "assistant";
      const isLastMessage = true;
      const caret =
        messageRole === "assistant" && isLastMessage ? "block" : undefined;
      const wrapper = mountStreamdown(
        { caret, isAnimating: true },
        "Assistant response",
      );

      expect(caretValue(wrapper)).toBe('" ▋"');
    });

    it("should not show caret for non-assistant messages", () => {
      const messageRole = "user";
      const isLastMessage = true;
      const caret =
        messageRole === "assistant" && isLastMessage ? "block" : undefined;
      const wrapper = mountStreamdown(
        { caret, isAnimating: true },
        "User message",
      );

      expect(caretValue(wrapper)).toBe("");
    });

    it("should not show caret for non-last messages", () => {
      const messageRole = "assistant";
      const isLastMessage = false;
      const caret =
        messageRole === "assistant" && isLastMessage ? "circle" : undefined;
      const wrapper = mountStreamdown(
        { caret, isAnimating: true },
        "Previous assistant message",
      );

      expect(caretValue(wrapper)).toBe("");
    });
  });
});
