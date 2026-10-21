import { defineAsyncComponent, defineComponent, h, nextTick, ref } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { Streamdown } from "../../index";
import { Mermaid } from "../../lib/mermaid";
import { PluginKey } from "../../lib/plugin-context";
import { BlockIncompleteKey } from "../../lib/block-incomplete-context";
import type { DiagramPlugin } from "../../lib/plugin-types";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe("async lifecycle", () => {
  it("shows the upstream skeleton while a custom Vue renderer loads", async () => {
    const loader = deferred<any>();
    const Renderer = defineAsyncComponent(() => loader.promise);
    const wrapper = mount(Streamdown, {
      props: {
        children: "```demo\nhello\n```",
        plugins: { renderers: [{ language: "demo", component: Renderer }] },
      },
    });
    expect(wrapper.find("svg.animate-spin").exists()).toBe(true);
    loader.resolve(
      defineComponent({
        props: { code: String },
        setup: (props) => () => h("output", props.code),
      }),
    );
    await flushPromises();
    expect(wrapper.find("output").text()).toContain("hello");
    expect(wrapper.find("svg.animate-spin").exists()).toBe(false);
    wrapper.unmount();
  });

  it("serializes Mermaid rendering, skips superseded chunks and wakes on completion", async () => {
    const pending = new Map<
      string,
      ReturnType<typeof deferred<{ svg: string }>>
    >();
    const render = vi.fn((_id: string, chart: string) => {
      const request = deferred<{ svg: string }>();
      pending.set(chart, request);
      return request.promise;
    });
    const plugin: DiagramPlugin = {
      name: "mermaid",
      type: "diagram",
      language: "mermaid",
      getMermaid: () => ({ initialize() {}, render }),
    };
    const streaming = ref(true);
    const wrapper = mount(Mermaid, {
      props: { chart: "A", fullscreen: true },
      global: {
        provide: {
          [PluginKey as symbol]: { mermaid: plugin },
          [BlockIncompleteKey as symbol]: streaming,
        },
      },
    });
    await nextTick();
    expect(render).toHaveBeenCalledTimes(1);
    await wrapper.setProps({ chart: "B" });
    await wrapper.setProps({ chart: "C" });
    expect(render).toHaveBeenCalledTimes(1);
    pending.get("A")!.resolve({
      svg: '<svg viewBox="0 0 100 50"><text>First valid</text></svg>',
    });
    await flushPromises();
    streaming.value = false;
    await nextTick();
    await flushPromises();
    expect(render.mock.calls.map(([, chart]) => chart)).toEqual(["A", "C"]);
    expect(wrapper.text()).toContain("First valid");
    pending.get("C")!.reject(new Error("Incomplete syntax"));
    await flushPromises();
    expect(wrapper.text()).toContain("First valid");
    expect(wrapper.text()).not.toContain("Mermaid Error");
    await wrapper.setProps({ chart: "D" });
    expect(render).toHaveBeenCalledTimes(3);
    wrapper.unmount();
    pending.get("D")!.resolve({ svg: "<svg><text>After unmount</text></svg>" });
    await flushPromises();
  });
});
