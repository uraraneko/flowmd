import {
  defineComponent,
  h,
  defineAsyncComponent,
  Suspense,
  computed,
  provide,
  type PropType,
} from "vue";
import type { HighlightResult } from "../plugin-types.js";
import { useCn } from "../prefix-context.js";
import { CodeBlockBody } from "./body.js";
import { CodeBlockContainer } from "./container.js";
import { CodeBlockKey } from "./context.js";
import { CodeBlockHeader } from "./header.js";
import { useStreamdownContext } from "../streamdown-context.js";

const trimTrailingNewlines = (str: string): string => {
  let end = str.length;
  while (end > 0 && str[end - 1] === "\n") {
    end--;
  }
  return str.slice(0, end);
};

const HighlightedCodeBlockBody = defineAsyncComponent(() =>
  import("./highlighted-body.js").then((mod) => mod.HighlightedCodeBlockBody),
);

export const CodeBlock = defineComponent({
  name: "CodeBlock",
  inheritAttrs: false,
  props: {
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    isIncomplete: {
      type: Boolean,
      default: false,
    },
    startLine: {
      type: Number,
      default: undefined,
    },
    lineNumbers: {
      type: Boolean,
      default: undefined,
    },
    maxHeight: { type: [Number, String], default: undefined },
    className: { type: String, default: undefined },
    class: {
      type: [String, Object, Array] as PropType<any>,
      default: undefined,
    },
  },
  setup(props, { slots, attrs }) {
    const cn = useCn();
    const context = useStreamdownContext();

    // Provide code context
    provide(CodeBlockKey, {
      get code() {
        return props.code;
      },
    });

    // Remove trailing newlines to prevent empty line at end of code blocks
    const trimmedCode = computed(() => trimTrailingNewlines(props.code));

    // Memoize the raw fallback tokens to avoid recomputing on every render
    const raw = computed<HighlightResult>(() => ({
      bg: "transparent",
      fg: "inherit",
      tokens: trimmedCode.value.split("\n").map((line) => [
        {
          content: line,
          color: "inherit",
          bgColor: "transparent",
          htmlStyle: {},
          offset: 0,
        },
      ]),
    }));

    return () =>
      h(
        CodeBlockContainer,
        {
          dir: "ltr",
          isIncomplete: props.isIncomplete,
          language: props.language,
        },
        () => [
          h(CodeBlockHeader, { language: props.language }),
          slots.default
            ? h(
                "div",
                {
                  class: cn(
                    "pointer-events-none absolute top-2 right-2 z-10 flex items-center",
                  ),
                },
                [
                  h(
                    "div",
                    {
                      class: cn(
                        "pointer-events-auto flex shrink-0 items-center gap-2 rounded-md border border-sidebar bg-sidebar/80 px-1.5 py-1 supports-[backdrop-filter]:bg-sidebar/70 supports-[backdrop-filter]:backdrop-blur",
                      ),
                      "data-streamdown": "code-block-actions",
                    },
                    slots.default(),
                  ),
                ],
              )
            : null,
          h(Suspense, null, {
            default: () =>
              h(HighlightedCodeBlockBody, {
                class: [props.className, props.class],
                ...attrs,
                code: trimmedCode.value,
                isIncomplete: props.isIncomplete,
                maxHeight: props.maxHeight ?? context.codeBlockMaxHeight,
                language: props.language,
                lineNumbers: props.lineNumbers,
                raw: raw.value,
                startLine: props.startLine,
              }),
            fallback: () =>
              h(CodeBlockBody, {
                language: props.language,
                lineNumbers: props.lineNumbers,
                class: [props.className, props.class],
                ...attrs,
                result: raw.value,
                maxHeight: props.maxHeight ?? context.codeBlockMaxHeight,
                startLine: props.startLine,
              }),
          }),
        ],
      );
  },
});
