import type { RemendOptions } from "remend";
import type { Component, VNodeChild } from "vue";
import type { Options, ExtraProps } from "./markdown.js";
import type { AnimateOptions, AnimatePlugin } from "./animate.js";
import type {
  MermaidConfig,
  ThemeInput,
  PluginConfig,
} from "./plugin-types.js";
import type { CSVSeparator } from "./table/utils.js";
import type { IconMap } from "./icon-context.js";
import type {
  StreamdownTranslations,
  StreamdownLocale,
} from "./translations-context.js";
export type DownloadControlConfig = boolean | { filename: string };

export type CopyControlConfig =
  | boolean
  | {
      onCopy?: () => void;
      onError?: (error: Error) => void;
    };

export type ControlsConfig =
  | boolean
  | {
      table?:
        | boolean
        | {
            copy?: boolean;
            csvSeparator?: CSVSeparator;
            download?: DownloadControlConfig;
            fullscreen?: boolean;
          };
      code?:
        | boolean
        | {
            copy?: CopyControlConfig;
            download?: DownloadControlConfig;
          };
      mermaid?:
        | boolean
        | {
            download?: DownloadControlConfig;
            copy?: CopyControlConfig;
            fullscreen?: boolean;
            panZoom?: boolean;
          };
      image?: boolean | { download?: boolean };
    };

export interface LinkSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  url: string;
}

export interface LinkSafetyConfig {
  enabled: boolean;
  onLinkCheck?: (url: string) => Promise<boolean> | boolean;
  renderModal?: (props: LinkSafetyModalProps) => VNodeChild;
}

export interface MermaidErrorComponentProps {
  chart: string;
  error: string;
  retry: () => void;
}

export interface MermaidOptions {
  config?: MermaidConfig;
  errorComponent?: Component<MermaidErrorComponentProps>;
}

export type AllowedTags = Record<string, string[]>;
export type PortalTarget = HTMLElement | null | (() => HTMLElement | null);

