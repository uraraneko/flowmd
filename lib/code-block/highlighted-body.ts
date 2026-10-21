import { defineComponent, h, ref, watch, inject, type PropType } from "vue";
import type { BundledLanguage } from "../shiki-types.js";
import { StreamdownKey } from "../streamdown-context.js";
import { usePlugins } from "../plugin-context.js";
import type { HighlightResult } from "../plugin-types.js";
import { CodeBlockBody } from "./body.js";

export const HighlightedCodeBlockBody = defineComponent({
  name: "HighlightedCodeBlockBody",
  props: {
    isIncomplete: { type: Boolean, default: false },
    maxHeight: { type: [Number, String], default: undefined },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    raw: {
      type: Object as PropType<HighlightResult>,
      required: true,
    },
    startLine: {
      type: Number,
      default: undefined,
    },
    lineNumbers: {
      type: Boolean,
      default: undefined,
    },
    className: { type: String, default: undefined },
    class: {
      type: [String, Object, Array] as PropType<any>,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    // Provide a default fallback value for StreamdownKey using partial type matching
    const streamdownContext = inject(StreamdownKey, {
      shikiTheme: ["github-light", "github-dark"] as any,
    } as any);
    const plugins = usePlugins();
    const result = ref<HighlightResult>(props.raw);

    watch(
      [
        () => props.code,
        () => props.isIncomplete,
        () => props.language,
        () => streamdownContext.shikiTheme,
        () => props.raw,
        () => plugins?.code,
      ],
      (_value, _previous, onCleanup) => {
        const codePlugin = plugins?.code;
        if (!codePlugin) {
          result.value = props.raw;
          return;
        }

        let current = true;
        onCleanup(() => {
          current = false;
        });
        const cachedResult = codePlugin.highlight(
          {
            code: props.code,
            isIncomplete: props.isIncomplete,
            language: props.language as BundledLanguage,
            themes: streamdownContext.shikiTheme,
          },
          (highlightedResult) => {
            if (current) result.value = highlightedResult;
          },
        );

        if (cachedResult) {
          result.value = cachedResult;
        }
      },
      { immediate: true },
    );

    return () =>
      h(CodeBlockBody, {
        class: [props.className, props.class],
        language: props.language,
        maxHeight: props.maxHeight,
        lineNumbers: props.lineNumbers,
        result: result.value,
        startLine: props.startLine,
        ...attrs,
      });
  },
});
