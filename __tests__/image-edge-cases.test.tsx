import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { ImageComponent } from "../lib/image";

vi.mock("../lib/utils", async () => {
  const actual = await vi.importActual("../lib/utils");
  return {
    ...actual,
    save: vi.fn(),
  };
});

describe("ImageComponent edge cases", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should handle cached images (img.complete=true with naturalWidth > 0)", async () => {
    const wrapper = mount(ImageComponent, {
      props: {
        alt: "Cached",
        node: null,
        src: "https://example.com/cached.png",
      },
    });

    const img = wrapper.find('img[data-streamdown="image"]');
    Object.defineProperty(img.element, "complete", { value: true });
    Object.defineProperty(img.element, "naturalWidth", { value: 200 });

    await img.trigger("error");
    await nextTick();

    const fallback = wrapper.find('[data-streamdown="image-fallback"]');
    expect(fallback.exists()).toBe(true);
    expect(fallback.text()).toContain("Image not available");
  });

  it("should call onError prop when image fails to load", async () => {
    const onError = vi.fn();
    const wrapper = mount(ImageComponent, {
      props: {
        alt: "Test",
        node: null,
        onError,
        src: "https://example.com/broken.png",
      },
    });

    await wrapper.find('img[data-streamdown="image"]').trigger("error");

    expect(onError).toHaveBeenCalled();
  });

  it("should call onLoad prop when image loads", async () => {
    const onLoad = vi.fn();
    const wrapper = mount(ImageComponent, {
      props: {
        alt: "Test",
        node: null,
        onLoad,
        src: "https://example.com/image.png",
      },
    });

    await wrapper.find('img[data-streamdown="image"]').trigger("load");

    expect(onLoad).toHaveBeenCalled();
  });

  it("should show download button when explicit dimensions are set", () => {
    const wrapper = mount(ImageComponent, {
      props: {
        alt: "Test",
        node: null,
        src: "https://example.com/image.png",
        width: 200,
      },
    });

    expect(wrapper.find('button[title="Download image"]').exists()).toBe(true);
  });

  it("should not show fallback when error occurs but explicit dimensions set", async () => {
    const wrapper = mount(ImageComponent, {
      props: {
        alt: "Test",
        height: 100,
        node: null,
        src: "https://example.com/image.png",
        width: 200,
      },
    });

    await wrapper.find('img[data-streamdown="image"]').trigger("error");
    await nextTick();

    expect(wrapper.find('[data-streamdown="image-fallback"]').exists()).toBe(
      false,
    );
  });

  it("should show error fallback and hide download on error", async () => {
    const wrapper = mount(ImageComponent, {
      props: {
        alt: "Test",
        node: null,
        src: "https://example.com/broken.png",
      },
    });

    await wrapper.find('img[data-streamdown="image"]').trigger("error");
    await nextTick();

    expect(wrapper.find('[data-streamdown="image-fallback"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('button[title="Download image"]').exists()).toBe(false);
  });
});
