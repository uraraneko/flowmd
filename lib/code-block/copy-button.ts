import {
  defineComponent,
  Fragment,
  h,
  ref,
  onUnmounted,
  type PropType,
  inject,
} from "vue";
import { StreamdownKey } from "../streamdown-context.js";
import { useIcons } from "../icon-context.js";
import { useCn } from "../prefix-context.js";
import { useTranslations } from "../translations-context.js";
import { useCodeBlockContext } from "./context.js";

export const CodeBlockCopyButton = defineComponent({
  name: "CodeBlockCopyButton",
  inheritAttrs: false,
  props: {
    onCopy: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
    onError: {
      type: Function as PropType<(error: Error) => void>,
      default: undefined,
    },
    timeout: {
      type: Number,
      default: 2000,
    },
    code: {
      type: String,
      default: undefined,
    },
    className: { type: String, default: undefined },
    class: {
      type: [String, Object, Array] as PropType<any>,
      default: undefined,
    },
  },
  setup(props, { slots, attrs }) {
    const cn = useCn();
    const isCopied = ref(false);
    const timeoutRef = ref<number | null>(null);
    const codeContext = useCodeBlockContext();
    const streamdownContext = inject(StreamdownKey, {
      isAnimating: false,
    } as any);
    const t = useTranslations();

    const copyToClipboard = async () => {
      const codeToCopy = props.code ?? codeContext.code;
      if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
        props.onError?.(new Error("Clipboard API not available"));
        return;
      }

      try {
        if (!isCopied.value) {
          await navigator.clipboard.writeText(codeToCopy);
          isCopied.value = true;
          props.onCopy?.();
          timeoutRef.value = window.setTimeout(() => {
            isCopied.value = false;
          }, props.timeout);
        }
      } catch (error) {
        props.onError?.(error as Error);
      }
    };

    onUnmounted(() => {
      if (timeoutRef.value) {
        window.clearTimeout(timeoutRef.value);
      }
    });

    const icons = useIcons();

    return () => {
      const Icon = isCopied.value ? icons.CheckIcon : icons.CopyIcon;

      return h(Fragment, null, [
        h(
          "button",
          {
            class: cn(
              "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
              [props.className, props.class],
            ),
            "data-streamdown": "code-block-copy-button",
            disabled: streamdownContext.isAnimating,
            onClick: copyToClipboard,
            title: t.copyCode,
            "aria-label": t.copyCode,
            type: "button",
            ...attrs,
          },
          slots.default
            ? slots.default()
            : [h(Icon, { "aria-hidden": "true", size: 14 })],
        ),
        isCopied.value
          ? h("output", { "aria-live": "polite", class: "sr-only" }, t.copied)
          : null,
      ]);
    };
  },
});
