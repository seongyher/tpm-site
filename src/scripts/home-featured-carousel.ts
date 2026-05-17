const activeAttribute = "data-home-featured-active";
const currentAttribute = "aria-current";

/**
 * Installs progressive carousel behavior for homepage featured items.
 *
 * @param rootDocument Browser document that owns homepage featured carousels.
 */
export function installHomeFeaturedCarousels(
  rootDocument: Document = document,
): void {
  rootDocument
    .querySelectorAll<HTMLElement>("[data-home-featured-carousel]")
    .forEach((carousel) => {
      bindCarousel(carousel, rootDocument);
    });
}

function bindCarousel(carousel: HTMLElement, rootDocument: Document): void {
  if (rootDocument.defaultView === null) {
    return;
  }

  const slides = Array.from(
    carousel.querySelectorAll<HTMLElement>("[data-home-featured-slide]"),
  );
  if (slides.length <= 1) {
    return;
  }

  const controls = carousel.querySelector<HTMLElement>(
    "[data-home-featured-controls]",
  );
  const indicatorsRoot = carousel.querySelector<HTMLElement>(
    "[data-home-featured-indicators]",
  );
  const previous = carousel.querySelector<HTMLButtonElement>(
    "[data-home-featured-previous]",
  );
  const next = carousel.querySelector<HTMLButtonElement>(
    "[data-home-featured-next]",
  );
  const indicators = Array.from(
    carousel.querySelectorAll<HTMLButtonElement>(
      "[data-home-featured-indicator]",
    ),
  );
  let activeIndex = activeSlideIndex(slides);

  showChrome(controls);
  showChrome(indicatorsRoot);
  showSlide(slides, indicators, activeIndex);

  const manualShow = (index: number): void => {
    activeIndex = index;
    showSlide(slides, indicators, activeIndex);
  };

  previous?.addEventListener("click", () => {
    manualShow(nextIndex(activeIndex, slides.length, -1));
  });
  next?.addEventListener("click", () => {
    manualShow(nextIndex(activeIndex, slides.length, 1));
  });
  indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", () => {
      manualShow(index);
    });
  });
}

function activeSlideIndex(slides: readonly HTMLElement[]): number {
  const activeIndex = slides.findIndex(
    (slide) => slide.getAttribute(activeAttribute) === "true",
  );

  return activeIndex === -1 ? 0 : activeIndex;
}

function nextIndex(index: number, length: number, direction: -1 | 1): number {
  return (index + direction + length) % length;
}

function showChrome(element: HTMLElement | null): void {
  if (element !== null) {
    element.hidden = false;
    element.classList.add("flex");
  }
}

function showSlide(
  slides: readonly HTMLElement[],
  indicators: readonly HTMLButtonElement[],
  activeIndex: number,
): void {
  slides.forEach((slide, index) => {
    const isActive = index === activeIndex;

    slide.hidden = false;
    slide.setAttribute(activeAttribute, String(isActive));
    slide.setAttribute("aria-hidden", String(!isActive));
    if (isActive) {
      slide.removeAttribute("inert");
    } else {
      slide.setAttribute("inert", "");
    }
  });
  indicators.forEach((indicator, index) => {
    const isActive = index === activeIndex;

    if (isActive) {
      indicator.setAttribute(currentAttribute, "true");
    } else {
      indicator.removeAttribute(currentAttribute);
    }
  });
}

if (typeof document !== "undefined") {
  installHomeFeaturedCarousels();
}
