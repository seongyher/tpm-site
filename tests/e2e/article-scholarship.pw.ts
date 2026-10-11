import { expect, test } from "@playwright/test";

test.describe("article scholarship and browser printing", () => {
  test("article pages expose Scholar metadata without generated PDF downloads", async ({
    page,
  }) => {
    await page.goto("/articles/what-is-a-meme/");

    const pdfLink = page.locator("[data-article-pdf-link]");
    await expect(pdfLink).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Cite this article" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Share this article" }),
    ).toBeVisible();
    await expect(page.locator('meta[name="citation_title"]')).toHaveAttribute(
      "content",
      "What Is A Meme?",
    );
    await expect(
      page.locator('meta[name="citation_author"]').first(),
    ).toHaveAttribute("content", /Claudia Vulliamy/u);
    await expect(
      page.locator('meta[name="citation_publication_date"]'),
    ).toHaveAttribute("content", "2021/11/30");
    await expect(page.locator('meta[name="citation_pdf_url"]')).toHaveCount(0);
    const response = await page.request.get(
      "/articles/what-is-a-meme/what-is-a-meme.pdf",
    );
    expect(response.status()).toBe(404);
  });

  test("print rendering keeps scholarly article content and strips web-only UI", async ({
    page,
  }) => {
    await page.goto("/articles/what-is-a-meme/");
    await page.emulateMedia({ media: "print" });

    await expect(page.locator("[data-site-header]")).toBeHidden();
    await expect(page.locator("[data-article-header-actions]")).toBeHidden();
    await expect(
      page.locator('[data-article-toc-placement="rail"]'),
    ).toBeHidden();
    await expect(
      page.locator('[data-article-toc-placement="inline"]'),
    ).toBeVisible();
    await expect(
      page.locator("#article-references-bibliography-heading"),
    ).toBeVisible();
    await expect(page.locator("[data-article-references]")).toBeVisible();
  });

  test("print fallbacks preserve MDX hover links and embedded media", async ({
    page,
  }) => {
    await page.emulateMedia({ media: "print" });
    await page.goto("/articles/social-media-freedom/");

    await expect(
      page.locator("[data-hover-image-trigger]").first(),
    ).toBeVisible();
    await expect(page.locator("[data-hover-image-panel]").first()).toBeHidden();

    await page.goto("/articles/gondola-shrine/");
    await expect(
      page.locator("[data-article-embed-frame]").first(),
    ).toBeHidden();
    await expect(
      page.locator("[data-article-embed-fallback]").first(),
    ).toBeVisible();
  });
});
