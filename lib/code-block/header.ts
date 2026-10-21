import { defineComponent, h } from "vue";
import { useCn } from "../prefix-context.js";

export const CodeBlockHeader = defineComponent({
  name: "CodeBlockHeader",
  props: {
    className: { type: String, default: undefined },
    language: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const cn = useCn();
    return () =>
      h(
        "div",
        {
          class: cn(
            "flex h-8 items-center text-muted-foreground text-xs",
            props.className,
          ),
          "data-language": props.language,
          "data-streamdown": "code-block-header",
        },
        [h("span", { class: cn("ml-1 font-mono lowercase") }, props.language)],
      );
  },
});
