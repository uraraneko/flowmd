import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { ImageComponent } from "../lib/image";

if (typeof URL.createObjectURL === "undefined") {
  URL.createObjectURL = vi.fn();
  URL.revokeObjectURL = vi.fn();
}

vi.mock("../lib/utils", async () => {
  const actual = await vi.importActual("../lib/utils");
  return {
    ...actual,
    save: vi.fn(),
  };
});

const triggerImageLoad = async (wrapper: ReturnType<typeof mount>) => {
  await wrapper.find('img[data-streamdown="image"]').trigger("load");
  await nextTick();
};

const clickDownload = async (wrapper: ReturnType<typeof mount>) => {
  const button = wrapper.find('button[title="Download image"]');
  expect(button.exists()).toBe(true);
  await button.trigger("click");
};

describe("ImageComponent", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render null when src is not provided", () => {
    const wrapper = mount(ImageComponent, { props: { node: null } });
    expect(wrapper.element.nodeType).toBe(Node.COMMENT_NODE);
  });

  it("should render image with src and alt", () => {
    const wrapper = mount(ImageComponent, {
      props: {
        alt: "Test image",
        node: null,
        src: "https://example.com/image.png",
      },
    });

    const img = wrapper.find('img[data-streamdown="image"]');
    expect(img.exists()).toBe(true);
    expect(img.attributes("src")).toBe("https://example.com/image.png");
    expect(img.attributes("alt")).toBe("Test image");
  });

  it("should render wrapper with correct classes", () => {
    const wrapper = mount(ImageComponent, {
      props: {
        alt: "Test",
        node: null,
        src: "https://example.com/image.png",
      },
    });

    const imageWrapper = wrapper.find('[data-streamdown="image-wrapper"]');
    expect(imageWrapper.exists()).toBe(true);
    expect(imageWrapper.classes()).toContain("group");
    expect(imageWrapper.classes()).toContain("relative");
  });

  it("should render download button", async () => {
    const wrapper = mount(ImageComponent, {
      props: {
        alt: "Test",
        node: null,
        src: "https://example.com/image.png",
      },
    });

    await triggerImageLoad(wrapper);

    expect(wrapper.find('button[title="Download image"]').exists()).toBe(true);
  });

  it("should apply custom className to image", () => {
    const wrapper = mount(ImageComponent, {
      props: {
        alt: "Test",
        class: "custom-class",
        node: null,
        src: "https://example.com/image.png",
      },
    });

    expect(wrapper.find('img[data-streamdown="image"]').classes()).toContain(
      "custom-class",
    );
  });

  it("should download image with extension from URL", async () => {
    const { save } = await import("../lib/utils");
    const mockBlob = new Blob(["image data"], { type: "image/png" });

    (global.fetch as any).mockResolvedValueOnce({
      blob: async () => mockBlob,
    });

    const wrapper = mount(ImageComponent, {
      props: {
        alt: "Test",
        node: null,
        src: "https://example.com/image.png",
      },
    });

    await triggerImageLoad(wrapper);
    await clickDownload(wrapper);

    await vi.waitFor(() => {
      expect(save).toHaveBeenCalledWith("image.png", mockBlob, "image/png");
    });
  });

  it("should download image with extension from blob type when URL has no extension", async () => {
    const { save } = await import("../lib/utils");
    const mockBlob = new Blob(["image data"], { type: "image/jpeg" });

    (global.fetch as any).mockResolvedValueOnce({
      blob: async () => mockBlob,
    });

    const wrapper = mount(ImageComponent, {
      props: {
        alt: "My Image",
        node: null,
        src: "https://example.com/noextension",
      },
    });

    await triggerImageLoad(wrapper);
    await clickDownload(wrapper);

    await vi.waitFor(() => {
      expect(save).toHaveBeenCalledWith("My Image.jpg", mockBlob, "image/jpeg");
    });
  });

  it("should use default extension when blob type is unknown", async () => {
    const { save } = await import("../lib/utils");
    const mockBlob = new Blob(["image data"], {
      type: "application/octet-stream",
    });

    (global.fetch as any).mockResolvedValueOnce({
      blob: async () => mockBlob,
    });

    const wrapper = mount(ImageComponent, {
      props: {
        alt: "Test",
        node: null,
        src: "https://example.com/noext",
      },
    });

    await triggerImageLoad(wrapper);
    await clickDownload(wrapper);

    await vi.waitFor(() => {
      expect(save).toHaveBeenCalledWith(
        "Test.png",
        mockBlob,
        "application/octet-stream",
      );
    });
  });

  it("should handle different image types from blob", async () => {
    const { save } = await import("../lib/utils");

    const testCases = [
      { type: "image/svg+xml", extension: "svg" },
      { type: "image/gif", extension: "gif" },
      { type: "image/webp", extension: "webp" },
      { type: "image/png", extension: "png" },
    ];

    for (const { type, extension } of testCases) {
      const mockBlob = new Blob(["data"], { type });
      (global.fetch as any).mockResolvedValueOnce({
        blob: async () => mockBlob,
      });

      const wrapper = mount(ImageComponent, {
        props: {
          alt: "Test",
          node: null,
          src: "https://example.com/test",
        },
      });

      await triggerImageLoad(wrapper);
      await clickDownload(wrapper);

      await vi.waitFor(() => {
        expect(save).toHaveBeenCalledWith(`Test.${extension}`, mockBlob, type);
      });

      wrapper.unmount();
      vi.clearAllMocks();
    }
  });

  it("should use alt text as filename when URL has no name", async () => {
    const { save } = await import("../lib/utils");
    const mockBlob = new Blob(["data"], { type: "image/png" });

    (global.fetch as any).mockResolvedValueOnce({
      blob: async () => mockBlob,
    });

    const wrapper = mount(ImageComponent, {
      props: {
        alt: "My Custom Name",
        node: null,
        src: "https://example.com/",
      },
    });

    await triggerImageLoad(wrapper);
    await clickDownload(wrapper);

    await vi.waitFor(() => {
      expect(save).toHaveBeenCalledWith(
        "My Custom Name.png",
        mockBlob,
        "image/png",
      );
    });
  });

  it("should use 'image' as default filename when no alt or filename available", async () => {
    const { save } = await import("../lib/utils");
    const mockBlob = new Blob(["data"], { type: "image/png" });

    (global.fetch as any).mockResolvedValueOnce({
      blob: async () => mockBlob,
    });

    const wrapper = mount(ImageComponent, {
      props: { node: null, src: "https://example.com/" },
    });

    await triggerImageLoad(wrapper);
    await clickDownload(wrapper);

    await vi.waitFor(() => {
      expect(save).toHaveBeenCalledWith("image.png", mockBlob, "image/png");
    });
  });

  it("should fallback to window.open when fetch fails (e.g., CORS error)", async () => {
    const mockWindowOpen = vi.fn();
    global.window.open = mockWindowOpen;

    (global.fetch as any).mockRejectedValueOnce(new Error("CORS error"));

    const wrapper = mount(ImageComponent, {
      props: {
        alt: "Test",
        node: null,
        src: "https://example.com/image.png",
      },
    });

    await triggerImageLoad(wrapper);
    await clickDownload(wrapper);

    await vi.waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalledWith(
        "https://example.com/image.png",
        "_blank",
      );
    });
  });

  it("should not attempt download when src is undefined in download handler", async () => {
    const { save } = await import("../lib/utils");

    const wrapper = mount(ImageComponent, {
      props: {
        alt: "Test",
        node: null,
        src: "https://example.com/image.png",
      },
    });

    await wrapper.setProps({ src: undefined });

    expect(wrapper.find('button[title="Download image"]').exists()).toBe(false);
    expect(save).not.toHaveBeenCalled();
  });

  it("should remove extension from alt text when used as filename", async () => {
    const { save } = await import("../lib/utils");
    const mockBlob = new Blob(["data"], { type: "image/png" });

    (global.fetch as any).mockResolvedValueOnce({
      blob: async () => mockBlob,
    });

    const wrapper = mount(ImageComponent, {
      props: {
        alt: "My Image.jpg",
        node: null,
        src: "https://example.com/",
      },
    });

    await triggerImageLoad(wrapper);
    await clickDownload(wrapper);

    await vi.waitFor(() => {
      expect(save).toHaveBeenCalledWith("My Image.png", mockBlob, "image/png");
    });
  });

  it("should pass through additional props to img element", () => {
    const wrapper = mount(ImageComponent, {
      attrs: {
        "data-testid": "custom-image",
        loading: "lazy",
        title: "Test Title",
      },
      props: {
        alt: "Test",
        node: null,
        src: "https://example.com/image.png",
      },
    });

    const img = wrapper.find('img[data-streamdown="image"]');
    expect(img.attributes("title")).toBe("Test Title");
    expect(img.attributes("loading")).toBe("lazy");
    expect(img.attributes("data-testid")).toBe("custom-image");
  });
});