export type StreamdownProps = Options & {
  mode?: "static" | "streaming";
  /**
   * Text direction. `"ltr"` / `"rtl"` force a single direction.
   * `"auto"` detects direction per block: in streaming mode via parsed
   * markdown blocks, in static mode via a rehype pass on each semantic
   * block (headings, paragraphs, list items, table cells, etc.).
   * Detection uses a content-majority strong-character count with
   * first-strong as the tie-breaker; fenced/inline code is excluded from
   * the evidence and code blocks are always rendered LTR.
   */
  dir?: "auto" | "ltr" | "rtl";
  BlockComponent?: Component<BlockProps>;
  parseMarkdownIntoBlocksFn?: (markdown: string) => string[];
  parseIncompleteMarkdown?: boolean;
  /** Normalize HTML block indentation to prevent 4+ spaces being treated as code blocks. @default false */
  normalizeHtmlIndentation?: boolean;
  className?: string;
  shikiTheme?: [ThemeInput, ThemeInput];
  mermaid?: MermaidOptions;
  /**
   * Max height for fenced code blocks. Numbers are treated as px.
   * Set to `0` or `Infinity` to disable. @default 400
   */
  codeBlockMaxHeight?: number | string;
  controls?: ControlsConfig;
  isAnimating?: boolean;
  /**
   * Max height for tables. Numbers are treated as px.
   * Set to `0` or `Infinity` to disable. @default 300
   */
  tableMaxHeight?: number | string;
  animated?: boolean | AnimateOptions;
  caret?: "block" | "circle";
  plugins?: PluginConfig;
  remend?: RemendOptions;
  linkSafety?: LinkSafetyConfig;
  /**
   * DOM node for Streamdown overlays, or a function returning one.
   * Defaults to `document.body`.
   */
  portal?: PortalTarget;
  /** Custom tags to allow through sanitization with their permitted attributes */
  allowedTags?: AllowedTags;
  /**
   * Fallback component for HTML tags or `allowedTags` entries that have no
   * matching key in the `components` map. Built-in and explicit `components`
   * entries always win — this does not replace the default Tailwind renderers.
   *
   * When set, it applies to:
   * - Custom tags declared via `allowedTags` that have no matching key in
   *   `components`.
   * - Standard HTML tags absent from both the built-in map and `components`
   *   (e.g. `<span>`, `<em>`, `<div>`, `<br>`).
   *
   * @example
   * ```tsx
   * import { h, type VNodeChild } from "vue";
   * // Render missing map entries / allowedTags via a pass-through
   * <Streamdown
   *   allowedTags={{ mention: ["user_id"] }}
   *   fallbackComponent={({ node, children, className, ...attrs }) =>
   *     h(node!.tagName, { ...attrs, class: className }, children as VNodeChild)
   *   }
   * >
   *   {markdown}
   * </Streamdown>
   * ```
   */
  fallbackComponent?: Component<Record<string, unknown> & ExtraProps>;
  /**
   * Tags whose children should be treated as plain text (no markdown parsing).
   * Useful for mention/entity tags in AI UIs where child content is a data
   * label rather than prose. Requires the tag to also be listed in `allowedTags`.
   *
   * @example
   * ```tsx
   * <Streamdown
   *   allowedTags={{ mention: ['user_id'] }}
   *   literalTagContent={['mention']}
   * >
   *   {`<mention user_id="123">@_some_username_</mention>`}
   * </Streamdown>
   * ```
   */
  literalTagContent?: string[];
  /**
   * Disable GFM / CommonMark autolinking for specific URL protocols (e.g. bare
   * email addresses become `mailto:` autolinks). Accepts protocol names with
   * or without a trailing colon, case-insensitive (`"mailto"` and `"mailto:"`
   * are equivalent). Only affects autolinks (bare URLs/emails and `<...>`
   * forms) — explicit markdown links (`[text](url)`), including cases where
   * the label reconstructs the URL, are left as links.
   *
   * @example
   * ```tsx
   * <Streamdown disableAutolinkProtocols={["mailto"]}>
   *   {"Contact us at hello@example.com"}
   * </Streamdown>
   * ```
   */
  disableAutolinkProtocols?: string[];
  /** Override UI strings for i18n / custom labels */
  translations?: Partial<StreamdownTranslations>;
  /** Custom icons to override the default icons used in controls */
  icons?: Partial<IconMap>;
  /** Tailwind CSS prefix to prepend to all utility classes (e.g. `"tw"` produces `tw:flex` instead of `flex`). Enables Tailwind v4's `prefix()` support. Note: user-supplied `className` values are also prefixed. */
  prefix?: string;
  /** Show line numbers in code blocks. @default true */
  lineNumbers?: boolean;
  locale?: StreamdownLocale;
  /**
   * Code fence languages rendered verbatim as plain monospace text, without
   * syntax highlighting, line numbers or controls. Useful for ASCII / Unicode
   * box-drawing diagrams where column alignment matters.
   * Custom renderers and the Mermaid plugin take precedence for matching languages.
   * @default []
   */
  codeBlockRawLanguages?: string[];
  /** Called when isAnimating transitions from false to true. Suppressed in mode="static". */
  onAnimationStart?: () => void;
  /** Called when isAnimating transitions from true to false. Suppressed in mode="static". */
  onAnimationEnd?: () => void;
  /** `data-*` attributes, like `aria-*` attributes, are set on the root element. */
  [dataAttribute: `data-${string}`]:
    string | number | bigint | boolean | null | undefined;
} & import("vue").AriaAttributes;

export type BlockProps = Options & {
  content: string;
  shouldParseIncompleteMarkdown: boolean;
  shouldNormalizeHtmlIndentation: boolean;
  index: number;
  isIncomplete: boolean;
  dir?: "ltr" | "rtl";
  animatePlugin?: AnimatePlugin | null;
};
