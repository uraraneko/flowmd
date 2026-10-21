import { resolvePortalTarget } from "../portal.js";
import {
  defineComponent,
  Fragment,
  h,
  ref,
  watch,
  inject,
  Teleport,
  type PropType,
} from "vue";
import { StreamdownKey } from "../streamdown-context.js";
import { useIcons } from "../icon-context.js";
import { useCn } from "../prefix-context.js";
import { lockBodyScroll, unlockBodyScroll } from "../scroll-lock.js";
import { useTranslations } from "../translations-context.js";
import { TableCopyDropdown } from "./copy-dropdown.js";
import { TableDownloadDropdown } from "./download-dropdown.js";

export const TableFullscreenButton = defineComponent({
  name: "TableFullscreenButton",
  props: {
    showCopy: {
      type: Boolean,
      default: true,
    },
    showDownload: {
      type: Boolean,
      default: true,
    },
    class: {
      type: [String, Object, Array] as PropType<any>,
      default: undefined,
    },
  },
  setup(props, { slots, attrs }) {
    const icons = useIcons();
    const cn = useCn();
    const isFullscreen = ref(false);
    const streamdownContext = inject(StreamdownKey, {
      isAnimating: false,
    } as any);
    const t = useTranslations();

    const handleOpen = () => {
      isFullscreen.value = true;
    };

    const handleClose = () => {
      isFullscreen.value = false;
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    watch(
      isFullscreen,
      (newVal, _previous, onCleanup) => {
        if (newVal) {
          lockBodyScroll();
          document.addEventListener("keydown", handleEsc);
          onCleanup(() => {
            document.removeEventListener("keydown", handleEsc);
            unlockBodyScroll();
          });
        }
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
            disabled: streamdownContext.isAnimating,
            onClick: handleOpen,
            title: t.viewFullscreen,
            type: "button",
            ...attrs,
          },
          [h(icons.Maximize2Icon, { size: 14 })],
        ),
        isFullscreen.value
          ? h(Teleport, { to: resolvePortalTarget(streamdownContext.portal) }, [
              h(
                "div",
                {
                  "aria-label": t.viewFullscreen,
                  "aria-modal": "true",
                  class: cn("fixed inset-0 z-50 flex flex-col bg-background"),
                  "data-streamdown": "table-fullscreen",
                  onClick: handleClose,
                  onKeydown: (e: KeyboardEvent) => {
                    if (e.key === "Escape") {
                      handleClose();
                    }
                  },
                  role: "dialog",
                },
                [
                  h(
                    "div",
                    {
                      class: cn("flex h-full flex-col"),
                      "data-streamdown": "table-wrapper",
                      onClick: (e: MouseEvent) => e.stopPropagation(),
                      onKeydown: (e: KeyboardEvent) => e.stopPropagation(),
                      role: "presentation",
                    },
                    [
                      h(
                        "div",
                        {
                          class: cn("flex items-center justify-end gap-1 p-4"),
                        },
                        [
                          props.showCopy ? h(TableCopyDropdown) : null,
                          props.showDownload ? h(TableDownloadDropdown) : null,
                          h(
                            "button",
                            {
                              class: cn(
                                "rounded-md p-1 text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                              ),
                              onClick: handleClose,
                              title: t.exitFullscreen,
                              type: "button",
                            },
                            [h(icons.XIcon, { size: 20 })],
                          ),
                        ],
                      ),
                      h(
                        "div",
                        {
                          class: cn(
                            "flex-1 overflow-auto p-4 pt-0 [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10",
                          ),
                        },
                        [
                          h(
                            "table",
                            {
                              class: cn(
                                "w-full border-collapse border border-border",
                              ),
                              "data-streamdown": "table",
                            },
                            slots.default ? slots.default() : [],
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ])
          : null,
      ]);
  },
});
