const rootSelector = "[data-disclosure-root]";
const triggerSelector = "[data-disclosure-trigger]";
const anchorTriggerSelector = "[data-anchor-trigger]";
const openAttribute = "data-disclosure-open";
const suppressedAttribute = "data-disclosure-suppressed";
const disclosureChangeEventName = "anchored-disclosure-change";

type PointerKind = "mouse" | "none" | "pen" | "touch";

/** Browser runtime dependencies for anchored disclosure behavior. */
export interface AnchoredDisclosureRuntime {
  readonly classes: {
    readonly Element: typeof Element;
    readonly Node: typeof Node;
  };
  readonly document: Document;
  readonly window: Window;
}

/**
 * Installs shared open/close behavior for anchored disclosure surfaces.
 *
 * @param runtime Browser runtime dependencies.
 */
export function installAnchoredDisclosure(runtime = browserRuntime()): void {
  if (runtime === null) {
    return;
  }

  let pendingPointerKind: PointerKind = "none";

  runtime.document.addEventListener(
    "pointerdown",
    (event) => {
      pendingPointerKind = pointerKind(event);
      closeRootsOutsideTarget(runtime, event.target);
    },
    { capture: true },
  );
  runtime.document.addEventListener("click", (event) => {
    handleDisclosureClick(runtime, event, pendingPointerKind);
    pendingPointerKind = "none";
  });
  runtime.document.addEventListener("focusin", (event) => {
    if (pendingPointerKind === "none") {
      handleDisclosureFocusIn(runtime, event.target);
    }
  });
  runtime.document.addEventListener("focusout", (event) => {
    handleDisclosureFocusOut(runtime, event.target);
  });
  runtime.document.addEventListener("keydown", (event) => {
    handleDisclosureKeyDown(runtime, event);
  });
}

function handleDisclosureClick(
  runtime: AnchoredDisclosureRuntime,
  event: MouseEvent,
  pointerKind: PointerKind,
): void {
  const target = event.target;

  if (!(target instanceof runtime.classes.Element)) {
    return;
  }

  const trigger = target.closest<HTMLElement>(triggerSelector);
  const root = trigger?.closest<HTMLElement>(rootSelector) ?? null;

  if (trigger === null || root === null) {
    return;
  }

  if (!shouldToggleFromClick(runtime, trigger, pointerKind)) {
    return;
  }

  event.preventDefault();
  toggleRoot(runtime, root);
}

function handleDisclosureFocusIn(
  runtime: AnchoredDisclosureRuntime,
  target: EventTarget | null,
): void {
  if (!(target instanceof runtime.classes.Element)) {
    return;
  }

  const root = target.closest<HTMLElement>(rootSelector);

  if (root === null) {
    clearSuppressedRoots(runtime);
    return;
  }

  if (root.hasAttribute(suppressedAttribute)) {
    return;
  }

  openRoot(runtime, root);
}

function handleDisclosureFocusOut(
  runtime: AnchoredDisclosureRuntime,
  target: EventTarget | null,
): void {
  if (!(target instanceof runtime.classes.Element)) {
    return;
  }

  const root = target.closest<HTMLElement>(rootSelector);

  if (root === null) {
    return;
  }

  runtime.window.requestAnimationFrame(() => {
    const activeElement = runtime.document.activeElement;
    const focusedInside =
      activeElement instanceof runtime.classes.Node &&
      root.contains(activeElement);

    if (!focusedInside) {
      closeRoot(root);
    }
  });
}

function handleDisclosureKeyDown(
  runtime: AnchoredDisclosureRuntime,
  event: KeyboardEvent,
): void {
  if (event.key !== "Escape") {
    return;
  }

  const openRootElement = runtime.document.querySelector<HTMLElement>(
    `${rootSelector}[${openAttribute}="true"]`,
  );

  if (openRootElement === null) {
    return;
  }

  event.preventDefault();
  closeRoot(openRootElement);
  openRootElement.setAttribute(suppressedAttribute, "true");
  focusFirstTrigger(openRootElement);
}

function closeRootsOutsideTarget(
  runtime: AnchoredDisclosureRuntime,
  target: EventTarget | null,
): void {
  const targetElement =
    target instanceof runtime.classes.Element ? target : null;

  openRoots(runtime).forEach((root) => {
    if (targetElement !== null && root.contains(targetElement)) {
      return;
    }

    root.removeAttribute(suppressedAttribute);
    closeRoot(root);
  });
}

