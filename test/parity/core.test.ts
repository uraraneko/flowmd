import { describe, expect, it } from "vitest";
import { h, createSSRApp } from "vue";
import { renderToString } from "@vue/server-renderer";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Root } from "hast";
import { parseMarkdownIntoBlocks } from "../../lib/parse-blocks";
import { parseMarkdownIntoBlocks as upstreamBlocks } from "../../vendor/upstream/packages/streamdown/lib/parse-blocks";
import { Markdown } from "../../lib/markdown";
import { Markdown as ReactMarkdown } from "../../vendor/upstream/packages/streamdown/lib/markdown";
import {
  Streamdown,
  defaultRemarkPlugins,
  defaultRehypePlugins,
} from "../../index";
import {
  Streamdown as ReactStreamdown,
  defaultRemarkPlugins as upstreamRemark,
  defaultRehypePlugins as upstreamRehype,
} from "../../vendor/upstream/packages/streamdown/index.tsx";
import remend from "remend";
import upstreamRemend from "../../vendor/upstream/packages/remend/src";

import { fixtures, canonical } from "./fixtures";

describe("pinned upstream core parity", () => {
  it("matches remend and block boundaries at every character prefix", () => {
    for (const fixture of fixtures) {
      for (let end = 0; end <= fixture.length; end++) {
        const prefix = fixture.slice(0, end);
        expect(remend(prefix), `remend: ${JSON.stringify(prefix)}`).toBe(
          upstreamRemend(prefix),
        );
        expect(
          parseMarkdownIntoBlocks(remend(prefix)),
          `blocks: ${JSON.stringify(prefix)}`,
        ).toEqual(upstreamBlocks(upstreamRemend(prefix)));
      }
    }
  });

  it("matches Markdown and HTML ASTs at every chunk", async () => {
    const captured: unknown[] = [];
    const captureMdast = () => (tree: unknown) => {
      captured.push(JSON.parse(JSON.stringify(tree)));
    };
    const captureHast = () => (tree: unknown) => {
      captured.push(JSON.parse(JSON.stringify(tree)));
    };
    const vueOptions = {
      remarkPlugins: [...Object.values(defaultRemarkPlugins), captureMdast],
      rehypePlugins: [...Object.values(defaultRehypePlugins), captureHast],
    };
    const reactOptions = {
      remarkPlugins: [...Object.values(upstreamRemark), captureMdast],
      rehypePlugins: [...Object.values(upstreamRehype), captureHast],
    };
    for (const fixture of fixtures) {
      for (let end = 0; end <= fixture.length; end += 3) {
        const source = remend(fixture.slice(0, end));
        const blocks = parseMarkdownIntoBlocks(source);
        for (const block of blocks) {
          captured.length = 0;
          ReactMarkdown({ ...reactOptions, children: block });
          const expected = captured.splice(0);
          expect(expected).toHaveLength(2);
          Markdown({ ...vueOptions, children: block });
          expect(captured, JSON.stringify(block)).toEqual(expected);
        }
      }
    }
  });

  it("matches framework-neutral HTML output", async () => {
    for (const fixture of fixtures) {
      const options = {
        children: fixture,
        remarkPlugins: Object.values(defaultRemarkPlugins),
        rehypePlugins: Object.values(defaultRehypePlugins),
      };
      const expected = renderToStaticMarkup(ReactMarkdown(options));
      const actual = await renderToString(
        createSSRApp({ render: () => Markdown(options) }),
      );
      expect(canonical(actual), fixture).toEqual(canonical(expected));
    }
  });

  it("matches built-in static markup for ordinary prose", async () => {
    for (const fixture of fixtures.slice(0, 5)) {
      const expected = renderToStaticMarkup(
        createElement(ReactStreamdown, {
          children: fixture,
          mode: "static",
          controls: false,
        }),
      );
      const actual = await renderToString(
        createSSRApp({
          render: () =>
            h(Streamdown, {
              children: fixture,
              mode: "static",
              controls: false,
            }),
        }),
      );
      expect(canonical(actual), fixture).toEqual(canonical(expected));
    }
  });
});
