import assert from "node:assert/strict";

import { expect, type Locator, type Page, test } from "@playwright/test";

import {
  expectApproximatelyEqual,
  expectInlineStartAligned,
  expectNoHorizontalOverflow,
  expectViewportContained,
  visibleBoundingBox,
} from "./helpers/layout";

const articleWithHoverImages = "/articles/social-media-freedom/";

/**
 * Opens the hover-image preview at the provided index.
 *
 * @param page Current Playwright page.
 * @param index Hover-image trigger index.
 * @returns Trigger and panel locators.
 */
async function openHoverPreview(
  page: Page,
  index: number,
): Promise<{ readonly panel: Locator; readonly trigger: Locator }> {
  const card = page.locator("[data-hover-image-card]").nth(index);
  const trigger = card.locator("[data-hover-image-trigger]");
  const panel = card.locator("[data-hover-image-panel]");

  await trigger.hover();
  await expect(panel).toBeVisible();

  return { panel, trigger };
}

/**
 * Returns the hover-image trigger closest to the right viewport edge.
 *
 * @param page Current Playwright page.
 * @returns Locator for the rightmost trigger.
 */
async function rightmostHoverTrigger(page: Page): Promise<Locator> {
  const triggerIndex = await page
    .locator("[data-hover-image-trigger]")
    .evaluateAll((elements) => {
      const indexedElements = elements.map((element, index) => ({
        index,
        right: element.getBoundingClientRect().right,
      }));
      const rightmost = indexedElements.reduce(
        (current, next) => (next.right > current.right ? next : current),
        { index: 0, right: Number.NEGATIVE_INFINITY },
      );

      return rightmost.index;
    });

  return page.locator("[data-hover-image-trigger]").nth(triggerIndex);
}

/**
 * Asserts that the hover preview renders as image-only media, not a padded
 * popover/card surface.
 *
 * @param panel Visible hover-image panel.
 */
async function expectImageOnlyPanel(panel: Locator): Promise<void> {
  const image = panel.locator("img");
  const panelMetrics = await panel.evaluate((element) => {
    const styles = window.getComputedStyle(element);

    return {
      backgroundColor: styles.backgroundColor,
      height: element.clientHeight,
      paddingBlockEnd: styles.paddingBlockEnd,
      paddingBlockStart: styles.paddingBlockStart,
      paddingInlineEnd: styles.paddingInlineEnd,
      paddingInlineStart: styles.paddingInlineStart,
      width: element.clientWidth,
    };
  });
  const imageBox = await visibleBoundingBox(image, "hover-image preview image");

  expect(panelMetrics.backgroundColor).toBe("rgba(0, 0, 0, 0)");
  expect(panelMetrics.paddingBlockEnd).toBe("0px");
  expect(panelMetrics.paddingBlockStart).toBe("0px");
  expect(panelMetrics.paddingInlineEnd).toBe("0px");
  expect(panelMetrics.paddingInlineStart).toBe("0px");
  expectApproximatelyEqual(panelMetrics.width, imageBox.width);
  expectApproximatelyEqual(panelMetrics.height, imageBox.height);
}

/**
 * Returns a required attribute value with a useful failure message.
 *
 * @param locator Locator expected to have the attribute.
 * @param name Attribute name.
 * @returns Attribute value.
 */
async function requiredAttribute(
  locator: Locator,
  name: string,
): Promise<string> {
  const value = await locator.getAttribute(name);

  if (value === null) {
    throw new Error(`Expected ${name} attribute to be present.`);
  }

  return value;
}

test.describe("native Astro hover-image previews", () => {
  test("stay inline, anchored, and viewport-contained on desktop", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto(articleWithHoverImages);

    const { panel, trigger } = await openHoverPreview(page, 0);

    await expectInlineStartAligned(trigger, panel);
    await expect(panel.locator("img")).toHaveAttribute("loading", "lazy");
    await expectImageOnlyPanel(panel);
    await expectViewportContained(page, panel, "hover-image panel");
    await expectNoHorizontalOverflow(page);
  });

  test("shift into the viewport near the left edge on mobile widths", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 720, width: 390 });
    await page.goto(articleWithHoverImages);

    const { panel } = await openHoverPreview(page, 0);

    await expect(panel).toHaveAttribute("data-anchor-detached", "false");
    await expectViewportContained(page, panel, "hover-image panel");
    await expectNoHorizontalOverflow(page);
  });

  test("remain viewport-contained near the right edge in dark mode", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 760, width: 900 });
    await page.goto(articleWithHoverImages);
    await page.locator(".theme-toggle").first().click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    const trigger = await rightmostHoverTrigger(page);
    await trigger.scrollIntoViewIfNeeded();
    const panel = trigger
      .locator("xpath=ancestor::*[@data-hover-image-card][1]")
      .locator("[data-hover-image-panel]");

    await trigger.hover();
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute("data-anchor-detached", "false");
    await expectViewportContained(page, panel, "hover-image panel");
    await expectNoHorizontalOverflow(page);
  });

  test("flip above the trigger when bottom space is insufficient", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 520, width: 900 });
    await page.goto(articleWithHoverImages);

    const trigger = page.locator("[data-hover-image-trigger]").first();
    await trigger.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      window.scrollBy({
        top: rect.bottom - window.innerHeight + 32,
      });
    });

    const panel = trigger
      .locator("xpath=ancestor::*[@data-hover-image-card][1]")
      .locator("[data-hover-image-panel]");

    await trigger.hover();
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute("data-anchor-placement", "top-start");
    await expectViewportContained(page, panel, "hover-image panel");
  });

  test("open on keyboard focus and close with Escape", async ({ page }) => {
    await page.setViewportSize({ height: 720, width: 900 });
    await page.goto(articleWithHoverImages);

    const card = page.locator("[data-hover-image-card]").first();
    const trigger = card.locator("[data-hover-image-trigger]");
    const panel = card.locator("[data-hover-image-panel]");

    await trigger.focus();
    await expect(panel).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expectImageOnlyPanel(panel);
    await expectViewportContained(page, panel, "hover-image panel");

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  });

  test("open on touch tap, dismiss outside, and keep a full-image path", async ({
    baseURL,
    browser,
  }) => {
    assert(
      baseURL !== undefined,
      "Expected the preview server base URL to be configured.",
    );

    const context = await browser.newContext({
      baseURL,
      hasTouch: true,
      viewport: { height: 720, width: 390 },
    });
    const page = await context.newPage();

    try {
      await page.goto(articleWithHoverImages);

      const card = page.locator("[data-hover-image-card]").first();
      const trigger = card.locator("[data-hover-image-trigger]");
      const panel = card.locator("[data-hover-image-panel]");
      const triggerHref = await requiredAttribute(trigger, "href");

      await trigger.tap();
      await expect(page).toHaveURL(
        new RegExp(`${articleWithHoverImages}$`, "u"),
      );
      await expect(panel).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(panel.locator(`a[href="${triggerHref}"]`)).toHaveCount(1);
      await expectImageOnlyPanel(panel);
      await expectViewportContained(page, panel, "hover-image panel");

      await page.touchscreen.tap(16, 700);
      await expect(panel).toBeHidden();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    } finally {
      await context.close();
    }
  });
});
