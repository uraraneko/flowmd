import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { parseMarkdownIntoBlocks, Streamdown } from "../index";

describe("Footnotes", () => {
  it("should render footnote references and definitions correctly", () => {
    const markdown = `Here is a simple footnote[^1].

A footnote can also have multiple lines[^2].

[^1]: This is the first footnote.
[^2]: This is a multi-line footnote.
    It can have multiple paragraphs.`;

    const wrapper = mount(Streamdown, {
      slots: { default: () => markdown },
    });

    const footnoteRefs = wrapper.element.querySelectorAll(
      'sup[data-streamdown="superscript"]',
    );
    expect(footnoteRefs.length).toBeGreaterThanOrEqual(2);

    const footnoteDef = wrapper.element.querySelector(
      "section[data-footnotes]",
    );
    expect(footnoteDef).toBeTruthy();

    const footnoteListItems = footnoteDef?.querySelectorAll("li");
    expect(footnoteListItems && footnoteListItems.length >= 2).toBe(true);

    expect(wrapper.html()).toContain("This is the first footnote");
    expect(wrapper.html()).toContain("This is a multi-line footnote");
  });

  it("should handle multiple footnote references", () => {
    const markdown = `First reference[^1], second reference[^2], and third[^3].

[^1]: First note.
[^2]: Second note.
[^3]: Third note.`;

    const wrapper = mount(Streamdown, {
      slots: { default: () => markdown },
    });

    const footnoteRefs = wrapper.element.querySelectorAll(
      'sup[data-streamdown="superscript"]',
    );
    expect(footnoteRefs.length).toBeGreaterThanOrEqual(3);

    const footnoteDef = wrapper.element.querySelector(
      "section[data-footnotes]",
    );
    expect(footnoteDef).toBeTruthy();

    const footnoteListItems = footnoteDef?.querySelectorAll("li");
    expect(footnoteListItems && footnoteListItems.length >= 3).toBe(true);
  });

  it("should handle footnotes with alphanumeric labels", () => {
    const markdown = `Reference with label[^note1].

[^note1]: This is a labeled footnote.`;

    const wrapper = mount(Streamdown, {
      slots: { default: () => markdown },
    });

    const footnoteRef = wrapper.element.querySelector(
      'sup[data-streamdown="superscript"]',
    );
    expect(footnoteRef).toBeTruthy();

    const footnoteDef = wrapper.element.querySelector(
      "section[data-footnotes]",
    );
    expect(footnoteDef).toBeTruthy();

    const footnoteListItems = footnoteDef?.querySelectorAll("li");
    expect(footnoteListItems && footnoteListItems.length >= 1).toBe(true);
    expect(wrapper.html()).toContain("This is a labeled footnote");
  });

  it("should render complex markdown with tables and footnotes", () => {
    const markdown = `# GitHub Flavored Markdown Features

GFM extends standard Markdown with powerful features[^1]. Here's a comprehensive demo:

## Tables

| Feature | Standard MD | GFM |
|---------|------------|-----|
| Tables | ❌ | ✅ |
| Task Lists | ❌ | ✅ |
| Strikethrough | ❌ | ✅ |

## Task Lists

- [x] Implement authentication
- [x] Add database models
- [ ] Write unit tests
- [ ] Deploy to production

## Strikethrough

~~Old approach~~ → New approach with AI models[^2]

[^1]: GitHub Flavored Markdown is a strict superset of CommonMark, maintained by GitHub.
[^2]: Modern AI models provide more intelligent and context-aware solutions.
`;

    const wrapper = mount(Streamdown, {
      slots: { default: () => markdown },
    });

    const footnotesSection = wrapper.element.querySelector(
      "section[data-footnotes]",
    );
    expect(footnotesSection).toBeTruthy();

    const footnoteItems = wrapper.element.querySelectorAll(
      'section[data-footnotes] li[data-streamdown="list-item"]',
    );

    expect(footnoteItems.length).toBe(2);

    const html = wrapper.html();
    expect(html).toContain("GitHub Flavored Markdown is a strict superset");
    expect(html).toContain("Modern AI models provide more intelligent");
  });

  it("should filter out empty footnotes during streaming", () => {
    const markdown = `Text with footnote[^1].

[^1]:`;

    const wrapper = mount(Streamdown, {
      props: { isAnimating: true },
      slots: { default: () => markdown },
    });

    const footnotesSection = wrapper.element.querySelector(
      "section[data-footnotes]",
    );

    if (footnotesSection) {
      const footnoteItems = footnotesSection.querySelectorAll(
        'li[data-streamdown="list-item"]',
      );
      expect(footnoteItems.length).toBe(0);
    }
  });

  it("should show footnotes once content arrives", () => {
    const markdown = `Text with footnote[^1].

[^1]: This is the content`;

    const wrapper = mount(Streamdown, {
      props: { isAnimating: true },
      slots: { default: () => markdown },
    });

    const footnotesSection = wrapper.element.querySelector(
      "section[data-footnotes]",
    );
    expect(footnotesSection).toBeTruthy();

    const footnoteItems = footnotesSection?.querySelectorAll(
      'li[data-streamdown="list-item"]',
    );
    expect(footnoteItems?.length).toBe(1);
    expect(wrapper.html()).toContain("This is the content");
  });
});

