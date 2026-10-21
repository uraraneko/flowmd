import { fireEvent, render, waitFor } from "./helpers/testing-library-vue";
import { describe, expect, it, vi } from "vitest";
import { Streamdown } from "../index";

const markdownWithTable = `
| Name | Age |
|------|-----|
| Alice | 30 |
| Bob | 25 |
`;

describe("TableFullscreenButton", () => {
  it("should render fullscreen button when controls are enabled", () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector('button[title="View fullscreen"]');
    expect(btn).toBeTruthy();
  });

  it("should not render fullscreen button when controls are false", () => {
    const { container } = render(
      <Streamdown controls={false}>{markdownWithTable}</Streamdown>,
    );

    const btn = container.querySelector('button[title="View fullscreen"]');
    expect(btn).toBeFalsy();
  });

  it("should not render fullscreen button when table fullscreen is false", () => {
    const { container } = render(
      <Streamdown controls={{ table: { fullscreen: false } }}>
        {markdownWithTable}
      </Streamdown>,
    );

    const btn = container.querySelector('button[title="View fullscreen"]');
    expect(btn).toBeFalsy();
  });

  it("should open fullscreen overlay on click", async () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]',
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();

    await fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]',
    );
    expect(overlay).toBeTruthy();
  });

  it("should close fullscreen overlay on close button click", async () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]',
    ) as HTMLButtonElement;
    await fireEvent.click(btn);

    const closeBtn = document.querySelector(
      'button[title="Exit fullscreen"]',
    ) as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();

    await fireEvent.click(closeBtn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]',
    );
    expect(overlay).toBeFalsy();
  });

  it("should close fullscreen overlay on Escape key", async () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]',
    ) as HTMLButtonElement;
    await fireEvent.click(btn);

    expect(
      document.querySelector('[data-streamdown="table-fullscreen"]'),
    ).toBeTruthy();

    await fireEvent.keyDown(document, { key: "Escape" });

    expect(
      document.querySelector('[data-streamdown="table-fullscreen"]'),
    ).toBeFalsy();
  });

  it("should lock body scroll when fullscreen is open", async () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]',
    ) as HTMLButtonElement;
    await fireEvent.click(btn);

    expect(document.body.style.overflow).toBe("hidden");

    const closeBtn = document.querySelector(
      'button[title="Exit fullscreen"]',
    ) as HTMLButtonElement;
    await fireEvent.click(closeBtn);

    expect(document.body.style.overflow).toBe("");
  });

  it("should disable fullscreen button when isAnimating", () => {
    const { container } = render(
      <Streamdown isAnimating={true}>{markdownWithTable}</Streamdown>,
    );

    const btn = container.querySelector(
      'button[title="View fullscreen"]',
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(true);
  });

  it("should render table content inside fullscreen overlay", async () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]',
    ) as HTMLButtonElement;
    await fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]',
    );
    const table = overlay?.querySelector('[data-streamdown="table"]');
    expect(table).toBeTruthy();
  });

  it("should show copy and download controls in fullscreen", async () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]',
    ) as HTMLButtonElement;
    await fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]',
    );
    const copyBtn = overlay?.querySelector('button[title="Copy table"]');
    const downloadBtn = overlay?.querySelector(
      'button[title="Download table"]',
    );
    expect(copyBtn).toBeTruthy();
    expect(downloadBtn).toBeTruthy();
  });

  it("should copy table from fullscreen overlay", async () => {
    global.ClipboardItem = class {
      constructor(public data: Record<string, Blob>) {}
    } as any;
    Object.assign(navigator, {
      clipboard: {
        write: vi.fn().mockResolvedValue(undefined),
      },
    });

    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]',
    ) as HTMLButtonElement;
    await fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]',
    );
    const copyBtn = overlay?.querySelector(
      'button[title="Copy table"]',
    ) as HTMLButtonElement;
    expect(copyBtn).toBeTruthy();
    await fireEvent.click(copyBtn);

    const markdownButton = document.querySelector(
      'button[title="Copy table as Markdown"]',
    ) as HTMLButtonElement;
    expect(markdownButton).toBeTruthy();
    await fireEvent.click(markdownButton);

    await waitFor(() => {
      expect(navigator.clipboard.write).toHaveBeenCalledWith([
        expect.objectContaining({
          data: expect.objectContaining({
            "text/plain": expect.any(Blob),
            "text/html": expect.any(Blob),
          }),
        }),
      ]);
    });
  });

  it("should not close fullscreen when clicking controls inside overlay", async () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]',
    ) as HTMLButtonElement;
    await fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]',
    );
    expect(overlay).toBeTruthy();

    const copyBtn = overlay?.querySelector(
      'button[title="Copy table"]',
    ) as HTMLButtonElement;
    expect(copyBtn).toBeTruthy();
    await fireEvent.click(copyBtn);

    expect(
      document.querySelector('[data-streamdown="table-fullscreen"]'),
    ).toBeTruthy();
  });

  it("should not close fullscreen when clicking table content", async () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]',
    ) as HTMLButtonElement;
    await fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]',
    );
    const table = overlay?.querySelector(
      '[data-streamdown="table"]',
    ) as HTMLTableElement;
    expect(table).toBeTruthy();
    await fireEvent.click(table);

    expect(
      document.querySelector('[data-streamdown="table-fullscreen"]'),
    ).toBeTruthy();
  });

  it("should close fullscreen overlay on backdrop click", async () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]',
    ) as HTMLButtonElement;
    await fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]',
    );
    expect(overlay).toBeTruthy();

    if (overlay) {
      await fireEvent.click(overlay);
    }

    expect(
      document.querySelector('[data-streamdown="table-fullscreen"]'),
    ).toBeFalsy();
  });

  it("should have aria attributes on fullscreen overlay", async () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]',
    ) as HTMLButtonElement;
    await fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]',
    );
    expect(overlay?.getAttribute("role")).toBe("dialog");
    expect(overlay?.getAttribute("aria-modal")).toBe("true");
    expect(overlay?.getAttribute("aria-label")).toBeTruthy();
  });

  it("should close fullscreen on Escape keyDown on the dialog element itself", async () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]',
    ) as HTMLButtonElement;
    await fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]',
    );
    expect(overlay).toBeTruthy();

    // Fire keyDown directly on the dialog element (covers onKeyDown handler lines 80-83)
    if (overlay) {
      await fireEvent.keyDown(overlay, { key: "Escape" });
    }

    expect(
      document.querySelector('[data-streamdown="table-fullscreen"]'),
    ).toBeFalsy();
  });

  it("should not close fullscreen on keyDown inside inner presentation div", async () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]',
    ) as HTMLButtonElement;
    await fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]',
    );
    expect(overlay).toBeTruthy();

    // Fire keyDown on the inner presentation div (covers line 91 stopPropagation)
    const innerDiv = overlay?.querySelector('[role="presentation"]');
    expect(innerDiv).toBeTruthy();
    if (innerDiv) {
      await fireEvent.keyDown(innerDiv, { key: "Escape" });
    }

    // Should still be open because stopPropagation prevents it from reaching the dialog
    expect(
      document.querySelector('[data-streamdown="table-fullscreen"]'),
    ).toBeTruthy();
  });

  it("should hide copy in fullscreen when table copy is false", async () => {
    const { container } = render(
      <Streamdown controls={{ table: { copy: false } }}>
        {markdownWithTable}
      </Streamdown>,
    );

    const btn = container.querySelector(
      'button[title="View fullscreen"]',
    ) as HTMLButtonElement;
    await fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]',
    );
    const copyBtn = overlay?.querySelector('button[title="Copy table"]');
    expect(copyBtn).toBeFalsy();
  });
});
