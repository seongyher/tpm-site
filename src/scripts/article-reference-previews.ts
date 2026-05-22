import {
  anchoredPresetConfig,
  computeAnchoredPosition,
} from "../lib/interactions/anchored-positioning";

const markerSelector = 'a[data-article-reference-marker="true"]';
const backlinkSelector = 'a[data-article-reference-backlink="true"]';
const triggerSelector = `${markerSelector}, ${backlinkSelector}`;
const previewSelector = "[data-article-reference-preview]";
const previewInitializedAttribute =
  "data-article-reference-preview-initialized";
const previewContentSelector = "[data-article-reference-preview-content]";
const definitionContentSelector = "[data-article-reference-definition-content]";
const sourceContextSelector =
  "p, li, blockquote, figcaption, h2, h3, h4, h5, h6";
const hiddenClass = "hidden";
const closeDelayMs = 120;
const contextPreviewLimit = 420;

/** Browser dependencies used by article reference previews. */
export interface ArticleReferencePreviewRuntime {
  readonly classes: {
    readonly Element: typeof Element;
    readonly Node: typeof Node;
  };
  readonly document: Document;
  readonly window: Window;
}

interface PreviewPayload {
  readonly content: HTMLElement;
  readonly source: "context" | "definition";
}

/**
 * Installs progressive hover/tap previews for article citations, notes, and
 * reference backlinks.
 *
 * @param runtime Browser runtime dependencies.
 */
export function installArticleReferencePreviews(
  runtime = browserRuntime(),
): void {
  if (runtime === null) {
    return;
  }

  const panel = runtime.document.querySelector<HTMLElement>(previewSelector);

  if (panel === null || panel.hasAttribute(previewInitializedAttribute)) {
    return;
  }

  const preview = previewParts(panel);

  if (preview === null) {
    return;
  }

  panel.setAttribute(previewInitializedAttribute, "true");
  panel.id ||= "article-reference-preview";

  let activeTrigger: HTMLAnchorElement | null = null;
  let closeTimer: number | undefined;

  const cancelClose = (): void => {
    if (closeTimer !== undefined) {
      runtime.window.clearTimeout(closeTimer);
      closeTimer = undefined;
    }
  };

  const close = (): void => {
    cancelClose();
    activeTrigger?.removeAttribute("aria-describedby");
    activeTrigger = null;
    panel.hidden = true;
    panel.classList.add(hiddenClass);
    delete panel.dataset["referencePreviewSource"];
  };

  const scheduleClose = (): void => {
    cancelClose();
    closeTimer = runtime.window.setTimeout(close, closeDelayMs);
  };

  const open = (trigger: HTMLAnchorElement): boolean => {
    const payload = payloadForTrigger(runtime, trigger);

    if (payload === null) {
      return false;
    }

    cancelClose();
    renderPreview(preview, payload);
    activeTrigger?.removeAttribute("aria-describedby");
    activeTrigger = trigger;
    activeTrigger.setAttribute("aria-describedby", panel.id);
    panel.dataset["referencePreviewSource"] = payload.source;
    panel.hidden = false;
    panel.classList.remove(hiddenClass);
    panel.style.visibility = "hidden";
    positionPanel(runtime, trigger, panel);
    panel.style.visibility = "";

    return true;
  };

  runtime.document.addEventListener("pointerover", (event) => {
    if (pointerType(event) === "touch") {
      return;
    }

    const trigger = triggerFromEvent(runtime, event);

    if (trigger !== null && !open(trigger)) {
      close();
    }
  });

  runtime.document.addEventListener("pointerout", (event) => {
    const trigger = triggerFromEvent(runtime, event);

    if (
      trigger !== null &&
      !containsEventTarget(runtime, trigger, event.relatedTarget) &&
      !containsEventTarget(runtime, panel, event.relatedTarget)
    ) {
      scheduleClose();
    }
  });

  runtime.document.addEventListener("focusin", (event) => {
    const trigger = triggerFromEvent(runtime, event);

    if (trigger !== null && !open(trigger)) {
      close();
      return;
    }

    if (trigger !== null) {
      return;
    }

    if (containsEventTarget(runtime, panel, event.target)) {
      cancelClose();
    }
  });

  runtime.document.addEventListener("focusout", (event) => {
    if (
      activeTrigger !== null &&
      !containsEventTarget(runtime, activeTrigger, event.relatedTarget) &&
      !containsEventTarget(runtime, panel, event.relatedTarget)
    ) {
      scheduleClose();
    }
  });

  runtime.document.addEventListener("click", (event) => {
    const trigger = triggerFromEvent(runtime, event);

    if (
      trigger !== null &&
      isCoarsePointer(runtime) &&
      activeTrigger !== trigger &&
      open(trigger)
    ) {
      event.preventDefault();
      return;
    }

    if (
      activeTrigger !== null &&
      !containsEventTarget(runtime, panel, event.target) &&
      !containsEventTarget(runtime, activeTrigger, event.target)
    ) {
      close();
    }
  });

  runtime.document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeTrigger !== null) {
      const trigger = activeTrigger;
      close();
      trigger.focus();
    }
  });

  panel.addEventListener("pointerover", cancelClose);
  panel.addEventListener("pointerout", (event) => {
    if (
      !containsEventTarget(runtime, panel, event.relatedTarget) &&
      (activeTrigger === null ||
        !containsEventTarget(runtime, activeTrigger, event.relatedTarget))
    ) {
      scheduleClose();
    }
  });

  runtime.window.addEventListener(
    "resize",
    () => {
      if (activeTrigger !== null) {
        positionPanel(runtime, activeTrigger, panel);
      }
    },
    { passive: true },
  );
  runtime.window.addEventListener(
    "scroll",
    () => {
      if (activeTrigger !== null) {
        positionPanel(runtime, activeTrigger, panel);
      }
    },
    { passive: true },
  );
}

