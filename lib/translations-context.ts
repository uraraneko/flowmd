import { type InjectionKey, inject } from "vue";

export type StreamdownLocale = "en" | "zh-CN";

export interface StreamdownTranslations {
  // Link modal
  close: string;
  copied: string;
  // Code block
  copyCode: string;
  copyLink: string;
  // Table
  copyTable: string;
  copyTableAsCsv: string;
  copyTableAsMarkdown: string;
  copyTableAsTsv: string;
  // Mermaid
  downloadDiagram: string;
  downloadDiagramAsMmd: string;
  downloadDiagramAsPng: string;
  downloadDiagramAsSvg: string;
  downloadFile: string;
  // Image
  downloadImage: string;
  downloadTable: string;
  downloadTableAsCsv: string;
  downloadTableAsMarkdown: string;
  errorMermaid: string;
  exitFullscreen: string;
  externalLinkWarning: string;
  imageNotAvailable: string;
  mermaidAriaLabel: string;
  mermaidFormatMmd: string;
  mermaidFormatPng: string;
  mermaidFormatSvg: string;
  openExternalLink: string;
  openLink: string;
  resetView: string;
  tableFormatCsv: string;
  tableFormatMarkdown: string;
  tableFormatTsv: string;
  viewFullscreen: string;
  zoomIn: string;
  zoomOut: string;
}

export const enTranslations: StreamdownTranslations = {
  // Code block
  copyCode: "Copy Code",
  downloadFile: "Download file",
  // Mermaid
  downloadDiagram: "Download diagram",
  downloadDiagramAsSvg: "Download diagram as SVG",
  downloadDiagramAsPng: "Download diagram as PNG",
  downloadDiagramAsMmd: "Download diagram as MMD",
  viewFullscreen: "View fullscreen",
  exitFullscreen: "Exit fullscreen",
  mermaidFormatSvg: "SVG",
  mermaidFormatPng: "PNG",
  mermaidFormatMmd: "MMD",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  resetView: "Reset zoom and pan",
  mermaidAriaLabel: "Mermaid chart",
  errorMermaid: "Failed to render Mermaid chart",
  // Table
  copyTable: "Copy table",
  copyTableAsMarkdown: "Copy table as Markdown",
  copyTableAsCsv: "Copy table as CSV",
  copyTableAsTsv: "Copy table as TSV",
  downloadTable: "Download table",
  downloadTableAsCsv: "Download table as CSV",
  downloadTableAsMarkdown: "Download table as Markdown",
  tableFormatMarkdown: "Markdown",
  tableFormatCsv: "CSV",
  tableFormatTsv: "TSV",
  // Image
  imageNotAvailable: "Image not available",
  downloadImage: "Download image",
  // Link modal
  openExternalLink: "Open external link?",
  externalLinkWarning: "You're about to visit an external website.",
  close: "Close",
  copyLink: "Copy link",
  copied: "Copied",
  openLink: "Open link",
};

export const zhCnTranslations: StreamdownTranslations = {
  ...enTranslations,
  // Code block
  copyCode: "复制代码",
  downloadFile: "下载文件",
  // Mermaid
  downloadDiagram: "下载图表",
  downloadDiagramAsSvg: "将图表下载为 SVG",
  downloadDiagramAsPng: "将图表下载为 PNG",
  downloadDiagramAsMmd: "将图表下载为 MMD",
  viewFullscreen: "全屏查看",
  exitFullscreen: "退出全屏",
  mermaidFormatSvg: "SVG",
  mermaidFormatPng: "PNG",
  mermaidFormatMmd: "MMD",
  zoomIn: "放大",
  zoomOut: "缩小",
  resetView: "重置缩放和平移",
  // Table
  copyTable: "复制表格",
  copyTableAsMarkdown: "将表格复制为 Markdown",
  copyTableAsCsv: "将表格复制为 CSV",
  copyTableAsTsv: "将表格复制为 TSV",
  downloadTable: "下载表格",
  downloadTableAsCsv: "将表格下载为 CSV",
  downloadTableAsMarkdown: "将表格下载为 Markdown",
  tableFormatMarkdown: "Markdown",
  tableFormatCsv: "CSV",
  tableFormatTsv: "TSV",
  // Image
  imageNotAvailable: "图片不可用",
  downloadImage: "下载图片",
  // Link modal
  openExternalLink: "打开外部链接？",
  externalLinkWarning: "你即将访问外部网站。",
  close: "关闭",
  copyLink: "复制链接",
  copied: "已复制",
  openLink: "打开链接",
};

export const localeTranslations: Record<
  StreamdownLocale,
  StreamdownTranslations
> = {
  en: enTranslations,
  "zh-CN": zhCnTranslations,
};

export const defaultTranslations: StreamdownTranslations = enTranslations;

export const TranslationsKey: InjectionKey<StreamdownTranslations> =
  Symbol("Translations");

export const useTranslations = (): StreamdownTranslations =>
  inject(TranslationsKey, defaultTranslations);
