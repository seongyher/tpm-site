const headerSelector = "[data-site-header]";
const headerHeightProperty = "--site-header-height";

interface SiteHeaderOffsetRuntime {
  readonly document: Document;
  readonly ResizeObserver: typeof ResizeObserver;
  readonly window: SiteHeaderOffsetWindow;
}

type SiteHeaderOffsetWindow = Window & {
  readonly HTMLElement: typeof HTMLElement;
};

/**
 * Installs sticky-header offset tracking and hash-target realignment.
 *
 * @param runtime Browser runtime dependencies.
 */
export function installSiteHeaderOffset(runtime = browserRuntime()): void {
  if (runtime === null) {
    return;
  }

  const header = runtime.document.querySelector<HTMLElement>(headerSelector);

  if (header === null) {
    return;
  }

  updateHeaderOffset(runtime, header);

  const observer = new runtime.ResizeObserver(() => {
    updateHeaderOffset(runtime, header);
    alignHashTarget(runtime);
  });

  observer.observe(header);
  runtime.window.addEventListener("hashchange", () => {
    alignHashTarget(runtime);
  });
  runtime.window.addEventListener(
    "load",
    () => {
      alignHashTarget(runtime);
    },
    { once: true },
  );
}

function updateHeaderOffset(
  runtime: SiteHeaderOffsetRuntime,
  header: HTMLElement,
): void {
  runtime.document.documentElement.style.setProperty(
    headerHeightProperty,
    `${header.getBoundingClientRect().height}px`,
  );
}

function hashTarget(runtime: SiteHeaderOffsetRuntime): HTMLElement | null {
  const id = decodeURIComponent(runtime.window.location.hash.slice(1));

  if (id === "") {
    return null;
  }

  const target = runtime.document.getElementById(id);

  return target instanceof runtime.window.HTMLElement ? target : null;
}

function alignHashTarget(runtime: SiteHeaderOffsetRuntime): void {
  const target = hashTarget(runtime);

  if (target === null) {
    return;
  }

  runtime.window.requestAnimationFrame(() => {
    target.scrollIntoView({ block: "start" });
  });
}

function browserRuntime(): null | SiteHeaderOffsetRuntime {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return null;
  }

  return {
    document,
    ResizeObserver,
    window,
  };
}

installSiteHeaderOffset();