function previewParts(panel: HTMLElement): null | {
  readonly content: HTMLElement;
} {
  const content = panel.querySelector<HTMLElement>(previewContentSelector);

  if (content === null) {
    return null;
  }

  return { content };
}

function payloadForTrigger(
  runtime: ArticleReferencePreviewRuntime,
  trigger: HTMLAnchorElement,
): null | PreviewPayload {
  return trigger.matches(markerSelector)
    ? markerPayload(runtime, trigger)
    : backlinkPayload(runtime, trigger);
}

function markerPayload(
  runtime: ArticleReferencePreviewRuntime,
  trigger: HTMLAnchorElement,
): null | PreviewPayload {
  const entryId =
    trigger.dataset["referenceEntryId"] ??
    fragmentId(trigger.getAttribute("href"));

  if (entryId === null) {
    return null;
  }

  const entry = runtime.document.getElementById(entryId);
  const definition = entry?.querySelector<HTMLElement>(
    definitionContentSelector,
  );

  if (definition === undefined || definition === null || !hasText(definition)) {
    return null;
  }

  return {
    content: sanitizedClone(definition),
    source: "definition",
  };
}

function backlinkPayload(
  runtime: ArticleReferencePreviewRuntime,
  trigger: HTMLAnchorElement,
): null | PreviewPayload {
  const markerId =
    trigger.dataset["referenceMarkerId"] ??
    fragmentId(trigger.getAttribute("href"));

  if (markerId === null) {
    return null;
  }

  const marker = runtime.document.getElementById(markerId);
  const sourceBlock = marker?.closest<HTMLElement>(sourceContextSelector);

  if (sourceBlock === undefined || sourceBlock === null) {
    return null;
  }

  const context = truncatedContext(sourceBlock.textContent);

  if (context.length === 0) {
    return null;
  }

  const content = runtime.document.createElement("p");
  content.className = "m-0 max-w-full min-w-0 break-words";
  content.textContent = context;

  return {
    content,
    source: "context",
  };
}

