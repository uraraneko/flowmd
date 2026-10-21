import { act, render, waitFor } from "./helpers/testing-library-vue";
import { describe, expect, it, vi } from "vitest";
import { PanZoom } from "../lib/mermaid/pan-zoom";
describe("PanZoom auto-fit", () => {
  it("should auto-fit large content to container width and size the viewport", async () => {
    const widthSpy = vi
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockReturnValue(500);

    try {
      const { container } = render(
        <PanZoom contentSize={{ height: 1000, width: 1000 }} isAutoFit={true}>
          <div>Content</div>
        </PanZoom>,
      );

      await waitFor(() => {
        const root = container.firstElementChild as HTMLElement;
        // widthFit = 500/1000 = 0.5 → viewport height = 1000 * 0.5 = 500
        expect(root.style.height).toBe("500px");

        const content = container.querySelector('[role="application"]');
        const transform = content?.getAttribute("style") ?? "";
        expect(transform).toContain("scale(0.5)");
      });
    } finally {
      widthSpy.mockRestore();
    }
  });

  it("should respect CSS max-height when sizing tall diagrams", async () => {
    const widthSpy = vi
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockReturnValue(500);

    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = ((element: Element) => {
      const styles = originalGetComputedStyle(element);
      if ((element as HTMLElement).className.includes("max-h-cap")) {
        return new Proxy(styles, {
          get(target, prop, receiver) {
            if (prop === "maxHeight") {
              return "200px";
            }
            return Reflect.get(target, prop, receiver);
          },
        });
      }
      return styles;
    }) as typeof window.getComputedStyle;

    try {
      const { container } = render(
        <PanZoom
          class="max-h-cap"
          contentSize={{ height: 1000, width: 1000 }}
          isAutoFit={true}
        >
          <div>Content</div>
        </PanZoom>,
      );

      await waitFor(() => {
        const root = container.firstElementChild as HTMLElement;
        // width-fit height would be 500, but max-height caps at 200
        expect(root.style.height).toBe("200px");

        const content = container.querySelector('[role="application"]');
        // fitZoom = min(0.5, 200/1000) = 0.2
        expect(content?.getAttribute("style") ?? "").toContain("scale(0.2)");
      });
    } finally {
      widthSpy.mockRestore();
      window.getComputedStyle = originalGetComputedStyle;
    }
  });

  it("should auto-fit to both dimensions in fullscreen", async () => {
    const widthSpy = vi
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockReturnValue(500);
    const heightSpy = vi
      .spyOn(HTMLElement.prototype, "clientHeight", "get")
      .mockReturnValue(250);

    try {
      const { container } = render(
        <PanZoom
          contentSize={{ height: 1000, width: 1000 }}
          fullscreen={true}
          isAutoFit={true}
        >
          <div>Content</div>
        </PanZoom>,
      );

      await waitFor(() => {
        const content = container.querySelector('[role="application"]');
        const transform = content?.getAttribute("style") ?? "";
        expect(transform).toContain("scale(0.25)");
      });
    } finally {
      widthSpy.mockRestore();
      heightSpy.mockRestore();
    }
  });

  it("should re-fit when the container is resized", async () => {
    let width = 500;
    const widthSpy = vi
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockImplementation(() => width);

    const observers: Array<{
      callback: ResizeObserverCallback;
    }> = [];

    const OriginalResizeObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      private callback: ResizeObserverCallback;

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
        observers.push({ callback });
      }

      observe() {
        /* noop */
      }

      unobserve() {
        /* noop */
      }

      disconnect() {
        /* noop */
      }
    } as typeof ResizeObserver;

    try {
      const { container } = render(
        <PanZoom contentSize={{ height: 1000, width: 1000 }} isAutoFit={true}>
          <div>Content</div>
        </PanZoom>,
      );

      await waitFor(() => {
        const content = container.querySelector('[role="application"]');
        expect(content?.getAttribute("style") ?? "").toContain("scale(0.5)");
      });

      width = 250;
      await act(() => {
        for (const observer of observers) {
          observer.callback([], observer as unknown as ResizeObserver);
        }
      });

      await waitFor(() => {
        const content = container.querySelector('[role="application"]');
        expect(content?.getAttribute("style") ?? "").toContain("scale(0.25)");
        const root = container.firstElementChild as HTMLElement;
        expect(root.style.height).toBe("250px");
      });
    } finally {
      widthSpy.mockRestore();
      globalThis.ResizeObserver = OriginalResizeObserver;
    }
  });
});
