import { defineComponent, h, type PropType } from "vue";
import { useCn } from "../prefix-context.js";

export const CodeBlockContainer = defineComponent({
  name: "CodeBlockContainer",
  props: {
    language: {
      type: String,
      required: true,
    },
    isIncomplete: {
      type: Boolean,
      default: false,
    },
    className: { type: String, default: undefined },
    class: {
      type: [String, Object, Array] as PropType<any>,
      default: undefined,
    },
    style: {
      type: [String, Object, Array] as PropType<any>,
      default: undefined,
    },
  },
  setup(props, { slots, attrs }) {
    const cn = useCn();
    return () =>
      h(
        "div",
        {
          class: cn(
            "relative my-4 flex w-full flex-col gap-2 rounded-xl border border-border bg-sidebar p-2",
            [props.className, props.class],
          ),
          "data-incomplete": props.isIncomplete || undefined,
          "data-language": props.language,
          "data-streamdown": "code-block",
          style: [
            {
              // Use content-visibility to skip rendering off-screen blocks
              // This can significantly improve performance for large documents
              contentVisibility: "auto",
              // Provide a hint for layout to prevent layout shifts
              containIntrinsicSize: "auto 200px",
            },
            props.style,
          ],
          ...Object.fromEntries(
            Object.entries(attrs).filter(([key]) => key !== "children"),
          ),
        },
        slots.default?.(),
      );
  },
});
