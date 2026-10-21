import {
  defineComponent,
  h,
  computed,
  type PropType,
  type CSSProperties,
} from "vue";
import { useStreamdownContext } from "../streamdown-context.js";
import { usePinnedScroll, resolveMaxHeight } from "../use-pinned-scroll.js";
import type { HighlightResult } from "../plugin-types.js";
import { useCn } from "../prefix-context.js";
import { cn as baseCn } from "../utils.js";

// Base line numbers class string (merged without prefix for memoization)
const LINE_NUMBER_CLASSES_BASE = baseCn(
  "block",
  "before:content-[counter(line)]",
  "before:inline-block",
  "before:[counter-increment:line]",
  "before:w-6",
  "before:mr-4",
  "before:text-[13px]",
  "before:text-right",
  "before:text-muted-foreground/50",
  "before:font-mono",
  "before:select-none",
);

/**
 * Parse a CSS declarations string (e.g. Shiki's rootStyle) into a style object.
 * This extracts CSS custom properties like --shiki-dark-bg from Shiki's dual theme output.
 */
const parseRootStyle = (rootStyle: string): Record<string, string> => {
  const style: Record<string, string> = {};
  for (const decl of rootStyle.split(";")) {
    const idx = decl.indexOf(":");
    if (idx > 0) {
      const prop = decl.slice(0, idx).trim();
      const val = decl.slice(idx + 1).trim();
      if (prop && val) {
        style[prop] = val;
      }
    }
  }
  return style;
};

export const CodeBlockBody = defineComponent({
  name: "CodeBlockBody",
  props: {
    maxHeight: { type: [Number, String], default: undefined },
    result: {
      type: Object as PropType<HighlightResult>,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    startLine: {
      type: Number,
      default: undefined,
    },
    lineNumbers: {
      type: Boolean,
      default: true,
    },
    className: { type: String, default: undefined },
    class: {
      type: [String, Object, Array] as PropType<any>,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    const cn = useCn();
    const context = useStreamdownContext();
    const maxHeight = computed(() => resolveMaxHeight(props.maxHeight));
    const scrollRef = usePinnedScroll(
      () => context.isAnimating,
      () => Boolean(maxHeight.value),
      () => props.result,
    );

    // Prefix the pre-computed line number classes
    const lineNumberClasses = computed(() => cn(LINE_NUMBER_CLASSES_BASE));

    // Use CSS custom properties instead of direct inline styles so that
    // dark-mode Tailwind classes can override without !important.
    // This is necessary because !important syntax differs between Tailwind v3 and v4.
    const preStyle = computed(() => {
      const style: Record<string, string> = {};

      if (props.result.bg) {
        style["--sdm-bg"] = props.result.bg;
      }
      if (props.result.fg) {
        style["--sdm-fg"] = props.result.fg;
      }

      // Parse rootStyle for Shiki dark theme CSS variables (--shiki-dark-bg, etc.)
      if (props.result.rootStyle) {
        Object.assign(style, parseRootStyle(props.result.rootStyle));
      }

      return style as CSSProperties;
    });

    return () =>
      h(
        "div",
        {
          class: cn(
            [props.className, props.class],
            maxHeight.value ? "overflow-y-auto" : null,
            "overflow-x-auto rounded-md border border-border bg-background p-4 text-sm",
          ),
          "data-language": props.language,
          "data-streamdown": "code-block-body",
          ref: scrollRef,
          style: maxHeight.value ? { maxHeight: maxHeight.value } : undefined,
          ...attrs,
        },
        [
          h(
            "pre",
            {
              class: cn(
                [props.className, props.class],
                "bg-[var(--sdm-bg,inherit)]",
                "dark:bg-[var(--shiki-dark-bg,var(--sdm-bg,inherit))]",
              ),
              style: preStyle.value,
            },
            [
              h(
                "code",
                {
                  class: props.lineNumbers
                    ? cn("[counter-increment:line_0] [counter-reset:line]")
                    : undefined,
                  style:
                    props.lineNumbers && props.startLine && props.startLine > 1
                      ? { counterReset: `line ${props.startLine - 1}` }
                      : undefined,
                },
                props.result.tokens.map((row, index) =>
                  h(
                    "span",
                    {
                      class: props.lineNumbers
                        ? lineNumberClasses.value
                        : cn("block"),
                      key: index,
                    },
                    row.length === 0 ||
                      (row.length === 1 && row[0].content === "")
                      ? "\n"
                      : row.map((token, tokenIndex) => {
                          const tokenStyle: Record<string, string> = {};
                          let hasBg = Boolean(token.bgColor);

                          if (token.color) {
                            tokenStyle["--sdm-c"] = token.color;
                          }
                          if (token.bgColor) {
                            tokenStyle["--sdm-tbg"] = token.bgColor;
                          }

                          if (token.htmlStyle) {
                            for (const [key, value] of Object.entries(
                              token.htmlStyle,
                            )) {
                              if (key === "color") {
                                tokenStyle["--sdm-c"] = value;
                              } else if (key === "background-color") {
                                tokenStyle["--sdm-tbg"] = value;
                                hasBg = true;
                              } else {
                                tokenStyle[key] = value;
                              }
                            }
                          }

                          return h(
                            "span",
                            {
                              class: cn(
                                "text-[var(--sdm-c,inherit)]",
                                "dark:text-[var(--shiki-dark,var(--sdm-c,inherit))]",
                                hasBg && "bg-[var(--sdm-tbg)]",
                                hasBg &&
                                  "dark:bg-[var(--shiki-dark-bg,var(--sdm-tbg))]",
                              ),
                              key: tokenIndex,
                              style: tokenStyle as CSSProperties,
                              ...token.htmlAttrs,
                            },
                            token.content,
                          );
                        }),
                  ),
                ),
              ),
            ],
          ),
        ],
      );
  },
});
