import assert from "node:assert/strict";

import { expect, type Locator, type Page, test } from "@playwright/test";

import {
  expectInlineStartAligned,
  expectNoHorizontalOverflow,
  expectPanelBelowHeader,
  expectViewportContained,
  visibleBoundingBox,
} from "./helpers/layout";

/**
 * Opens the visible category dropdown at an index.
 *
 * @param page Current Playwright page.
 * @param index Category dropdown index.
 * @returns Trigger and panel locators.
 */
async function openCategoryDropdown(
  page: Page,
  index: number,
): Promise<{ readonly panel: Locator; readonly trigger: Locator }> {
  const dropdown = page.locator("[data-category-dropdown]").nth(index);
  const trigger = dropdown.locator("[data-anchor-trigger]");
  const panel = dropdown.locator("[data-category-preview]");

  await trigger.hover();
  await expect(panel).toBeVisible();

  return { panel, trigger };
}

/**
 * Reads a required attribute from a locator.
 *
 * @param locator Element locator.
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

test.describe("anchored header surfaces", () => {
  test("closed anchored panels do not receive measured placement state", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto("/");

    await expect(
      page.locator("[data-category-preview]").first(),
    ).not.toHaveAttribute("data-anchor-placement");
    await expect(page.locator("#site-search-reveal")).not.toHaveAttribute(
      "data-anchor-placement",
    );
  });

  test("desktop search snaps to the header bottom and start-aligns to its trigger", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto("/");

    const trigger = page.locator("[data-search-reveal-trigger]").first();
    const panel = page.locator("#site-search-reveal");

    await trigger.click();
    await expect(panel).toBeVisible();

    await expectPanelBelowHeader(page, panel);
    await expectInlineStartAligned(trigger, panel);
    await expectViewportContained(page, panel, "search panel");
    await expectNoHorizontalOverflow(page);
  });

  test("category dropdowns snap to the header and use trigger-relative inline alignment", async ({
    page,
  }) => {
    for (const viewport of [
      { height: 900, width: 768 },
      { height: 900, width: 1280 },
      { height: 1100, width: 1800 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/");

      const first = await openCategoryDropdown(page, 0);
      await expect(first.panel).toHaveAttribute(
        "data-anchor-placement",
        "bottom-start",
      );
      await expectPanelBelowHeader(page, first.panel);
      await expectInlineStartAligned(first.trigger, first.panel);
      await expectViewportContained(page, first.panel, "first category panel");

      const dropdownCount = await page
        .locator("[data-category-dropdown]")
        .count();
      const middle = await openCategoryDropdown(
        page,
        Math.floor(dropdownCount / 2),
      );
      await expectPanelBelowHeader(page, middle.panel);
      await expectViewportContained(
        page,
        middle.panel,
        "middle category panel",
      );

      const last = await openCategoryDropdown(page, dropdownCount - 1);
      await expect(last.panel).toHaveAttribute(
        "data-anchor-placement",
        /bottom-(?:start|end)/u,
      );
      await expectPanelBelowHeader(page, last.panel);
      await expectViewportContained(page, last.panel, "last category panel");

      await expectNoHorizontalOverflow(page);
    }
  });

  test("category dropdown remains open while the pointer moves from trigger to panel", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto("/");

    const { panel, trigger } = await openCategoryDropdown(page, 0);
    const triggerBox = await visibleBoundingBox(trigger, "category trigger");
    const panelBox = await visibleBoundingBox(panel, "category preview panel");

    await page.mouse.move(
      triggerBox.x + triggerBox.width / 2,
      triggerBox.y + triggerBox.height - 1,
    );
    await page.mouse.move(panelBox.x + 16, panelBox.y + 8, { steps: 12 });

    await expect(panel).toBeVisible();
  });

  test("category disclosure button opens with keyboard focus and closes with Escape", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto("/");

    const dropdown = page.locator("[data-category-dropdown]").first();
    const button = dropdown.locator("[data-category-disclosure-trigger]");
    const panel = dropdown.locator("[data-category-preview]");

    await button.focus();
    await expect(panel).toBeVisible();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expectPanelBelowHeader(page, panel);

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(button).toHaveAttribute("aria-expanded", "false");
  });

  test("touch users can open category previews without losing direct category navigation", async ({
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
      viewport: { height: 768, width: 1024 },
    });
    const page = await context.newPage();

    try {
      await page.goto("/");

      const dropdown = page.locator("[data-category-dropdown]").first();
      const categoryLink = dropdown.locator("[data-anchor-trigger]");
      const button = dropdown.locator("[data-category-disclosure-trigger]");
      const panel = dropdown.locator("[data-category-preview]");
      const categoryHref = await requiredAttribute(categoryLink, "href");

      await button.tap();
      await expect(panel).toBeVisible();
      await expect(button).toHaveAttribute("aria-expanded", "true");
      await expectPanelBelowHeader(page, panel);
      await expectViewportContained(page, panel, "touch category panel");

      await page.touchscreen.tap(16, 740);
      await expect(panel).toBeHidden();
      await expect(button).toHaveAttribute("aria-expanded", "false");

      await button.tap();
      await expect(panel).toBeVisible();
      await categoryLink.tap();
      await expect(page).toHaveURL(`${baseURL}${categoryHref}`);
    } finally {
      await context.close();
    }
  });

  test("mobile menu is viewport-safe and internally scrollable on short screens", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 420, width: 320 });
    await page.goto("/");

    await page.getByLabel("Open navigation menu").click();

    const panel = page.locator("[data-mobile-menu-panel]");
    const panelBox = await visibleBoundingBox(panel, "mobile menu panel");

    await expect(panel).toBeVisible();
    await expectPanelBelowHeader(page, panel);
    await expectViewportContained(page, panel, "mobile menu panel");
    expect(panelBox.x).toBe(0);
    expect(panelBox.width).toBe(320);
    await expect(panel.getByRole("searchbox")).toBeVisible();
    await expect(panel.locator(".theme-toggle")).toBeVisible();
    await expect(panel.getByRole("link", { name: "RSS" })).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test("click-owned anchored surfaces keep their relationship after scroll, resize, and theme changes", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 760, width: 1024 });
    await page.goto("/");

    const trigger = page.locator("[data-search-reveal-trigger]").first();
    const panel = page.locator("#site-search-reveal");

    await trigger.click();
    await expect(panel).toBeVisible();

    await page.evaluate(() => window.scrollBy({ top: 240 }));
    await expect(panel).toBeVisible();
    await expectPanelBelowHeader(page, panel);
    await expectInlineStartAligned(trigger, panel);
    await expectViewportContained(page, panel, "scrolled search panel");

    await page.setViewportSize({ height: 700, width: 900 });
    await expect(panel).toBeVisible();
    await expectPanelBelowHeader(page, panel);
    await expectViewportContained(page, panel, "resized search panel");

    await page.evaluate(() => {
      document.documentElement.dataset["theme"] = "dark";
      window.dispatchEvent(new Event("resize"));
    });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(panel).toBeVisible();
    await expectPanelBelowHeader(page, panel);
    await expectViewportContained(page, panel, "dark-mode search panel");
    await expectNoHorizontalOverflow(page);
  });
});
