import { render } from "./helpers/testing-library-vue";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

const markdown = "Hello **world**\n\nSecond paragraph";

describe("data-* and aria-* props", async () => {
  for (const mode of ["static", "streaming"] as const) {
    it(`are set on the root element in ${mode} mode`, async () => {
      const { container } = render(
        <Streamdown
          aria-busy="true"
          aria-label="Assistant reply"
          className="custom-class"
          data-message-id="42"
          mode={mode}
        >
          {markdown}
        </Streamdown>,
      );

      const root = container.firstElementChild as HTMLElement;
      expect(root.getAttribute("data-message-id")).toBe("42");
      expect(root.getAttribute("aria-label")).toBe("Assistant reply");
      expect(root.getAttribute("aria-busy")).toBe("true");
      expect(root.className).toContain("custom-class");
      expect(container.querySelectorAll("[data-message-id]")).toHaveLength(1);
    });
  }

  it("update on the root when only an attribute changes", async () => {
    const { container, rerender } = render(
      <Streamdown data-state="streaming">{markdown}</Streamdown>,
    );
    await rerender(<Streamdown data-state="done">{markdown}</Streamdown>);

    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-state")).toBe("done");
  });

  it("are removed from the root when no longer passed", async () => {
    const { container, rerender } = render(
      <Streamdown data-state="streaming">{markdown}</Streamdown>,
    );
    await rerender(<Streamdown>{markdown}</Streamdown>);

    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-state")).toBe(false);
  });
});
