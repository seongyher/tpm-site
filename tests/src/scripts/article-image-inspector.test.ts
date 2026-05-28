import { describe, expect, test } from "bun:test";
import { Window as HappyWindow } from "happy-dom";

import { installArticleImageInspector } from "../../../src/scripts/article-image-inspector";

type TestWindow = InstanceType<typeof HappyWindow>;

describe("article image inspector browser script", () => {
  test("opens an inspection dialog from an image trigger and restores focus on close", () => {
    const window = testWindow();
    const document = browserDocument(window);
    const { button, image } = appendInspectableFigure(document);
    image.src = "/images/thread.png";
    image.srcset =
      "/images/thread-small.png 480w, /images/thread-large.png 1200w";
    image.alt = "Long thread screenshot";

    installArticleImageInspector({ document });
    button.focus();
    button.dispatchEvent(
      browserEvent(
        new window.MouseEvent("click", { bubbles: true, cancelable: true }),
      ),
    );

    const dialog = requiredDialog(document);
    const dialogImage = requiredDialogImage(document);
    const close = requiredDialogClose(document);

    expect(dialog.open).toBe(true);
    expect(dialogImage.alt).toBe("Long thread screenshot");
    expect(dialogImage.src).toBe("https://example.com/images/thread.png");
    expect(dialogImage.getAttribute("srcset")).toContain("thread-large");
    expect(document.activeElement).toBe(close);
    expect(close.getAttribute("aria-label")).toBe("Close image viewer");
    expect(close.textContent).toBe("");

    close.dispatchEvent(
      browserEvent(
        new window.MouseEvent("click", { bubbles: true, cancelable: true }),
      ),
    );

    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(button);
  });

  test("copies captions and supports backdrop dismissal", () => {
    const window = testWindow();
    const document = browserDocument(window);
    appendInspectableFigure(document, "Full thread caption.");

    installArticleImageInspector({ document });
    requiredInspectTrigger(document).click();

    const dialog = requiredDialog(document);
    const caption = requiredDialogCaption(document);
    const viewport = requiredDialogViewport(document);

    expect(caption.hidden).toBe(false);
    expect(caption.textContent).toBe("Full thread caption.");

    viewport.dispatchEvent(
      browserEvent(
        new window.MouseEvent("click", { bubbles: true, cancelable: true }),
      ),
    );

    expect(dialog.open).toBe(false);
  });

  test("dismisses when native dialog backdrop clicks target the dialog", () => {
    const window = testWindow();
    const document = browserDocument(window);
    appendInspectableFigure(document);

    installArticleImageInspector({ document });
    requiredInspectTrigger(document).click();
    const dialog = requiredDialog(document);

    dialog.dispatchEvent(
      browserEvent(
        new window.MouseEvent("click", { bubbles: true, cancelable: true }),
      ),
    );

    expect(dialog.open).toBe(false);
  });

  test("uses native dialog show and close methods when available", () => {
    const window = testWindow();
    const document = browserDocument(window);
    const dialogPrototype = Reflect.getPrototypeOf(
      document.createElement("dialog"),
    );
    if (dialogPrototype === null) {
      throw new Error("Expected dialog prototype.");
    }
    let showCount = 0;
    let closeCount = 0;
    Reflect.set(
      dialogPrototype,
      "showModal",
      function showModal(this: HTMLDialogElement) {
        showCount += 1;
        this.setAttribute("open", "");
      },
    );
    Reflect.set(
      dialogPrototype,
      "close",
      function close(this: HTMLDialogElement) {
        closeCount += 1;
        this.removeAttribute("open");
        this.dispatchEvent(browserEvent(new window.Event("close")));
      },
    );
    appendInspectableFigure(document);

    installArticleImageInspector({ document });
    requiredInspectTrigger(document).click();
    requiredDialogClose(document).click();

    expect(showCount).toBe(1);
    expect(closeCount).toBe(1);
    expect(requiredDialog(document).open).toBe(false);
  });

  test("installs once and reuses the existing dialog on later opens", () => {
    const window = testWindow();
    const document = browserDocument(window);
    const first = appendInspectableFigure(document, "First caption.");
    const second = appendInspectableFigure(document, "Second caption.");
    first.image.src = "/images/first.png";
    second.image.src = "/images/second.png";

    installArticleImageInspector({ document });
    installArticleImageInspector({ document });
    first.button.click();
    const dialog = requiredDialog(document);
    const dialogImage = requiredDialogImage(document);

    expect(dialogImage.src).toBe("https://example.com/images/first.png");
    requiredDialogClose(document).click();
    second.button.click();

    expect(requiredDialog(document)).toBe(dialog);
    expect(dialogImage.src).toBe("https://example.com/images/second.png");
    expect(requiredDialogCaption(document).textContent).toBe("Second caption.");
  });

  test("supports browsers without native dialog methods", () => {
    const window = testWindow();
    const document = browserDocument(window);
    const dialogPrototype = Reflect.getPrototypeOf(
      document.createElement("dialog"),
    );
    if (dialogPrototype === null) {
      throw new Error("Expected dialog prototype.");
    }
    Reflect.set(dialogPrototype, "showModal", undefined);
    Reflect.set(dialogPrototype, "close", undefined);
    const { button } = appendInspectableFigure(document);

    installArticleImageInspector({ document });
    button.focus();
    button.click();
    const dialog = requiredDialog(document);

    expect(dialog.hasAttribute("open")).toBe(true);
    dialog.dispatchEvent(
      browserEvent(
        new window.KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: "Escape",
        }),
      ),
    );

    expect(dialog.hasAttribute("open")).toBe(false);
    expect(document.activeElement).toBe(button);
  });

  test("ignores non-element clicks and figures without images", () => {
    const window = testWindow();
    const document = browserDocument(window);
    const figure = document.createElement("figure");
    const button = document.createElement("button");
    figure.dataset["articleImageFigure"] = "true";
    button.dataset["articleImageInspectTrigger"] = "true";
    figure.append(button);
    document.body.append(figure);

    installArticleImageInspector({ document });
    document.dispatchEvent(browserEvent(new window.Event("click")));
    button.click();

    expect(document.querySelector("[data-article-image-dialog]")).toBeNull();
  });

  test("ignores incomplete inspectable markup safely", () => {
    const window = testWindow();
    const document = browserDocument(window);
    const button = document.createElement("button");
    button.dataset["articleImageInspectTrigger"] = "true";
    document.body.append(button);

    installArticleImageInspector({ document });
    button.click();

    expect(document.querySelector("[data-article-image-dialog]")).toBeNull();
  });

  test("installs from ambient browser globals when runtime is omitted", () => {
    const window = testWindow();
    const document = browserDocument(window);
    appendInspectableFigure(document);

    Reflect.set(globalThis, "document", document);

    try {
      installArticleImageInspector();
      requiredInspectTrigger(document).click();
    } finally {
      Reflect.deleteProperty(globalThis, "document");
    }

    expect(requiredDialog(document).open).toBe(true);
  });
});

