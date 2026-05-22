import { existsSync } from "node:fs";
import path from "node:path";

import { AxeBuilder } from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import {
  expectFocusVisible,
  expectHorizontallyContained,
  expectNoHorizontalOverflow,
  viewportMatrix,
} from "./helpers/layout";

const activeOutputDir = process.env["SITE_OUTPUT_DIR"] ?? "dist";
const catalogIsBuilt = existsSync(
  path.join(activeOutputDir, "catalog", "index.html"),
);

async function setTheme(page: Page, theme: "dark" | "light"): Promise<void> {
  await page.evaluate((nextTheme) => {
    document.documentElement.dataset["theme"] = nextTheme;
    localStorage.setItem("theme", nextTheme);
  }, theme);
}

if (!catalogIsBuilt) {
  test("component catalog route is absent in normal production builds", async ({
    request,
  }) => {
    const response = await request.get("/catalog/");
    expect(response.status()).toBe(404);
  });
} else {
  for (const viewport of viewportMatrix) {
    test(`catalog examples stay contained at ${viewport.label}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        height: viewport.height,
        width: viewport.width,
      });
      await page.goto("/catalog/");
      await expect(
        page.getByRole("heading", { name: "Platform Component Catalog" }),
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);

      const examples = page.locator("[data-catalog-component]");
      const count = await examples.count();
      expect(count).toBeGreaterThan(20);

      for (let index = 0; index < Math.min(count, 12); index += 1) {
        const example = examples.nth(index);
        const preview = example.locator("[data-catalog-preview]");
        await expectHorizontallyContained(preview, example, {
          inner: "catalog preview",
          outer: "catalog example",
        });
      }

      await setTheme(page, "light");
      await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
      await expectNoHorizontalOverflow(page);
    });
  }

  test("catalog shows support and danger button states with visible labels", async ({
    page,
  }) => {
    await page.goto("/catalog/");
    const linkButtonExample = page.locator(
      '[data-catalog-component="src/components/ui/LinkButton.astro"]',
    );
    await expect(
      linkButtonExample.getByRole("link", { name: "Support Us" }),
    ).toBeVisible();

    const buttonExample = page.locator(
      '[data-catalog-component="src/components/ui/Button.astro"]',
    );
    await expect(
      buttonExample.getByRole("button", { name: "Danger" }),
    ).toBeVisible();

    await setTheme(page, "light");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(
      linkButtonExample.getByRole("link", { name: "Support Us" }),
    ).toBeVisible();
    await expect(
      buttonExample.getByRole("button", { name: "Danger" }),
    ).toBeVisible();
  });

  test("catalog article list uses flat rows with bounded optional media", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto("/catalog/");

    const example = page.locator(
      '[data-catalog-component="src/components/articles/ArticleList.astro"][data-catalog-example="ArticleList"]',
    );
    const rows = example.locator("[data-article-card]");
    const imageBackedRow = rows.nth(0);
    const noImageRow = rows.nth(1);
    const minimumTitleRow = rows.nth(2);

    await expect(rows).toHaveCount(3);
    await expect(imageBackedRow).toHaveAttribute(
      "data-article-card-has-image",
      "true",
    );
    await expect(noImageRow).toHaveAttribute(
      "data-article-card-has-image",
      "false",
    );
    await expect(
      imageBackedRow.locator("[data-article-card-image-link]"),
    ).toBeVisible();
    await expect(
      noImageRow.locator("[data-article-card-image-link]"),
    ).toHaveCount(0);

    const imageBox = await imageBackedRow
      .locator("[data-article-card-image-link]")
      .boundingBox();
    expect(imageBox?.width ?? 0).toBeGreaterThan(150);
    expect(imageBox?.width ?? 0).toBeLessThanOrEqual(300);
    expect(imageBox?.height ?? 0).toBeGreaterThan(150);
    expect(imageBox?.width ?? 0).toBeGreaterThan(
      (imageBox?.height ?? 0) * 1.45,
    );
    await expect(
      imageBackedRow.locator("[data-article-card-title]"),
    ).toHaveAttribute("data-article-card-title-fit", "dense");
    await expect(
      minimumTitleRow.locator("[data-article-card-title]"),
    ).toHaveAttribute("data-article-card-title-fit", "minimum");
    await expect(
      minimumTitleRow.locator("[data-article-card-description]"),
    ).toHaveAttribute("data-article-card-description-fit", "compact");

    const minimumTitleMetrics = await minimumTitleRow
      .locator("[data-article-card-title]")
      .evaluate((element) => {
        const styles = getComputedStyle(element);
        const lineHeight = Number(styles.lineHeight.replace("px", ""));
        const rect = element.getBoundingClientRect();

        return {
          height: rect.height,
          lineHeight,
        };
      });
    expect(minimumTitleMetrics.height).toBeLessThanOrEqual(
      minimumTitleMetrics.lineHeight * 2 + 2,
    );
    const compactDescriptionMetrics = await minimumTitleRow
      .locator("[data-article-card-description]")
      .evaluate((element) => {
        const styles = getComputedStyle(element);
        const lineHeight = Number(styles.lineHeight.replace("px", ""));
        const rect = element.getBoundingClientRect();

        return {
          height: rect.height,
          lineHeight,
        };
      });
    expect(compactDescriptionMetrics.height).toBeLessThanOrEqual(
      compactDescriptionMetrics.lineHeight * 3 + 2,
    );

    await expectHorizontallyContained(imageBackedRow, example, {
      inner: "image-backed article row",
      outer: "article list catalog example",
    });
    await expectHorizontallyContained(noImageRow, example, {
      inner: "no-image article row",
      outer: "article list catalog example",
    });
    await expectNoHorizontalOverflow(page);

    await page.setViewportSize({ height: 740, width: 390 });
    await expect(imageBackedRow).toBeVisible();
    const mobileImageBox = await imageBackedRow
      .locator("[data-article-card-image-link]")
      .boundingBox();
    expect(mobileImageBox?.width ?? 0).toBeGreaterThanOrEqual(78);
    expect(mobileImageBox?.width ?? 0).toBeLessThanOrEqual(82);
    expect(
      Math.abs((mobileImageBox?.width ?? 0) - (mobileImageBox?.height ?? 0)),
    ).toBeLessThanOrEqual(2);
    await expectHorizontallyContained(imageBackedRow, example, {
      inner: "mobile image-backed article row",
      outer: "article list catalog example",
    });
    await expectNoHorizontalOverflow(page);
  });

  test("catalog covers simplified editorial image policies and inspection behavior", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto("/catalog/");

    for (const [exampleTitle, policy, isInspectable] of [
      ["ArticleImage - Default", "bounded", "true"],
      ["ArticleImage - Captioned", "bounded", "true"],
      ["ArticleImage - Long Alt", "bounded", "true"],
      ["ArticleImage - Natural", "natural", "false"],
      ["Generated Markdown Image - Unknown", "bounded", "true"],
      ["Generated Markdown Linked Image", "bounded", "false"],
    ] as const) {
      const example = page.locator(`[data-catalog-example="${exampleTitle}"]`);
      await example.scrollIntoViewIfNeeded();
      await expect(example).toBeVisible();
      await expect(
        example.locator(
          `[data-article-image-policy="${policy}"][data-article-image-inspectable="${isInspectable}"]`,
        ),
      ).toBeVisible();
    }

    const inspectableExample = page.locator(
      '[data-catalog-example="ArticleImage - Default"]',
    );
    await expect(
      page
        .locator('[data-catalog-example="Generated Markdown Linked Image"]')
        .locator("[data-article-image-inspect-trigger]"),
    ).toHaveCount(0);
    const trigger = inspectableExample.getByRole("button", {
      name: /View full image/u,
    });
    await trigger.focus();
    await expectFocusVisible(page);
    const scrollBeforeOpen = await page.evaluate(() => window.scrollY);
    await trigger.evaluate((element) => {
      if (!(element instanceof HTMLButtonElement)) {
        throw new TypeError("Article image trigger must be a button.");
      }

      element.click();
    });

    const dialog = page.locator("[data-article-image-dialog]");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.locator("[data-article-image-dialog-image]"),
    ).toHaveAttribute("alt", "A bounded article image preview");
    const closeButton = dialog.locator("[data-article-image-dialog-close]");
    await expect(closeButton).toHaveAttribute(
      "aria-label",
      "Close image viewer",
    );
    await closeButton.click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    const scrollAfterClose = await page.evaluate(() => window.scrollY);
    expect(Math.abs(scrollAfterClose - scrollBeforeOpen)).toBeLessThanOrEqual(
      1,
    );
    await expectNoHorizontalOverflow(page);
  });

  test("catalog article references keep markers and backlinks keyboard navigable", async ({
    page,
  }) => {
    await page.goto("/catalog/");

    const example = page.locator(
      '[data-catalog-component="src/components/articles/ArticleReferences.astro"]',
    );
    const marker = example.locator("#cite-ref-baudrillard-1981");
    const entry = example.locator("#cite-baudrillard-1981");
    const backlink = example.locator("#cite-backref-baudrillard-1981");

    await expect(marker).toBeVisible();
    await expect(entry).toBeVisible();
    await expect(backlink).toBeVisible();

    await marker.focus();
    await expectFocusVisible(page);
    await marker.click();
    await expect(page).toHaveURL(/#cite-baudrillard-1981$/u);

    await backlink.focus();
    await expectFocusVisible(page);
    await backlink.click();
    await expect(page).toHaveURL(/#cite-ref-baudrillard-1981$/u);
  });

  test("catalog article references expose citation and backlink previews", async ({
    page,
  }) => {
    await page.goto("/catalog/");

    const example = page.locator(
      '[data-catalog-component="src/components/articles/ArticleReferences.astro"]',
    );
    const marker = example.locator("#cite-ref-baudrillard-1981");
    const backlink = example.locator("#cite-backref-baudrillard-1981");
    const panel = example.locator("[data-article-reference-preview]");
    const panelContent = panel.locator(
      "[data-article-reference-preview-content]",
    );

    await marker.hover();
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute(
      "data-reference-preview-source",
      "definition",
    );
    await expect(panelContent).toContainText("Simulacra");
    await expect(panel.getByText("Go to bibliography entry")).toHaveCount(0);
    await expectHorizontallyContained(panel, page.locator("body"), {
      inner: "article reference preview",
      outer: "page",
    });

    await backlink.hover();
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute(
      "data-reference-preview-source",
      "context",
    );
    await expect(panelContent).toContainText(
      "A catalog paragraph can point to an explanatory note",
    );
    await expect(panel.getByText("Go to source")).toHaveCount(0);
  });

  test("catalog article references have sensible accessibility structure", async ({
    page,
  }) => {
    await page.goto("/catalog/");

    const exampleSelector =
      '[data-catalog-component="src/components/articles/ArticleReferences.astro"]';
    const example = page.locator(exampleSelector);

    await expect(example.getByRole("heading", { name: "Notes" })).toBeVisible();
    await expect(
      example.getByRole("heading", { name: "Bibliography" }),
    ).toBeVisible();
    await expect(
      example.getByRole("navigation", {
        name: "Backlinks for citation references",
      }),
    ).toBeVisible();
    await expect(example.locator("main")).toHaveCount(0);

    const duplicateIds = await example.evaluate((element) => {
      const seen = new Set<string>();
      const duplicates = new Set<string>();

      for (const elementWithId of element.querySelectorAll("[id]")) {
        const id = elementWithId.id;

        if (seen.has(id)) {
          duplicates.add(id);
        }

        seen.add(id);
      }

      return Array.from(duplicates);
    });

    expect(duplicateIds).toEqual([]);

    const results = await new AxeBuilder({ page })
      .include(exampleSelector)
      .analyze();
    const severeViolations = results.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical",
    );

    expect(severeViolations).toEqual([]);

    await setTheme(page, "light");
    await expect(example.locator("#cite-ref-baudrillard-1981")).toBeVisible();
    await expect(
      example.locator("#cite-backref-baudrillard-1981"),
    ).toBeVisible();
  });

  for (const viewport of viewportMatrix) {
    test(`catalog article references stay contained at ${viewport.label}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        height: viewport.height,
        width: viewport.width,
      });
      await page.goto("/catalog/");

      const example = page.locator(
        '[data-catalog-component="src/components/articles/ArticleReferences.astro"]',
      );
      const references = example.locator("[data-article-references]");

      await expect(references).toBeVisible();
      await expectHorizontallyContained(references, example, {
        inner: "article references",
        outer: "article references catalog example",
      });
      await expectNoHorizontalOverflow(page);
    });
  }
}
