import { mount, type VueWrapper } from "@vue/test-utils";
import {
  defineComponent,
  Fragment,
  h,
  isVNode,
  nextTick,
  type VNodeChild,
} from "vue";
import { vi } from "vitest";

type RenderOptions = {
  container?: Element;
};

type RenderResult = {
  container: Element;
  baseElement: Element;
  getByText: (text: string | RegExp) => HTMLElement;
  getByTestId: (testId: string) => HTMLElement;
  getByTitle: (title: string | RegExp) => HTMLElement;
  getByRole: (
    role: string,
    options?: { name?: string | RegExp },
  ) => HTMLElement;
  queryByText: (text: string | RegExp) => HTMLElement | null;
  queryByTestId: (testId: string) => HTMLElement | null;
  queryByTitle: (title: string | RegExp) => HTMLElement | null;
  queryByRole: (
    role: string,
    options?: { name?: string | RegExp },
  ) => HTMLElement | null;
  rerender: (ui: VNodeChild) => Promise<void>;
  unmount: () => void;
  wrapper: VueWrapper;
};

const renderedWrappers: VueWrapper[] = [];

const asChildren = (ui: VNodeChild) => (Array.isArray(ui) ? ui : [ui]);

const acceptsChildrenProp = (type: unknown): boolean => {
  if (typeof type === "function") {
    return true;
  }
  if (!(type && typeof type === "object" && "props" in type)) {
    return false;
  }

  const props = (type as { props?: unknown }).props;
  if (Array.isArray(props)) {
    return props.includes("children");
  }
  return Boolean(props && typeof props === "object" && "children" in props);
};

const withChildrenProp = (ui: VNodeChild): VNodeChild => {
  if (Array.isArray(ui)) {
    return ui.map(withChildrenProp);
  }
  if (!isVNode(ui)) {
    return ui;
  }

  const props = { ...(ui.props ?? {}) } as Record<string, unknown>;
  const propChildren = props.children as VNodeChild | undefined;
  const rawChildren =
    ui.children === null && propChildren !== undefined
      ? propChildren
      : ui.children;
  const convertedChildren = Array.isArray(rawChildren)
    ? rawChildren.map(withChildrenProp)
    : withChildrenProp(rawChildren as VNodeChild);

  if (typeof ui.type === "string" || ui.type === Fragment) {
    delete props.children;
    return h(ui.type, props, convertedChildren as any);
  }

  if (props.children !== undefined || ui.children === null) {
    return h(ui.type as any, props);
  }

  if (acceptsChildrenProp(ui.type)) {
    props.children = convertedChildren;
  }

  return h(ui.type as any, props, () => convertedChildren);
};

const createRoot = () =>
  defineComponent({
    name: "TestRenderRoot",
    props: {
      node: { type: null, required: true },
    },
    setup(props) {
      return () => asChildren(withChildrenProp(props.node as VNodeChild));
    },
  });

const matchesText = (value: string, matcher: string | RegExp) =>
  typeof matcher === "string" ? value.trim() === matcher : matcher.test(value);

const queryByTextFrom = (
  root: ParentNode,
  text: string | RegExp,
): HTMLElement | null => {
  const elements = Array.from(root.querySelectorAll<HTMLElement>("*"));
  return (
    elements.find((element) => {
      if (!matchesText(element.textContent ?? "", text)) {
        return false;
      }
      return !Array.from(element.children).some((child) =>
        matchesText(child.textContent ?? "", text),
      );
    }) ?? null
  );
};

const getByTextFrom = (
  root: ParentNode,
  text: string | RegExp,
): HTMLElement => {
  const element = queryByTextFrom(root, text);
  if (!element) {
    throw new Error(`Unable to find element with text: ${text.toString()}`);
  }
  return element;
};

const queryByTestIdFrom = (
  root: ParentNode,
  testId: string,
): HTMLElement | null =>
  root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

const getByTestIdFrom = (root: ParentNode, testId: string): HTMLElement => {
  const element = queryByTestIdFrom(root, testId);
  if (!element) {
    throw new Error(`Unable to find element by data-testid: ${testId}`);
  }
  return element;
};

const queryByTitleFrom = (
  root: ParentNode,
  title: string | RegExp,
): HTMLElement | null =>
  Array.from(root.querySelectorAll<HTMLElement>("[title]")).find((element) =>
    matchesText(element.getAttribute("title") ?? "", title),
  ) ?? null;

const getByTitleFrom = (
  root: ParentNode,
  title: string | RegExp,
): HTMLElement => {
  const element = queryByTitleFrom(root, title);
  if (!element) {
    throw new Error(`Unable to find element by title: ${title.toString()}`);
  }
  return element;
};

const accessibleName = (element: HTMLElement) =>
  element.getAttribute("aria-label") ?? element.textContent ?? "";

const queryByRoleFrom = (
  root: ParentNode,
  role: string,
  options: { name?: string | RegExp } = {},
): HTMLElement | null =>
  Array.from(
    root.querySelectorAll<HTMLElement>(`[role="${role}"],${role}`),
  ).find(
    (element) =>
      options.name === undefined ||
      matchesText(accessibleName(element), options.name),
  ) ?? null;

