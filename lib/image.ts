import {
  defineComponent,
  h,
  ref,
  onMounted,
  computed,
  type PropType,
} from "vue";
import { INCOMPLETE_IMAGE_PLACEHOLDER } from "remend";
import { useIcons } from "./icon-context.js";
import type { ExtraProps } from "./markdown.js";
import { useCn } from "./prefix-context.js";
import { useTranslations } from "./translations-context.js";
import { save } from "./utils.js";

const fileExtensionPattern = /\.[^/.]+$/;

export const ImageComponent = defineComponent({
  name: "ImageComponent",
  inheritAttrs: false,
  props: {
    showControls: { type: Boolean, default: true },
    showDownloadControl: { type: Boolean, default: true },
    node: {
      type: Object as PropType<ExtraProps["node"]>,
      default: undefined,
    },
    class: {
      type: [String, Object, Array] as PropType<any>,
      default: undefined,
    },
    src: {
      type: String,
      default: undefined,
    },
    alt: {
      type: String,
      default: undefined,
    },
    width: {
      type: [String, Number],
      default: undefined,
    },
    height: {
      type: [String, Number],
      default: undefined,
    },
    onLoad: {
      type: Function as PropType<(event: Event) => void>,
      default: undefined,
    },
    onError: {
      type: Function as PropType<(event: Event) => void>,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    const icons = useIcons();
    const cn = useCn();
    const imgRef = ref<HTMLImageElement | null>(null);
    const imageLoaded = ref(false);
    const imageError = ref(false);
    const t = useTranslations();

    const hasExplicitDimensions = computed(
      () => props.width != null || props.height != null,
    );
    const showDownload = computed(
      () =>
        (imageLoaded.value || hasExplicitDimensions.value) &&
        !imageError.value &&
        props.showControls &&
        props.showDownloadControl,
    );
    const showFallback = computed(
      () => imageError.value && !hasExplicitDimensions.value,
    );

    // Handle images already complete before React attaches event handlers (e.g. cached or SSR hydration)
    onMounted(() => {
      const img = imgRef.value;
      if (img?.complete) {
        const loaded = img.naturalWidth > 0;
        imageLoaded.value = loaded;
        imageError.value = !loaded;
      }
    });

    const handleLoad = (event: Event) => {
      imageLoaded.value = true;
      imageError.value = false;
      props.onLoad?.(event);
    };

    const handleError = (event: Event) => {
      imageLoaded.value = false;
      imageError.value = true;
      props.onError?.(event);
    };

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: "Complex image download logic with multiple edge cases"
    const downloadImage = async () => {
      /* v8 ignore next */
      if (!props.src) {
        return;
      }

      try {
        const response = await fetch(props.src);
        const blob = await response.blob();

        // Extract filename from URL or use alt text with proper extension
        const urlPath = new URL(props.src, window.location.origin).pathname;
        const originalFilename = urlPath.split("/").pop() || "";
        const extension = originalFilename.split(".").pop();
        const hasExtension =
          originalFilename.includes(".") &&
          extension !== undefined &&
          extension.length <= 4;

        let filename = "";

        if (hasExtension) {
          filename = originalFilename;
        } else {
          // Determine extension from blob type
          const mimeType = blob.type;
          let fileExtension = "png"; // default

          if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
            fileExtension = "jpg";
          } else if (mimeType.includes("png")) {
            fileExtension = "png";
          } else if (mimeType.includes("svg")) {
            fileExtension = "svg";
          } else if (mimeType.includes("gif")) {
            fileExtension = "gif";
          } else if (mimeType.includes("webp")) {
            fileExtension = "webp";
          }

          const baseName = props.alt || originalFilename || "image";
          filename = `${baseName.replace(fileExtensionPattern, "")}.${fileExtension}`;
        }

        save(filename, blob, blob.type);
      } catch {
        // CORS fallback: open image in new tab for manual save
        window.open(props.src, "_blank");
      }
    };

    return () => {
      if (!props.src) {
        return null;
      }

      if (props.src === INCOMPLETE_IMAGE_PLACEHOLDER) {
        return h(
          "div",
          {
            class: cn("group relative my-4 inline-block"),
            "data-incomplete": "true",
            "data-streamdown": "image-wrapper",
          },
          h("div", {
            class: cn("h-24 w-48 animate-pulse rounded-lg bg-muted"),
            "data-streamdown": "image-placeholder",
          }),
        );
      }
      return h(
        "div",
        {
          class: cn("group relative my-4 inline-block"),
          "data-streamdown": "image-wrapper",
        },
        [
          h("img", {
            alt: props.alt,
            class: cn(
              "max-w-full rounded-lg",
              showFallback.value && "hidden",
              props.class,
            ),
            "data-streamdown": "image",
            onError: handleError,
            onLoad: handleLoad,
            ref: imgRef,
            src: props.src,
            width: props.width,
            height: props.height,
            ...attrs,
          }),
          showFallback.value &&
            h(
              "span",
              {
                class: cn("text-muted-foreground text-xs italic"),
                "data-streamdown": "image-fallback",
              },
              t.imageNotAvailable,
            ),
          props.showControls &&
            h("div", {
              "data-streamdown": "image-overlay",
              class: cn(
                "pointer-events-none absolute inset-0 hidden rounded-lg bg-black/10 group-hover:block",
              ),
            }),
          showDownload.value &&
            h(
              "button",
              {
                class: cn(
                  "absolute end-2 bottom-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-background/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-background",
                  "opacity-0 group-hover:opacity-100",
                ),
                onClick: downloadImage,
                title: t.downloadImage,
                type: "button",
              },
              [h(icons.DownloadIcon, { size: 14 })],
            ),
        ],
      );
    };
  },
});
