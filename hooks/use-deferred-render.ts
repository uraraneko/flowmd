import { onMounted, onUnmounted, ref } from "vue";

/**
 * Default debounce delay in milliseconds before checking if element is still in view
 */
export const DEFERRED_RENDER_DEBOUNCE_DELAY = 300;

/**
 * Default root margin for Intersection Observer
 * Starts rendering when element is 200px away from viewport
 */
export const DEFERRED_RENDER_ROOT_MARGIN = "300px";

/**
 * Default timeout for requestIdleCallback in milliseconds
 */
export const DEFERRED_RENDER_IDLE_TIMEOUT = 500;

export interface UseDeferredRenderOptions {
  /**
   * Debounce delay in milliseconds before checking if still in view
   * @default DEFERRED_RENDER_DEBOUNCE_DELAY
   */
  debounceDelay?: number;
  /**
   * Timeout for requestIdleCallback in milliseconds
   * @default DEFERRED_RENDER_IDLE_TIMEOUT
   */
  idleTimeout?: number;
  /**
   * If true, render immediately without waiting for intersection
   * @default false
   */
  immediate?: boolean;
  /**
   * Root margin for Intersection Observer (e.g., '200px' to start rendering 200px before entering viewport)
   * @default DEFERRED_RENDER_ROOT_MARGIN
   */
  rootMargin?: string;
}

/**
 * Hook for deferred rendering components when they enter the viewport.
 * Uses Intersection Observer + debounce + requestIdleCallback for optimal performance.
 *
 * @param options Configuration options
 * @returns Object containing `shouldRender` flag and `containerRef` to attach to the element
 */
export function useDeferredRender(options: UseDeferredRenderOptions = {}) {
  const {
    immediate = false,
    debounceDelay = DEFERRED_RENDER_DEBOUNCE_DELAY,
    rootMargin = DEFERRED_RENDER_ROOT_MARGIN,
    idleTimeout = DEFERRED_RENDER_IDLE_TIMEOUT,
  } = options;

  const shouldRender = ref(false);
  const containerRef = ref<HTMLElement | null>(null);
  const renderTimeoutRef = ref<number | null>(null);
  const idleCallbackRef = ref<number | null>(null);
  let observer: IntersectionObserver | null = null;

  // Polyfill for requestIdleCallback
  const requestIdleCallbackPolyfill = (
    callback: IdleRequestCallback,
  ): number => {
    const start = Date.now();
    return window.setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      });
    }, 1);
  };

  const requestIdleCallbackWrapper =
    typeof window !== "undefined" && window.requestIdleCallback
      ? (cb: IdleRequestCallback, opts?: IdleRequestOptions) =>
          window.requestIdleCallback(cb, opts)
      : requestIdleCallbackPolyfill;

  const cancelIdleCallbackWrapper =
    typeof window !== "undefined" && window.cancelIdleCallback
      ? (id: number) => window.cancelIdleCallback(id)
      : (id: number) => {
          clearTimeout(id);
        };

  const clearPendingRenders = () => {
    if (renderTimeoutRef.value) {
      clearTimeout(renderTimeoutRef.value);
      renderTimeoutRef.value = null;
    }
    if (idleCallbackRef.value) {
      cancelIdleCallbackWrapper(idleCallbackRef.value);
      idleCallbackRef.value = null;
    }
  };

  const scheduleRender = (obs: IntersectionObserver) => {
    idleCallbackRef.value = requestIdleCallbackWrapper(
      (deadline) => {
        // If we have time remaining or it's urgent, render
        if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
          shouldRender.value = true;
          obs.disconnect();
        } else {
          // Otherwise, schedule again with shorter timeout
          idleCallbackRef.value = requestIdleCallbackWrapper(
            () => {
              shouldRender.value = true;
              obs.disconnect();
            },
            { timeout: idleTimeout / 2 },
          );
        }
      },
      { timeout: idleTimeout },
    );
  };

  const handleIntersecting = (obs: IntersectionObserver) => {
    clearPendingRenders();

    // Debounce rendering: wait for debounceDelay, then check if still in view
    renderTimeoutRef.value = window.setTimeout(() => {
      // Re-check if element is still in viewport using observer records
      const records = obs.takeRecords();
      // If no records, element hasn't changed state (still intersecting)
      // If records exist, check the latest intersection state
      const isStillInView =
        records.length === 0 || (records.at(-1)?.isIntersecting ?? false);

      if (isStillInView) {
        scheduleRender(obs);
      }
    }, debounceDelay);
  };

  const handleIntersection = (
    entry: IntersectionObserverEntry,
    obs: IntersectionObserver,
  ) => {
    if (entry.isIntersecting) {
      handleIntersecting(obs);
    } else {
      clearPendingRenders();
    }
  };

  onMounted(() => {
    if (immediate) {
      shouldRender.value = true;
      return;
    }

    const container = containerRef.value;
    if (!container) {
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          handleIntersection(entry, observer!);
        }
      },
      {
        rootMargin,
        threshold: 0,
      },
    );

    observer.observe(container);
  });

  onUnmounted(() => {
    clearPendingRenders();
    if (observer) {
      observer.disconnect();
    }
  });

  return {
    shouldRender,
    containerRef,
  };
}