const getByRoleFrom = (
  root: ParentNode,
  role: string,
  options: { name?: string | RegExp } = {},
): HTMLElement => {
  const element = queryByRoleFrom(root, role, options);
  if (!element) {
    throw new Error(`Unable to find element by role: ${role}`);
  }
  return element;
};

export const render = (
  ui: VNodeChild,
  options: RenderOptions = {},
): RenderResult => {
  const host = options.container ?? document.createElement("div");
  if (!options.container) {
    document.body.appendChild(host);
  }

  const Root = createRoot();
  const wrapper = mount(Root, {
    attachTo: host,
    props: { node: ui },
  });
  renderedWrappers.push(wrapper);

  const container =
    Array.from(host.children).find((element) =>
      element.hasAttribute("data-v-app"),
    ) ?? host;

  return {
    container,
    baseElement: document.body,
    getByText: (text) => getByTextFrom(container, text),
    getByTestId: (testId) => getByTestIdFrom(container, testId),
    getByTitle: (title) => getByTitleFrom(container, title),
    getByRole: (role, options) => getByRoleFrom(container, role, options),
    queryByText: (text) => queryByTextFrom(container, text),
    queryByTestId: (testId) => queryByTestIdFrom(container, testId),
    queryByTitle: (title) => queryByTitleFrom(container, title),
    queryByRole: (role, options) => queryByRoleFrom(container, role, options),
    rerender: async (nextUi) => {
      await wrapper.setProps({ node: nextUi });
      await nextTick();
    },
    unmount: () => {
      wrapper.unmount();
      if (!options.container && host.parentNode) {
        host.parentNode.removeChild(host);
      }
    },
    wrapper,
  };
};

const dispatch = async (element: EventTarget, event: Event) => {
  element.dispatchEvent(event);
  await nextTick();
  return true;
};

export const fireEvent = {
  click: (element: EventTarget, init?: MouseEventInit) =>
    dispatch(
      element,
      new MouseEvent("click", { bubbles: true, cancelable: true, ...init }),
    ),
  mouseDown: (element: EventTarget, init?: MouseEventInit) =>
    dispatch(
      element,
      new MouseEvent("mousedown", { bubbles: true, cancelable: true, ...init }),
    ),
  mouseMove: (element: EventTarget, init?: MouseEventInit) =>
    dispatch(
      element,
      new MouseEvent("mousemove", { bubbles: true, cancelable: true, ...init }),
    ),
  mouseUp: (element: EventTarget, init?: MouseEventInit) =>
    dispatch(
      element,
      new MouseEvent("mouseup", { bubbles: true, cancelable: true, ...init }),
    ),
  pointerDown: (element: EventTarget, init?: PointerEventInit) =>
    dispatch(
      element,
      new PointerEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        ...init,
      }),
    ),
  pointerMove: (element: EventTarget, init?: PointerEventInit) =>
    dispatch(
      element,
      new PointerEvent("pointermove", {
        bubbles: true,
        cancelable: true,
        ...init,
      }),
    ),
  pointerUp: (element: EventTarget, init?: PointerEventInit) =>
    dispatch(
      element,
      new PointerEvent("pointerup", {
        bubbles: true,
        cancelable: true,
        ...init,
      }),
    ),
  keyDown: (element: EventTarget, init?: KeyboardEventInit) =>
    dispatch(
      element,
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        ...init,
      }),
    ),
  wheel: (element: EventTarget, init?: WheelEventInit) =>
    dispatch(
      element,
      new WheelEvent("wheel", { bubbles: true, cancelable: true, ...init }),
    ),
  load: (element: EventTarget, init?: EventInit) =>
    dispatch(
      element,
      new Event("load", { bubbles: false, cancelable: false, ...init }),
    ),
  error: (element: EventTarget, init?: EventInit) =>
    dispatch(
      element,
      new Event("error", { bubbles: false, cancelable: false, ...init }),
    ),
};

export const waitFor = vi.waitFor;

export const act = async (callback: () => unknown | Promise<unknown>) => {
  const result = callback();
  if (result && typeof (result as Promise<unknown>).then === "function") {
    await result;
  }
  await nextTick();
};

export const screen = {
  getByText: (text: string | RegExp) => getByTextFrom(document.body, text),
  getByTestId: (testId: string) => getByTestIdFrom(document.body, testId),
  getByTitle: (title: string | RegExp) => getByTitleFrom(document.body, title),
  getByRole: (role: string, options?: { name?: string | RegExp }) =>
    getByRoleFrom(document.body, role, options),
  queryByText: (text: string | RegExp) => queryByTextFrom(document.body, text),
  queryByTestId: (testId: string) => queryByTestIdFrom(document.body, testId),
  queryByTitle: (title: string | RegExp) =>
    queryByTitleFrom(document.body, title),
  queryByRole: (role: string, options?: { name?: string | RegExp }) =>
    queryByRoleFrom(document.body, role, options),
};

export const cleanup = () => {
  for (const wrapper of renderedWrappers.splice(0)) {
    wrapper.unmount();
  }
  document.body.innerHTML = "";
};
