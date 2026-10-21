import { contextView } from "./lib/context-view.js";
import {
  computed,
  getCurrentInstance,
  defineComponent,
  h,
  isVNode,
  onMounted,
  onUpdated,
  shallowRef,
  shallowReactive,
  type VNode,
  toRef,
  useId,
  provide,
  ref,
  watch,
  type Component,
  type FunctionalComponent,
  type DefineComponent,
  type CSSProperties,
  type PropType,
  type VNodeChild,
} from "vue";
import { harden } from "rehype-harden";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remend, { type RemendOptions } from "remend";
import type { Pluggable } from "unified";
import {
  type AnimateOptions,
  type AnimatePlugin,
  createRenderAnimatePlugin,
  createAnimateTimeline,
  type AnimateTimeline,
} from "./lib/animate.js";
import { BlockIncompleteKey } from "./lib/block-incomplete-context.js";
import { components as defaultComponents } from "./lib/components.js";
import { detectTextDirection } from "./lib/detect-direction.js";
import { defaultIcons, IconKey, type IconMap } from "./lib/icon-context.js";
import {
  hasIncompleteCodeFence,
  hasTable,
} from "./lib/incomplete-code-utils.js";
import { Markdown, type Options } from "./lib/markdown.js";
import { parseMarkdownIntoBlocks } from "./lib/parse-blocks.js";
import { PluginKey } from "./lib/plugin-context.js";
import type { PluginConfig, ThemeInput } from "./lib/plugin-types.js";
import { PrefixKey } from "./lib/prefix-context.js";
import { preprocessCustomTags } from "./lib/preprocess-custom-tags.js";
import { preprocessLiteralTagContent } from "./lib/preprocess-literal-tag-content.js";
import { rehypeLiteralTagContent } from "./lib/rehype/literal-tag-content.js";
import { remarkCodeMeta } from "./lib/remark/code-meta.js";
import {
  localeTranslations,
  type StreamdownLocale,
  type StreamdownTranslations,
  TranslationsKey,
} from "./lib/translations-context.js";
import {
  defaultStreamdownContext,
  StreamdownKey,
  type StreamdownContextType,
} from "./lib/streamdown-context.js";
import { createCn } from "./lib/utils.js";
import { remarkDisableAutolinkProtocols } from "./lib/remark/disable-autolink-protocols.js";
import { rehypeBlockDirection } from "./lib/rehype/block-direction.js";
import { useCaretHost } from "./lib/use-caret-host.js";
export type DefaultComponents = typeof defaultComponents;
export { defaultComponents };

export type {
  BundledLanguage,
  BundledTheme,
  ThemeRegistrationAny,
} from "./lib/shiki-types.js";
export type { AnimateOptions } from "./lib/animate.js";
export { createAnimatePlugin } from "./lib/animate.js";
export { useIsCodeFenceIncomplete } from "./lib/block-incomplete-context.js";
export { CodeBlock } from "./lib/code-block/index.js";
export { CodeBlockContainer } from "./lib/code-block/container.js";
export { CodeBlockCopyButton } from "./lib/code-block/copy-button.js";
export { CodeBlockDownloadButton } from "./lib/code-block/download-button.js";
export { CodeBlockHeader } from "./lib/code-block/header.js";
export { CodeBlockSkeleton } from "./lib/code-block/skeleton.js";
export { detectTextDirection } from "./lib/detect-direction.js";
export type { IconMap } from "./lib/icon-context.js";
export type {
  AllowElement,
  Components,
  ExtraProps,
  UrlTransform,
} from "./lib/markdown.js";
export { defaultUrlTransform } from "./lib/markdown.js";
export { parseMarkdownIntoBlocks } from "./lib/parse-blocks.js";
export type {
  CjkPlugin,
  CodeHighlighterPlugin,
  CustomRenderer,
  CustomRendererProps,
  DiagramPlugin,
  HighlightOptions,
  HighlightResult,
  HighlightToken,
  MathPlugin,
  PluginConfig,
  ThemeInput,
} from "./lib/plugin-types.js";
export {
  TableCopyDropdown,
  type TableCopyDropdownProps,
} from "./lib/table/copy-dropdown.js";
export {
  TableDownloadButton,
  type TableDownloadButtonProps,
  TableDownloadDropdown,
  type TableDownloadDropdownProps,
} from "./lib/table/download-dropdown.js";
export {
  type CSVSeparator,
  escapeMarkdownTableCell,
  extractTableDataFromElement,
  type TableData,
  tableDataToCSV,
  tableDataToMarkdown,
  tableDataToTSV,
} from "./lib/table/utils.js";
export type {
  StreamdownLocale,
  StreamdownTranslations,
} from "./lib/translations-context.js";
export {
  defaultTranslations,
  enTranslations,
  localeTranslations,
  zhCnTranslations,
} from "./lib/translations-context.js";
export type { StreamdownContextType } from "./lib/streamdown-context.js";
export {
  StreamdownContext,
  StreamdownKey,
  useStreamdownContext,
} from "./lib/streamdown-context.js";

