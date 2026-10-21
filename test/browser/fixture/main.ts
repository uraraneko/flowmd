import { createApp, h, shallowRef, nextTick } from "vue";
import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { flushSync } from "react-dom";
import { Streamdown } from "../../../index.js";
import { Streamdown as ReactStreamdown } from "../../../vendor/upstream/packages/streamdown/index.tsx";
import { code } from "../../../plugins/code.js";
import { math } from "../../../plugins/math.js";
import { cjk } from "../../../plugins/cjk.js";
import { mermaid } from "../../../plugins/mermaid.js";
import "./style.css";

const reactRoot = createRoot(document.querySelector("#react")!);
const state = shallowRef<Record<string, unknown>>({ children: "" });
createApp({ render: () => h(Streamdown, state.value) }).mount("#vue");

const plugins = { code, math, cjk, mermaid };
async function render(source: string, options: Record<string, unknown> = {}) {
  const { rich = false, ...rest } = options;
  const shared = { children: source, ...(rich ? { plugins } : {}), ...rest };
  flushSync(() =>
    reactRoot.render(
      createElement(ReactStreamdown, {
        ...shared,
        portal: document.querySelector("#react-overlays") as HTMLElement,
      }),
    ),
  );
  state.value = { ...shared, portal: document.querySelector("#vue-overlays") };
  await nextTick();
  await new Promise(requestAnimationFrame);
}

Object.assign(window, { streamdownTest: { render } });
await render(
  "# Streaming Markdown\n\nBoth renderers receive **the same input**.\n\n```ts\nconst answer = 42;\n```",
  { isAnimating: false },
);
