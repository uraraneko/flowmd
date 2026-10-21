export const fixtures = [
  "# Heading\n\nParagraph with **bold** and _italic_.\n",
  "标题\n---\n\n中文 **强调**，日本語、한국어。\n",
  "- first\n  - nested\n\n    continued\n- second\n",
  "1. first\n2. second\n\n> quoted\n>\n> - nested\n",
  "- [x] done\n- [ ] pending\n\n~~deleted~~ and https://example.com\n",
  "```ts startLine=10\nconst a = '**literal**';\n\nconst b = 2;\n```\n",
  "~~~text\n┌───┐\n│ x │\n└───┘\n~~~\n",
  "| a | b |\n| :--- | ---: |\n| 1 | 2 |\n\nAfter table\n",
  "See [example][ref].\n\n[ref]: https://example.com\n",
  "Text[^a].\n\n[^a]: Footnote **content**.\n",
  "<details>\n<summary>Title</summary>\n\n**Nested**\n\n</details>\n",
  "![alt](https://example.com/image.png)\n\n[link](https://example.com)\n",
  "<script>alert(1)</script>\n\n[unsafe](javascript:alert(1))\n",
  "Text **unfinished",
  "Use ``a ` b",
  "[unfinished](https://exa",
  "![unfinished](https://exa",
  "$$\nx = a + b\n$$\n",
  "Windows\r\n\r\n- one\r\n- two\r\n",
];

export const canonical = (html: string) => {
  const template = document.createElement("template");
  template.innerHTML = html;
  // React DOM server injects resource hints, independently of Streamdown.
  // Compare the rendered content, retaining every user-facing element/attribute.
  template.content
    .querySelectorAll('link[rel="preload"][as="image"]')
    .forEach((node) => node.remove());
  const walk = (node: Node): unknown => {
    if (node.nodeType === Node.COMMENT_NODE) return undefined;
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (!(node instanceof Element))
      return Array.from(node.childNodes)
        .map(walk)
        .filter((x) => x !== undefined);
    return [
      node.tagName,
      Object.fromEntries(
        Array.from(node.attributes)
          .map((a) => [
            a.name,
            a.name === "style" ? (node as HTMLElement).style.cssText : a.value,
          ])
          .sort(),
      ),
      Array.from(node.childNodes)
        .map(walk)
        .filter((x) => x !== undefined),
    ];
  };
  return walk(template.content);
};
