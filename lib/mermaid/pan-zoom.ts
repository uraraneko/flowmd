import { computeFit } from "./fit.js";
import {
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  ref,
  watch,
  type PropType,
  type VNodeChild,
} from "vue";
import { useIcons } from "../icon-context.js";
import { useCn } from "../prefix-context.js";
import { useTranslations } from "../translations-context.js";

interface Point {
  x: number;
  y: number;
}

export const PanZoom = defineComponent({
  name: "PanZoom",
  props: {
    contentSize: {
      type: Object as PropType<{ height: number; width: number } | null>,
      default: null,
    },
    fitKey: { type: String, default: undefined },
    isAutoFit: { type: Boolean, default: false },
    class: {
      type: [String, Object, Array] as PropType<any>,
      default: undefined,
    },
    fullscreen: {
      type: Boolean,
      default: false,
    },
    initialZoom: {
      type: Number,
      default: 1,
    },
    maxZoom: {
      type: Number,
      default: 3,
    },
    minZoom: {
      type: Number,
      default: 0.5,
    },
    showControls: {
      type: Boolean,
      default: true,
    },
    zoomStep: {
      type: Number,
      default: 0.1,
    },
  },
  setup(props, { slots }) {
    const icons = useIcons();
    const cn = useCn();
    const t = useTranslations();
    const containerRef = ref<HTMLDivElement | null>(null);
    const contentRef = ref<HTMLDivElement | null>(null);
    const zoom = ref(props.initialZoom);
    const baseZoom = ref(props.initialZoom);
    const effectiveMinZoom = ref(props.minZoom);
    const viewportHeight = ref<number | null>(null);
    let hasUserInteracted = false;
    let resizeObserver: ResizeObserver | null = null;
    const pan = ref<Point>({ x: 0, y: 0 });
    const isPanning = ref(false);
    const panStart = ref<Point>({ x: 0, y: 0 });
    const panStartPosition = ref<Point>({ x: 0, y: 0 });

    const handleZoom = (delta: number) => {
      const nextZoom = Math.max(
        effectiveMinZoom.value,
        Math.min(props.maxZoom, zoom.value + delta),
      );
      zoom.value = nextZoom;
      hasUserInteracted = true;
    };

    const handleZoomIn = () => {
      handleZoom(props.zoomStep);
    };

    const handleZoomOut = () => {
      handleZoom(-props.zoomStep);
    };

    const handleReset = () => {
      zoom.value = baseZoom.value;
      pan.value = { x: 0, y: 0 };
      hasUserInteracted = false;
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -props.zoomStep : props.zoomStep;
      handleZoom(delta);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || event.isPrimary === false) {
        return;
      }

      isPanning.value = true;
      hasUserInteracted = true;
      panStart.value = { x: event.clientX, y: event.clientY };
      panStartPosition.value = { ...pan.value };

      const target = event.currentTarget;
      if (target instanceof HTMLElement) {
        target.setPointerCapture(event.pointerId);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isPanning.value) {
        return;
      }

      event.preventDefault();
      const deltaX = event.clientX - panStart.value.x;
      const deltaY = event.clientY - panStart.value.y;
      pan.value = {
        x: panStartPosition.value.x + deltaX,
        y: panStartPosition.value.y + deltaY,
      };
    };

    const handlePointerUp = (event: PointerEvent) => {
      isPanning.value = false;
      const target = event.currentTarget;
      if (target instanceof HTMLElement) {
        target.releasePointerCapture(event.pointerId);
      }
    };

    const applyFit = () => {
      if (!(props.isAutoFit && props.contentSize && containerRef.value)) return;
      const result = computeFit(
        props.contentSize,
        containerRef.value,
        props.fullscreen,
      );
      if (!result) return;
      viewportHeight.value = result.viewportHeight;
      baseZoom.value = result.fitZoom;
      effectiveMinZoom.value = Math.min(props.minZoom, result.fitZoom);
      if (!hasUserInteracted) {
        zoom.value = result.fitZoom;
        pan.value = { x: 0, y: 0 };
      }
    };
    const observeFit = () => {
      resizeObserver?.disconnect();
      applyFit();
      if (
        props.isAutoFit &&
        props.contentSize &&
        containerRef.value &&
        typeof ResizeObserver !== "undefined"
      ) {
        resizeObserver = new ResizeObserver(applyFit);
        resizeObserver.observe(containerRef.value);
      }
    };
    watch(
      () => [props.initialZoom, props.isAutoFit, props.minZoom],
      () => {
        effectiveMinZoom.value = props.minZoom;
        if (!props.isAutoFit) {
          baseZoom.value = props.initialZoom;
          zoom.value = props.initialZoom;
          viewportHeight.value = null;
        }
      },
    );
    watch(
      () => [props.fitKey, props.isAutoFit],
      () => {
        if (props.isAutoFit) hasUserInteracted = false;
      },
    );
    watch(
      () => [
        props.contentSize,
        props.isAutoFit,
        props.fullscreen,
        props.minZoom,
      ],
      observeFit,
      { flush: "post" },
    );
    onMounted(() => {
      observeFit();
      containerRef.value?.addEventListener("wheel", handleWheel, {
        passive: false,
      });
      contentRef.value?.addEventListener("pointerdown", handlePointerDown);
    });

    onUnmounted(() => {
      resizeObserver?.disconnect();
      containerRef.value?.removeEventListener("wheel", handleWheel);
      contentRef.value?.removeEventListener("pointerdown", handlePointerDown);
      contentRef.value?.removeEventListener("pointermove", handlePointerMove);
      contentRef.value?.removeEventListener("pointerup", handlePointerUp);
      contentRef.value?.removeEventListener("pointercancel", handlePointerUp);
      document.body.style.userSelect = "";
    });

    watch(isPanning, (value) => {
      const content = contentRef.value;
      if (!content) {
        return;
      }

      if (value) {
        document.body.style.userSelect = "none";
        content.addEventListener("pointermove", handlePointerMove, {
          passive: false,
        });
        content.addEventListener("pointerup", handlePointerUp);
        content.addEventListener("pointercancel", handlePointerUp);
        return;
      }

      document.body.style.userSelect = "";
      content.removeEventListener("pointermove", handlePointerMove);
      content.removeEventListener("pointerup", handlePointerUp);
      content.removeEventListener("pointercancel", handlePointerUp);
    });

    return () => {
      const children = (slots.default?.() ?? []) as VNodeChild[];

      return h(
        "div",
        {
          class: cn(
            "relative flex flex-col",
            props.fullscreen ? "h-full w-full" : "min-h-28 w-full",
            props.class,
          ),
          ref: containerRef,
          style: {
            cursor: isPanning.value ? "grabbing" : "grab",
            ...(!props.fullscreen &&
            props.isAutoFit &&
            viewportHeight.value != null
              ? { height: `${viewportHeight.value}px` }
              : {}),
          },
        },
        [
          props.showControls
            ? h(
                "div",
                {
                  class: cn(
                    "absolute z-10 flex flex-col gap-1 rounded-md border border-border bg-background/80 p-1 supports-[backdrop-filter]:bg-background/70 supports-[backdrop-filter]:backdrop-blur-sm",
                    props.fullscreen ? "start-4 bottom-4" : "start-2 bottom-2",
                  ),
                },
                [
                  h(
                    "button",
                    {
                      class: cn(
                        "flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
                      ),
                      disabled: zoom.value >= props.maxZoom,
                      onClick: handleZoomIn,
                      "aria-label": t.zoomIn,
                      title: t.zoomIn,
                      type: "button",
                    },
                    [h(icons.ZoomInIcon, { "aria-hidden": "true", size: 16 })],
                  ),
                  h(
                    "button",
                    {
                      class: cn(
                        "flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
                      ),
                      disabled: zoom.value <= effectiveMinZoom.value,
                      onClick: handleZoomOut,
                      "aria-label": t.zoomOut,
                      title: t.zoomOut,
                      type: "button",
                    },
                    [h(icons.ZoomOutIcon, { "aria-hidden": "true", size: 16 })],
                  ),
                  h(
                    "button",
                    {
                      class: cn(
                        "flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                      ),
                      onClick: handleReset,
                      "aria-label": t.resetView,
                      title: t.resetView,
                      type: "button",
                    },
                    [
                      h(icons.RotateCcwIcon, {
                        "aria-hidden": "true",
                        size: 16,
                      }),
                    ],
                  ),
                ],
              )
            : null,
          h(
            "div",
            {
              class: cn(
                "flex h-full w-full flex-1 origin-center items-center justify-center transition-transform duration-150 ease-out",
              ),
              ref: contentRef,
              role: "application",
              style: {
                transform: `translate(${pan.value.x}px, ${pan.value.y}px) scale(${zoom.value})`,
                transformOrigin: "center center",
                touchAction: "none",
                willChange: "transform",
              },
            },
            children,
          ),
        ],
      );
    };
  },
});