const HTML_BLOCK_START_PATTERN = /^[ \t]*<[\w!/?-]/;
const HTML_LINE_INDENT_PATTERN = /(^|\n)[ \t]{4,}(?=<[\w!/?-])/g;

export const normalizeHtmlIndentation = (content: string): string => {
  if (typeof content !== "string" || content.length === 0) {
    return content;
  }
  if (!HTML_BLOCK_START_PATTERN.test(content)) {
    return content;
  }
  return content.replace(HTML_LINE_INDENT_PATTERN, "$1");
};

export type {
  DownloadControlConfig,
  CopyControlConfig,
  ControlsConfig,
  LinkSafetyModalProps,
  LinkSafetyConfig,
  MermaidErrorComponentProps,
  MermaidOptions,
  AllowedTags,
  PortalTarget,
  StreamdownProps,
} from "./lib/types.js";
import type {
  ControlsConfig,
  LinkSafetyConfig,
  MermaidOptions,
  AllowedTags,
  PortalTarget,
  StreamdownProps,
} from "./lib/types.js";

const carets = {
  block: " ▋",
  circle: " ●",
} as const;

const defaultShikiTheme: [ThemeInput, ThemeInput] = [
  "github-light",
  "github-dark",
];

const defaultLinkSafetyConfig: LinkSafetyConfig = {
  enabled: true,
};

const defaultSanitizeSchema = {
  ...defaultSchema,
  clobberPrefix: "",
  protocols: {
    ...defaultSchema.protocols,
    href: [...(defaultSchema.protocols?.href ?? []), "tel", "streamdown"],
    src: [...(defaultSchema.protocols?.src ?? []), "streamdown"],
  },
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), "metastring"],
  },
};

export const defaultRehypePlugins: Record<string, Pluggable> = {
  raw: rehypeRaw,
  sanitize: [rehypeSanitize, defaultSanitizeSchema],
  harden: [
    harden,
    {
      allowedImagePrefixes: ["*"],
      allowedLinkPrefixes: ["*"],
      allowedProtocols: ["*"],
      defaultOrigin: undefined,
      allowDataImages: true,
    },
  ],
} as const;

export const defaultRemarkPlugins: Record<string, Pluggable> = {
  gfm: [remarkGfm, {}],
  codeMeta: remarkCodeMeta,
} as const;

const defaultRehypePluginsArray = Object.values(defaultRehypePlugins);
const defaultRemarkPluginsArray = Object.values(defaultRemarkPlugins);

export type BlockProps = Options & {
  content: string;
  shouldParseIncompleteMarkdown: boolean;
  shouldNormalizeHtmlIndentation: boolean;
  index: number;
  isIncomplete: boolean;
  dir?: "ltr" | "rtl";
  animatePlugin?: AnimatePlugin | null;
};

