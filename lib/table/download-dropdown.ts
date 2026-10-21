import {
  defineComponent,
  h,
  ref,
  onMounted,
  onUnmounted,
  inject,
  type ExtractPublicPropTypes,
  type PropType,
} from "vue";
import { StreamdownKey } from "../streamdown-context.js";
import { getDownloadFilename } from "../controls.js";
import { useIcons } from "../icon-context.js";
import { useCn } from "../prefix-context.js";
import { useTranslations } from "../translations-context.js";
import { save } from "../utils.js";
import {
  extractTableDataFromElement,
  tableDataToCSV,
  getTableCsvSeparator,
  tableDataToMarkdown,
} from "./utils.js";

const tableDownloadButtonProps = {
  onDownload: {
    type: Function as PropType<() => void>,
    default: undefined,
  },
  onError: {
    type: Function as PropType<(error: Error) => void>,
    default: undefined,
  },
  format: {
    type: String as PropType<"csv" | "markdown">,
    default: "csv",
  },
  filename: {
    type: String,
    default: undefined,
  },
  className: { type: String, default: undefined },
  class: {
    type: [String, Object, Array] as PropType<any>,
    default: undefined,
  },
} as const;

export type TableDownloadButtonProps = ExtractPublicPropTypes<
  typeof tableDownloadButtonProps
>;

export const TableDownloadButton = defineComponent({
  name: "TableDownloadButton",
  props: tableDownloadButtonProps,
  setup(props, { slots, attrs }) {
    const cn = useCn();
    const streamdownContext = inject(StreamdownKey, {
      isAnimating: false,
    } as any);
    const t = useTranslations();
    const icons = useIcons();

    const downloadTableData = (event: MouseEvent) => {
      try {
        const button = event.currentTarget as HTMLButtonElement;
        const tableWrapper = button.closest(
          '[data-streamdown="table-wrapper"]',
        );
        const tableElement = tableWrapper?.querySelector(
          "table",
        ) as HTMLTableElement;

        if (!tableElement) {
          props.onError?.(new Error("Table not found"));
          return;
        }

        const tableData = extractTableDataFromElement(tableElement);
        let content = "";
        let mimeType = "";
        let extension = "";

        switch (props.format) {
          case "csv":
            content = tableDataToCSV(
              tableData,
              getTableCsvSeparator(streamdownContext.controls ?? true),
            );
            mimeType = "text/csv";
            extension = "csv";
            break;
          case "markdown":
            content = tableDataToMarkdown(tableData);
            mimeType = "text/markdown";
            extension = "md";
            break;
          default:
            content = tableDataToCSV(
              tableData,
              getTableCsvSeparator(streamdownContext.controls ?? true),
            );
            mimeType = "text/csv";
            extension = "csv";
        }

        save(
          `${props.filename || getDownloadFilename(streamdownContext.controls ?? true, "table", "table")}.${extension}`,
          content,
          mimeType,
        );
        props.onDownload?.();
      } catch (error) {
        props.onError?.(error as Error);
      }
    };

    return () =>
      h(
        "button",
        {
          class: cn(
            "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
            [props.className, props.class],
          ),
          disabled: streamdownContext.isAnimating,
          onClick: downloadTableData,
          title:
            props.format === "csv"
              ? t.downloadTableAsCsv
              : t.downloadTableAsMarkdown,
          type: "button",
          ...attrs,
        },
        slots.default ? slots.default() : [h(icons.DownloadIcon, { size: 14 })],
      );
  },
});

const tableDownloadDropdownProps = {
  onDownload: {
    type: Function as PropType<(format: "csv" | "markdown") => void>,
    default: undefined,
  },
  onError: {
    type: Function as PropType<(error: Error) => void>,
    default: undefined,
  },
  className: { type: String, default: undefined },
  class: {
    type: [String, Object, Array] as PropType<any>,
    default: undefined,
  },
} as const;

export type TableDownloadDropdownProps = ExtractPublicPropTypes<
  typeof tableDownloadDropdownProps
>;

export const TableDownloadDropdown = defineComponent({
  name: "TableDownloadDropdown",
  props: tableDownloadDropdownProps,
  setup(props, { slots, attrs }) {
    const cn = useCn();
    const isOpen = ref(false);
    const dropdownRef = ref<HTMLDivElement | null>(null);
    const streamdownContext = inject(StreamdownKey, {
      isAnimating: false,
    } as any);
    const t = useTranslations();
    const icons = useIcons();

    const downloadTableData = (format: "csv" | "markdown") => {
      try {
        const tableContainer = dropdownRef.value?.closest(
          '[data-streamdown="table-wrapper"], [data-streamdown="table-fullscreen"]',
        );
        const tableElement = tableContainer?.querySelector(
          "table",
        ) as HTMLTableElement | null;

        if (!tableElement) {
          props.onError?.(new Error("Table not found"));
          return;
        }

        const tableData = extractTableDataFromElement(tableElement);
        const content =
          format === "csv"
            ? tableDataToCSV(
                tableData,
                getTableCsvSeparator(streamdownContext.controls ?? true),
              )
            : tableDataToMarkdown(tableData);
        const extension = format === "csv" ? "csv" : "md";
        const filename = `${getDownloadFilename(streamdownContext.controls ?? true, "table", "table")}.${extension}`;
        const mimeType = format === "csv" ? "text/csv" : "text/markdown";

        save(filename, content, mimeType);
        isOpen.value = false;
        props.onDownload?.(format);
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
      h(
        "div",
        {
          class: cn("relative"),
          ref: dropdownRef,
        },
        [
          h(
            "button",
            {
              class: cn(
                "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
                [props.className, props.class],
              ),
              disabled: streamdownContext.isAnimating,
              onClick: () => {
                isOpen.value = !isOpen.value;
              },
              title: t.downloadTable,
              type: "button",
              ...attrs,
            },
            slots.default
              ? slots.default()
              : [h(icons.DownloadIcon, { size: 14 })],
          ),
          isOpen.value
            ? h(
                "div",
                {
                  class: cn(
                    "absolute end-0 top-full z-20 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg",
                  ),
                },
                [
                  h(
                    "button",
                    {
                      class: cn(
                        "w-full px-3 py-2 text-start text-sm transition-colors hover:bg-muted/40",
                      ),
                      onClick: () => downloadTableData("csv"),
                      title: t.downloadTableAsCsv,
                      type: "button",
                    },
                    t.tableFormatCsv,
                  ),
                  h(
                    "button",
                    {
                      class: cn(
                        "w-full px-3 py-2 text-start text-sm transition-colors hover:bg-muted/40",
                      ),
                      onClick: () => downloadTableData("markdown"),
                      title: t.downloadTableAsMarkdown,
                      type: "button",
                    },
                    t.tableFormatMarkdown,
                  ),
                ],
              )
            : null,
        ],
      );
  },
});
