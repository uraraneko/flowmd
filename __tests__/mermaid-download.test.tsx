import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { StreamdownKey } from "../index";
import { MermaidDownloadDropdown } from "../lib/mermaid/download-button";
import { PluginKey } from "../lib/plugin-context";
import type { DiagramPlugin, MermaidInstance } from "../lib/plugin-types";
import { createStreamdownContext } from "./helpers/vue";

vi.mock("../lib/utils", async () => {
  const actual = await vi.importActual("../lib/utils");
  return {
    ...actual,
    save: vi.fn(),
  };
});

vi.mock("../lib/mermaid/utils", () => ({
  svgToPngBlob: vi
    .fn()
    .mockResolvedValue(new Blob(["png"], { type: "image/png" })),
}));

describe("MermaidDownloadDropdown", () => {
  const createMockPlugin = (
    renderResult = { svg: "<svg><text>Chart</text></svg>" },
  ): DiagramPlugin => {
    const mockInstance: MermaidInstance = {
      initialize: vi.fn(),
      render: vi.fn().mockResolvedValue(renderResult),
    };
    return {
      name: "mermaid",
      type: "diagram",
      language: "mermaid",
      getMermaid: vi.fn().mockReturnValue(mockInstance),
    };
  };

  const mountDropdown = (
    props: Record<string, unknown>,
    plugin: DiagramPlugin | null = createMockPlugin(),
    context = createStreamdownContext(),
  ) =>
    mount(MermaidDownloadDropdown, {
      props,
      global: {
        provide: {
          [PluginKey as symbol]: plugin ? { mermaid: plugin } : {},
          [StreamdownKey as symbol]: context,
        },
      },
    });

  const openDropdown = async (wrapper: ReturnType<typeof mountDropdown>) => {
    await wrapper.find("button").trigger("click");
    await nextTick();
  };

  const findOption = (
    wrapper: ReturnType<typeof mountDropdown>,
    label: string,
  ) =>
    wrapper.findAll("button").find((button) => button.text().trim() === label);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should toggle dropdown on button click", async () => {
    const wrapper = mountDropdown({ chart: "graph TD; A-->B" });

    await openDropdown(wrapper);
    expect(wrapper.find(".absolute").exists()).toBe(true);

    await wrapper.find("button").trigger("click");
    await nextTick();
    expect(wrapper.find(".absolute").exists()).toBe(false);
  });

  it("should download as MMD format", async () => {
    const { save } = await import("../lib/utils");
    const onDownload = vi.fn();
    const wrapper = mountDropdown({ chart: "graph TD; A-->B", onDownload });

    await openDropdown(wrapper);
    await findOption(wrapper, "MMD")?.trigger("click");

    await vi.waitFor(() => {
      expect(save).toHaveBeenCalledWith(
        "diagram.mmd",
        "graph TD; A-->B",
        "text/plain",
      );
      expect(onDownload).toHaveBeenCalledWith("mmd");
    });
  });

  it("should download as SVG format", async () => {
    const { save } = await import("../lib/utils");
    const onDownload = vi.fn();
    const plugin = createMockPlugin();
    const wrapper = mountDropdown(
      { chart: "graph TD; A-->B", onDownload },
      plugin,
    );

    await openDropdown(wrapper);
    await findOption(wrapper, "SVG")?.trigger("click");

    await vi.waitFor(() => {
      expect(save).toHaveBeenCalledWith(
        "diagram.svg",
        "<svg><text>Chart</text></svg>",
        "image/svg+xml",
      );
      expect(onDownload).toHaveBeenCalledWith("svg");
    });
  });

  it("should download as PNG format", async () => {
    const { save } = await import("../lib/utils");
    const { svgToPngBlob } = await import("../lib/mermaid/utils");
    const onDownload = vi.fn();
    const plugin = createMockPlugin();
    const wrapper = mountDropdown(
      { chart: "graph TD; A-->B", onDownload },
      plugin,
    );

    await openDropdown(wrapper);
    await findOption(wrapper, "PNG")?.trigger("click");

    await vi.waitFor(() => {
      expect(svgToPngBlob).toHaveBeenCalledWith(
        "<svg><text>Chart</text></svg>",
      );
      expect(save).toHaveBeenCalledWith(
        "diagram.png",
        expect.any(Blob),
        "image/png",
      );
      expect(onDownload).toHaveBeenCalledWith("png");
    });
  });

  it("should call onError when mermaid render returns empty SVG", async () => {
    const onError = vi.fn();
    const plugin = createMockPlugin({ svg: "" });
    const wrapper = mountDropdown(
      { chart: "graph TD; A-->B", onError },
      plugin,
    );

    await openDropdown(wrapper);
    await findOption(wrapper, "SVG")?.trigger("click");

    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("SVG not found"),
        }),
      );
    });
  });

  it("should call onError when render throws", async () => {
    const onError = vi.fn();
    const mockInstance: MermaidInstance = {
      initialize: vi.fn(),
      render: vi.fn().mockRejectedValue(new Error("Render failed")),
    };
    const plugin: DiagramPlugin = {
      name: "mermaid",
      type: "diagram",
      language: "mermaid",
      getMermaid: vi.fn().mockReturnValue(mockInstance),
    };
    const wrapper = mountDropdown({ chart: "invalid", onError }, plugin);

    await openDropdown(wrapper);
    await findOption(wrapper, "SVG")?.trigger("click");

    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it("should call onError when no mermaid plugin available", async () => {
    const onError = vi.fn();
    const wrapper = mountDropdown({ chart: "graph TD; A-->B", onError }, null);

    await openDropdown(wrapper);
    await findOption(wrapper, "SVG")?.trigger("click");

    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Mermaid plugin not available",
        }),
      );
    });
  });

  it("should close dropdown on outside click", async () => {
    const wrapper = mountDropdown({ chart: "graph TD; A-->B" });

    await openDropdown(wrapper);
    expect(wrapper.find(".absolute").exists()).toBe(true);

    document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await nextTick();

    expect(wrapper.find(".absolute").exists()).toBe(false);
  });

  it("should be disabled when isAnimating", () => {
    const wrapper = mountDropdown(
      { chart: "graph TD; A-->B" },
      createMockPlugin(),
      createStreamdownContext({ isAnimating: true }),
    );

    expect(wrapper.find("button").attributes("disabled")).toBeDefined();
  });
});
