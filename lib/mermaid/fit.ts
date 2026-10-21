const positiveOrNull = (px: number): number | null => (px > 0 ? px : null);

const parseLengthPx = (value: string, element: HTMLElement): number | null => {
  if (value.endsWith("px")) {
    return positiveOrNull(Number.parseFloat(value));
  }

  if (value.endsWith("rem")) {
    const rootFontSize = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize || "16",
    );
    return positiveOrNull(Number.parseFloat(value) * rootFontSize);
  }

  if (value.endsWith("em")) {
    const fontSize = Number.parseFloat(
      getComputedStyle(element).fontSize || "16",
    );
    return positiveOrNull(Number.parseFloat(value) * fontSize);
  }

  if (value.endsWith("vh")) {
    return positiveOrNull(
      (Number.parseFloat(value) / 100) * window.innerHeight,
    );
  }

  if (value.endsWith("%")) {
    const parent = element.parentElement;
    if (!(parent && parent.clientHeight > 0)) {
      return null;
    }
    return positiveOrNull(
      (Number.parseFloat(value) / 100) * parent.clientHeight,
    );
  }

  return null;
};

/**
 * Resolve CSS max-height to pixels when possible.
 * Returns null when max-height does not constrain the element.
 */
const resolveMaxHeightPx = (
  element: HTMLElement,
  maxHeight: string,
): number | null => {
  const value = maxHeight.trim().toLowerCase();
  if (!value || value === "none" || value === "auto") {
    return null;
  }

  return parseLengthPx(value, element);
};

const MIN_MAX_HEIGHT_REGEX = /^min\(\s*([^,]+)\s*,\s*([^)]+)\s*\)$/i;

/**
 * Evaluate simple `min(a, b)` max-height expressions used in Tailwind utilities
 * like `max-h-[min(70vh,40rem)]`.
 */
const resolveComplexMaxHeightPx = (
  element: HTMLElement,
  maxHeight: string,
): number | null => {
  const direct = resolveMaxHeightPx(element, maxHeight);
  if (direct != null) {
    return direct;
  }

  const minMatch = maxHeight.trim().match(MIN_MAX_HEIGHT_REGEX);
  if (!minMatch) {
    return null;
  }

  const left = resolveMaxHeightPx(element, minMatch[1].trim());
  const right = resolveMaxHeightPx(element, minMatch[2].trim());
  if (left == null || right == null) {
    return null;
  }
  return Math.min(left, right);
};

export const computeFit = (
  contentSize: { height: number; width: number },
  container: HTMLElement,
  fullscreen: boolean,
): { fitZoom: number; viewportHeight: number | null } | null => {
  const containerWidth = container.clientWidth;
  if (!(containerWidth > 0)) {
    return null;
  }

  if (fullscreen) {
    const containerHeight = container.clientHeight;
    if (!(containerHeight > 0)) {
      return null;
    }

    const fitZoom = Math.min(
      containerWidth / contentSize.width,
      containerHeight / contentSize.height,
      1,
    );

    if (!(fitZoom > 0) || Number.isNaN(fitZoom)) {
      return null;
    }

    return { fitZoom, viewportHeight: null };
  }

  // Fit to container width first so the card never expands past the text column.
  const widthFit = Math.min(containerWidth / contentSize.width, 1);
  if (!(widthFit > 0) || Number.isNaN(widthFit)) {
    return null;
  }

  const heightAtWidthFit = contentSize.height * widthFit;

  // Cap tall diagrams using CSS max-height on this viewport or its parents.
  let maxHeightPx: number | null = null;
  let node: HTMLElement | null = container;
  while (node && maxHeightPx == null) {
    const styles = getComputedStyle(node);
    maxHeightPx = resolveComplexMaxHeightPx(node, styles.maxHeight);
    node = node.parentElement;
  }

  const viewportHeight =
    maxHeightPx != null
      ? Math.min(heightAtWidthFit, maxHeightPx)
      : heightAtWidthFit;

  const fitZoom = Math.min(widthFit, viewportHeight / contentSize.height, 1);

  if (!(fitZoom > 0) || Number.isNaN(fitZoom)) {
    return null;
  }

  return { fitZoom, viewportHeight };
};
