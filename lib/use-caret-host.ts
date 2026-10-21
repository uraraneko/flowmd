import { onMounted, onUpdated, ref, type Ref } from "vue";

const HIDDEN_ATTRIBUTE = "data-sd-caret-hidden";

/** Mark only the terminal block; changing the container invalidates long documents. */
export function useCaretHost(shouldHideCaret: Readonly<Ref<boolean>>) {
  const containerRef = ref<HTMLDivElement | null>(null);
  const hydrated = ref(false);
  let marked: Element | null = null;
  const update = () => {
    const host = shouldHideCaret.value
      ? (containerRef.value?.lastElementChild ?? null)
      : null;
    if (host !== marked) {
      marked?.removeAttribute(HIDDEN_ATTRIBUTE);
      host?.setAttribute(HIDDEN_ATTRIBUTE, "");
      marked = host;
    }
  };
  onMounted(() => {
    hydrated.value = true;
    update();
  });
  onUpdated(update);
  return {
    containerRef,
    showCaret: {
      get value() {
        return hydrated.value || !shouldHideCaret.value;
      },
    },
  };
}
