import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, type PropType } from "vue";
import { useDeferredRender } from "../hooks/use-deferred-render";

const TestComponent = defineComponent({
  name: "DeferredRenderTestComponent",
  props: {
    debounceDelay: { type: Number, default: undefined },
    idleTimeout: { type: Number, default: undefined },
    immediate: { type: Boolean, default: false },
    rootMargin: { type: String, default: undefined },
  },
  setup(props) {
    const { shouldRender, containerRef } = useDeferredRender({
      immediate: props.immediate,
      debounceDelay: props.debounceDelay,
      rootMargin: props.rootMargin,
      idleTimeout: props.idleTimeout,
    });

    return () =>
      h("div", { "data-testid": "container", ref: containerRef }, [
        shouldRender.value
          ? h("span", { "data-testid": "rendered" }, "Rendered")
          : h("span", { "data-testid": "placeholder" }, "Placeholder"),
      ]);
  },
});

const mountTestComponent = (
  props: InstanceType<typeof TestComponent>["$props"],
) => mount(TestComponent, { props: props as Record<string, unknown> });

const findByTestId = (wrapper: ReturnType<typeof mount>, testId: string) =>
  wrapper.find(`[data-testid="${testId}"]`);

const flushTimers = async (time: number) => {
  vi.advanceTimersByTime(time);
  await nextTick();
};

let observerInstances: any[] = [];

