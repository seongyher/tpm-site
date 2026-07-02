const boundAttribute = "data-scroll-rail-bound";
const disabledThresholdPx = 2;

type ResizeObserverConstructor = new (
  callback: ResizeObserverCallback,
) => ResizeObserver;

/**
 * Installs progressive scroll controls for horizontal rail components.
 *
 * @param rootDocument Browser document that owns horizontal rails.
 */
export function installHorizontalScrollRails(
  rootDocument: Document = document,
): void {
  rootDocument
    .querySelectorAll<HTMLElement>("[data-scroll-rail]")
    .forEach((root) => {
      if (root.hasAttribute(boundAttribute)) {
        return;
      }

      bindScrollRail(root, rootDocument);
    });
}

/**
 * Returns a page-sized horizontal scroll distance for a rail viewport.
 *
 * @param viewport Rail viewport whose visible width should determine movement.
 * @returns Pixel distance for one previous/next action.
 */
export function horizontalScrollStep(
  viewport: Pick<HTMLElement, "clientWidth">,
): number {
  return Math.max(160, Math.floor(viewport.clientWidth * 0.82));
}

function bindScrollRail(root: HTMLElement, rootDocument: Document): void {
  const rootWindow = rootDocument.defaultView;
  const viewport = root.querySelector<HTMLElement>(
    "[data-scroll-rail-viewport]",
  );
  const previous = root.querySelector<HTMLButtonElement>(
    "[data-scroll-rail-previous]",
  );
  const next = root.querySelector<HTMLButtonElement>("[data-scroll-rail-next]");
  const startControl = root.querySelector<HTMLElement>(
    "[data-scroll-rail-start]",
  );
  const endControl = root.querySelector<HTMLElement>("[data-scroll-rail-end]");

  if (
    rootWindow === null ||
    viewport === null ||
    previous === null ||
    next === null ||
    startControl === null ||
    endControl === null
  ) {
    return;
  }

  root.setAttribute(boundAttribute, "true");

  const update = (): void => {
    updateRailControls({ endControl, next, previous, startControl, viewport });
  };
  const scheduleUpdate = (): void => {
    rootWindow.requestAnimationFrame(update);
  };
  const scrollByDirection = (direction: -1 | 1): void => {
    viewport.scrollBy({
      behavior: reducedMotion(rootWindow) ? "auto" : "smooth",
      left: horizontalScrollStep(viewport) * direction,
    });
    scheduleUpdate();
    rootWindow.setTimeout(update, 220);
  };

  previous.addEventListener("click", () => {
    scrollByDirection(-1);
  });
  next.addEventListener("click", () => {
    scrollByDirection(1);
  });
  viewport.addEventListener("scroll", scheduleUpdate, { passive: true });
  rootWindow.addEventListener("resize", scheduleUpdate);
  resizeObserver(rootWindow, update)?.observe(viewport);
  update();
}

function updateRailControls({
  endControl,
  next,
  previous,
  startControl,
  viewport,
}: {
  endControl: HTMLElement;
  next: HTMLButtonElement;
  previous: HTMLButtonElement;
  startControl: HTMLElement;
  viewport: HTMLElement;
}): void {
  const maxScroll = maximumScrollLeft(viewport);
  const hasOverflow = maxScroll > disabledThresholdPx;
  const canScrollBackward =
    hasOverflow && viewport.scrollLeft > disabledThresholdPx;
  const canScrollForward =
    hasOverflow && viewport.scrollLeft < maxScroll - disabledThresholdPx;

  setControlVisibility(startControl, canScrollBackward);
  setControlVisibility(endControl, canScrollForward);

  previous.disabled = !canScrollBackward;
  next.disabled = !canScrollForward;
}

function setControlVisibility(control: HTMLElement, isVisible: boolean): void {
  control.hidden = !isVisible;
  control.classList.toggle("hidden", !isVisible);
  control.classList.toggle("flex", isVisible);
}

function maximumScrollLeft({
  clientWidth,
  scrollWidth,
}: Pick<HTMLElement, "clientWidth" | "scrollWidth">): number {
  return Math.max(0, scrollWidth - clientWidth);
}

function reducedMotion(rootWindow: Window): boolean {
  return rootWindow.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isResizeObserverConstructor(
  value: unknown,
): value is ResizeObserverConstructor {
  return typeof value === "function";
}

function resizeObserver(
  rootWindow: Window,
  update: () => void,
): ResizeObserver | undefined {
  const Observer: unknown = Reflect.get(rootWindow, "ResizeObserver");

  if (!isResizeObserverConstructor(Observer)) {
    return undefined;
  }

  return new Observer(update);
}

if (typeof document !== "undefined") {
  installHorizontalScrollRails();
}
