import { type InjectionKey, inject, unref, computed, type Ref } from "vue";

/**
 * Context that indicates whether the current block has an incomplete code fence.
 * True when: streaming is active AND this is the last block AND it has an unclosed code fence.
 */
const BlockIncompleteKey: InjectionKey<boolean | Ref<boolean>> =
  Symbol("BlockIncomplete");

/**
 * Hook to check if the current block has an incomplete (unclosed) code fence.
 *
 * Returns a readonly computed ref, true while this block is still streaming.
 * Useful for deferring expensive renders (syntax highlighting, Mermaid diagrams)
 * until the code block is complete.
 */
export const useIsCodeFenceIncomplete = () => {
  const state = inject(BlockIncompleteKey, false);
  return computed(() => unref(state));
};

export { BlockIncompleteKey };
export const useBlockIncompleteState = useIsCodeFenceIncomplete;
