import {
  type ClipboardStatusTarget,
  copyTextWithStatus,
  parseJsonStringPayload,
} from "../lib/interactions/browser-clipboard";

/** Browser dependencies used by the article share enhancement. */
export interface ArticleShareRuntime {
  document: Document;
  navigator: Navigator;
  window: {
    open: (url: string, target?: string, features?: string) => unknown;
  };
}

const buttonSelector = "[data-article-share-copy-button]";
const openButtonSelector = "[data-article-share-open-button]";
const rootSelector = "[data-article-share-menu]";
const statusSelector = "[data-article-share-copy-status]";

/**
 * Installs progressive clipboard copying for article share menus.
 *
 * @param runtime Browser DOM dependencies, injected by tests.
 */
export function installArticleShare(runtime = browserRuntime()): void {
  if (runtime === undefined) {
    return;
  }

  const { document } = runtime;

  if (document.documentElement.dataset["articleShare"] === "ready") {
    return;
  }

  document.documentElement.dataset["articleShare"] = "ready";
  document.addEventListener("click", (event) => {
    const target = event.target;
    const elementConstructor = document.defaultView?.Element;

    if (
      elementConstructor === undefined ||
      !(target instanceof elementConstructor)
    ) {
      return;
    }

    const copyButton = target.closest<HTMLButtonElement>(buttonSelector);

    if (copyButton !== null) {
      copyArticleLink(runtime, copyButton).catch(() => undefined);
      return;
    }

    const openButton = target.closest<HTMLButtonElement>(openButtonSelector);

    if (openButton !== null) {
      openShareTarget(runtime, openButton);
    }
  });
}

function openShareTarget(
  runtime: ArticleShareRuntime,
  button: HTMLButtonElement,
): void {
  const href = parseSharePayload(button.dataset["articleShareOpenUrl"]);

  if (href === undefined || href.trim().length === 0) {
    return;
  }

  runtime.window.open(href, "_blank", "noopener,noreferrer");
}

async function copyArticleLink(
  runtime: ArticleShareRuntime,
  button: HTMLButtonElement,
): Promise<void> {
  const text = parseSharePayload(button.dataset["articleShareCopyText"]);

  await copyTextWithStatus(
    runtime.navigator,
    text ?? "",
    shareStatusTarget(button),
    {
      empty: "Article URL was not found.",
      failure: "Copy failed. Copy the URL from your address bar.",
      success: "Copied.",
    },
  );
}

function parseSharePayload(encoded: string | undefined): string | undefined {
  return parseJsonStringPayload(encoded);
}

function shareStatusTarget(button: HTMLButtonElement): ClipboardStatusTarget {
  return {
    button,
    rootSelector,
    stateDatasetKey: "articleShareCopyState",
    statusSelector,
  };
}

function browserRuntime(): ArticleShareRuntime | undefined {
  if (
    typeof document === "undefined" ||
    typeof navigator === "undefined" ||
    typeof window === "undefined"
  ) {
    return undefined;
  }

  return { document, navigator, window };
}

installArticleShare();
