import { mount } from "@vue/test-utils";
import { h, nextTick } from "vue";
import { describe, expect, it } from "vitest";
import { defaultTranslations } from "../index";
import { PanZoom } from "../lib/mermaid/pan-zoom";

const mountPanZoom = (props: Record<string, unknown> = {}) =>
  mount(PanZoom, {
    props,
    slots: {
      default: () => h("div", { "data-testid": "child" }, "Test Content"),
    },
  });

const content = (wrapper: ReturnType<typeof mountPanZoom>) =>
  wrapper.find('[role="application"]');

describe("PanZoom", () => {
  it("should render children", () => {
    const wrapper = mountPanZoom();

    expect(wrapper.find('[data-testid="child"]').exists()).toBe(true);
  });

  it("should render zoom controls by default", () => {
    const wrapper = mountPanZoom();

    expect(
      wrapper.find(`button[title="${defaultTranslations.zoomIn}"]`).exists(),
    ).toBe(true);
    expect(
      wrapper.find(`button[title="${defaultTranslations.zoomOut}"]`).exists(),
    ).toBe(true);
    expect(
      wrapper.find(`button[title="${defaultTranslations.resetView}"]`).exists(),
    ).toBe(true);
  });

  it("should hide controls when showControls is false", () => {
    const wrapper = mountPanZoom({ showControls: false });

    expect(
      wrapper.find(`button[title="${defaultTranslations.zoomIn}"]`).exists(),
    ).toBe(false);
  });

  it("should zoom in when zoom in button is clicked", async () => {
    const wrapper = mountPanZoom({ initialZoom: 1, zoomStep: 0.1 });
    const initialTransform = content(wrapper).attributes("style");

    await wrapper
      .find(`button[title="${defaultTranslations.zoomIn}"]`)
      .trigger("click");

    expect(content(wrapper).attributes("style")).not.toBe(initialTransform);
    expect(content(wrapper).attributes("style")).toContain("scale(1.1)");
  });

  it("should zoom out when zoom out button is clicked", async () => {
    const wrapper = mountPanZoom({ initialZoom: 1, zoomStep: 0.1 });

    await wrapper
      .find(`button[title="${defaultTranslations.zoomOut}"]`)
      .trigger("click");

    expect(content(wrapper).attributes("style")).toContain("scale(0.9)");
  });

  it("should reset zoom and pan when reset button is clicked", async () => {
    const wrapper = mountPanZoom({ initialZoom: 1 });

    await wrapper
      .find(`button[title="${defaultTranslations.zoomIn}"]`)
      .trigger("click");
    await wrapper
      .find(`button[title="${defaultTranslations.resetView}"]`)
      .trigger("click");

    expect(content(wrapper).attributes("style")).toContain("scale(1)");
  });

  it("should respect minZoom limit", () => {
    const wrapper = mountPanZoom({
      initialZoom: 0.5,
      minZoom: 0.5,
      zoomStep: 0.1,
    });

    expect(
      wrapper
        .find(`button[title="${defaultTranslations.zoomOut}"]`)
        .attributes("disabled"),
    ).toBeDefined();
  });

  it("should respect maxZoom limit", () => {
    const wrapper = mountPanZoom({ initialZoom: 3, maxZoom: 3, zoomStep: 0.1 });

    expect(
      wrapper
        .find(`button[title="${defaultTranslations.zoomIn}"]`)
        .attributes("disabled"),
    ).toBeDefined();
  });

  it("should have pointer handling on content", () => {
    const wrapper = mountPanZoom();

    expect(content(wrapper).exists()).toBe(true);
    expect(content(wrapper).attributes("role")).toBe("application");
    expect((wrapper.element as HTMLElement).style.cursor).toBe("grab");
  });

  it("should ignore non-primary pointer down", async () => {
    const wrapper = mountPanZoom();
    const initialCursor = (wrapper.element as HTMLElement).style.cursor;

    content(wrapper).element.dispatchEvent(
      new PointerEvent("pointerdown", {
        button: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true,
        cancelable: true,
      }),
    );
    await nextTick();

    expect((wrapper.element as HTMLElement).style.cursor).toBe(initialCursor);
  });

  it("should apply custom className", () => {
    const wrapper = mountPanZoom({ class: "custom-pan-zoom" });

    expect(wrapper.classes()).toContain("custom-pan-zoom");
  });

  it("should apply fullscreen styles when fullscreen prop is true", () => {
    const wrapper = mountPanZoom({ fullscreen: true });

    expect(wrapper.classes()).toContain("h-full");
    expect(wrapper.classes()).toContain("w-full");
  });

  it("should handle wheel events for zoom", async () => {
    const wrapper = mountPanZoom();

    wrapper.element.dispatchEvent(
      new WheelEvent("wheel", {
        deltaY: -100,
        bubbles: true,
        cancelable: true,
      }),
    );
    await nextTick();

    expect(content(wrapper).attributes("style")).toContain("scale(1.1)");
  });

  it("should use initial zoom value", () => {
    const wrapper = mountPanZoom({ initialZoom: 1.5 });

    expect(content(wrapper).attributes("style")).toContain("scale(1.5)");
  });

  it("should handle custom zoom step", async () => {
    const wrapper = mountPanZoom({ initialZoom: 1, zoomStep: 0.5 });

    await wrapper
      .find(`button[title="${defaultTranslations.zoomIn}"]`)
      .trigger("click");

    expect(content(wrapper).attributes("style")).toContain("scale(1.5)");
  });

  it("should set cursor to grab when not panning", () => {
    const wrapper = mountPanZoom();

    expect((wrapper.element as HTMLElement).style.cursor).toBe("grab");
  });

  it("should have role application on content div", () => {
    const wrapper = mountPanZoom();

    expect(content(wrapper).exists()).toBe(true);
  });

  it("should set touch-action none on content", () => {
    const wrapper = mountPanZoom();

    expect((content(wrapper).element as HTMLElement).style.touchAction).toBe(
      "none",
    );
  });
});