export const Block: DefineComponent<BlockProps> = defineComponent({
  name: "Block",
  inheritAttrs: false,
  props: {
    content: {
      type: String,
      required: true,
    },
    shouldParseIncompleteMarkdown: {
      type: Boolean,
      required: true,
    },
    shouldNormalizeHtmlIndentation: {
      type: Boolean,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
    isIncomplete: {
      type: Boolean,
      required: true,
    },
    dir: {
      type: String as PropType<"ltr" | "rtl" | undefined>,
      default: undefined,
    },
    animatePlugin: {
      type: Object as PropType<AnimatePlugin | null>,
      default: null,
    },
    allowElement: {
      type: Function as PropType<Options["allowElement"]>,
      default: undefined,
    },
    allowedElements: {
      type: Array as PropType<Options["allowedElements"]>,
      default: undefined,
    },
    components: {
      type: Object as PropType<Options["components"]>,
      default: undefined,
    },
    disallowedElements: {
      type: Array as PropType<Options["disallowedElements"]>,
      default: undefined,
    },
    rehypePlugins: {
      type: Array as PropType<Options["rehypePlugins"]>,
      default: undefined,
    },
    remarkPlugins: {
      type: Array as PropType<Options["remarkPlugins"]>,
      default: undefined,
    },
    remarkRehypeOptions: {
      type: Object as PropType<Options["remarkRehypeOptions"]>,
      default: undefined,
    },
    skipHtml: {
      type: Boolean,
      default: undefined,
    },
    unwrapDisallowed: {
      type: Boolean,
      default: undefined,
    },
    urlTransform: {
      type: Function as PropType<Options["urlTransform"]>,
      default: undefined,
    },
  },
  setup(props) {
    provide(BlockIncompleteKey, toRef(props, "isIncomplete"));
    const commit = () => props.animatePlugin?.commit();
    onMounted(commit);
    onUpdated(commit);
    let previous: BlockProps | undefined;
    let rendered: VNode | undefined;

    return () => {
      const current = { ...props };
      const sameComponents =
        previous &&
        (previous.components === current.components ||
          (Object.keys(previous.components ?? {}).length ===
            Object.keys(current.components ?? {}).length &&
            Object.keys(previous.components ?? {}).every(
              (key) =>
                previous?.components?.[key] === current.components?.[key],
            )));
      if (
        previous &&
        rendered &&
        sameComponents &&
        previous.content === current.content &&
        previous.index === current.index &&
        previous.shouldNormalizeHtmlIndentation ===
          current.shouldNormalizeHtmlIndentation &&
        previous.isIncomplete === current.isIncomplete &&
        previous.dir === current.dir &&
        previous.rehypePlugins === current.rehypePlugins &&
        previous.remarkPlugins === current.remarkPlugins &&
        Boolean(previous.animatePlugin) === Boolean(current.animatePlugin)
      )
        return rendered;
      previous = current;

      const normalizedContent =
        typeof props.content === "string" &&
        props.shouldNormalizeHtmlIndentation
          ? normalizeHtmlIndentation(props.content)
          : props.content;

      const markdownProps: Options = {
        allowElement: props.allowElement,
        allowedElements: props.allowedElements,
        components: props.components,
        disallowedElements: props.disallowedElements,
        rehypePlugins: props.rehypePlugins,
        remarkPlugins: props.remarkPlugins,
        remarkRehypeOptions: props.remarkRehypeOptions,
        skipHtml: props.skipHtml,
        unwrapDisallowed: props.unwrapDisallowed,
        urlTransform: props.urlTransform,
        children: normalizedContent,
      };

      const markdownNode = h(Markdown, markdownProps);

      if (props.dir) {
        return (rendered = h(
          "div",
          {
            dir: props.dir,
            style: { display: "contents" },
          },
          [markdownNode],
        ));
      }

      return (rendered = markdownNode);
    };
  },
}) as unknown as DefineComponent<BlockProps>;

const mergeIcons = (overrides?: Partial<IconMap>): IconMap => ({
  ...defaultIcons,
  ...overrides,
});

const slotChildrenToString = (children: VNodeChild): string => {
  if (
    children === null ||
    children === undefined ||
    typeof children === "boolean"
  ) {
    return "";
  }
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(slotChildrenToString).join("");
  }
  if (isVNode(children)) {
    return slotChildrenToString(children.children as VNodeChild);
  }
  return "";
};

