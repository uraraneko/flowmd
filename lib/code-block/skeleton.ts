import { defineComponent, h } from "vue";
import { useIcons } from "../icon-context.js";
import { useCn } from "../prefix-context.js";

export const CodeBlockSkeleton = defineComponent({
  name: "CodeBlockSkeleton",
  setup() {
    const icons = useIcons();
    const cn = useCn();

    return () =>
      h(
        "div",
        {
          class: cn(
            "w-full divide-y divide-border overflow-hidden rounded-xl border border-border",
          ),
        },
        [
          h("div", { class: cn("h-[46px] w-full bg-muted/80") }),
          h(
            "div",
            { class: cn("flex w-full items-center justify-center p-4") },
            [h(icons.Loader2Icon, { class: cn("size-4 animate-spin") })],
          ),
        ],
      );
  },
});
