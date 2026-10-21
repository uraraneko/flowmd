import { defineComponent, h, computed, type PropType } from "vue";
import { useStreamdownContext } from "../streamdown-context.js";
import { resolveMaxHeight, usePinnedScroll } from "../use-pinned-scroll.js";
import { useCn } from "../prefix-context.js";
import { TableCopyDropdown } from "./copy-dropdown.js";
import { TableDownloadDropdown } from "./download-dropdown.js";
import { TableFullscreenButton } from "./fullscreen-button.js";

export const Table = defineComponent({
  name: "Table",
  inheritAttrs: false,
  props: {
    children: { type: null, default: undefined },
    maxHeight: { type: [Number, String], default: undefined },
    showControls: {
      type: Boolean,
      default: undefined,
    },
    showCopy: {
      type: Boolean,
      default: true,
    },
    showDownload: {
      type: Boolean,
      default: true,
    },
    showFullscreen: {
      type: Boolean,
      default: true,
    },
    class: {
      type: [String, Object, Array] as PropType<any>,
      default: undefined,
    },
  },
  setup(props, { slots, attrs }) {
    const cn = useCn();
    const context = useStreamdownContext();
    const height = computed(() => resolveMaxHeight(props.maxHeight));
    const scrollRef = usePinnedScroll(
      () => context.isAnimating,
      () => Boolean(height.value),
      () => props.children,
    );

    return () => {
      const hasCopy = props.showControls && props.showCopy;
      const hasDownload = props.showControls && props.showDownload;
      const hasFullscreen = props.showControls && props.showFullscreen;
      const hasAnyControl = hasCopy || hasDownload || hasFullscreen;

      return h(
        "div",
        {
          class: cn(
            "my-4 flex flex-col gap-2 rounded-lg border border-border bg-sidebar p-2",
          ),
          "data-streamdown": "table-wrapper",
        },
        [
          hasAnyControl
            ? h("div", { class: cn("flex items-center justify-end gap-1") }, [
                hasCopy ? h(TableCopyDropdown) : null,
                hasDownload ? h(TableDownloadDropdown) : null,
                hasFullscreen
                  ? h(
                      TableFullscreenButton,
                      {
                        showCopy: hasCopy,
                        showDownload: hasDownload,
                      },
                      slots.default ? slots.default : undefined,
                    )
                  : null,
              ])
            : null,
          h(
            "div",
            {
              ref: scrollRef,
              style: height.value ? { maxHeight: height.value } : undefined,
              class: cn(
                "border-collapse overflow-x-auto overflow-y-auto rounded-md border border-border bg-background",
              ),
            },
            [
              h(
                "table",
                {
                  class: cn("w-full divide-y divide-border", props.class),
                  "data-streamdown": "table",
                  ...attrs,
                },
                slots.default ? slots.default() : [],
              ),
            ],
          ),
        ],
      );
    };
  },
});
