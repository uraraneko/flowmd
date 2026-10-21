import { expect } from "vitest";
import { createApp, h, shallowRef, nextTick } from "vue";
import { createRoot } from "react-dom/client";
import { createElement, act } from "react";
import { Streamdown } from "../../index";
import { Streamdown as ReactStreamdown } from "../../vendor/upstream/packages/streamdown/index.tsx";
import { canonical } from "./fixtures";

export async function harness(options: Record<string, unknown> = {}) {
  const vueHost = document.createElement("div");
  const reactHost = document.createElement("div");
  const vueOverlays = document.createElement("div");
  const reactOverlays = document.createElement("div");
  document.body.append(vueHost, reactHost, vueOverlays, reactOverlays);
  const state = shallowRef({ children: "", ...options });
  const app = createApp({
    render: () => h(Streamdown, { ...state.value, portal: vueOverlays }),
  });
  app.mount(vueHost);
  const root = createRoot(reactHost);
  const update = async (
    children: string,
    changes: Record<string, unknown> = {},
  ) => {
    const props = { ...state.value, ...changes, children };
    await act(async () => {
      root.render(
        createElement(ReactStreamdown, { ...props, portal: reactOverlays }),
      );
    });
    state.value = props;
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await nextTick();
  };
  const compare = () => {
    expect(canonical(vueHost.innerHTML)).toEqual(
      canonical(reactHost.innerHTML),
    );
    expect(canonical(vueOverlays.innerHTML)).toEqual(
      canonical(reactOverlays.innerHTML),
    );
  };
  const dispose = async () => {
    app.unmount();
    await act(async () => root.unmount());
    vueHost.remove();
    reactHost.remove();
    vueOverlays.remove();
    reactOverlays.remove();
  };
  return {
    update,
    compare,
    dispose,
    vueHost,
    reactHost,
    vueOverlays,
    reactOverlays,
  };
}