describe("useDeferredRender", () => {
  let originalIntersectionObserver: typeof IntersectionObserver;

  beforeEach(() => {
    vi.useFakeTimers();
    observerInstances = [];
    originalIntersectionObserver = globalThis.IntersectionObserver;

    globalThis.IntersectionObserver = function (
      this: any,
      callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) {
      this.callback = callback;
      this.options = options;
      this.observe = vi.fn();
      this.disconnect = vi.fn();
      this.unobserve = vi.fn();
      this.takeRecords = vi.fn().mockReturnValue([]);
      this.root = null;
      this.rootMargin = options?.rootMargin ?? "";
      this.thresholds = [0];
      observerInstances.push(this);
      return this;
    } as unknown as typeof IntersectionObserver;

    if (!window.requestIdleCallback) {
      (window as any).requestIdleCallback = (
        cb: IdleRequestCallback,
        _opts?: IdleRequestOptions,
      ) =>
        window.setTimeout(() => {
          cb({ didTimeout: false, timeRemaining: () => 30 });
        }, 0);
    }
    if (!window.cancelIdleCallback) {
      (window as any).cancelIdleCallback = (id: number) => {
        clearTimeout(id);
      };
    }
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    globalThis.IntersectionObserver = originalIntersectionObserver;
  });

  it("should render immediately when immediate=true", async () => {
    const wrapper = mountTestComponent({ immediate: true });
    await nextTick();

    expect(findByTestId(wrapper, "rendered").exists()).toBe(true);
  });

  it("should not render initially when immediate=false", () => {
    const wrapper = mountTestComponent({ immediate: false });

    expect(findByTestId(wrapper, "placeholder").exists()).toBe(true);
  });

  it("should render when element intersects viewport", async () => {
    const wrapper = mountTestComponent({
      debounceDelay: 100,
      idleTimeout: 200,
      immediate: false,
    });

    expect(findByTestId(wrapper, "placeholder").exists()).toBe(true);

    const observer = observerInstances[0];
    expect(observer).toBeTruthy();

    observer.callback(
      [
        {
          isIntersecting: true,
          target: findByTestId(wrapper, "container").element,
        } as unknown as IntersectionObserverEntry,
      ],
      observer as unknown as IntersectionObserver,
    );
    await nextTick();

    await flushTimers(150);
    await flushTimers(50);

    expect(findByTestId(wrapper, "rendered").exists()).toBe(true);
  });

  it("should clear pending renders when element leaves viewport", async () => {
    const wrapper = mountTestComponent({
      debounceDelay: 100,
      immediate: false,
    });
    const observer = observerInstances[0];

    observer.callback(
      [
        {
          isIntersecting: true,
          target: findByTestId(wrapper, "container").element,
        } as unknown as IntersectionObserverEntry,
      ],
      observer as unknown as IntersectionObserver,
    );
    await nextTick();

    observer.callback(
      [
        {
          isIntersecting: false,
          target: findByTestId(wrapper, "container").element,
        } as unknown as IntersectionObserverEntry,
      ],
      observer as unknown as IntersectionObserver,
    );
    await flushTimers(500);

    expect(findByTestId(wrapper, "placeholder").exists()).toBe(true);
  });

  it("should handle re-entry into viewport with idle callback having pending", async () => {
    const wrapper = mountTestComponent({
      debounceDelay: 50,
      idleTimeout: 100,
      immediate: false,
    });
    const observer = observerInstances[0];

    observer.callback(
      [
        {
          isIntersecting: true,
          target: findByTestId(wrapper, "container").element,
        } as unknown as IntersectionObserverEntry,
      ],
      observer as unknown as IntersectionObserver,
    );
    await flushTimers(60);

    observer.callback(
      [
        {
          isIntersecting: true,
          target: findByTestId(wrapper, "container").element,
        } as unknown as IntersectionObserverEntry,
      ],
      observer as unknown as IntersectionObserver,
    );
    await flushTimers(500);

    expect(findByTestId(wrapper, "rendered").exists()).toBe(true);
  });

  it("should handle takeRecords returning non-intersecting entry", async () => {
    const wrapper = mountTestComponent({ debounceDelay: 50, immediate: false });
    const observer = observerInstances[0];

    observer.callback(
      [
        {
          isIntersecting: true,
          target: findByTestId(wrapper, "container").element,
        } as unknown as IntersectionObserverEntry,
      ],
      observer as unknown as IntersectionObserver,
    );
    observer.takeRecords.mockReturnValue([
      { isIntersecting: false } as IntersectionObserverEntry,
    ]);

    await flushTimers(200);

    expect(findByTestId(wrapper, "placeholder").exists()).toBe(true);
  });

  it("should clean up on unmount", async () => {
    const wrapper = mountTestComponent({ debounceDelay: 50, immediate: false });
    const observer = observerInstances[0];

    observer.callback(
      [
        {
          isIntersecting: true,
          target: findByTestId(wrapper, "container").element,
        } as unknown as IntersectionObserverEntry,
      ],
      observer as unknown as IntersectionObserver,
    );

    await flushTimers(60);
    wrapper.unmount();

    expect(observer.disconnect).toHaveBeenCalled();
  });

  it("should handle idle callback with didTimeout=true", async () => {
    const origRIC = window.requestIdleCallback;
    (window as any).requestIdleCallback = (
      cb: IdleRequestCallback,
      _opts?: IdleRequestOptions,
    ) =>
      window.setTimeout(() => {
        cb({ didTimeout: true, timeRemaining: () => 0 });
      }, 0);

    const wrapper = mountTestComponent({
      debounceDelay: 50,
      idleTimeout: 200,
      immediate: false,
    });
    const observer = observerInstances[0];

    observer.callback(
      [
        {
          isIntersecting: true,
          target: findByTestId(wrapper, "container").element,
        } as unknown as IntersectionObserverEntry,
      ],
      observer as unknown as IntersectionObserver,
    );

    await flushTimers(500);

    expect(findByTestId(wrapper, "rendered").exists()).toBe(true);
    (window as any).requestIdleCallback = origRIC;
  });

  it("should clean up idleCallbackRef on effect re-run", async () => {
    const wrapper = mountTestComponent({
      debounceDelay: 50,
      idleTimeout: 200,
      immediate: false,
    });
    const observer = observerInstances[0];

    observer.callback(
      [
        {
          isIntersecting: true,
          target: findByTestId(wrapper, "container").element,
        } as unknown as IntersectionObserverEntry,
      ],
      observer as unknown as IntersectionObserver,
    );
    await flushTimers(60);

    await wrapper.setProps({ debounceDelay: 100 });

    const newObserver = observerInstances.at(-1);
    if (newObserver) {
      newObserver.callback(
        [
          {
            isIntersecting: true,
            target: findByTestId(wrapper, "container").element,
          } as unknown as IntersectionObserverEntry,
        ],
        newObserver as unknown as IntersectionObserver,
      );
    }

    await flushTimers(500);

    expect(findByTestId(wrapper, "rendered").exists()).toBe(true);
  });

  it("should handle idle callback re-schedule when timeRemaining=0 and !didTimeout", async () => {
    let callCount = 0;
    (window as any).requestIdleCallback = (
      cb: IdleRequestCallback,
      _opts?: IdleRequestOptions,
    ) => {
      callCount++;
      const currentCall = callCount;
      return window.setTimeout(() => {
        if (currentCall === 1) {
          cb({ didTimeout: false, timeRemaining: () => 0 });
        } else {
          cb({ didTimeout: false, timeRemaining: () => 30 });
        }
      }, 0);
    };

    const wrapper = mountTestComponent({
      debounceDelay: 50,
      idleTimeout: 200,
      immediate: false,
    });
    const observer = observerInstances[0];

    observer.callback(
      [
        {
          isIntersecting: true,
          target: findByTestId(wrapper, "container").element,
        } as unknown as IntersectionObserverEntry,
      ],
      observer as unknown as IntersectionObserver,
    );

    await flushTimers(60);
    await flushTimers(10);
    await flushTimers(10);

    expect(findByTestId(wrapper, "rendered").exists()).toBe(true);
  });
});
