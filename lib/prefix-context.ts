import { type InjectionKey, inject } from "vue";
import { type CnFunction, cn as defaultCn } from "./utils.js";

/**
 * Context for providing a prefix-aware `cn` function to all components.
 * Defaults to the standard `cn` (no prefix) for zero-overhead when unused.
 */
export const PrefixKey: InjectionKey<CnFunction> = Symbol("Prefix");

/**
 * Hook to access the prefix-aware `cn` function.
 * When a prefix is set via `<Streamdown prefix="...">`, this returns
 * a `cn` that prepends the prefix to all class names.
 */
export const useCn = (): CnFunction => inject(PrefixKey, defaultCn);
