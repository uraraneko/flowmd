import { resolvePortalTarget } from "../portal.js";
import type { MermaidConfig } from "../plugin-types.js";
import {
  computed,
  defineComponent,
  Fragment,
  h,
  ref,
  Teleport,
  watch,
  type PropType,
} from "vue";
import { useStreamdownContext } from "../streamdown-context.js";
import { useIcons } from "../icon-context.js";
import { useCn } from "../prefix-context.js";
import { lockBodyScroll, unlockBodyScroll } from "../scroll-lock.js";
import { useTranslations } from "../translations-context.js";
import type { ControlsConfig } from "../types.js";

const shouldShowMermaidControl = (
  config: ControlsConfig,
  control: "panZoom" | "download" | "copy",
) => {
  if (typeof config === "boolean") return config;
  const setting = config.mermaid;
  return typeof setting === "object"
    ? setting[control] !== false
    : setting !== false;
};
import { CodeBlockCopyButton } from "../code-block/copy-button.js";
import { MermaidDownloadDropdown } from "./download-button.js";
import { Mermaid } from "./index.js";

export const MermaidFullscreenButton = defineComponent({
  name: "MermaidFullscreenButton",
  inheritAttrs: false,
  props: {
    chart: { type: String, required: true },
    config: { type: Object as PropType<MermaidConfig>, default: undefined },
    onFullscreen: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
    onExit: { type: Function as PropType<() => void>, default: undefined },
    class: {
      type: [String, Object, Array] as PropType<any>,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    const icons = useIcons();
    const cn = useCn();
    const isFullscreen = ref(false);
    const context = useStreamdownContext();
    const t = useTranslations();
    const showPanZoomControls = computed(() =>
      shouldShowMermaidControl(context.controls, "panZoom"),
    );
    const handleClose = () => {
      isFullscreen.value = false;
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    const stop = (event: Event) => event.stopPropagation();

    watch(isFullscreen, (value, _previous, onCleanup) => {
      if (value) {
        lockBodyScroll();
        document.addEventListener("keydown", handleEsc);
        onCleanup(() => {
          document.removeEventListener("keydown", handleEsc);
          unlockBodyScroll();
        });
      }
    });
    watch(
      () => [isFullscreen.value, props.onFullscreen, props.onExit],
      () => {
        if (isFullscreen.value) props.onFullscreen?.();
        else props.onExit?.();
      },
      { immediate: true },
    );

    return () =>
      h(Fragment, null, [
        h(
          "button",
          {
            class: cn(
              "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
              props.class,
            ),
            disabled: context.isAnimating,
            onClick: () => {
              isFullscreen.value = !isFullscreen.value;
            },
            title: t.viewFullscreen,
            type: "button",
            ...attrs,
            "aria-label": t.viewFullscreen,
          },
          [h(icons.Maximize2Icon, { "aria-hidden": "true", size: 14 })],
        ),
        isFullscreen.value
          ? h(Teleport, { to: resolvePortalTarget(context.portal) }, [
              h(
                "div",
                {
                  "aria-label": t.viewFullscreen,
                  "aria-modal": "true",
                  class: cn(
                    "fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm",
                  ),
                  "data-streamdown": "mermaid-fullscreen",
                  onClick: handleClose,
                  onKeydown: handleEsc,
                  role: "dialog",
                },
                [
                  h(
                    "div",
                    {
                      class: cn(
                        "absolute end-4 top-4 z-10 flex items-center gap-1",
                      ),
                      onClick: stop,
                      onKeydown: stop,
                      role: "presentation",
                    },
                    [
                      shouldShowMermaidControl(context.controls, "download")
                        ? h(MermaidDownloadDropdown, {
                            chart: props.chart,
                            config: props.config,
                          })
                        : null,
                      shouldShowMermaidControl(context.controls, "copy")
                        ? h(CodeBlockCopyButton, { code: props.chart })
                        : null,
                      h(
                        "button",
                        {
                          "aria-label": t.exitFullscreen,
                          class: cn(
                            "rounded-md p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                          ),
                          onClick: handleClose,
                          title: t.exitFullscreen,
                          type: "button",
                        },
                        [h(icons.XIcon, { "aria-hidden": "true", size: 20 })],
                      ),
                    ],
                  ),
                  h(
                    "div",
                    {
                      class: cn(
                        "flex size-full items-center justify-center p-4",
                      ),
                      onClick: stop,
                      onKeydown: stop,
                      role: "presentation",
                    },
                    [
                      h(Mermaid, {
                        chart: props.chart,
                        class: cn("size-full [&_svg]:h-auto [&_svg]:w-auto"),
                        config: props.config,
                        fullscreen: true,
                        showControls: showPanZoomControls.value,
                      }),
                    ],
                  ),
                ],
              ),
            ])
          : null,
      ]);
  },
});
