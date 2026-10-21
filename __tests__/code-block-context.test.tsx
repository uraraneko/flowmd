import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, reactive } from "vue";
import { describe, expect, it } from "vitest";
import {
  CodeBlockContext,
  CodeBlockKey,
  useCodeBlockContext,
} from "../lib/code-block/context";
import { mountComposable } from "./helpers/vue";

describe("CodeBlockContext", () => {
  it("should provide code value through context", () => {
    let capturedCode = "";

    const TestComponent = defineComponent({
      setup() {
        const { code } = useCodeBlockContext();
        capturedCode = code;
        return () => h("div", code);
      },
    });

    mount(CodeBlockContext.Provider, {
      props: { value: { code: "test code" } },
      slots: { default: () => h(TestComponent) },
    });

    expect(capturedCode).toBe("test code");
  });

  it("should work with default context value when no provider is used", () => {
    const { result } = mountComposable(() => useCodeBlockContext());
    expect(result.code).toBe("");
  });

  it("should have default empty code value", () => {
    const { result } = mountComposable(() => useCodeBlockContext(), {
      [CodeBlockKey as symbol]: { code: "" },
    });
    expect(result.code).toBe("");
  });

  it("should update when a reactive context value changes", async () => {
    let capturedCode = "";
    const value = reactive({ code: "initial" });

    const TestComponent = defineComponent({
      setup() {
        const context = useCodeBlockContext();
        return () => {
          capturedCode = context.code;
          return h("div", context.code);
        };
      },
    });

    mount(CodeBlockContext.Provider, {
      props: { value },
      slots: { default: () => h(TestComponent) },
    });

    expect(capturedCode).toBe("initial");

    value.code = "updated";
    await nextTick();

    expect(capturedCode).toBe("updated");
  });
});