const mergeComponents = (
  components?: Options["components"],
): NonNullable<Options["components"]> => {
  const { inlineCode, ...userComponents } = components ?? {};
  const merged: NonNullable<Options["components"]> = {
    ...defaultComponents,
    ...userComponents,
  };

  if (inlineCode) {
    const blockCode = merged.code;
    const code: FunctionalComponent<Record<string, unknown>> = (
      props,
      { slots },
    ) => {
      const isInline = !("data-block" in props);
      if (isInline) {
        return h(inlineCode, props, slots);
      }
      return blockCode ? h(blockCode, props, slots) : null;
    };
    merged.code = code;
  }

  return merged;
};

export const Streamdown: DefineComponent<StreamdownProps> = defineComponent({
  name: "Streamdown",
  inheritAttrs: false,
  props: {
    codeBlockMaxHeight: { type: [Number, String], default: 400 },
    tableMaxHeight: { type: [Number, String], default: 300 },
    portal: {
      type: [Object, Function] as PropType<PortalTarget>,
      default: undefined,
    },
    fallbackComponent: {
      type: [Object, Function] as PropType<Component>,
      default: undefined,
    },
    codeBlockRawLanguages: {
      type: Array as PropType<string[]>,
      default: undefined,
    },
    disableAutolinkProtocols: {
      type: Array as PropType<string[]>,
      default: undefined,
    },

    allowElement: {
      type: Function as PropType<Options["allowElement"]>,
      default: undefined,
    },
    allowedElements: {
      type: Array as PropType<Options["allowedElements"]>,
      default: undefined,
    },
    children: {
      type: String,
      default: undefined,
    },
    components: {
      type: Object as PropType<Options["components"]>,
      default: undefined,
    },
    disallowedElements: {
      type: Array as PropType<Options["disallowedElements"]>,
      default: undefined,
    },
    rehypePlugins: {
      type: Array as PropType<Options["rehypePlugins"]>,
      default: () => defaultRehypePluginsArray,
    },
    remarkPlugins: {
      type: Array as PropType<Options["remarkPlugins"]>,
      default: () => defaultRemarkPluginsArray,
    },
    remarkRehypeOptions: {
      type: Object as PropType<Options["remarkRehypeOptions"]>,
      default: undefined,
    },
    skipHtml: {
      type: Boolean,
      default: undefined,
    },
    unwrapDisallowed: {
      type: Boolean,
      default: undefined,
    },
    urlTransform: {
      type: Function as PropType<Options["urlTransform"]>,
      default: undefined,
    },
    mode: {
      type: String as PropType<"static" | "streaming">,
      default: "streaming",
    },
    dir: {
      type: String as PropType<"auto" | "ltr" | "rtl" | undefined>,
      default: undefined,
    },
    BlockComponent: {
      type: [Object, Function] as PropType<Component<BlockProps>>,
      default: Block,
    },
    parseMarkdownIntoBlocksFn: {
      type: Function as PropType<(markdown: string) => string[]>,
      default: parseMarkdownIntoBlocks,
    },
    parseIncompleteMarkdown: {
      type: Boolean,
      default: true,
    },
    normalizeHtmlIndentation: {
      type: Boolean,
      default: false,
    },
    className: {
      type: String,
      default: undefined,
    },
    shikiTheme: {
      type: Array as unknown as PropType<[ThemeInput, ThemeInput]>,
      default: undefined,
    },
    mermaid: {
      type: Object as PropType<MermaidOptions | undefined>,
      default: undefined,
    },
    controls: {
      type: [Boolean, Object] as PropType<ControlsConfig>,
      default: true,
    },
    locale: {
      type: String as PropType<StreamdownLocale | undefined>,
      default: undefined,
    },
    isAnimating: {
      type: Boolean,
      default: false,
    },
    animated: {
      type: [Boolean, Object] as PropType<boolean | AnimateOptions | undefined>,
      default: undefined,
    },
    caret: {
      type: String as PropType<keyof typeof carets | undefined>,
      default: undefined,
    },
    plugins: {
      type: Object as PropType<PluginConfig | undefined>,
      default: undefined,
    },
    remend: {
      type: Object as PropType<RemendOptions | undefined>,
      default: undefined,
    },
    linkSafety: {
      type: Object as PropType<LinkSafetyConfig>,
      default: () => defaultLinkSafetyConfig,
    },
    allowedTags: {
      type: Object as PropType<AllowedTags | undefined>,
      default: undefined,
    },
    literalTagContent: {
      type: Array as PropType<string[] | undefined>,
      default: undefined,
    },
    translations: {
      type: Object as PropType<Partial<StreamdownTranslations> | undefined>,
      default: undefined,
    },
    icons: {
      type: Object as PropType<Partial<IconMap> | undefined>,
      default: undefined,
    },
    prefix: {
      type: String,
      default: undefined,
    },
    lineNumbers: {
      type: Boolean,
      default: true,
    },
    onAnimationStart: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
    onAnimationEnd: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
  },
  setup(inputProps, { slots, attrs }) {
    const props = shallowReactive({ ...inputProps });
    const trackedInputs = [
      "children",
      "shikiTheme",
      "isAnimating",
      "animated",
      "mode",
      "plugins",
      "className",
      "linkSafety",
      "lineNumbers",
      "codeBlockMaxHeight",
      "tableMaxHeight",
      "normalizeHtmlIndentation",
      "literalTagContent",
      "disableAutolinkProtocols",
      "prefix",
      "dir",
      "fallbackComponent",
      "locale",
    ] as const;
    const instance = getCurrentInstance()!;
    const snapshotInputs = () => {
      const raw = instance.vnode.props ?? {};
      // Vue accepts both spellings. Read raw values to preserve upstream's
      // undefined-versus-explicit-default comparison without missing SFC props.
      return Object.fromEntries(
        Object.keys(inputProps).map((key) => [
          key,
          Object.hasOwn(raw, key)
            ? raw[key]
            : raw[
                key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
              ],
        ]),
      );
    };
    let previousInputs = snapshotInputs();
    let previousRootAttributes: Record<string, unknown> = {};
    const syncInputs = (slotText: string) => {
      const currentInputs = snapshotInputs();
      const rootAttributes = Object.fromEntries(
        Object.entries(attrs).filter(
          ([key]) => key.startsWith("data-") || key.startsWith("aria-"),
        ),
      );
      const names = Object.keys(rootAttributes);
      const changed =
        trackedInputs.some(
          (key) => previousInputs[key] !== currentInputs[key],
        ) ||
        JSON.stringify(previousInputs.codeBlockRawLanguages) !==
          JSON.stringify(currentInputs.codeBlockRawLanguages) ||
        JSON.stringify(previousInputs.translations) !==
          JSON.stringify(currentInputs.translations) ||
        names.length !== Object.keys(previousRootAttributes).length ||
        names.some(
          (key) =>
            !Object.hasOwn(previousRootAttributes, key) ||
            previousRootAttributes[key] !== rootAttributes[key],
        ) ||
        slotSource.value !== slotText;
      if (changed) {
        Object.assign(props, inputProps);
        previousInputs = { ...currentInputs };
        previousRootAttributes = rootAttributes;
      }
      slotSource.value = slotText;
    };
    const generatedId = useId();
    const prefixedCn = computed(() => createCn(props.prefix));
    const prevIsAnimating = ref<boolean | null>(null);
    const slotSource = shallowRef("");

    const mergedIcons = computed(() => mergeIcons(props.icons));
    const localeValue = computed<StreamdownLocale>(() =>
      props.locale && props.locale in localeTranslations ? props.locale : "en",
    );
    const codePlugin = computed(() => props.plugins?.code);
    const mathPlugin = computed(() => props.plugins?.math);
    const cjkPlugin = computed(() => props.plugins?.cjk);
    const rawLanguagesKey = computed(() =>
      props.codeBlockRawLanguages?.length
        ? JSON.stringify(props.codeBlockRawLanguages)
        : "",
    );
    const rawLanguages = computed<string[] | undefined>(() =>
      rawLanguagesKey.value ? JSON.parse(rawLanguagesKey.value) : undefined,
    );
    const contextValue = computed<StreamdownContextType>(() => ({
      ...defaultStreamdownContext,
      shikiTheme:
        props.shikiTheme ?? codePlugin.value?.getThemes() ?? defaultShikiTheme,
      codeBlockMaxHeight: props.codeBlockMaxHeight,
      tableMaxHeight: props.tableMaxHeight,
      codeBlockRawLanguages: rawLanguages.value,
      portal: props.portal,
      controls: props.controls,
      isAnimating: props.isAnimating,
      lineNumbers: props.lineNumbers,
      mode: props.mode,
      mermaid: props.mermaid,
      linkSafety: props.linkSafety,
    }));
    let previousTranslationKey: string | undefined;
    let previousTranslationLocale: StreamdownLocale | undefined;
    let previousTranslations: StreamdownTranslations | undefined;
    const translationsValue = computed<StreamdownTranslations>(() => {
      const key = JSON.stringify(props.translations);
      const locale = localeValue.value;
      if (
        !previousTranslations ||
        key !== previousTranslationKey ||
        locale !== previousTranslationLocale
      ) {
        previousTranslationKey = key;
        previousTranslationLocale = locale;
        previousTranslations = {
          ...localeTranslations[locale],
          ...props.translations,
        };
      }
      return previousTranslations;
    });

    provide(
      TranslationsKey,
      contextView(() => translationsValue.value),
    );
    provide(
      PluginKey,
      contextView(() => props.plugins),
    );
    provide(
      StreamdownKey,
      contextView(() => contextValue.value),
    );
    provide(
      IconKey,
      contextView(() => mergedIcons.value),
    );
    provide(PrefixKey, (...args) => prefixedCn.value(...args));

    const notifyAnimation = () => {
      if (props.mode === "static") return;
      const isAnimating = props.isAnimating;
      const previous = prevIsAnimating.value;
      prevIsAnimating.value = isAnimating;
      if (previous === null) {
        if (isAnimating) props.onAnimationStart?.();
      } else if (isAnimating && !previous) props.onAnimationStart?.();
      else if (!isAnimating && previous) props.onAnimationEnd?.();
    };
    // Like React effects, callbacks run after DOM commit and never during SSR.
    onMounted(notifyAnimation);
    watch(() => [props.isAnimating, props.mode], notifyAnimation, {
      flush: "post",
    });

    const allowedTagNames = computed(() =>
      props.allowedTags ? Object.keys(props.allowedTags) : [],
    );

    const processedChildren = computed(() => {
      const source =
        typeof props.children === "string"
          ? props.children
          : props.children === undefined
            ? slotSource.value
            : "";
      let result =
        props.mode === "streaming" && props.parseIncompleteMarkdown
          ? remend(source, props.remend)
          : source;

      if (props.literalTagContent?.length) {
        result = preprocessLiteralTagContent(result, props.literalTagContent);
      }

      if (allowedTagNames.value.length > 0) {
        result = preprocessCustomTags(result, allowedTagNames.value);
      }

      return result;
    });

    const blocks = computed(() =>
      props.parseMarkdownIntoBlocksFn(processedChildren.value),
    );

    const blocksToRender = blocks;

    const blockDirections = computed(() =>
      props.dir === "auto"
        ? blocksToRender.value.map(detectTextDirection)
        : undefined,
    );

    const blockKeys = computed(() =>
      blocksToRender.value.map((_block, idx) => `${generatedId}-${idx}`),
    );

    const animatedKey = computed(() => {
      if (props.animated === true) return "true";
      if (props.animated) return JSON.stringify(props.animated);
      return "";
    });

    let timeline: AnimateTimeline | null = null;
    let animationKey = "";
    let blockAnimations: AnimatePlugin[] = [];
    let blockPlugins: Pluggable[][] = [];
    let previousPlugins: Pluggable[] | null = null;
    const commitTimeline = () => {
      if (props.isAnimating) timeline?.commitPass();
    };
    onMounted(commitTimeline);
    onUpdated(commitTimeline);

    const mergedComponents = computed(() => {
      const merged = mergeComponents(props.components);
      if (!props.fallbackComponent) return merged;
      return new Proxy(merged, {
        getOwnPropertyDescriptor(target, key) {
          return (
            Object.getOwnPropertyDescriptor(target, key) ??
            (typeof key === "string" && /^[a-z]/.test(key)
              ? {
                  configurable: true,
                  enumerable: false,
                  value: props.fallbackComponent,
                }
              : undefined)
          );
        },
        get(target, key, receiver) {
          return typeof key === "string" &&
            /^[a-z]/.test(key) &&
            !Object.hasOwn(target, key)
            ? props.fallbackComponent
            : Reflect.get(target, key, receiver);
        },
      });
    });

    const mergedRemarkPlugins = computed<Pluggable[]>(() => {
      let result: Pluggable[] = [];
      if (cjkPlugin.value) {
        result = [...result, ...cjkPlugin.value.remarkPluginsBefore];
      }
      result = [
        ...result,
        ...(props.remarkPlugins ?? defaultRemarkPluginsArray),
      ];
      if (props.disableAutolinkProtocols?.length) {
        result = [
          ...result,
          [remarkDisableAutolinkProtocols, props.disableAutolinkProtocols],
        ];
      }
      if (cjkPlugin.value) {
        result = [...result, ...cjkPlugin.value.remarkPluginsAfter];
      }
      if (mathPlugin.value) {
        result = [...result, mathPlugin.value.remarkPlugin];
      }
      return result;
    });

    const mergedRehypePlugins = computed<Pluggable[]>(() => {
      let result = (props.rehypePlugins ??
        defaultRehypePluginsArray) as Pluggable[];

      if (
        props.allowedTags &&
        Object.keys(props.allowedTags).length > 0 &&
        (props.rehypePlugins ?? defaultRehypePluginsArray) ===
          defaultRehypePluginsArray
      ) {
        const extendedSchema = {
          ...defaultSanitizeSchema,
          tagNames: [
            ...(defaultSanitizeSchema.tagNames ?? []),
            ...Object.keys(props.allowedTags),
          ],
          attributes: {
            ...defaultSanitizeSchema.attributes,
            ...props.allowedTags,
          },
        };

        result = [
          defaultRehypePlugins.raw,
          [rehypeSanitize, extendedSchema],
          defaultRehypePlugins.harden,
        ] as Pluggable[];
      }

      if (props.literalTagContent?.length) {
        result = [
          ...result,
          [rehypeLiteralTagContent, props.literalTagContent],
        ];
      }

      if (mathPlugin.value) {
        result = [...result, mathPlugin.value.rehypePlugin];
      }

      if (props.dir === "auto" && props.mode === "static") {
        result = [...result, rehypeBlockDirection];
      }

      return result;
    });

    const shouldHideCaret = computed(() => {
      if (!props.isAnimating || blocksToRender.value.length === 0) {
        return false;
      }
      const lastBlock = blocksToRender.value.at(-1) as string;
      return hasIncompleteCodeFence(lastBlock) || hasTable(lastBlock);
    });

    const style = computed<CSSProperties | undefined>(() =>
      props.caret && props.isAnimating
        ? ({
            "--streamdown-caret": `"${carets[props.caret]}"`,
          } as CSSProperties)
        : undefined,
    );
    const { containerRef, showCaret } = useCaretHost(shouldHideCaret);

    return () => {
      syncInputs(
        inputProps.children === undefined
          ? slotChildrenToString(slots.default?.())
          : "",
      );
      const nextKey = animatedKey.value;
      if (nextKey !== animationKey) {
        animationKey = nextKey;
        timeline = nextKey
          ? createAnimateTimeline({
              maxBacklogMs:
                typeof props.animated === "object"
                  ? props.animated.maxBacklogMs
                  : undefined,
            })
          : null;
        blockAnimations = [];
        blockPlugins = [];
      }
      if (timeline && props.isAnimating) timeline.beginPass(timeline.now());
      if (previousPlugins !== mergedRehypePlugins.value) {
        previousPlugins = mergedRehypePlugins.value;
        blockPlugins = [];
      }
      const rootAttributes = Object.fromEntries(
        Object.entries(attrs).filter(
          ([key]) => key.startsWith("data-") || key.startsWith("aria-"),
        ),
      );
      const wrapperClass = prefixedCn.value(
        "space-y-4 whitespace-normal [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        props.mode === "streaming" && props.caret && showCaret.value
          ? "[&>*:last-child:not([data-sd-caret-hidden])]:after:inline [&>*:last-child:not([data-sd-caret-hidden])]:after:align-baseline [&>*:last-child:not([data-sd-caret-hidden])]:after:content-[var(--streamdown-caret)]"
          : null,
        props.className,
      );

      if (props.mode === "static") {
        const markdownProps: Options = {
          allowElement: props.allowElement,
          allowedElements: props.allowedElements,
          components: mergedComponents.value,
          disallowedElements: props.disallowedElements,
          rehypePlugins: mergedRehypePlugins.value,
          remarkPlugins: mergedRemarkPlugins.value,
          remarkRehypeOptions: props.remarkRehypeOptions,
          skipHtml: props.skipHtml,
          unwrapDisallowed: props.unwrapDisallowed,
          urlTransform: props.urlTransform,
          children: processedChildren.value,
        };

        return h(
          "div",
          {
            class: prefixedCn.value(
              "space-y-4 whitespace-normal [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
              props.className,
            ),
            ...rootAttributes,
            dir: props.dir === "auto" ? undefined : props.dir,
          },
          [h(Markdown, markdownProps)],
        );
      }

      return h(
        "div",
        {
          ...rootAttributes,
          ref: containerRef,
          class: wrapperClass,
          style: style.value,
        },
        [
          blocksToRender.value.length === 0 && props.caret && props.isAnimating
            ? h("span")
            : null,
          ...blocksToRender.value.map((block, index) => {
            let blockAnimatePlugin: AnimatePlugin | null = null;
            if (timeline && props.isAnimating) {
              if (!blockAnimations[index]) {
                const { maxBacklogMs: _, ...options } =
                  typeof props.animated === "object" ? props.animated : {};
                blockAnimations[index] = createRenderAnimatePlugin({
                  ...options,
                  timeline,
                });
              }
              blockAnimatePlugin = blockAnimations[index];
              blockPlugins[index] ??= [
                ...mergedRehypePlugins.value,
                blockAnimatePlugin.rehypePlugin,
              ];
            }
            const isLastBlock = index === blocksToRender.value.length - 1;
            const isIncomplete =
              props.isAnimating && isLastBlock && hasIncompleteCodeFence(block);

            return h(props.BlockComponent ?? Block, {
              animatePlugin: blockAnimatePlugin,
              allowElement: props.allowElement,
              allowedElements: props.allowedElements,
              components: mergedComponents.value,
              content: block,
              dir:
                blockDirections.value?.[index] ??
                (props.dir !== "auto" ? props.dir : undefined),
              disallowedElements: props.disallowedElements,
              index,
              isIncomplete,
              key: blockKeys.value[index],
              rehypePlugins: blockAnimatePlugin
                ? blockPlugins[index]
                : mergedRehypePlugins.value,
              remarkPlugins: mergedRemarkPlugins.value,
              remarkRehypeOptions: props.remarkRehypeOptions,
              shouldNormalizeHtmlIndentation: props.normalizeHtmlIndentation,
              shouldParseIncompleteMarkdown: props.parseIncompleteMarkdown,
              skipHtml: props.skipHtml,
              unwrapDisallowed: props.unwrapDisallowed,
              urlTransform: props.urlTransform,
            });
          }),
        ],
      );
    };
  },
}) as unknown as DefineComponent<StreamdownProps>;
