import { defineComponent, h } from "vue";
import { useCn } from "./prefix-context.js";

export const RawCodeBlock = defineComponent({
  name: "RawCodeBlock",
  inheritAttrs: false,
  props: {
    code: { type: String, required: true },
    language: { type: String, required: true },
    isIncomplete: { type: Boolean, required: true },
  },
  setup(props, { attrs }) {
    const cn = useCn();
    return () =>
      h(
        "pre",
        {
          ...attrs,
          class: cn(
            "my-4 overflow-x-auto rounded-xl border bg-sidebar p-4 text-sm",
            attrs.class as string,
          ),
          "data-streamdown": "raw-code-block",
          "data-language": props.language,
          "data-incomplete": props.isIncomplete,
          style: {
            fontFamily:
              'ui-monospace, "SF Mono", "Cascadia Mono", "DejaVu Sans Mono", "Liberation Mono", Menlo, Consolas, monospace',
            fontFeatureSettings: '"liga" 0, "calt" 0',
            fontVariantLigatures: "none",
            overflowX: "auto",
            tabSize: 2,
            whiteSpace: "pre",
          },
        },
        props.code,
      );
  },
});