function toggleRoot(
  runtime: AnchoredDisclosureRuntime,
  root: HTMLElement,
): void {
  if (isRootOpen(root)) {
    closeRoot(root);
    return;
  }

  openRoot(runtime, root);
}

function openRoot(runtime: AnchoredDisclosureRuntime, root: HTMLElement): void {
  closeSiblingRoots(runtime, root);
  root.removeAttribute(suppressedAttribute);

  if (isRootOpen(root)) {
    return;
  }

  root.setAttribute(openAttribute, "true");
  syncTriggers(root, true);
  dispatchDisclosureChange(root);
}

function closeRoot(root: HTMLElement): void {
  if (!isRootOpen(root)) {
    return;
  }

  root.removeAttribute(openAttribute);
  syncTriggers(root, false);
  dispatchDisclosureChange(root);
}

function closeSiblingRoots(
  runtime: AnchoredDisclosureRuntime,
  currentRoot: HTMLElement,
): void {
  openRoots(runtime).forEach((root) => {
    if (root !== currentRoot) {
      root.removeAttribute(suppressedAttribute);
      closeRoot(root);
    }
  });
}

function clearSuppressedRoots(runtime: AnchoredDisclosureRuntime): void {
  runtime.document
    .querySelectorAll<HTMLElement>(`${rootSelector}[${suppressedAttribute}]`)
    .forEach((root) => root.removeAttribute(suppressedAttribute));
}

function openRoots(runtime: AnchoredDisclosureRuntime): readonly HTMLElement[] {
  return Array.from(
    runtime.document.querySelectorAll<HTMLElement>(
      `${rootSelector}[${openAttribute}="true"]`,
    ),
  );
}

function isRootOpen(root: HTMLElement): boolean {
  return root.getAttribute(openAttribute) === "true";
}

function syncTriggers(root: HTMLElement, open: boolean): void {
  root.querySelectorAll<HTMLElement>(triggerSelector).forEach((trigger) => {
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

function dispatchDisclosureChange(root: HTMLElement): void {
  const EventConstructor = root.ownerDocument.defaultView?.Event ?? Event;

  root.dispatchEvent(
    new EventConstructor(disclosureChangeEventName, {
      bubbles: true,
    }),
  );
}

function focusFirstTrigger(root: HTMLElement): void {
  const trigger =
    root.querySelector<HTMLElement>(triggerSelector) ??
    root.querySelector<HTMLElement>(anchorTriggerSelector);

  if (trigger === null || !isFocusable(trigger)) {
    return;
  }

  trigger.focus();
}

function shouldToggleFromClick(
  runtime: AnchoredDisclosureRuntime,
  trigger: HTMLElement,
  pointerKind: PointerKind,
): boolean {
  const tagName = trigger.tagName.toLowerCase();

  if (tagName === "button" || tagName === "summary") {
    return true;
  }

  return isCoarseActivation(runtime, pointerKind);
}

function isCoarseActivation(
  runtime: AnchoredDisclosureRuntime,
  pointerKind: PointerKind,
): boolean {
  return (
    pointerKind === "touch" ||
    (pointerKind === "pen" && !hasFinePointer(runtime)) ||
    (pointerKind === "none" && hasCoarsePointer(runtime))
  );
}

function hasFinePointer(runtime: AnchoredDisclosureRuntime): boolean {
  return mediaMatches(runtime, "(hover: hover) and (pointer: fine)");
}

function hasCoarsePointer(runtime: AnchoredDisclosureRuntime): boolean {
  return mediaMatches(runtime, "(hover: none), (pointer: coarse)");
}

function mediaMatches(
  runtime: AnchoredDisclosureRuntime,
  query: string,
): boolean {
  if (typeof runtime.window.matchMedia !== "function") {
    return false;
  }

  return runtime.window.matchMedia(query).matches;
}

function pointerKind(event: PointerEvent): PointerKind {
  if (
    event.pointerType === "mouse" ||
    event.pointerType === "pen" ||
    event.pointerType === "touch"
  ) {
    return event.pointerType;
  }

  return "none";
}

interface FocusableElement {
  readonly focus: () => void;
}

function isFocusable(
  element: HTMLElement,
): element is FocusableElement & HTMLElement {
  return "focus" in element && typeof element.focus === "function";
}

function browserRuntime(): AnchoredDisclosureRuntime | null {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return null;
  }

  return {
    classes: {
      Element,
      Node,
    },
    document,
    window,
  };
}
