import {
  type ClipboardStatusTarget,
  copyTextWithStatus,
  parseJsonStringPayload,
} from "../lib/browser-clipboard";

/** Browser dependencies used by the article citation copy enhancement. */
export interface ArticleCitationCopyRuntime {
  document: Document;
  navigator: Navigator;
}

const rootSelector = "[data-article-citation-menu]";
const buttonSelector = "[data-article-citation-copy-button]";
const statusSelector = "[data-article-citation-copy-status]";
const styleButtonSelector = "[data-article-citation-style-button]";

/**
 * Installs progressive clipboard copying for article citation blocks.
 *
 * @param runtime Browser DOM dependencies, injected by tests.
 */
export function installArticleCitationCopy(runtime = browserRuntime()): void {
  if (runtime === undefined) {
    return;
  }

  const { document } = runtime;

  if (document.documentElement.dataset["articleCitationCopy"] === "ready") {
    return;
  }

  document.documentElement.dataset["articleCitationCopy"] = "ready";
  document.addEventListener("click", (event) => {
    const target = event.target;
    const elementConstructor = document.defaultView?.Element;

    if (
      elementConstructor === undefined ||
      !(target instanceof elementConstructor)
    ) {
      return;
    }

    const styleButton = target.closest<HTMLButtonElement>(styleButtonSelector);

    if (styleButton !== null) {
      selectCitationStyle(styleButton);
      return;
    }

    const button = target.closest<HTMLButtonElement>(buttonSelector);

    if (button === null) {
      return;
    }

    copyCitation(runtime, button).catch(() => undefined);
  });
}

function selectCitationStyle(button: HTMLButtonElement): void {
  const root = button.closest<HTMLElement>(rootSelector);

  if (root === null) {
    return;
  }

  const text = root.querySelector<HTMLElement>("[data-article-citation-text]");
  const copyButton = root.querySelector<HTMLButtonElement>(buttonSelector);
  const citation = parseCitationPayload(
    button.dataset["articleCitationFormatText"],
  );

  if (text === null || copyButton === null || citation === undefined) {
    return;
  }

  const label = button.dataset["articleCitationFormatLabel"] ?? "citation";
  renderCitationText(text, citation);
  text.dataset["articleCitationCopyText"] = JSON.stringify(citation);
  copyButton.setAttribute("aria-label", `Copy ${label} citation`);
  delete copyButton.dataset["articleCitationCopyState"];

  const status = root.querySelector<HTMLElement>(statusSelector);

  if (status !== null) {
    status.textContent = "";
  }

  for (const candidate of root.querySelectorAll<HTMLButtonElement>(
    styleButtonSelector,
  )) {
    candidate.setAttribute(
      "aria-pressed",
      candidate === button ? "true" : "false",
    );
  }
}

function renderCitationText(target: HTMLElement, citation: string): void {
  const document = target.ownerDocument;
  const lines = citation.split("\n").map((line) => {
    const span = document.createElement("span");
    span.className = "block min-w-0 max-w-full";
    span.textContent = line.length === 0 ? "\u00A0" : line;

    return span;
  });

  target.replaceChildren(...lines);
}

async function copyCitation(
  runtime: ArticleCitationCopyRuntime,
  button: HTMLButtonElement,
): Promise<void> {
  const root = button.closest<HTMLElement>(rootSelector);
  const targetId = button.dataset["articleCitationCopyTarget"];
  const target =
    root === null || targetId === undefined
      ? undefined
      : Array.from(
          root.querySelectorAll<HTMLElement>("[data-article-citation-text]"),
        ).find((element) => element.id === targetId);
  const textareaConstructor =
    target?.ownerDocument.defaultView?.HTMLTextAreaElement;
  const text =
    target === undefined
      ? ""
      : (citationCopyText(target) ??
        fallbackCitationText(target, textareaConstructor));

  await copyTextWithStatus(
    runtime.navigator,
    text,
    citationStatusTarget(button),
    {
      empty: "Citation text was not found.",
      failure: "Copy failed. Select the citation text manually.",
      success: "Copied.",
    },
  );
}

function fallbackCitationText(
  target: HTMLElement,
  textareaConstructor: typeof HTMLTextAreaElement | undefined,
): string {
  return textareaConstructor !== undefined &&
    target instanceof textareaConstructor
    ? target.value
    : target.textContent;
}

function citationCopyText(target: HTMLElement): string | undefined {
  return parseJsonStringPayload(target.dataset["articleCitationCopyText"]);
}

function parseCitationPayload(encoded: string | undefined): string | undefined {
  return parseJsonStringPayload(encoded);
}

function citationStatusTarget(
  button: HTMLButtonElement,
): ClipboardStatusTarget {
  return {
    button,
    rootSelector,
    stateDatasetKey: "articleCitationCopyState",
    statusSelector,
  };
}

function browserRuntime(): ArticleCitationCopyRuntime | undefined {
  if (typeof document === "undefined" || typeof navigator === "undefined") {
    return undefined;
  }

  return { document, navigator };
}

installArticleCitationCopy();
