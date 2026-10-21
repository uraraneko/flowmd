import { contextView } from "./context-view.js";
import {
  type InjectionKey,
  defineComponent,
  inject,
  provide,
  type PropType,
  type VNodeChild,
} from "vue";
import type { PluginConfig } from "./plugin-types.js";

/**
 * Context for Streamdown plugins
 */
export const PluginKey: InjectionKey<PluginConfig | null> = Symbol("Plugin");

export const PluginContext = {
  Provider: defineComponent({
    name: "PluginContextProvider",
    props: {
      value: { type: Object as PropType<PluginConfig | null>, default: null },
    },
    setup(props, { slots }) {
      provide(
        PluginKey,
        contextView(() => props.value),
      );
      return () => slots.default?.() as VNodeChild;
    },
  }),
};

/**
 * Hook to access all plugins
 */
export const usePlugins = (): PluginConfig | null => inject(PluginKey, null);

/**
 * Hook to access the code plugin
 */
export const useCodePlugin = () => {
  const plugins = usePlugins();
  return plugins?.code ?? null;
};

/**
 * Hook to access the mermaid plugin
 */
export const useMermaidPlugin = () => {
  const plugins = usePlugins();
  return plugins?.mermaid ?? null;
};

/**
 * Hook to access the math plugin
 */
export const useMathPlugin = () => {
  const plugins = usePlugins();
  return plugins?.math ?? null;
};

/**
 * Hook to access the cjk plugin
 */
export const useCjkPlugin = () => {
  const plugins = usePlugins();
  return plugins?.cjk ?? null;
};

/**
 * Hook to find a custom renderer for a given language
 */
export const useCustomRenderer = (language: string) => {
  const plugins = usePlugins();
  if (!(plugins?.renderers && language)) {
    return null;
  }
  return (
    plugins.renderers.find((r) =>
      Array.isArray(r.language)
        ? r.language.includes(language)
        : r.language === language,
    ) ?? null
  );
};
