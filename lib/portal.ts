import type { PortalTarget } from "./types.js";

export const resolvePortalTarget = (
  portal: PortalTarget | undefined,
): HTMLElement => {
  const container = typeof portal === "function" ? portal() : portal;
  return container ?? document.body;
};
