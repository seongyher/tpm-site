import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";

import { installHomeFeaturedCarousels } from "../../../src/scripts/home-featured-carousel";

describe("home featured carousel browser script", () => {
  test("reveals controls and advances slides with buttons", () => {
    const window = carouselWindow();
    const document = window.document;

    appendCarouselFixture(browserDocument(document));
    installHomeFeaturedCarousels(browserDocument(document));

    const controls = requiredHtmlElement(
      document.querySelector("[data-home-featured-controls]"),
    );
    const next = requiredElement(
      document.querySelector("[data-home-featured-next]"),
    );
    const first = requiredHtmlElement(
      document.querySelectorAll("[data-home-featured-slide]").item(0),
    );
    const second = requiredHtmlElement(
      document.querySelectorAll("[data-home-featured-slide]").item(1),
    );

    expect(controls.hidden).toBe(false);
    expect(first.hidden).toBe(false);
    expect(second.hidden).toBe(false);
    expect(second.getAttribute("aria-hidden")).toBe("true");
    expect(second.hasAttribute("inert")).toBe(true);

    next.dispatchEvent(new window.Event("click"));

    expect(first.hidden).toBe(false);
    expect(first.getAttribute("aria-hidden")).toBe("true");
    expect(first.hasAttribute("inert")).toBe(true);
    expect(second.hidden).toBe(false);
    expect(second.getAttribute("aria-hidden")).toBe("false");
    expect(second.hasAttribute("inert")).toBe(false);
  });

  test("does not start auto-rotation by default", () => {
    const window = carouselWindow();
    const document = window.document;
    const intervals: TimerHandler[] = [];

    Reflect.set(window, "setInterval", (handler: TimerHandler) => {
      intervals.push(handler);

      return intervals.length;
    });
    appendCarouselFixture(browserDocument(document));
    installHomeFeaturedCarousels(browserDocument(document));

    expect(intervals).toEqual([]);
  });

  test("switches slides with indicators", () => {
    const window = carouselWindow();
    const document = window.document;

    appendCarouselFixture(browserDocument(document));
    installHomeFeaturedCarousels(browserDocument(document));

    const first = requiredHtmlElement(
      document.querySelectorAll("[data-home-featured-slide]").item(0),
    );
    const second = requiredHtmlElement(
      document.querySelectorAll("[data-home-featured-slide]").item(1),
    );
    const secondIndicator = requiredElement(
      document.querySelectorAll("[data-home-featured-indicator]").item(1),
    );

    secondIndicator.dispatchEvent(new window.Event("click"));

    expect(first.getAttribute("aria-hidden")).toBe("true");
    expect(second.getAttribute("aria-hidden")).toBe("false");
    expect(secondIndicator.getAttribute("aria-current")).toBe("true");
  });
});

function appendCarouselFixture(document: Document): void {
  const section = document.createElement("section");
  section.setAttribute("data-home-featured-carousel", "");

  const controls = document.createElement("div");
  controls.setAttribute("data-home-featured-controls", "");
  controls.hidden = true;

  const previous = document.createElement("button");
  previous.setAttribute("data-home-featured-previous", "");
  previous.textContent = "Previous";

  const next = document.createElement("button");
  next.setAttribute("data-home-featured-next", "");
  next.textContent = "Next";

  const firstSlide = document.createElement("article");
  firstSlide.setAttribute("aria-hidden", "false");
  firstSlide.setAttribute("data-home-featured-active", "true");
  firstSlide.setAttribute("data-home-featured-slide", "");
  firstSlide.textContent = "One";

  const secondSlide = document.createElement("article");
  secondSlide.setAttribute("aria-hidden", "true");
  secondSlide.setAttribute("data-home-featured-active", "false");
  secondSlide.setAttribute("data-home-featured-slide", "");
  secondSlide.hidden = true;
  secondSlide.textContent = "Two";

  const indicators = document.createElement("div");
  indicators.setAttribute("data-home-featured-indicators", "");
  indicators.hidden = true;

  const firstIndicator = document.createElement("button");
  firstIndicator.setAttribute("aria-current", "true");
  firstIndicator.setAttribute("data-home-featured-index", "0");
  firstIndicator.setAttribute("data-home-featured-indicator", "");
  firstIndicator.textContent = "One";

  const secondIndicator = document.createElement("button");
  secondIndicator.setAttribute("data-home-featured-index", "1");
  secondIndicator.setAttribute("data-home-featured-indicator", "");
  secondIndicator.textContent = "Two";

  controls.append(previous, next);
  indicators.append(firstIndicator, secondIndicator);
  section.append(controls, firstSlide, secondSlide, indicators);
  document.body.replaceChildren(section);
}

function carouselWindow(): Window {
  const window = new Window();

  Reflect.set(window, "SyntaxError", SyntaxError);
  Reflect.set(window, "matchMedia", () => ({
    addEventListener: () => undefined,
    matches: false,
  }));

  return window;
}

function requiredElement<T>(element: null | T): T {
  if (element === null) {
    throw new Error("Expected carousel fixture element.");
  }

  return element;
}

function requiredHtmlElement(element: unknown): HTMLElement {
  if (element === null) {
    throw new Error("Expected carousel fixture element.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM implements browser elements at runtime but exposes package-local DOM types.
  return element as HTMLElement;
}

function browserDocument(document: unknown): Document {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM implements browser documents at runtime but exposes package-local DOM types.
  return document as Document;
}
