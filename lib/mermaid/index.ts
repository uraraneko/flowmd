import {
  defineComponent,
  h,
  ref,
  shallowRef,
  watch,
  onMounted,
  onUnmounted,
  type PropType,
} from "vue";
import { useDeferredRender } from "../../hooks/use-deferred-render.js";
import { useStreamdownContext } from "../streamdown-context.js";
import { useBlockIncompleteState } from "../block-incomplete-context.js";
import { usePlugins } from "../plugin-context.js";
import type { DiagramPlugin, MermaidConfig } from "../plugin-types.js";
import { useCn } from "../prefix-context.js";
import { useTranslations } from "../translations-context.js";
import { PanZoom } from "./pan-zoom.js";
import { getMermaidSvgSize, normalizeMermaidInlineSvg } from "./utils.js";

interface RenderRequest {
  chart: string;
  config?: MermaidConfig;
}
type RenderOutcome =
  | { ok: true; svg: string; size: { height: number; width: number } | null }
  | { ok: false; error: string };

async function renderChart(
  plugin: DiagramPlugin,
  { chart, config }: RenderRequest,
  fullscreen: boolean,
  fallbackError: string,
): Promise<RenderOutcome> {
  try {
    const mermaid = plugin.getMermaid(config);
    const chartHash = chart
      .split("")
      .reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
    const uniqueId = `mermaid-${Math.abs(chartHash)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const { svg } = await mermaid.render(uniqueId, chart);
    return {
      ok: true,
      svg: fullscreen ? svg : normalizeMermaidInlineSvg(svg),
      size: getMermaidSvgSize(svg),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : fallbackError,
    };
  }
}

/** One render in flight; intermediate streamed charts coalesce into the latest request. */
export const Mermaid = defineComponent({
  name: "Mermaid",
  props: {
    chart: { type: String, required: true },
    config: { type: Object as PropType<MermaidConfig>, default: undefined },
    fullscreen: { type: Boolean, default: false },
    showControls: { type: Boolean, default: true },
    class: {
      type: [String, Object, Array] as PropType<any>,
      default: undefined,
    },
  },
  setup(props) {
    const cn = useCn();
    const t = useTranslations();
    const context = useStreamdownContext();
    const plugins = usePlugins();
    const streaming = useBlockIncompleteState();
    const error = ref<string | null>(null);
    const loading = ref(false);
    const svg = ref("");
    const lastValidSvg = ref("");
    const svgSize = shallowRef<{ height: number; width: number } | null>(null);
    const retries = ref(0);
    const { shouldRender, containerRef } = useDeferredRender({
      immediate: props.fullscreen,
    });
    let mounted = false;
    let inFlight = false;
    let latest: RenderRequest | null = null;
    let wake: (() => void) | null = null;
    onMounted(() => {
      mounted = true;
    });
    onUnmounted(() => {
      mounted = false;
      wake?.();
    });
    watch(streaming, (value) => {
      if (!value) wake?.();
    });

    const pauseWhileStreaming = async (ms: number) => {
      if (!streaming.value) return;
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, ms);
        wake = () => {
          clearTimeout(timer);
          resolve();
        };
      });
      wake = null;
    };

    watch(
      () => [
        props.chart,
        props.config,
        retries.value,
        shouldRender.value,
        plugins?.mermaid,
      ],
      async () => {
        if (!shouldRender.value) return;
        const plugin = plugins?.mermaid;
        if (!plugin) {
          error.value =
            "Mermaid plugin not available. Please add the mermaid plugin to enable diagram rendering.";
          return;
        }
        latest = { chart: props.chart, config: props.config };
        if (inFlight) return;
        inFlight = true;
        error.value = null;
        loading.value = true;
        try {
          let request: RenderRequest | null = latest;
          while (request) {
            const startedAt = performance.now();
            const result = await renderChart(
              plugin,
              request,
              props.fullscreen,
              t.errorMermaid,
            );
            if (!mounted) return;
            if (result.ok) {
              svg.value = result.svg;
              svgSize.value = result.size;
              lastValidSvg.value = result.svg;
            } else if (request === latest) error.value = result.error;
            if (result.ok)
              await pauseWhileStreaming(performance.now() - startedAt);
            if (!mounted || request === latest) return;
            request = latest;
          }
        } finally {
          inFlight = false;
          if (mounted) loading.value = false;
        }
      },
      { immediate: true },
    );

    return () => {
      const display = svg.value || lastValidSvg.value;
      if (!(shouldRender.value || display))
        return h("div", {
          class: cn("my-4 min-h-[200px]", props.class),
          ref: containerRef,
        });
      if (loading.value && !display)
        return h(
          "div",
          {
            class: cn("my-4 flex justify-center p-4", props.class),
            ref: containerRef,
          },
          [
            h(
              "div",
              {
                class: cn("flex items-center space-x-2 text-muted-foreground"),
              },
              [
                h("div", {
                  class: cn(
                    "h-4 w-4 animate-spin rounded-full border-current border-b-2",
                  ),
                }),
                h("span", { class: cn("text-sm") }, "Loading diagram..."),
              ],
            ),
          ],
        );
      if (error.value && !display) {
        const retry = () => {
          retries.value++;
        };
        const ErrorComponent = context.mermaid?.errorComponent;
        if (ErrorComponent)
          return h("div", { ref: containerRef }, [
            h(ErrorComponent, {
              chart: props.chart,
              error: error.value,
              retry,
            }),
          ]);
        return h(
          "div",
          {
            class: cn("rounded-md bg-red-50 p-4", props.class),
            ref: containerRef,
          },
          [
            h(
              "p",
              { class: cn("font-mono text-red-700 text-sm") },
              `Mermaid Error: ${error.value}`,
            ),
            h("details", { class: cn("mt-2") }, [
              h(
                "summary",
                { class: cn("cursor-pointer text-red-600 text-xs") },
                "Show Code",
              ),
              h(
                "pre",
                {
                  class: cn(
                    "mt-2 overflow-x-auto rounded bg-red-100 p-2 text-red-800 text-xs",
                  ),
                },
                props.chart,
              ),
            ]),
          ],
        );
      }
      return h(
        "div",
        {
          class: cn(
            props.fullscreen ? "size-full" : "max-h-[min(70vh,40rem)] w-full",
            props.class,
          ),
          "data-streamdown": "mermaid",
          ref: containerRef,
        },
        [
          h(
            PanZoom,
            {
              class: cn(
                props.fullscreen
                  ? "size-full overflow-hidden"
                  : "max-h-[min(70vh,40rem)] overflow-hidden",
                props.class,
              ),
              contentSize: svgSize.value,
              fitKey: props.chart,
              fullscreen: props.fullscreen,
              isAutoFit: true,
              maxZoom: 3,
              minZoom: 0.1,
              showControls: props.showControls,
              zoomStep: 0.1,
            },
            {
              default: () =>
                h("div", {
                  "aria-label": t.mermaidAriaLabel,
                  class: cn(
                    "flex justify-center",
                    props.fullscreen ? "size-full items-center" : null,
                  ),
                  innerHTML: display,
                  role: "img",
                }),
            },
          ),
        ],
      );
    };
  },
});
