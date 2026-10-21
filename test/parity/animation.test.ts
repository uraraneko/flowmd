import { describe, expect, it, vi } from "vitest";
import { harness } from "./harness";

describe("animation updates", () => {
  it("matches stagger, appended blocks, replacement and settle without remounting", async () => {
    const clock = vi.spyOn(performance, "now").mockReturnValue(100);
    const run = await harness({
      animated: { animation: "fadeIn", duration: 150, stagger: 25 },
      isAnimating: true,
    });
    try {
      await run.update("Hello world\n\n");
      run.compare();
      const paragraph = run.vueHost.querySelector("p");
      clock.mockReturnValue(125);
      await run.update("Hello world\n\nNext section arrives");
      run.compare();
      expect(run.vueHost.querySelector("p")).toBe(paragraph);
      await run.update("Hello world\n\nNext section arrives", {
        isAnimating: false,
      });
      run.compare();
      expect(run.vueHost.querySelector("p")).toBe(paragraph);
      expect(run.vueHost.querySelectorAll("[data-sd-animate]")).toHaveLength(0);
      clock.mockReturnValue(200);
      await run.update("A replacement", { isAnimating: true });
      run.compare();
    } finally {
      await run.dispose();
      clock.mockRestore();
    }
  });
});
