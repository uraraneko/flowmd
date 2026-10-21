import { describe, expect, it } from "vitest";
import { contextView } from "../../lib/context-view";

describe("Vue context views", () => {
  it("follows replacement and preserves destructuring, enumeration and optional values", () => {
    let value: { controls?: boolean; mode?: string } | null = {
      controls: true,
      mode: "streaming",
    };
    const context = contextView(() => value);
    expect({ ...context }).toEqual(value);
    expect("mode" in context).toBe(true);
    value = { controls: false };
    expect(context.controls).toBe(false);
    expect(Object.keys(context)).toEqual(["controls"]);
    expect(Object.hasOwn(context, "mode")).toBe(false);
    value = null;
    expect({ ...context }).toEqual({});
    expect(context.mode).toBeUndefined();
    expect("mode" in context).toBe(false);
  });
});
