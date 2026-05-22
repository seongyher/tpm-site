import {
  type AnchoredPreset,
  anchoredPresetConfig,
  type AnchorRect,
  computeAnchoredPosition,
  emptyAnchorRect,
} from "../lib/interactions/anchored-positioning";

const rootSelector = "[data-anchor-root]";
const triggerSelector = "[data-anchor-trigger]";
const panelSelector = "[data-anchor-panel]";
const siteHeaderSelector = "[data-site-header]";
const initializedAttribute = "data-anchor-initialized";
const disclosureChangeEventName = "anchored-disclosure-change";
const disclosureOpenAttribute = "data-disclosure-open";
const disclosureRootAttribute = "data-disclosure-root";
const rootSelectorClosest = rootSelector;
const resizeObservers = new Map<HTMLElement, ResizeObserver>();

/** Browser runtime dependencies for anchored positioning. */
export interface AnchoredPositioningRuntime {
  readonly classes: {
    readonly Element: typeof Element;
    readonly Node: typeof Node;
    readonly ResizeObserver: typeof ResizeObserver | undefined;
  };
  readonly document: Document;
  readonly window: Window;
}

/**
 * Installs anchored-positioning behavior for trigger-attached floating
 * surfaces.
 *
 * @param runtime Browser runtime dependencies.
 */
export function installAnchoredPositioning(runtime = browserRuntime()): void {
  if (runtime === null) {
    return;
  }

  initializeRoots(runtime);
  runtime.document.addEventListener("mouseover", (event) => {
    scheduleRootFromEvent(runtime, event);
  });
  runtime.document.addEventListener("focusin", (event) => {
    scheduleRootFromEvent(runtime, event);
  });
  runtime.document.addEventListener("click", (event) => {
    scheduleRootFromEvent(runtime, event);
  });
  runtime.document.addEventListener("toggle", (event) => {
    scheduleRootFromEvent(runtime, event);
  });
  runtime.document.addEventListener(disclosureChangeEventName, (event) => {
    scheduleRootFromEvent(runtime, event);
  });
  runtime.window.addEventListener("resize", () => scheduleOpenRoots(runtime), {
    passive: true,
  });
  runtime.window.addEventListener("scroll", () => scheduleOpenRoots(runtime), {
    passive: true,
  });
  runtime.window.visualViewport?.addEventListener(
    "resize",
    () => scheduleOpenRoots(runtime),
    { passive: true },
  );
  runtime.window.visualViewport?.addEventListener(
    "scroll",
    () => scheduleOpenRoots(runtime),
    { passive: true },
  );
}

/**
 * Repositions the anchored root nearest a browser event target.
 *
 * This keeps lazy loaders robust: if the positioning module is loaded because
 * of a first pointer/focus/click intent, the root that caused the load is
 * positioned immediately after installation instead of waiting for a second
 * user interaction.
 *
 * @param target Event target that triggered anchored positioning.
 * @param runtime Browser runtime dependencies.
 */
export function scheduleAnchoredRootFromTarget(
  target: EventTarget | null,
  runtime = browserRuntime(),
): void {
  if (runtime === null) {
    return;
  }

  if (!(target instanceof runtime.classes.Element)) {
    return;
  }

  const root = target.closest<HTMLElement>(rootSelectorClosest);

  if (root === null) {
    return;
  }

  scheduleRoot(runtime, root);
}

function initializeRoots(runtime: AnchoredPositioningRuntime): void {
  cleanupDisconnectedRoots();
  runtime.document
    .querySelectorAll<HTMLElement>(rootSelector)
    .forEach((root) => {
      if (root.hasAttribute(initializedAttribute)) {
        return;
      }

      root.setAttribute(initializedAttribute, "true");
      root.addEventListener("toggle", () => scheduleRoot(runtime, root));
      root.addEventListener("mouseenter", () => scheduleRoot(runtime, root));
      root.addEventListener("focusin", () => scheduleRoot(runtime, root));

      const resizeObserver = resizeObserverFor(runtime, root);
      const panel = panelFor(root);
      resizeObserver?.observe(root);
      observeIfPresent(
        resizeObserver,
        runtime.document.querySelector<HTMLElement>(siteHeaderSelector),
      );
      observeIfPresent(resizeObserver, panel);
      trackResizeObserver(root, resizeObserver);
      panel?.addEventListener("toggle", () => scheduleRoot(runtime, root));
    });
}

function scheduleRootFromEvent(
  runtime: AnchoredPositioningRuntime,
  event: Event,
): void {
  const target = event.target;

  if (!(target instanceof runtime.classes.Element)) {
    return;
  }

  const root = target.closest<HTMLElement>(rootSelectorClosest);

  if (root === null) {
    return;
  }

  scheduleRoot(runtime, root);
}

function scheduleOpenRoots(runtime: AnchoredPositioningRuntime): void {
  cleanupDisconnectedRoots();
  initializeRoots(runtime);
  runtime.document
    .querySelectorAll<HTMLElement>(rootSelector)
    .forEach((root) => {
      if (isRootOpen(runtime, root)) {
        scheduleRoot(runtime, root);
      }
    });
}

function scheduleRoot(
  runtime: AnchoredPositioningRuntime,
  root: HTMLElement,
): void {
  runtime.window.requestAnimationFrame(() => positionRoot(runtime, root));
}

