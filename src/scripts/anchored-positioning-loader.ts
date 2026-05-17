const rootSelector = "[data-anchor-root]";
const installedAttribute = "data-anchor-positioning-loader-installed";
const intentEvents = [
  "mouseover",
  "focusin",
  "pointerdown",
  "click",
  "toggle",
  "anchored-disclosure-change",
] as const;

interface AnchoredPositioningModule {
  scheduleAnchoredRootFromTarget(target: EventTarget | null): void;
}

interface IdleDeadlineLike {
  readonly didTimeout: boolean;
  timeRemaining(): number;
}

interface AnchoredPositioningLoaderWindow {
  requestIdleCallback?(
    callback: (deadline: IdleDeadlineLike) => void,
    options?: { timeout?: number },
  ): number;
  setTimeout(callback: () => void, timeout: number): number;
}

interface AnchoredPositioningLoaderRuntime {
  readonly document: Document;
  readonly loadAnchoredPositioning: () => Promise<AnchoredPositioningModule>;
  readonly window: AnchoredPositioningLoaderWindow;
}

/**
 * Installs a small first-intent loader for anchored positioning.
 *
 * The heavier positioning controller is not needed until a user opens or
 * approaches an anchored surface. This loader keeps the initial request chain
 * smaller while still warming the module during idle time for normal browsing.
 *
 * @param runtime Browser runtime dependencies.
 */
export function installAnchoredPositioningLoader(
  runtime = browserRuntime(),
): void {
  if (runtime === null) {
    return;
  }

  if (runtime.document.querySelector(rootSelector) === null) {
    return;
  }

  const documentElement = runtime.document.documentElement;
  if (documentElement.hasAttribute(installedAttribute)) {
    return;
  }

  documentElement.setAttribute(installedAttribute, "true");

  let modulePromise: Promise<AnchoredPositioningModule> | undefined;
  const loadModule = async (): Promise<AnchoredPositioningModule> => {
    return (modulePromise ??= runtime.loadAnchoredPositioning());
  };
  const loadFromTarget = (target: EventTarget | null): void => {
    void loadModule()
      .then((module) => {
        module.scheduleAnchoredRootFromTarget(target);

        return undefined;
      })
      .catch(() => undefined);
  };

  intentEvents.forEach((eventName) => {
    runtime.document.addEventListener(
      eventName,
      (event) => {
        loadFromTarget(event.target);
      },
      { capture: true, passive: true },
    );
  });

  scheduleIdleWarmup(runtime, () => {
    loadFromTarget(null);
  });
}

function scheduleIdleWarmup(
  runtime: AnchoredPositioningLoaderRuntime,
  callback: () => void,
): void {
  if (runtime.window.requestIdleCallback === undefined) {
    runtime.window.setTimeout(callback, 1500);

    return;
  }

  runtime.window.requestIdleCallback(callback, { timeout: 3000 });
}

function browserRuntime(): AnchoredPositioningLoaderRuntime | null {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return null;
  }

  return {
    document,
    loadAnchoredPositioning: async () => import("./anchored-positioning"),
    window,
  };
}

installAnchoredPositioningLoader();
