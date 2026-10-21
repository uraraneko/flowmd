import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import type { CustomRendererProps } from "../lib/plugin-types";

const VegaRenderer = defineComponent({
  name: "VegaRenderer",
  props: {
    code: { type: String, required: true },
    language: { type: String, required: true },
    isIncomplete: { type: Boolean, required: true },
    meta: { type: String, default: undefined },
  },
  setup(props) {
    return () =>
      h(
        "div",
        {
          "data-code": props.code,
          "data-incomplete": String(props.isIncomplete),
          "data-language": props.language,
          "data-testid": "vega-renderer",
        },
        `Vega Chart: ${props.code}`,
      );
  },
});

const D2Renderer = defineComponent({
  name: "D2Renderer",
  props: {
    code: { type: String, required: true },
    language: { type: String, required: true },
  },
  setup(props) {
    return () =>
      h(
        "div",
        { "data-language": props.language, "data-testid": "d2-renderer" },
        `D2 Diagram: ${props.code}`,
      );
  },
});

const mountStreamdown = (plugins: Record<string, unknown>, children: string) =>
  mount(Streamdown, { props: { plugins, children } });

describe("Custom Renderers", () => {
  it("renders custom renderer for matching language", async () => {
    const wrapper = mountStreamdown(
      { renderers: [{ language: "vega-lite", component: VegaRenderer }] },
      '```vega-lite\n{"mark": "bar"}\n```',
    );

    await vi.waitFor(() => {
      const renderer = wrapper.find('[data-testid="vega-renderer"]');
      expect(renderer.exists()).toBe(true);
      expect(renderer.text()).toContain('{"mark": "bar"}');
    });
  });

  it("passes correct props to custom renderer", async () => {
    const wrapper = mountStreamdown(
      { renderers: [{ language: "vega-lite", component: VegaRenderer }] },
      "```vega-lite\ntest-code\n```",
    );

    await vi.waitFor(() => {
      const renderer = wrapper.find('[data-testid="vega-renderer"]');
      expect(renderer.exists()).toBe(true);
      expect(renderer.attributes("data-language")).toBe("vega-lite");
      expect(renderer.attributes("data-code")).toBe("test-code\n");
      expect(renderer.attributes("data-incomplete")).toBe("false");
    });
  });

  it("renders non-matching languages as default code blocks", async () => {
    const wrapper = mountStreamdown(
      { renderers: [{ language: "vega-lite", component: VegaRenderer }] },
      "```javascript\nconsole.log('hello')\n```",
    );

    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="vega-renderer"]').exists()).toBe(
        false,
      );
      expect(wrapper.find('[data-streamdown="code-block"]').exists()).toBe(
        true,
      );
    });
  });

  it("supports multiple renderers independently", async () => {
    const wrapper = mountStreamdown(
      {
        renderers: [
          { language: "vega-lite", component: VegaRenderer },
          { language: "d2", component: D2Renderer },
        ],
      },
      "```vega-lite\nchart-code\n```\n\n```d2\ndiagram-code\n```",
    );

    await vi.waitFor(() => {
      const vegaRenderer = wrapper.find('[data-testid="vega-renderer"]');
      const d2Renderer = wrapper.find('[data-testid="d2-renderer"]');
      expect(vegaRenderer.exists()).toBe(true);
      expect(d2Renderer.exists()).toBe(true);
      expect(vegaRenderer.text()).toContain("chart-code");
      expect(d2Renderer.text()).toContain("diagram-code");
    });
  });

  it("supports array language field", async () => {
    const wrapper = mountStreamdown(
      {
        renderers: [
          { language: ["vega", "vega-lite"], component: VegaRenderer },
        ],
      },
      "```vega\nchart1\n```\n\n```vega-lite\nchart2\n```",
    );

    await vi.waitFor(() => {
      expect(wrapper.findAll('[data-testid="vega-renderer"]')).toHaveLength(2);
    });
  });

  it("does not interfere with default code blocks when no renderers configured", async () => {
    const wrapper = mount(Streamdown, {
      props: { children: "```javascript\nconst x = 1;\n```" },
    });

    await vi.waitFor(() => {
      expect(wrapper.find('[data-streamdown="code-block"]').exists()).toBe(
        true,
      );
    });
  });

  it("passes meta prop to custom renderer when metastring is present", async () => {
    const MetaRenderer = defineComponent({
      props: { meta: { type: String, default: undefined } },
      setup(props: Partial<CustomRendererProps>) {
        return () =>
          h("div", {
            "data-meta": props.meta ?? "",
            "data-testid": "meta-renderer",
          });
      },
    });
    const wrapper = mountStreamdown(
      { renderers: [{ language: "rust", component: MetaRenderer }] },
      '```rust {1} title="foo"\nlet x = 1;\n```',
    );

    await vi.waitFor(() => {
      expect(
        wrapper.find('[data-testid="meta-renderer"]').attributes("data-meta"),
      ).toBe('{1} title="foo"');
    });
  });

  it("passes undefined meta when no metastring present", async () => {
    const MetaRenderer = defineComponent({
      props: { meta: { type: String, default: undefined } },
      setup(props: Partial<CustomRendererProps>) {
        return () =>
          h("div", {
            "data-has-meta": props.meta !== undefined ? "true" : "false",
            "data-testid": "meta-renderer",
          });
      },
    });
    const wrapper = mountStreamdown(
      { renderers: [{ language: "rust", component: MetaRenderer }] },
      "```rust\nlet x = 1;\n```",
    );

    await vi.waitFor(() => {
      expect(
        wrapper
          .find('[data-testid="meta-renderer"]')
          .attributes("data-has-meta"),
      ).toBe("false");
    });
  });
});
