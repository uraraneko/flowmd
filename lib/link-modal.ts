import { resolvePortalTarget } from "./portal.js";
import { defineComponent, h, Teleport, ref, watch, type PropType } from "vue";
import { useStreamdownContext } from "./streamdown-context.js";
import { useIcons } from "./icon-context.js";
import { useCn } from "./prefix-context.js";
import { lockBodyScroll, unlockBodyScroll } from "./scroll-lock.js";
import { useTranslations } from "./translations-context.js";

export const LinkSafetyModal = defineComponent({
  name: "LinkSafetyModal",
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onConfirm: {
      type: Function as PropType<() => void>,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const context = useStreamdownContext();
    const icons = useIcons();
    const cn = useCn();
    const copied = ref(false);
    const t = useTranslations();

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(props.url);
        copied.value = true;
        setTimeout(() => {
          copied.value = false;
        }, 2000);
      } catch {
        // Clipboard API not available
      }
    };

    const handleConfirm = () => {
      props.onConfirm();
      props.onClose();
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        props.onClose();
      }
    };

    watch(
      () => props.isOpen,
      (isOpen, _previous, onCleanup) => {
        if (isOpen) {
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

    return () => {
      if (!props.isOpen) {
        return null;
      }

      const overlay = h(
        "div",
        {
          class: cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm",
          ),
          "data-streamdown": "link-safety-modal",
          onClick: props.onClose,
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === "Escape") {
              props.onClose();
            }
          },
          role: "button",
          tabindex: 0,
        },
        [
          h(
            "div",
            {
              class: cn(
                "relative mx-4 flex w-full max-w-md flex-col gap-4 rounded-xl border bg-background p-6 shadow-lg",
              ),
              onClick: (e: MouseEvent) => e.stopPropagation(),
              onKeydown: (e: KeyboardEvent) => e.stopPropagation(),
              role: "presentation",
            },
            [
              h(
                "button",
                {
                  class: cn(
                    "absolute end-4 top-4 rounded-md p-1 text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                  ),
                  onClick: props.onClose,
                  title: t.close,
                  type: "button",
                },
                [h(icons.XIcon, { size: 16 })],
              ),
              h("div", { class: cn("flex flex-col gap-2") }, [
                h(
                  "div",
                  {
                    class: cn("flex items-center gap-2 font-semibold text-lg"),
                  },
                  [
                    h(icons.ExternalLinkIcon, { size: 20 }),
                    h("span", t.openExternalLink),
                  ],
                ),
                h(
                  "p",
                  { class: cn("text-muted-foreground text-sm") },
                  t.externalLinkWarning,
                ),
              ]),
              h(
                "div",
                {
                  class: cn(
                    "break-all rounded-md bg-muted p-3 font-mono text-sm",
                    props.url.length > 100 && "max-h-32 overflow-y-auto",
                  ),
                },
                props.url,
              ),
              h("div", { class: cn("flex gap-2") }, [
                h(
                  "button",
                  {
                    class: cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 font-medium text-sm transition-all hover:bg-muted",
                    ),
                    onClick: handleCopy,
                    type: "button",
                  },
                  copied.value
                    ? [h(icons.CheckIcon, { size: 14 }), h("span", t.copied)]
                    : [h(icons.CopyIcon, { size: 14 }), h("span", t.copyLink)],
                ),
                h(
                  "button",
                  {
                    class: cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-all hover:bg-primary/90",
                    ),
                    onClick: handleConfirm,
                    type: "button",
                  },
                  [
                    h(icons.ExternalLinkIcon, { size: 14 }),
                    h("span", t.openLink),
                  ],
                ),
              ]),
            ],
          ),
        ],
      );
      return h(Teleport, { to: resolvePortalTarget(context.portal) }, [
        overlay,
      ]);
    };
  },
});