function renderPreview(
  preview: {
    readonly content: HTMLElement;
  },
  payload: PreviewPayload,
): void {
  preview.content.replaceChildren(payload.content);
}

function positionPanel(
  runtime: ArticleReferencePreviewRuntime,
  trigger: HTMLElement,
  panel: HTMLElement,
): void {
  const config = anchoredPresetConfig("inline-hover-preview");
  const result = computeAnchoredPosition({
    blockAnchorRect: elementRect(trigger),
    boundaryRect: viewportRect(runtime),
    fallback: config.fallback,
    floatingSize: elementSize(panel),
    inlineAnchorRect: elementRect(trigger),
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

function triggerFromEvent(
  runtime: ArticleReferencePreviewRuntime,
  event: Event,
): HTMLAnchorElement | null {
  const target = event.target;

  if (!(target instanceof runtime.classes.Element)) {
    return null;
  }

  return target.closest<HTMLAnchorElement>(triggerSelector);
}

function sanitizedClone(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true);
  const view = element.ownerDocument.defaultView;

  if (view === null || !(clone instanceof view.HTMLElement)) {
    throw new Error("Expected reference preview content to clone as HTML.");
  }

  clone.removeAttribute("id");
  clone
    .querySelectorAll("[id]")
    .forEach((child) => child.removeAttribute("id"));
  clone
    .querySelectorAll(
      "[data-article-reference-marker], [data-article-reference-backlink]",
    )
    .forEach((child) => {
      child.removeAttribute("data-article-reference-marker");
      child.removeAttribute("data-article-reference-backlink");
    });

  return clone;
}

function fragmentId(href: null | string): null | string {
  if (href?.startsWith("#") !== true) {
    return null;
  }

  const fragment = href.slice(1);

  try {
    return decodeURIComponent(fragment);
  } catch {
    return fragment;
  }
}

function hasText(element: HTMLElement): boolean {
  return normalizedText(element.textContent).length > 0;
}

function truncatedContext(text: string): string {
  const normalized = normalizedText(text);

  return normalized.length > contextPreviewLimit
    ? `${normalized.slice(0, contextPreviewLimit).trimEnd()}...`
    : normalized;
}

function normalizedText(text: string): string {
  return text.replace(/\s+/gu, " ").trim();
}

function containsEventTarget(
  runtime: ArticleReferencePreviewRuntime,
  element: HTMLElement,
  target: EventTarget | null,
): boolean {
  return target instanceof runtime.classes.Node && element.contains(target);
}

function pointerType(event: Event): string | undefined {
  return "pointerType" in event && typeof event.pointerType === "string"
    ? event.pointerType
    : undefined;
}

function isCoarsePointer(runtime: ArticleReferencePreviewRuntime): boolean {
  return runtime.window.matchMedia("(pointer: coarse)").matches;
}

function elementRect(element: HTMLElement): {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
} {
  const rect = element.getBoundingClientRect();

  return {
    height: rect.height,
    width: rect.width,
    x: rect.x,
    y: rect.y,
  };
}

function elementSize(element: HTMLElement): {
  readonly height: number;
  readonly width: number;
} {
  const rect = element.getBoundingClientRect();

  return {
    height: rect.height,
    width: rect.width,
  };
}

function viewportRect(runtime: ArticleReferencePreviewRuntime): {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
} {
  const viewport = runtime.window.visualViewport;

  return {
    height: viewport?.height ?? runtime.window.innerHeight,
    width: viewport?.width ?? runtime.window.innerWidth,
    x: viewport?.offsetLeft ?? 0,
    y: viewport?.offsetTop ?? 0,
  };
}

function browserRuntime(): ArticleReferencePreviewRuntime | null {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return null;
  }

  return {
    classes: { Element, Node },
    document,
    window,
  };
}

installArticleReferencePreviews();
