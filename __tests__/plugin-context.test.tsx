import { defineComponent } from "vue";
import { describe, expect, it } from "vitest";
import {
  PluginKey,
  useCjkPlugin,
  useCodePlugin,
  useCustomRenderer,
  useMathPlugin,
  useMermaidPlugin,
  usePlugins,
} from "../lib/plugin-context";
import { mountComposable } from "./helpers/vue";

describe("plugin-context hooks", () => {
  const withPlugins = (value: any) => ({ [PluginKey as symbol]: value });

  describe("usePlugins", () => {
    it("should return null when no provider", () => {
      const { result } = mountComposable(() => usePlugins());
      expect(result).toBeNull();
    });

    it("should return plugins when provided", () => {
      const plugins = { code: { name: "code" } };
      const { result } = mountComposable(
        () => usePlugins(),
        withPlugins(plugins),
      );
      expect(result).toBe(plugins);
    });
  });

  describe("useCodePlugin", () => {
    it("should return null when no plugins", () => {
      const { result } = mountComposable(
        () => useCodePlugin(),
        withPlugins(null),
      );
      expect(result).toBeNull();
    });

    it("should return code plugin when available", () => {
      const codePlugin = { name: "code" };
      const { result } = mountComposable(
        () => useCodePlugin(),
        withPlugins({ code: codePlugin }),
      );
      expect(result).toBe(codePlugin);
    });
  });

  describe("useMermaidPlugin", () => {
    it("should return null when no plugins", () => {
      const { result } = mountComposable(
        () => useMermaidPlugin(),
        withPlugins(null),
      );
      expect(result).toBeNull();
    });

    it("should return mermaid plugin when available", () => {
      const mermaidPlugin = { name: "mermaid" };
      const { result } = mountComposable(
        () => useMermaidPlugin(),
        withPlugins({ mermaid: mermaidPlugin }),
      );
      expect(result).toBe(mermaidPlugin);
    });
  });

  describe("useMathPlugin", () => {
    it("should return null when no plugins", () => {
      const { result } = mountComposable(
        () => useMathPlugin(),
        withPlugins(null),
      );
      expect(result).toBeNull();
    });

    it("should return math plugin when available", () => {
      const mathPlugin = { name: "math" };
      const { result } = mountComposable(
        () => useMathPlugin(),
        withPlugins({ math: mathPlugin }),
      );
      expect(result).toBe(mathPlugin);
    });
  });

  describe("useCjkPlugin", () => {
    it("should return null when no plugins", () => {
      const { result } = mountComposable(
        () => useCjkPlugin(),
        withPlugins(null),
      );
      expect(result).toBeNull();
    });

    it("should return cjk plugin when available", () => {
      const cjkPlugin = { name: "cjk" };
      const { result } = mountComposable(
        () => useCjkPlugin(),
        withPlugins({ cjk: cjkPlugin }),
      );
      expect(result).toBe(cjkPlugin);
    });
  });

  describe("useCustomRenderer", () => {
    const DummyComponent = defineComponent({
      setup() {
        return () => null;
      },
    });

    it("should return null when no plugins", () => {
      const { result } = mountComposable(
        () => useCustomRenderer("vega"),
        withPlugins(null),
      );
      expect(result).toBeNull();
    });

    it("should return null when no renderers configured", () => {
      const { result } = mountComposable(
        () => useCustomRenderer("vega"),
        withPlugins({}),
      );
      expect(result).toBeNull();
    });

    it("should return null for empty language", () => {
      const renderer = { language: "vega", component: DummyComponent };
      const { result } = mountComposable(
        () => useCustomRenderer(""),
        withPlugins({ renderers: [renderer] }),
      );
      expect(result).toBeNull();
    });

    it("should match string language", () => {
      const renderer = { language: "vega", component: DummyComponent };
      const { result } = mountComposable(
        () => useCustomRenderer("vega"),
        withPlugins({ renderers: [renderer] }),
      );
      expect(result).toBe(renderer);
    });

    it("should match array language", () => {
      const renderer = {
        language: ["vega", "vega-lite"],
        component: DummyComponent,
      };
      const { result } = mountComposable(
        () => useCustomRenderer("vega-lite"),
        withPlugins({ renderers: [renderer] }),
      );
      expect(result).toBe(renderer);
    });

    it("should return null for non-matching language", () => {
      const renderer = { language: "vega", component: DummyComponent };
      const { result } = mountComposable(
        () => useCustomRenderer("d2"),
        withPlugins({ renderers: [renderer] }),
      );
      expect(result).toBeNull();
    });

    it("should return first matching renderer", () => {
      const renderer1 = { language: "vega", component: DummyComponent };
      const renderer2 = {
        language: "vega",
        component: defineComponent({ setup: () => () => null }),
      };
      const { result } = mountComposable(
        () => useCustomRenderer("vega"),
        withPlugins({ renderers: [renderer1, renderer2] }),
      );
      expect(result).toBe(renderer1);
    });
  });
});
