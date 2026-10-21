import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import * as Vue from "vue";
import { defineComponent, h, shallowRef, type FunctionalComponent } from "vue";
import { compileTemplate } from "vue/compiler-sfc";
import { Streamdown } from "../../index";

describe("Vue port review regressions", () => {
  it.each(["isAnimating", "is-animating"])(
    "settles an unchanged fence when %s changes",
    async (name) => {
      const end = vi.fn();
      const wrapper = mount(Streamdown, {
        props: {
          children: "```js\nx",
          [name]: true,
          onAnimationEnd: end,
        },
      });
      await flushPromises();
      expect(
        wrapper
          .find('[data-streamdown="code-block"]')
          .attributes("data-incomplete"),
      ).toBe("true");
      await wrapper.setProps({ [name]: false });
      await flushPromises();
      expect(end).toHaveBeenCalledTimes(1);
      expect(
        wrapper
          .find('[data-streamdown="code-block"]')
          .attributes("data-incomplete"),
      ).toBeUndefined();
      expect(
        wrapper
          .find('[data-streamdown="code-block-copy-button"]')
          .attributes("disabled"),
      ).toBeUndefined();
    },
  );

  it("settles streaming from a compiled SFC template using kebab-case props", async () => {
    const active = shallowRef(true);
    const end = vi.fn();
    const compiled = compileTemplate({
      id: "review-regression",
      filename: "StreamingReply.vue",
      source:
        '<Streamdown :children="source" :is-animating="active" @animation-end="end" />',
      compilerOptions: { mode: "function" },
    });
    expect(compiled.errors).toEqual([]);
    const render = new Function("Vue", compiled.code)(Vue);
    const wrapper = mount(
      defineComponent({
        components: { Streamdown },
        setup: () => ({ source: "```js\nx", active, end }),
        render,
      }),
    );
    await flushPromises();
    active.value = false;
    await flushPromises();
    expect(end).toHaveBeenCalledTimes(1);
    expect(
      wrapper
        .find('[data-streamdown="code-block"]')
        .attributes("data-incomplete"),
    ).toBeUndefined();
  });

  it("updates other tracked kebab-case props without a new Markdown chunk", async () => {
    const wrapper = mount(Streamdown, {
      props: {
        children: "```js\nx\n```",
        "class-name": "first",
        "line-numbers": true,
        "code-block-max-height": 120,
      } as any,
    });
    await flushPromises();
    await wrapper.setProps({
      "class-name": "second",
      "line-numbers": false,
      "code-block-max-height": 240,
    } as any);
    await flushPromises();
    expect(wrapper.classes()).toContain("second");
    expect(wrapper.classes()).not.toContain("first");
    expect(
      wrapper.find('[data-streamdown="code-block-body"]').attributes("style"),
    ).toContain("240px");
    expect(
      wrapper
        .find('[data-streamdown="code-block-body"] code')
        .attributes("class"),
    ).toBeUndefined();
    await wrapper.setProps({ "code-block-raw-languages": ["js"] } as any);
    await flushPromises();
    expect(
      wrapper.find('[data-streamdown="raw-code-block"]').element.textContent,
    ).toBe("x\n");
  });

  it("preserves an inlineCode override's default slot across streaming updates", async () => {
    const Inline: FunctionalComponent = (_, { slots }) =>
      h("mark", slots.default?.());
    const wrapper = mount(Streamdown, {
      props: { children: "`abc`", components: { inlineCode: Inline } },
    });
    await flushPromises();
    expect(wrapper.find("mark").text()).toBe("abc");
    await wrapper.setProps({ children: "`abcdef`" });
    await flushPromises();
    expect(wrapper.find("mark").text()).toBe("abcdef");
  });

  it("preserves a code override's slot when inlineCode is configured", async () => {
    const Inline: FunctionalComponent = (_, { slots }) =>
      h("mark", slots.default?.());
    const Code: FunctionalComponent = (_, { slots }) =>
      h("output", slots.default?.());
    const wrapper = mount(Streamdown, {
      props: {
        children: "```js\nabc\n```",
        components: { inlineCode: Inline, code: Code },
      },
    });
    await flushPromises();
    expect(wrapper.find("output").element.textContent).toBe("abc\n");
    await wrapper.setProps({ children: "```js\nabcdef\n```" });
    await flushPromises();
    expect(wrapper.find("output").element.textContent).toBe("abcdef\n");
  });
});