function positionRoot(
  runtime: AnchoredPositioningRuntime,
  root: HTMLElement,
): void {
  const preset = presetFor(root);
  const trigger = triggerFor(root);
  const panel = panelFor(root);

  if (preset === null || trigger === null || panel === null) {
    return;
  }

  if (!isRootOpen(runtime, root)) {
    return;
  }

  const config = anchoredPresetConfig(preset);
  const result = computeAnchoredPosition({
    boundaryRect: viewportRect(runtime),
    blockAnchorRect: blockAnchorRect(runtime, preset, trigger),
    fallback: config.fallback,
    floatingSize: elementSize(panel),
    inlineAnchorRect: inlineAnchorRect(runtime, preset, trigger),
    offset: config.offset,
    placement: config.placement,
    safeGutter: config.safeGutter,
  });

  panel.style.setProperty("--anchor-x", `${result.x}px`);
  panel.style.setProperty("--anchor-y", `${result.y}px`);
  panel.style.setProperty("--anchor-max-width", `${result.maxWidth}px`);
  panel.style.setProperty("--anchor-max-height", `${result.maxHeight}px`);
  panel.dataset["anchorPlacement"] = result.placement;
  panel.dataset["anchorState"] = result.state.join(" ");
  panel.dataset["anchorDetached"] = result.detached ? "true" : "false";
}

function presetFor(root: HTMLElement): AnchoredPreset | null {
  const preset = root.dataset["anchorPreset"];

  if (
    preset === "article-action-menu" ||
    preset === "article-citation-menu" ||
    preset === "header-dropdown" ||
    preset === "header-search-start" ||
    preset === "header-search-end" ||
    preset === "mobile-shell-panel" ||
    preset === "inline-hover-preview"
  ) {
    return preset;
  }

  return null;
}

function triggerFor(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>(triggerSelector);
}

function panelFor(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>(panelSelector);
}

function isRootOpen(
  runtime: AnchoredPositioningRuntime,
  root: HTMLElement,
): boolean {
  const panel = panelFor(root);
  const activeElement = runtime.document.activeElement;
  const focusedInside =
    activeElement instanceof runtime.classes.Node &&
    root.contains(activeElement);

  return (
    root.getAttribute(disclosureOpenAttribute) === "true" ||
    root.matches(":hover") ||
    root.hasAttribute("open") ||
    (!root.hasAttribute(disclosureRootAttribute) && focusedInside) ||
    panel?.matches(":popover-open") === true
  );
}

function blockAnchorRect(
  runtime: AnchoredPositioningRuntime,
  preset: AnchoredPreset,
  trigger: HTMLElement,
): AnchorRect {
  if (
    preset === "header-dropdown" ||
    preset === "header-search-start" ||
    preset === "header-search-end" ||
    preset === "mobile-shell-panel"
  ) {
    return elementRect(
      runtime.document.querySelector<HTMLElement>(siteHeaderSelector),
    );
  }

  return elementRect(trigger);
}

function inlineAnchorRect(
  runtime: AnchoredPositioningRuntime,
  preset: AnchoredPreset,
  trigger: HTMLElement,
): AnchorRect {
  if (preset === "mobile-shell-panel") {
    return viewportRect(runtime);
  }

  return elementRect(trigger);
}

function viewportRect(runtime: AnchoredPositioningRuntime): AnchorRect {
  const visualViewport = runtime.window.visualViewport;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Happy DOM and some browser-like runtimes can omit visualViewport even though DOM types model it as nullable.
  if (visualViewport !== null && visualViewport !== undefined) {
    return {
      height: visualViewport.height,
      width: visualViewport.width,
      x: visualViewport.offsetLeft,
      y: visualViewport.offsetTop,
    };
  }

  return {
    height: runtime.window.innerHeight,
    width: runtime.window.innerWidth,
    x: 0,
    y: 0,
  };
}

function elementRect(element: Element | null): AnchorRect {
  if (element === null) {
    return emptyAnchorRect();
  }

  const rect = element.getBoundingClientRect();

  return {
    height: rect.height,
    width: rect.width,
    x: rect.x,
    y: rect.y,
  };
}

function elementSize(
  element: HTMLElement,
): Pick<AnchorRect, "height" | "width"> {
  const rect = element.getBoundingClientRect();

  return {
    height: rect.height,
    width: rect.width,
  };
}

function resizeObserverFor(
  runtime: AnchoredPositioningRuntime,
  root: HTMLElement,
): null | ResizeObserver {
  const ResizeObserverConstructor = runtime.classes.ResizeObserver;

  if (ResizeObserverConstructor === undefined) {
    return null;
  }

  return new ResizeObserverConstructor(() => {
    if (isRootOpen(runtime, root)) {
      scheduleRoot(runtime, root);
    }
  });
}

function observeIfPresent(
  resizeObserver: null | ResizeObserver,
  element: Element | null,
): void {
  if (resizeObserver === null || element === null) {
    return;
  }

  resizeObserver.observe(element);
}

function trackResizeObserver(
  root: HTMLElement,
  resizeObserver: null | ResizeObserver,
): void {
  if (resizeObserver === null) {
    return;
  }

  resizeObservers.set(root, resizeObserver);
}

function cleanupDisconnectedRoots(): void {
  for (const [root, resizeObserver] of resizeObservers) {
    if (!root.isConnected) {
      resizeObserver.disconnect();
      resizeObservers.delete(root);
    }
  }
}

function browserRuntime(): AnchoredPositioningRuntime | null {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return null;
  }

  return {
    classes: {
      Element,
      Node,
      ResizeObserver:
        typeof ResizeObserver === "undefined" ? undefined : ResizeObserver,
    },
    document,
    window,
  };
}

installAnchoredPositioning();
