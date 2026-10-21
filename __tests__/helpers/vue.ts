import { mount, type MountingOptions, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, type Component, type VNodeChild } from "vue";
import {
  defaultStreamdownContext,
  StreamdownKey,
  type StreamdownContextType,
} from "../../lib/streamdown-context";
import { PluginKey } from "../../lib/plugin-context";
import type { PluginConfig } from "../../lib/plugin-types";

export const flushPromises = () =>
  new Promise<void>((resolve) => queueMicrotask(resolve));

export const createStreamdownContext = (
  overrides: Partial<StreamdownContextType> = {},
): StreamdownContextType => ({
  ...defaultStreamdownContext,
  ...overrides,
});

export const mountComposable = <T>(
  useValue: () => T,
  provideMap: Record<symbol, unknown> = {},
): { wrapper: VueWrapper; result: T } => {
  let result!: T;

  const Probe = defineComponent({
    setup() {
      result = useValue();
      return () => null;
    },
  });

  const wrapper = mount(Probe, {
    global: {
      provide: provideMap,
    },
  });

  return { wrapper, result };
};

export const mountWithStreamdownContext = (
  component: Component,
  options: MountingOptions<Record<string, unknown>> = {},
  context: Partial<StreamdownContextType> = {},
) =>
  mount(component, {
    ...options,
    global: {
      ...options.global,
      provide: {
        ...options.global?.provide,
        [StreamdownKey as symbol]: createStreamdownContext(context),
      },
    },
  });

export const mountWithPluginContext = (
  component: Component,
  options: MountingOptions<Record<string, unknown>> = {},
  plugins: PluginConfig | null = null,
) =>
  mount(component, {
    ...options,
    global: {
      ...options.global,
      provide: {
        ...options.global?.provide,
        [PluginKey as symbol]: plugins,
      },
    },
  });

export const mountVNode = (
  node: VNodeChild,
  options: MountingOptions<Record<string, unknown>> = {},
) =>
  mount(
    defineComponent({
      setup() {
        return () => h("div", [node]);
      },
    }),
    options,
  );

export const textSlot = (text: string) => () => h("span", text);
