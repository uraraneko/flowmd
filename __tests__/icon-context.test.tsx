import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, type SVGAttributes } from "vue";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import {
  defaultIcons,
  IconKey,
  type IconMap,
  useIcons,
} from "../lib/icon-context";

const CustomCheckIcon = (props: SVGAttributes) =>
  h("svg", { ...props, "data-testid": "custom-check" }, [
    h("title", "Check icon"),
    h("circle", { r: "5" }),
  ]);

const AltCheckIcon = (props: SVGAttributes) =>
  h("svg", { ...props, "data-testid": "alt-check" }, [
    h("title", "Alt check"),
    h("rect", { height: "10", width: "10" }),
  ]);

const createIconConsumer = (iconName: keyof IconMap) =>
  defineComponent({
    setup() {
      const icons = useIcons();
      return () => icons[iconName]({ "data-testid": "rendered-icon" });
    },
  });

describe("useIcons", () => {
  it("returns default icons outside of a provider", () => {
    const wrapper = mount(createIconConsumer("CheckIcon"));

    const svg = wrapper.element;
    expect(svg.getAttribute("data-testid")).toBe("rendered-icon");
    expect(svg.querySelector("path")).toBeTruthy();
    expect(svg.querySelector("circle")).toBeFalsy();
  });

  it("uses icons provided through IconKey", () => {
    const wrapper = mount(createIconConsumer("CheckIcon"), {
      global: {
        provide: {
          [IconKey as symbol]: {
            ...defaultIcons,
            CheckIcon: CustomCheckIcon,
          },
        },
      },
    });

    const svg = wrapper.element;
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg.querySelector("circle")).toBeTruthy();
    expect(svg.querySelector("path")).toBeFalsy();
  });

  it("keeps non-overridden icons as defaults when provided value is merged", () => {
    const wrapper = mount(createIconConsumer("CopyIcon"), {
      global: {
        provide: {
          [IconKey as symbol]: {
            ...defaultIcons,
            CheckIcon: CustomCheckIcon,
          },
        },
      },
    });

    const svg = wrapper.element;
    expect(svg.getAttribute("data-testid")).toBe("rendered-icon");
    expect(svg.querySelector("path")).toBeTruthy();
  });
});

describe("Streamdown icons prop", () => {
  it("provides default icons when no overrides are given", async () => {
    const wrapper = mount(Streamdown, {
      props: { mode: "static", children: "```js\nconsole.log('x')\n```" },
    });

    await nextTick();
    expect(
      wrapper.element.querySelector(
        '[data-streamdown="code-block-copy-button"] svg',
      ),
    ).toBeTruthy();
  });

  it("overrides a specific icon when provided", async () => {
    const wrapper = mount(Streamdown, {
      props: {
        mode: "static",
        children: "```js\nconsole.log('x')\n```",
        icons: { CheckIcon: CustomCheckIcon },
      },
    });

    await nextTick();
    expect(wrapper.props("icons")).toEqual({ CheckIcon: CustomCheckIcon });
  });

  it("applies new icons on the next upstream-compatible content update", async () => {
    const Consumer = createIconConsumer("CheckIcon");
    const Host = defineComponent({
      props: {
        icons: { type: Object, default: undefined },
        text: { type: String, default: "content" },
      },
      setup(props) {
        return () =>
          h(
            Streamdown,
            {
              mode: "static",
              children: props.text,
              icons: props.icons,
              components: {
                p: defineComponent({
                  setup() {
                    return () => h(Consumer);
                  },
                }),
              },
            },
            () => "content",
          );
      },
    });

    const wrapper = mount(Host, {
      props: { icons: { CheckIcon: CustomCheckIcon } },
    });

    expect(wrapper.element.querySelector("circle")).toBeTruthy();

    await wrapper.setProps({ icons: { CheckIcon: AltCheckIcon } });
    await nextTick();

    expect(wrapper.element.querySelector("circle")).toBeTruthy();
    await wrapper.setProps({ text: "next content" });
    expect(wrapper.element.querySelector("rect")).toBeTruthy();
    expect(wrapper.element.querySelector("circle")).toBeFalsy();
  });
});
