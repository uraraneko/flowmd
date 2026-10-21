import { createApp, defineComponent, h, nextTick, shallowRef } from "vue";
import { describe, expect, it, vi } from "vitest";
import { Streamdown, useIsCodeFenceIncomplete } from "../../index";

async function mounted(render: () => any, check: () => Promise<void>) {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp({ render });
  app.mount(host);
  try {
    await check();
  } finally {
    app.unmount();
    host.remove();
  }
}

describe("native Vue contract", () => {
  it("updates Markdown supplied through a reactive default slot", async () => {
    const source = shallowRef("**first**");
    const host = document.createElement("div");
    const app = createApp({
      render: () => h(Streamdown, {}, { default: () => source.value }),
    });
    app.mount(host);
    try {
      expect(host.textContent).toBe("first");
      source.value = "**second**";
      await nextTick();
      expect(host.textContent).toBe("second");
      source.value = "";
      await nextTick();
      expect(host.textContent).toBe("");
    } finally {
      app.unmount();
    }
  });
  it("keeps the incomplete-fence composable reactive when captured once in setup", async () => {
    const observed: boolean[] = [];
    const Custom = defineComponent({
      setup() {
        const incomplete = useIsCodeFenceIncomplete();
        return () => {
          observed.push(incomplete.value);
          return h("div", String(incomplete.value));
        };
      },
    });
    const source = shallowRef("```custom\nhello");
    await mounted(
      () =>
        h(Streamdown, {
          children: source.value,
          isAnimating: true,
          components: { code: Custom },
        }),
      async () => {
        expect(observed.at(-1)).toBe(true);
        source.value += "\n```";
        await nextTick();
        expect(observed.at(-1)).toBe(false);
      },
    );
  });
  it("fires animation callbacks when leaving static mode with an active stream", async () => {
    const mode = shallowRef<"static" | "streaming">("static");
    const start = vi.fn();
    const end = vi.fn();
    const active = shallowRef(true);
    await mounted(
      () =>
        h(Streamdown, {
          children: "Hello",
          mode: mode.value,
          isAnimating: active.value,
          onAnimationStart: start,
          onAnimationEnd: end,
        }),
      async () => {
        expect(start).not.toHaveBeenCalled();
        mode.value = "streaming";
        await nextTick();
        expect(start).toHaveBeenCalledTimes(1);
        active.value = false;
        await nextTick();
        expect(end).toHaveBeenCalledTimes(1);
      },
    );
  });
});

describe("public component class overrides", () => {
  it("accepts className on code blocks without replacing their built-in styling", async () => {
    const { mount, flushPromises } = await import("@vue/test-utils");
    const { CodeBlock } = await import("../../index");
    const wrapper = mount(CodeBlock, {
      props: { code: "const x = 1;", language: "js", className: "custom-code" },
    });
    await flushPromises();
    const body = wrapper.find('[data-streamdown="code-block-body"]');
    expect(body.classes()).toContain("custom-code");
    expect(body.classes()).toContain("bg-background");
    expect(body.attributes("classname")).toBeUndefined();
    wrapper.unmount();
  });
  it("accepts Vue SFC-style icon components in controls", async () => {
    const { mount, flushPromises } = await import("@vue/test-utils");
    const Icon = defineComponent({
      render: () => h("svg", { "data-test-icon": "copy" }),
    });
    const wrapper = mount(Streamdown, {
      props: { children: "```js\nx\n```", icons: { CopyIcon: Icon } },
    });
    await flushPromises();
    expect(wrapper.find('[data-test-icon="copy"]').exists()).toBe(true);
    expect(
      wrapper.find('[data-test-icon="copy"]').attributes("aria-hidden"),
    ).toBe("true");
    wrapper.unmount();
  });
});

describe("animation callback lifecycle", () => {
  it("runs the initial callback after DOM commit and suppresses it during SSR", async () => {
    const { createSSRApp } = await import("vue");
    const { renderToString } = await import("@vue/server-renderer");
    const start = vi.fn();
    const props = {
      children: "**Mounted content**",
      isAnimating: true,
      onAnimationStart: start,
    };
    await renderToString(createSSRApp({ render: () => h(Streamdown, props) }));
    expect(start).not.toHaveBeenCalled();
    let committedText: string | null | undefined;
    await mounted(
      () =>
        h(Streamdown, {
          ...props,
          onAnimationStart: () => {
            start();
            committedText = document.querySelector(
              '[data-streamdown="strong"]',
            )?.textContent;
          },
        }),
      async () => {
        expect(start).toHaveBeenCalledTimes(1);
        expect(committedText).toBe("Mounted content");
      },
    );
  });
});
