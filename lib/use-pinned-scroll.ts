import { onMounted, onUnmounted, ref, watch } from "vue";

const BOTTOM_THRESHOLD_PX = 8;

export function resolveMaxHeight(
  maxHeight: number | string | undefined,
): string | undefined {
  if (maxHeight === undefined || maxHeight === 0 || maxHeight === Infinity)
    return;
  if (typeof maxHeight === "number")
    return Number.isFinite(maxHeight) && maxHeight > 0
      ? `${maxHeight}px`
      : undefined;
  if (maxHeight === "0" || maxHeight === "none" || maxHeight === "Infinity")
    return;
  return maxHeight;
}

/** Coalesce layout reads; allow a user to scroll up without being pulled back. */
export function usePinnedScroll(
  isActive: () => boolean,
  enabled: () => boolean,
  contentKey: () => unknown,
) {
  const scrollRef = ref<HTMLDivElement | null>(null);
  let pinned = true;
  let frame: number | null = null;
  let attached: HTMLDivElement | null = null;
  const handleScroll = () => {
    if (attached)
      pinned =
        attached.scrollHeight - attached.scrollTop - attached.clientHeight <
        BOTTOM_THRESHOLD_PX;
  };
  const attach = () => {
    attached?.removeEventListener("scroll", handleScroll);
    attached = enabled() ? scrollRef.value : null;
    attached?.addEventListener("scroll", handleScroll, { passive: true });
  };
  const schedule = () => {
    const element = scrollRef.value;
    if (!(element && enabled() && isActive() && pinned) || frame !== null)
      return;
    frame = requestAnimationFrame(() => {
      frame = null;
      if (pinned)
        element.scrollTo({ top: element.scrollHeight, behavior: "instant" });
    });
  };
  onMounted(() => {
    attach();
    schedule();
  });
  watch(enabled, attach, { flush: "post" });
  watch(isActive, () => {
    pinned = true;
  });
  watch([isActive, enabled, contentKey], schedule, { flush: "post" });
  onUnmounted(() => {
    attached?.removeEventListener("scroll", handleScroll);
    if (frame !== null) cancelAnimationFrame(frame);
  });
  return scrollRef;
}