function testWindow(): TestWindow {
  const window = new HappyWindow({
    url: "https://example.com/articles/demo/",
  });
  Reflect.set(window, "SyntaxError", SyntaxError);

  return window;
}

function browserDocument(window: TestWindow): Document {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM implements browser Document at runtime but exposes package-local DOM types.
  return window.document as unknown as Document;
}

function browserEvent(event: unknown): Event {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM implements browser Event at runtime but exposes package-local DOM types.
  return event as Event;
}

function appendInspectableFigure(
  document: Document,
  captionText = "",
): { button: HTMLButtonElement; image: HTMLImageElement } {
  const figure = document.createElement("figure");
  figure.dataset["articleImageFigure"] = "true";
  const button = document.createElement("button");
  button.dataset["articleImageInspectTrigger"] = "true";
  const image = document.createElement("img");
  image.dataset["articleImage"] = "true";
  image.src = "/images/thread.png";
  image.alt = "Thread";
  const caption = document.createElement("figcaption");
  caption.textContent = captionText;
  button.append(image);
  figure.append(button, caption);
  document.body.append(figure);

  return { button, image };
}

function requiredDialog(document: Document): HTMLDialogElement {
  const element = document.querySelector<HTMLDialogElement>(
    "[data-article-image-dialog]",
  );

  if (element === null) {
    throw new Error("Missing element: dialog");
  }

  return element;
}

function requiredDialogImage(document: Document): HTMLImageElement {
  const element = document.querySelector<HTMLImageElement>(
    "[data-article-image-dialog-image]",
  );

  if (element === null) {
    throw new Error("Missing element: dialog image");
  }

  return element;
}

function requiredDialogClose(document: Document): HTMLButtonElement {
  const element = document.querySelector<HTMLButtonElement>(
    "[data-article-image-dialog-close]",
  );

  if (element === null) {
    throw new Error("Missing element: dialog close");
  }

  return element;
}

function requiredDialogCaption(document: Document): HTMLElement {
  const element = document.querySelector<HTMLElement>(
    "[data-article-image-dialog-caption]",
  );

  if (element === null) {
    throw new Error("Missing element: dialog caption");
  }

  return element;
}

function requiredDialogViewport(document: Document): HTMLElement {
  const element = document.querySelector<HTMLElement>(
    "[data-article-image-dialog-viewport]",
  );

  if (element === null) {
    throw new Error("Missing element: dialog viewport");
  }

  return element;
}

function requiredInspectTrigger(document: Document): HTMLButtonElement {
  const element = document.querySelector<HTMLButtonElement>(
    "[data-article-image-inspect-trigger]",
  );

  if (element === null) {
    throw new Error("Missing element: inspect trigger");
  }

  return element;
}