describe("Footnote detection (parseMarkdownIntoBlocks)", () => {
  it("should not treat regex negated character classes as footnotes", () => {
    const markdown = `# Regex Examples

Here are some useful regex patterns.

\`\`\`perl
# Match URLs
https?://[^\\s<>"{}|\\^\`\\[\\]]+

# Match IP addresses
\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}
\`\`\`

More text after the code block.
`;

    const blocks = parseMarkdownIntoBlocks(markdown);

    expect(blocks.length).toBeGreaterThan(1);
  });

  it("should not match [^>] or similar short patterns as footnotes", () => {
    const markdown = `# Parser Code

Some explanation.

\`\`\`js
const regex = /[^>]+/;
const other = /[^)]/;
const brackets = /[^{]/;
\`\`\`

End of document.
`;

    const blocks = parseMarkdownIntoBlocks(markdown);
    expect(blocks.length).toBeGreaterThan(1);
  });

  it("should still detect real footnotes with numeric identifiers", () => {
    const markdown = `Here is a footnote[^1].

[^1]: This is the footnote content.
`;

    const blocks = parseMarkdownIntoBlocks(markdown);
    expect(blocks.length).toBe(1);
  });

  it("should still detect real footnotes with alphanumeric identifiers", () => {
    const markdown = `Here is a footnote[^note1].

[^note1]: This is the footnote content.
`;

    const blocks = parseMarkdownIntoBlocks(markdown);
    expect(blocks.length).toBe(1);
  });

  it("should still detect real footnotes with hyphenated identifiers", () => {
    const markdown = `Here is a footnote[^my-note].

[^my-note]: This is the footnote content.
`;

    const blocks = parseMarkdownIntoBlocks(markdown);
    expect(blocks.length).toBe(1);
  });

  it("should still detect real footnotes with underscored identifiers", () => {
    const markdown = `Here is a footnote[^my_note].

[^my_note]: This is the footnote content.
`;

    const blocks = parseMarkdownIntoBlocks(markdown);
    expect(blocks.length).toBe(1);
  });

  it("should handle markdown with tables containing inline code with special chars", () => {
    const markdown = `# Reference

| Pattern | Description |
|---------|-------------|
| \`[^\\s]\` | Non-whitespace |
| \`[^>]\` | Not greater than |

Some text after.
`;

    const blocks = parseMarkdownIntoBlocks(markdown);
    expect(blocks.length).toBeGreaterThan(1);
  });
});
