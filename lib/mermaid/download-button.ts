import type { MermaidConfig } from "../plugin-types.js";
import {
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  ref,
  type PropType,
  type VNodeChild,
} from "vue";
import { useStreamdownContext } from "../streamdown-context.js";
import { getDownloadFilename } from "../controls.js";
import { useIcons } from "../icon-context.js";
import { usePlugins } from "../plugin-context.js";
import { useCn } from "../prefix-context.js";
import { useTranslations } from "../translations-context.js";
import { save } from "../utils.js";
import { svgToPngBlob } from "./utils.js";

export interface MermaidDownloadDropdownProps {
  chart: string;
  children?: VNodeChild;
  className?: string;
  config?: MermaidConfig;
  onDownload?: (format: "mmd" | "png" | "svg") => void;
  onError?: (error: Error) => void;
}

export const MermaidDownloadDropdown = defineComponent({
  name: "MermaidDownloadDropdown",
  props: {
    chart: {
      type: String,
      required: true,
    },
    children: {
      type: null,
      default: undefined,
    },
    className: {
      type: String,
      default: undefined,
    },
    config: {
      type: Object as PropType<MermaidConfig | undefined>,
      default: undefined,
    },
    onDownload: {
      type: Function as PropType<
        ((format: "mmd" | "png" | "svg") => void) | undefined
      >,
      default: undefined,
    },
    onError: {
      type: Function as PropType<((error: Error) => void) | undefined>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const cn = useCn();
    const isOpen = ref(false);
    const dropdownRef = ref<HTMLDivElement | null>(null);
    const streamdownContext = useStreamdownContext();
    const icons = useIcons();
    const plugins = usePlugins();
    const t = useTranslations();

    const downloadMermaid = async (format: "mmd" | "png" | "svg") => {
      try {
        if (format === "mmd") {
          save(
            `${getDownloadFilename(streamdownContext.controls, "mermaid", "diagram")}.mmd`,
            props.chart,
            "text/plain",
          );
          isOpen.value = false;
          props.onDownload?.(format);
          return;
        }

        const mermaidPlugin = plugins?.mermaid;
        if (!mermaidPlugin) {
          props.onError?.(new Error("Mermaid plugin not available"));
          return;
        }

        const mermaid = mermaidPlugin.getMermaid(props.config);
        const chartHash = props.chart.split("").reduce((acc, char) => {
          return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
        }, 0);
        const uniqueId = `mermaid-${Math.abs(chartHash)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, props.chart);

        if (!svg) {
          props.onError?.(
            new Error("SVG not found. Please wait for the diagram to render."),
          );
          return;
        }

        if (format === "svg") {
          save(
            `${getDownloadFilename(streamdownContext.controls, "mermaid", "diagram")}.svg`,
            svg,
            "image/svg+xml",
          );
          isOpen.value = false;
          props.onDownload?.(format);
          return;
        }

        if (format === "png") {
          const blob = await svgToPngBlob(svg);
          save(
            `${getDownloadFilename(streamdownContext.controls, "mermaid", "diagram")}.png`,
            blob,
            "image/png",
          );
          props.onDownload?.(format);
          isOpen.value = false;
        }
      } catch (error) {
        props.onError?.(error as Error);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const path = event.composedPath();
      if (dropdownRef.value && !path.includes(dropdownRef.value)) {
        isOpen.value = false;
      }
    };

    onMounted(() => {
      document.addEventListener("mousedown", handleClickOutside);
    });

    onUnmounted(() => {
      document.removeEventListener("mousedown", handleClickOutside);
    });

    return () =>
      h("div", { class: cn("relative"), ref: dropdownRef }, [
        h(
          "button",
          {
            class: cn(
              "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
              props.className,
            ),
            disabled: streamdownContext.isAnimating,
            onClick: () => {
              isOpen.value = !isOpen.value;
            },
            "aria-label": t.downloadDiagram,
            title: t.downloadDiagram,
            type: "button",
          },
          slots.default?.() ?? [
            h(icons.DownloadIcon, { "aria-hidden": "true", size: 14 }),
          ],
        ),
        isOpen.value
          ? h(
              "div",
              {
                class: cn(
                  "absolute end-0 top-full z-10 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg",
                ),
              },
              [
                h(
                  "button",
                  {
                    class: cn(
                      "w-full px-3 py-2 text-start text-sm transition-colors hover:bg-muted/40",
                    ),
                    onClick: () => downloadMermaid("svg"),
                    "aria-label": t.downloadDiagramAsSvg,
                    title: t.downloadDiagramAsSvg,
                    type: "button",
                  },
                  t.mermaidFormatSvg,
                ),
                h(
                  "button",
                  {
                    class: cn(
                      "w-full px-3 py-2 text-start text-sm transition-colors hover:bg-muted/40",
                    ),
                    onClick: () => downloadMermaid("png"),
                    "aria-label": t.downloadDiagramAsPng,
                    title: t.downloadDiagramAsPng,
                    type: "button",
                  },
                  t.mermaidFormatPng,
                ),
                h(
                  "button",
                  {
                    class: cn(
                      "w-full px-3 py-2 text-start text-sm transition-colors hover:bg-muted/40",
                    ),
                    onClick: () => downloadMermaid("mmd"),
                    "aria-label": t.downloadDiagramAsMmd,
                    title: t.downloadDiagramAsMmd,
                    type: "button",
                  },
                  t.mermaidFormatMmd,
                ),
              ],
            )
          : null,
      ]);
  },
});
