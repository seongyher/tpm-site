import { expect, type Page, test } from "@playwright/test";

import {
  expectApproximatelyEqual,
  expectCenteredInViewport,
  expectFocusVisible,
  expectHorizontallyContained,
  expectNoHorizontalOverflow,
  expectNoOverlap,
  expectVerticallyBefore,
  expectViewportContained,
  scrollToY,
  visibleBoundingBox,
} from "./helpers/layout";

const archiveRoutes = [
  "/announcements/",
  "/articles/",
  "/articles/all/",
  "/categories/",
  "/categories/metamemetics/",
  "/collections/",
  "/collections/start-here/",
  "/tags/",
  "/tags/memeculture/",
  "/search/",
] as const;

async function expectHashTargetBelowHeader(
  page: Page,
  targetSelector: string,
): Promise<void> {
  const headerBox = await visibleBoundingBox(
    page.locator("[data-site-header]"),
    "site header",
  );
  const targetBox = await visibleBoundingBox(
    page.locator(targetSelector),
    "hash target heading",
  );
  const minimumY = headerBox.y + headerBox.height + 8;

  expect(targetBox.y).toBeGreaterThanOrEqual(minimumY);
  expect(targetBox.y).toBeLessThanOrEqual(minimumY + 112);
}

test.describe("component layout invariants", () => {
  for (const route of archiveRoutes) {
    test(`${route} keeps a comfortable page measure on wide screens`, async ({
      page,
    }) => {
      await page.setViewportSize({ height: 1200, width: 2560 });
      await page.goto(route);

      const pageFrame = page.locator("[data-page-frame]").first();
      const main = page.locator("main").first();
      const pageFrameBox = await visibleBoundingBox(pageFrame, "page frame");

      expect(pageFrameBox.width).toBeLessThanOrEqual(1000);
      await expectHorizontallyContained(pageFrame, main, {
        inner: "page frame",
        outer: "main content",
      });
      await expectNoHorizontalOverflow(page);
    });
  }

  test("homepage discovery and support blocks share a comfortable content measure", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 1200, width: 2560 });
    await page.goto("/");

    const pageFrame = page.locator("[data-page-frame]").first();
    const categoryOverview = page.locator("[data-home-category-overview]");
    const recentFeed = page.locator("[data-home-recent-feed]");

    await expectHorizontallyContained(categoryOverview, pageFrame, {
      inner: "homepage category overview",
      outer: "homepage page frame",
    });
    await expectHorizontallyContained(recentFeed, pageFrame, {
      inner: "homepage recent feed",
      outer: "homepage page frame",
    });

    const categoryBox = await visibleBoundingBox(
      categoryOverview,
      "homepage category overview",
    );
    const recentBox = await visibleBoundingBox(recentFeed, "homepage recent");
    expect(categoryBox.width).toBeGreaterThan(700);
    expect(recentBox.width).toBeGreaterThan(700);
    expect(Math.abs(categoryBox.width - recentBox.width)).toBeLessThanOrEqual(
      1,
    );
  });

  test("articles hub keeps category discovery in one compact horizontal rail", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 1000, width: 1440 });
    await page.goto("/articles/");

    const pageFrame = page.locator("[data-page-frame]").first();
    const categoryRail = page.locator("[data-articles-category-rail]");
    const viewport = categoryRail.locator("[data-scroll-rail-viewport]");
    const latestArticles = page.getByRole("heading", {
      exact: true,
      name: "Latest Articles",
    });
    const previousCategory = categoryRail.getByRole("button", {
      name: "Scroll categories left",
    });
    const nextCategory = categoryRail.getByRole("button", {
      name: "Scroll categories right",
    });
    const readRailMetrics = async () =>
      viewport.evaluate((rail) => {
        const itemBoxes = Array.from(rail.querySelectorAll("li"), (item) => {
          const box = item.getBoundingClientRect();

          return {
            height: box.height,
            top: box.top,
            width: box.width,
            x: box.x,
          };
        });

        return {
          clientWidth: rail.clientWidth,
          itemBoxes,
          scrollLeft: rail.scrollLeft,
          scrollWidth: rail.scrollWidth,
        };
      });

    await expect(categoryRail).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Browse Categories" }),
    ).toHaveCount(0);
    await expectHorizontallyContained(categoryRail, pageFrame, {
      inner: "articles category rail",
      outer: "articles page frame",
    });
    const railBox = await visibleBoundingBox(
      categoryRail,
      "articles category rail",
    );
    expect(railBox.height).toBeLessThanOrEqual(150);

    const railMetrics = await readRailMetrics();
    expect(railMetrics.scrollWidth).toBeGreaterThan(railMetrics.clientWidth);
    expect(railMetrics.scrollLeft).toBe(0);
    railMetrics.itemBoxes.slice(1).forEach((box) => {
      expect(
        Math.abs(box.top - (railMetrics.itemBoxes[0]?.top ?? 0)),
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(box.width - (railMetrics.itemBoxes[0]?.width ?? 0)),
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(box.height - (railMetrics.itemBoxes[0]?.height ?? 0)),
      ).toBeLessThanOrEqual(1);
    });
    expect(railMetrics.itemBoxes[1]?.x).toBeGreaterThan(
      railMetrics.itemBoxes[0]?.x ?? 0,
    );
    await expect(previousCategory).toBeHidden();
    await expect(nextCategory).toBeVisible();
    await expect(nextCategory).toBeEnabled();
    await expectVerticallyBefore(categoryRail, latestArticles, {
      after: "latest articles",
      before: "articles category rail",
    });
    await expectNoHorizontalOverflow(page);
  });

  test("homepage flat front page exposes announcements, featured, discovery, and reading paths", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 1000, width: 1440 });
    await page.goto("/");

    const leadGrid = page.locator("[data-home-lead-grid]");
    const leadHero = page.locator("[data-home-lead-hero]");
    const leadFeatured = page.locator("[data-home-lead-featured]");
    const leadStart = page.locator("[data-home-lead-start]");
    const leadAnnouncements = page.locator("[data-home-lead-announcements]");
    const hero = page.locator("[data-home-hero-block]");
    const heroCtaRow = hero.locator("[data-home-hero-cta-row]");
    const featured = page.locator("[data-home-featured-carousel]");
    const startHere = leadStart.locator("[data-flat-article-list]");
    const announcements = leadAnnouncements.locator("[data-flat-article-list]");
    const categories = page.locator("[data-home-category-overview]");
    const discoveryLinks = page.locator("[data-home-discovery-links]");
    const recentFeed = page.locator("[data-home-recent-feed]");

    await expect(announcements.getByRole("link").first()).toBeVisible();
    const supportCta = hero.getByRole("link", {
      name: "Support The Philosopher's Meme on Patreon",
    });
    const discordCta = hero.getByRole("link", {
      name: "Join the TPM Discord",
    });

    await expect(supportCta).toBeVisible();
    await expect(discordCta).toBeVisible();
    await expect(hero.getByRole("link", { name: "Visit YouTube" })).toHaveCount(
      0,
    );
    const ctaBoxes = await Promise.all([
      visibleBoundingBox(supportCta, "homepage Patreon CTA"),
      visibleBoundingBox(discordCta, "homepage Discord CTA"),
    ]);
    const logoBoxes = await Promise.all([
      visibleBoundingBox(supportCta.locator("img"), "homepage Patreon logo"),
      visibleBoundingBox(discordCta.locator("img"), "homepage Discord logo"),
    ]);
    const referenceCtaBox = ctaBoxes[0];
    ctaBoxes.slice(1).forEach((box) => {
      expect(Math.abs(box.width - referenceCtaBox.width)).toBeLessThanOrEqual(
        1,
      );
      expect(Math.abs(box.height - referenceCtaBox.height)).toBeLessThanOrEqual(
        1,
      );
    });
    logoBoxes.forEach((box) => {
      expect(box.width).toBeGreaterThan(referenceCtaBox.width * 0.6);
      expect(box.height).toBeGreaterThan(referenceCtaBox.height * 0.4);
    });
    await expect(
      featured
        .locator("[data-home-featured-slide]")
        .first()
        .getByRole("link")
        .first(),
    ).toBeVisible();
    await expect(startHere.getByRole("link").first()).toBeVisible();
    await expect(
      discoveryLinks.getByRole("link", { exact: true, name: "Articles" }),
    ).toHaveAttribute("href", "/articles/");
    await expect(
      discoveryLinks.getByRole("link", { exact: true, name: "Archive" }),
    ).toHaveAttribute("href", "/articles/all/");
    await expect(
      discoveryLinks.getByRole("link", { name: "Authors" }),
    ).toHaveAttribute("href", "/authors/");
    await expect(
      discoveryLinks.getByRole("link", { name: "Collections" }),
    ).toHaveAttribute("href", "/collections/");
    await expect(
      discoveryLinks.getByRole("link", { name: "Tags" }),
    ).toHaveAttribute("href", "/tags/");
    await expect(
      discoveryLinks.getByRole("link", { name: "GitHub" }),
    ).toHaveCount(0);
    await expect(discoveryLinks.getByRole("link", { name: "RSS" })).toHaveCount(
      0,
    );
    await expect(page.getByText("Essays")).toHaveCount(0);
    await expect(
      recentFeed.getByRole("link", { name: "Join the TPM Discord" }),
    ).toHaveCount(0);

    const leadGridBox = await visibleBoundingBox(
      leadGrid,
      "homepage lead grid",
    );
    const discoveryBox = await visibleBoundingBox(
      discoveryLinks,
      "homepage read links",
    );
    const headerBox = await visibleBoundingBox(
      page.locator("[data-site-header]"),
      "site header",
    );
    const leadHeroBox = await visibleBoundingBox(
      leadHero,
      "homepage lead hero cell",
    );
    const leadFeaturedBox = await visibleBoundingBox(
      leadFeatured,
      "homepage lead featured cell",
    );
    const leadStartBox = await visibleBoundingBox(
      leadStart,
      "homepage lead start-here cell",
    );
    const leadAnnouncementsBox = await visibleBoundingBox(
      leadAnnouncements,
      "homepage lead announcements cell",
    );
    const announcementBox = await visibleBoundingBox(
      announcements,
      "homepage announcements",
    );
    const heroBox = await visibleBoundingBox(hero, "homepage hero");
    const heroImageBox = await visibleBoundingBox(
      hero.locator("img").first(),
      "homepage hero image",
    );
    const featuredBox = await visibleBoundingBox(featured, "featured carousel");
    const featuredViewportBox = await visibleBoundingBox(
      featured.locator("[data-home-featured-viewport]"),
      "featured carousel viewport",
    );
    const startBox = await visibleBoundingBox(startHere, "start here rail");
    const announcementsHeadingBox = await visibleBoundingBox(
      announcements.getByRole("heading", { name: "Announcements" }),
      "announcements heading",
    );

    await expect(
      featured.getByRole("heading", { name: "Featured" }),
    ).toHaveCount(0);
    expect(discoveryBox.width).toBeLessThan(leadGridBox.width * 0.55);
    expect(
      discoveryBox.y - (headerBox.y + headerBox.height),
    ).toBeLessThanOrEqual(24);
    expect(
      leadGridBox.y - (discoveryBox.y + discoveryBox.height),
    ).toBeLessThanOrEqual(16);
    expect(leadHeroBox.x).toBeLessThan(leadStartBox.x);
    expect(leadFeaturedBox.x).toBeLessThan(leadAnnouncementsBox.x);
    expect(leadHeroBox.width).toBeGreaterThan(leadStartBox.width);
    expect(leadFeaturedBox.width).toBeGreaterThan(leadAnnouncementsBox.width);
    expect(leadHeroBox.width).toBeGreaterThan(leadGridBox.width * 0.55);
    expect(leadStartBox.width).toBeGreaterThan(leadGridBox.width * 0.25);
    expect(Math.abs(leadHeroBox.x - leadFeaturedBox.x)).toBeLessThanOrEqual(1);
    expect(
      Math.abs(leadStartBox.x - leadAnnouncementsBox.x),
    ).toBeLessThanOrEqual(1);
    expect(Math.abs(leadHeroBox.y - leadStartBox.y)).toBeLessThanOrEqual(1);
    expect(
      Math.abs(leadFeaturedBox.y - leadAnnouncementsBox.y),
    ).toBeLessThanOrEqual(1);
    expect(announcementsHeadingBox.y).toBeGreaterThanOrEqual(
      leadAnnouncementsBox.y,
    );
    expect(heroBox.x).toBeLessThan(startBox.x);
    expect(featuredBox.x).toBeLessThan(announcementBox.x);
    expect(featuredBox.width).toBeGreaterThan(leadGridBox.width * 0.55);
    expect(heroImageBox.width).toBeGreaterThan(heroBox.width * 0.75);
    expect(leadGridBox.y).toBeLessThan(360);
    expect(featuredViewportBox.height).toBeGreaterThan(
      featuredBox.height * 0.7,
    );
    expect(Math.abs(featuredBox.y - announcementBox.y)).toBeLessThanOrEqual(1);

    const nextFeature = featured.getByRole("button", {
      name: "Next featured item",
    });
    await expect(nextFeature).toBeVisible();
    const featuredControlsBox = await visibleBoundingBox(
      featured.locator("[data-home-featured-controls]"),
      "featured carousel controls",
    );
    expect(featuredControlsBox.y).toBeGreaterThan(featuredViewportBox.y);
    const activeFeaturedSlide = featured.locator(
      '[data-home-featured-slide][data-home-featured-active="true"]',
    );
    const featuredMetaBox = await visibleBoundingBox(
      activeFeaturedSlide.locator("[data-home-featured-meta]"),
      "active featured metadata",
    );
    const featuredTitleBox = await visibleBoundingBox(
      activeFeaturedSlide.locator("[data-home-featured-title]"),
      "active featured title",
    );
    const featuredMediaBox = await visibleBoundingBox(
      activeFeaturedSlide.locator("[data-home-featured-media]"),
      "active featured media",
    );
    const activeFeatureTitle = await activeFeaturedSlide
      .locator("[data-home-featured-title]")
      .textContent();
    await nextFeature.click();
    await expect
      .poll(async () =>
        activeFeaturedSlide.locator("[data-home-featured-title]").textContent(),
      )
      .not.toBe(activeFeatureTitle);
    const featuredBoxAfterChange = await visibleBoundingBox(
      featured,
      "featured carousel after slide change",
    );
    const featuredViewportBoxAfterChange = await visibleBoundingBox(
      featured.locator("[data-home-featured-viewport]"),
      "featured carousel viewport after slide change",
    );
    expect(
      Math.abs(featuredBoxAfterChange.height - featuredBox.height),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(
        featuredViewportBoxAfterChange.height - featuredViewportBox.height,
      ),
    ).toBeLessThanOrEqual(1);
    const featuredMetaBoxAfterChange = await visibleBoundingBox(
      activeFeaturedSlide.locator("[data-home-featured-meta]"),
      "active featured metadata after slide change",
    );
    const featuredTitleBoxAfterChange = await visibleBoundingBox(
      activeFeaturedSlide.locator("[data-home-featured-title]"),
      "active featured title after slide change",
    );
    const featuredMediaBoxAfterChange = await visibleBoundingBox(
      activeFeaturedSlide.locator("[data-home-featured-media]"),
      "active featured media after slide change",
    );
    expect(
      Math.abs(featuredMetaBoxAfterChange.y - featuredMetaBox.y),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(featuredTitleBoxAfterChange.y - featuredTitleBox.y),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(featuredMediaBoxAfterChange.y - featuredMediaBox.y),
    ).toBeLessThanOrEqual(1);

    const categoryRail = categories.locator("[data-scroll-rail-viewport]");
    const previousCategory = categories.getByRole("button", {
      name: "Scroll categories left",
    });
    const nextCategory = categories.getByRole("button", {
      name: "Scroll categories right",
    });
    const readCategoryRailMetrics = async () =>
      categoryRail.evaluate((rail) => {
        const itemBoxes = Array.from(rail.querySelectorAll("li"), (item) => {
          const box = item.getBoundingClientRect();

          return {
            height: box.height,
            top: box.top,
            width: box.width,
            x: box.x,
          };
        });

        return {
          clientWidth: rail.clientWidth,
          itemBoxes,
          scrollLeft: rail.scrollLeft,
          scrollWidth: rail.scrollWidth,
        };
      });
    const railMetrics = await readCategoryRailMetrics();

    await expect(previousCategory).toBeHidden();
    await expect(nextCategory).toBeVisible();
    await expect(nextCategory).toBeEnabled();
    expect(railMetrics.scrollWidth).toBeGreaterThan(railMetrics.clientWidth);
    expect(railMetrics.scrollLeft).toBe(0);
    railMetrics.itemBoxes.slice(1).forEach((box) => {
      expect(
        Math.abs(box.top - (railMetrics.itemBoxes[0]?.top ?? 0)),
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(box.width - (railMetrics.itemBoxes[0]?.width ?? 0)),
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(box.height - (railMetrics.itemBoxes[0]?.height ?? 0)),
      ).toBeLessThanOrEqual(1);
    });
    expect(railMetrics.itemBoxes[1]?.x).toBeGreaterThan(
      railMetrics.itemBoxes[0]?.x ?? 0,
    );
    await nextCategory.click();
    await expect
      .poll(async () => categoryRail.evaluate((rail) => rail.scrollLeft))
      .toBeGreaterThan(0);
    await expect(previousCategory).toBeEnabled();
    await expect(previousCategory).toBeVisible();
    await categoryRail.evaluate((rail) => {
      rail.scrollLeft = rail.scrollWidth;
      rail.dispatchEvent(new Event("scroll", { bubbles: true }));
    });
    await expect(nextCategory).toBeHidden();
    await expect(previousCategory).toBeVisible();

    await expectVerticallyBefore(discoveryLinks, leadGrid, {
      after: "homepage lead grid",
      before: "homepage read links",
    });
    await expectVerticallyBefore(categories, recentFeed, {
      after: "homepage recent feed",
      before: "homepage categories",
    });

    const tagHrefCount = await discoveryLinks
      .locator("a")
      .evaluateAll(
        (links) =>
          links.filter(
            (link) => link.getAttribute("href")?.startsWith("/tags/") === true,
          ).length,
      );
    expect(tagHrefCount).toBe(1);
    await expectNoHorizontalOverflow(page);

    await page.setViewportSize({ height: 1000, width: 390 });
    await page.goto("/");
    const mobileCtaRowMetrics = await heroCtaRow.evaluate((row) => ({
      clientWidth: row.clientWidth,
      scrollWidth: row.scrollWidth,
    }));
    const mobileCtaBoxes = await Promise.all([
      visibleBoundingBox(supportCta, "mobile homepage Patreon CTA"),
      visibleBoundingBox(discordCta, "mobile homepage Discord CTA"),
    ]);
    const mobileCtaReferenceBox = mobileCtaBoxes[0];

    expect(mobileCtaRowMetrics.scrollWidth).toBeLessThanOrEqual(
      mobileCtaRowMetrics.clientWidth + 1,
    );
    mobileCtaBoxes.slice(1).forEach((box) => {
      expect(Math.abs(box.y - mobileCtaReferenceBox.y)).toBeLessThanOrEqual(1);
      expect(
        Math.abs(box.height - mobileCtaReferenceBox.height),
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(box.width - mobileCtaReferenceBox.width),
      ).toBeLessThanOrEqual(1);
    });
    const mobileRailMetrics = await readCategoryRailMetrics();
    expect(mobileRailMetrics.scrollWidth).toBeGreaterThan(
      mobileRailMetrics.clientWidth,
    );
    expect(mobileRailMetrics.scrollLeft).toBe(0);
    mobileRailMetrics.itemBoxes.slice(1).forEach((box) => {
      expect(
        Math.abs(box.top - (mobileRailMetrics.itemBoxes[0]?.top ?? 0)),
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(box.width - (mobileRailMetrics.itemBoxes[0]?.width ?? 0)),
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(box.height - (mobileRailMetrics.itemBoxes[0]?.height ?? 0)),
      ).toBeLessThanOrEqual(1);
    });
    await expect(previousCategory).toBeHidden();
    await expect(nextCategory).toBeVisible();
    await expect(nextCategory).toBeEnabled();

    await expectVerticallyBefore(hero, featured, {
      after: "mobile featured",
      before: "mobile hero",
    });
    await expectVerticallyBefore(discoveryLinks, hero, {
      after: "mobile hero",
      before: "mobile read links",
    });
    await expectVerticallyBefore(featured, startHere, {
      after: "mobile start here",
      before: "mobile featured",
    });
    await expectVerticallyBefore(startHere, announcements, {
      after: "mobile announcements",
      before: "mobile start here",
    });
    await expectVerticallyBefore(announcements, categories, {
      after: "mobile categories",
      before: "mobile announcements",
    });
    await expectNoHorizontalOverflow(page);
  });

  test("article end surfaces render support, discovery, references, then final tags", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 1200, width: 1280 });
    await page.goto(
      "/articles/wittgensteins-most-beloved-quote-was-real-but-its-fake-now/",
    );

    const prose = page.locator("[data-article-prose]");
    const stack = page.locator("[data-endcap-stack]");
    const endcap = page.locator(
      'article aside[aria-label="Article support and discovery"]',
    );
    const supportBlock = endcap.locator("[data-support-block]");
    const continuityBlock = endcap.locator("[data-article-continuity]");
    const continuity = continuityBlock.getByRole("heading", {
      name: /^(Next|Previous) Article$/u,
    });
    const support = endcap.getByRole("heading", {
      name: "Support The Philosopher's Meme",
    });
    const moreInCategory = endcap.getByRole("heading", {
      name: /More in/,
    });
    const tags = page.locator("[data-article-tags-placement]");
    const references = page.locator("[data-article-references]");

    await expect(tags.getByLabel("Article tags")).toBeVisible();
    await expect(tags.getByRole("link").first()).toHaveAttribute(
      "href",
      /^\/tags\//u,
    );
    await expect(
      supportBlock.getByRole("link", {
        name: "Support The Philosopher's Meme on Patreon",
      }),
    ).toBeVisible();
    await expect(
      supportBlock.getByRole("link", { name: "Join the TPM Discord" }),
    ).toBeVisible();
    await expect(continuity).toBeVisible();
    await expect(
      continuityBlock.getByRole("link", { name: "View more" }),
    ).toHaveAttribute("href", "/articles/all/");
    await expectVerticallyBefore(prose, continuityBlock, {
      after: "article continuity block",
      before: "article prose",
    });
    await expectVerticallyBefore(continuityBlock, support, {
      after: "support block",
      before: "article continuity block",
    });
    await expectVerticallyBefore(support, moreInCategory, {
      after: "more in category",
      before: "support block",
    });
    await expectVerticallyBefore(endcap, tags, {
      after: "article tags",
      before: "article endcap",
    });
    await expect(references).toBeVisible();
    await expectVerticallyBefore(endcap, references, {
      after: "article references",
      before: "article endcap",
    });
    await expectVerticallyBefore(references, tags, {
      after: "article tags",
      before: "article references",
    });
    await expectHorizontallyContained(stack, prose, {
      inner: "article end stack",
      outer: "article prose",
    });

    const proseBox = await visibleBoundingBox(prose, "article prose");
    const continuityBox = await visibleBoundingBox(
      continuityBlock,
      "article continuity block",
    );
    const supportBox = await visibleBoundingBox(
      supportBlock,
      "article support block",
    );
    const endcapBox = await visibleBoundingBox(endcap, "article endcap");
    const tagsBox = await visibleBoundingBox(tags, "article tags");
    const referencesBox = await visibleBoundingBox(
      references,
      "article references",
    );
    const proseToContinuityGap =
      continuityBox.y - (proseBox.y + proseBox.height);
    const continuityToSupportGap =
      supportBox.y - (continuityBox.y + continuityBox.height);
    const endcapToNextGap = referencesBox.y - (endcapBox.y + endcapBox.height);
    const finalSurfaceBox = referencesBox;
    const finalSurfaceToTagsGap =
      tagsBox.y - (finalSurfaceBox.y + finalSurfaceBox.height);

    expect(proseToContinuityGap).toBeGreaterThanOrEqual(24);
    expect(proseToContinuityGap).toBeLessThanOrEqual(40);
    expect(continuityToSupportGap).toBeGreaterThanOrEqual(24);
    expect(continuityToSupportGap).toBeLessThanOrEqual(64);
    expect(endcapToNextGap).toBeGreaterThanOrEqual(32);
    expect(endcapToNextGap).toBeLessThanOrEqual(64);
    expect(finalSurfaceToTagsGap).toBeGreaterThanOrEqual(32);
    expect(finalSurfaceToTagsGap).toBeLessThanOrEqual(64);
  });

  test("article body starts close to the header when no hero image is rendered", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 1200, width: 1280 });
    await page.goto("/articles/the-memetic-bottleneck/");

    const readingNavigation = page.locator("[data-article-reading-navigation]");
    const readingNavigationBox = await visibleBoundingBox(
      readingNavigation,
      "article reading navigation",
    );
    const headerBox = await visibleBoundingBox(
      page.locator("article > header").first(),
      "article header",
    );
    const firstProseElementBox = await visibleBoundingBox(
      page.locator("[data-article-prose] > :first-child").first(),
      "first prose element",
    );
    const headerToBodyGap =
      firstProseElementBox.y - (headerBox.y + headerBox.height);

    await expect(
      readingNavigation.getByRole("link", { exact: true, name: "Articles" }),
    ).toHaveAttribute("href", "/articles/");
    await expect(
      readingNavigation.getByRole("link", { exact: true, name: "Archive" }),
    ).toHaveAttribute("href", "/articles/all/");
    await expect(readingNavigation.getByText("Read")).toHaveCount(0);
    expect(readingNavigationBox.x).toBeLessThanOrEqual(headerBox.x + 1);
    expect(readingNavigationBox.y).toBeLessThan(headerBox.y);
    expect(headerToBodyGap).toBeGreaterThanOrEqual(0);
    expect(headerToBodyGap).toBeLessThanOrEqual(64);
  });

  test("SoundCloud article embeds reserve compact audio space", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto("/articles/the-structure-of-hyperspatial-politics/");

    const prose = page.locator("[data-article-prose]");
    const embed = prose.locator("[data-article-embed]").first();
    const frame = embed.locator(
      '[data-article-embed-frame][data-article-embed-provider="soundcloud"]',
    );
    const firstBodyHeading = prose.getByRole("heading", {
      name: "The Structures of Hyperspatial Politics",
    });

    await expect(frame).toBeVisible();
    await expectHorizontallyContained(embed, prose, {
      inner: "SoundCloud article embed",
      outer: "article prose",
    });
    await expectVerticallyBefore(embed, firstBodyHeading, {
      after: "first body heading",
      before: "SoundCloud article embed",
    });

    const frameBox = await visibleBoundingBox(
      frame,
      "SoundCloud article embed frame",
    );
    const embedBox = await visibleBoundingBox(
      embed,
      "SoundCloud article embed",
    );
    const headingBox = await visibleBoundingBox(
      firstBodyHeading,
      "first body heading",
    );
    const embedToHeadingGap = headingBox.y - (embedBox.y + embedBox.height);

    expect(frameBox.height).toBeGreaterThanOrEqual(100);
    expect(frameBox.height).toBeLessThanOrEqual(140);
    expect(embedToHeadingGap).toBeGreaterThanOrEqual(24);
    expect(embedToHeadingGap).toBeLessThanOrEqual(64);
  });

  test("article citation menu stays in header flow and exposes selectable citations", async ({
    page,
  }) => {
    for (const viewport of [
      { height: 700, width: 320 },
      { height: 1024, width: 768 },
      { height: 900, width: 1280 },
    ] as const) {
      await page.setViewportSize(viewport);
      await page.goto(
        "/articles/wittgensteins-most-beloved-quote-was-real-but-its-fake-now/",
      );

      const header = page.locator("article > header").first();
      const title = header.getByRole("heading", { level: 1 });
      const kickerRow = header.locator("[data-article-kicker-row]");
      const categoryLink = kickerRow.locator("[data-article-category-link]");
      const metaRow = header.locator("[data-article-meta-row]");
      const headerActions = header.locator("[data-article-header-actions]");
      const citationMenu = header.locator("[data-article-citation-menu]");
      const shareMenu = header.locator("[data-article-share-menu]");
      const citationTrigger = citationMenu.getByRole("button", {
        name: "Cite this article",
      });
      const shareTrigger = shareMenu.getByRole("button", {
        name: "Share this article",
      });
      const pdfLink = headerActions.locator("[data-article-pdf-link]");
      const citationPanel = page.locator("[data-article-citation-panel]");
      const sharePanel = page.locator("[data-article-share-panel]");
      const citationText = citationPanel.locator(
        "[data-article-citation-text]",
      );
      const citationTextBlock = citationPanel.locator(
        "[data-article-citation-text-block]",
      );
      const styleButtons = citationPanel.locator(
        "[data-article-citation-style-button]",
      );

      await expect(citationTrigger).toBeVisible();
      await expect(shareTrigger).toBeVisible();
      await expect(pdfLink).toHaveCount(0);
      await expect(categoryLink).toBeVisible();
      await expectVerticallyBefore(kickerRow, title, {
        after: "article title",
        before: "article category/action row",
      });
      await expectVerticallyBefore(title, metaRow, {
        after: "article metadata row",
        before: "article title",
      });
      await expectHorizontallyContained(headerActions, header, {
        inner: "article header actions",
        outer: "article header",
      });
      await expectHorizontallyContained(headerActions, kickerRow, {
        inner: "article header actions",
        outer: "article category/action row",
      });
      await expectHorizontallyContained(citationMenu, headerActions, {
        inner: "article citation menu",
        outer: "article header actions",
      });
      await expectHorizontallyContained(shareMenu, headerActions, {
        inner: "article share menu",
        outer: "article header actions",
      });

      const kickerRowBox = await visibleBoundingBox(
        kickerRow,
        "article category/action row",
      );
      const headerActionsBox = await visibleBoundingBox(
        headerActions,
        "article header actions",
      );
      const headerHeightBefore = (
        await visibleBoundingBox(header, "article header")
      ).height;

      expectApproximatelyEqual(
        headerActionsBox.x + headerActionsBox.width,
        kickerRowBox.x + kickerRowBox.width,
        2,
      );
      await expect(citationPanel).toBeHidden();
      await expect(citationText).toBeHidden();
      await expect(sharePanel).toBeHidden();

      await shareTrigger.click();
      await expect(sharePanel).toBeVisible();
      const shareTriggerBox = await visibleBoundingBox(
        shareTrigger,
        "article share trigger",
      );
      const sharePanelBox = await visibleBoundingBox(
        sharePanel,
        "article share panel",
      );
      expectApproximatelyEqual(
        sharePanelBox.y,
        shareTriggerBox.y + shareTriggerBox.height + 4,
        2,
      );
      await expect(
        sharePanel.locator("[data-article-share-copy-button]"),
      ).toHaveCount(1);
      await expect(
        sharePanel.locator("[data-article-share-action]"),
      ).toHaveCount(9);
      await expect(
        sharePanel.locator('[data-article-share-action="x"]'),
      ).toBeVisible();
      await sharePanel.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      await expect(
        sharePanel.locator('[data-article-share-action="pinterest"]'),
      ).toBeVisible();
      await expect(
        sharePanel.locator('[data-article-share-action="x"]'),
      ).toHaveAttribute(
        "data-article-share-open-url",
        /twitter\.com\/intent\/tweet.*via=philo_meme/u,
      );
      await expect(
        sharePanel.locator('[data-article-share-action="threads"]'),
      ).toHaveAttribute(
        "data-article-share-open-url",
        /threads\.com\/intent\/post/u,
      );
      await expect(
        sharePanel.locator('[data-article-share-action="reddit"]'),
      ).toHaveAttribute("data-article-share-open-url", /reddit\.com\/submit/u);
      await expect(
        sharePanel.locator('[data-article-share-action="hacker-news"]'),
      ).toHaveAttribute(
        "data-article-share-open-url",
        /news\.ycombinator\.com\/submitlink/u,
      );
      await expect(
        sharePanel.locator('[data-article-share-action="pinterest"]'),
      ).toHaveAttribute(
        "data-article-share-open-url",
        /pinterest\.com\/pin\/create\/button/u,
      );
      await expect(
        sharePanel.locator(
          'a[href*="twitter.com"], a[href*="facebook.com/sharer"], a[href*="reddit.com/submit"], a[href*="pinterest.com/pin"]',
        ),
      ).toHaveCount(0);
      await expectViewportContained(page, sharePanel, "article share panel");
      expectApproximatelyEqual(
        (await visibleBoundingBox(header, "article header after share")).height,
        headerHeightBefore,
        2,
      );
      await expect(
        page.locator(
          'script[src*="platform.twitter.com"], script[src*="connect.facebook.net"], script[src*="assets.pinterest.com"]',
        ),
      ).toHaveCount(0);
      await page.keyboard.press("Escape");
      await expect(sharePanel).toBeHidden();

      await citationTrigger.click();
      await expect(citationPanel).toBeVisible();
      await expect(styleButtons).toHaveCount(8);
      const [
        firstStyleButtonBox,
        secondStyleButtonBox,
        thirdStyleButtonBox,
        fourthStyleButtonBox,
        fifthStyleButtonBox,
        sixthStyleButtonBox,
        seventhStyleButtonBox,
        eighthStyleButtonBox,
      ] = await Promise.all([
        visibleBoundingBox(styleButtons.nth(0), "article citation style 1"),
        visibleBoundingBox(styleButtons.nth(1), "article citation style 2"),
        visibleBoundingBox(styleButtons.nth(2), "article citation style 3"),
        visibleBoundingBox(styleButtons.nth(3), "article citation style 4"),
        visibleBoundingBox(styleButtons.nth(4), "article citation style 5"),
        visibleBoundingBox(styleButtons.nth(5), "article citation style 6"),
        visibleBoundingBox(styleButtons.nth(6), "article citation style 7"),
        visibleBoundingBox(styleButtons.nth(7), "article citation style 8"),
      ]);

      for (const box of [
        secondStyleButtonBox,
        thirdStyleButtonBox,
        fourthStyleButtonBox,
      ]) {
        expectApproximatelyEqual(box.y, firstStyleButtonBox.y, 1);
        expectApproximatelyEqual(box.width, firstStyleButtonBox.width, 1);
      }

      for (const box of [
        sixthStyleButtonBox,
        seventhStyleButtonBox,
        eighthStyleButtonBox,
      ]) {
        expectApproximatelyEqual(box.y, fifthStyleButtonBox.y, 1);
        expectApproximatelyEqual(box.width, fifthStyleButtonBox.width, 1);
      }

      expect(fifthStyleButtonBox.y).toBeGreaterThan(
        firstStyleButtonBox.y + firstStyleButtonBox.height - 1,
      );
      expectApproximatelyEqual(
        fifthStyleButtonBox.width,
        firstStyleButtonBox.width,
        1,
      );
      await expect(citationText).toHaveCount(1);
      await expect(citationText).toBeVisible();
      await expect(citationText).toContainText("The Philosopher's Meme");
      expectApproximatelyEqual(
        (await visibleBoundingBox(header, "article header")).height,
        headerHeightBefore,
        2,
      );
      await expectViewportContained(
        page,
        citationPanel,
        "article citation panel",
      );

      const apaCopyButton = citationPanel.getByRole("button", {
        name: "Copy APA citation",
      });

      await expect(apaCopyButton).toBeVisible();
      await expect(
        citationPanel.locator("[data-article-citation-copy-button]"),
      ).toHaveCount(1);
      await expectHorizontallyContained(apaCopyButton, citationTextBlock, {
        inner: "article citation copy button",
        outer: "article citation text block",
      });

      const citationTextBlockBox = await visibleBoundingBox(
        citationTextBlock,
        "article citation text block",
      );
      const citationPanelBox = await visibleBoundingBox(
        citationPanel,
        "article citation panel",
      );
      const apaCopyButtonBox = await visibleBoundingBox(
        apaCopyButton,
        "article citation copy button",
      );

      expect(apaCopyButtonBox.y).toBeGreaterThanOrEqual(
        citationTextBlockBox.y + 4,
      );
      expect(apaCopyButtonBox.y).toBeLessThanOrEqual(
        citationTextBlockBox.y + 10,
      );
      expect(
        apaCopyButtonBox.x + apaCopyButtonBox.width,
      ).toBeGreaterThanOrEqual(
        citationTextBlockBox.x + citationTextBlockBox.width - 10,
      );

      const chicagoNotesButton = citationPanel.getByRole("button", {
        exact: true,
        name: "Chicago Notes",
      });

      await chicagoNotesButton.click();

      await expect(citationText).toBeVisible();
      await expect(chicagoNotesButton).toHaveAttribute("aria-pressed", "true");
      await expect(
        citationPanel.getByRole("button", {
          name: "Copy Chicago Notes citation",
        }),
      ).toBeVisible();

      const chicagoPanelBox = await visibleBoundingBox(
        citationPanel,
        "article citation panel after Chicago Notes",
      );
      const chicagoTextBlockBox = await visibleBoundingBox(
        citationTextBlock,
        "article citation text block after Chicago Notes",
      );

      expectApproximatelyEqual(
        chicagoPanelBox.width,
        citationPanelBox.width,
        1,
      );
      expectApproximatelyEqual(
        chicagoTextBlockBox.width,
        citationTextBlockBox.width,
        1,
      );

      const bibtexButton = citationPanel.getByRole("button", {
        exact: true,
        name: "BibTeX",
      });

      await bibtexButton.click();

      await expect(citationText).toBeVisible();
      await expect(citationText).toContainText(/@online\{/u);
      await expect(bibtexButton).toHaveAttribute("aria-pressed", "true");
      await expect(
        citationPanel.getByRole("button", { name: "Copy BibTeX citation" }),
      ).toBeVisible();
      const bibtexPanelBox = await visibleBoundingBox(
        citationPanel,
        "article citation panel after BibTeX",
      );
      const bibtexTextBlockBox = await visibleBoundingBox(
        citationTextBlock,
        "article citation text block after BibTeX",
      );

      expectApproximatelyEqual(bibtexPanelBox.width, citationPanelBox.width, 1);
      expectApproximatelyEqual(
        bibtexTextBlockBox.width,
        citationTextBlockBox.width,
        1,
      );
      await expectNoHorizontalOverflow(page);
    }
  });

  test("article table of contents occupies the reading margin without overlaying prose", async ({
    page,
  }) => {
    for (const viewport of [
      { height: 900, width: 1280 },
      { height: 1000, width: 1800 },
      { height: 1200, width: 2560 },
    ] as const) {
      await page.setViewportSize(viewport);
      await page.goto("/articles/facebook-groups/");
      await scrollToY(page, 600);

      const headerBox = await visibleBoundingBox(
        page.locator("[data-site-header]"),
        "site header",
      );
      const toc = page.locator("[data-article-toc-placement='rail']");
      const inlineToc = page.locator("[data-article-toc-placement='inline']");
      const prose = page.locator("[data-article-prose]");
      const contentColumn = page.locator("[data-margin-sidebar-content]");
      const tocBox = await visibleBoundingBox(toc, "article table of contents");

      await expect(inlineToc).toBeHidden();
      expect(tocBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height);
      await expectNoOverlap(toc, prose, {
        first: "article table of contents",
        second: "article prose",
      });
      await expectHorizontallyContained(prose, contentColumn, {
        inner: "article prose",
        outer: "reading content column",
      });
      await expectCenteredInViewport(
        page,
        contentColumn,
        "reading content column with TOC visible",
      );
      await expectNoHorizontalOverflow(page);
    }
  });

  test("article table of contents hide and hash-link behavior is keyboard safe", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 2560 });
    await page.goto("/articles/facebook-groups/");

    const toc = page.locator("[data-article-toc-placement='rail']");
    const details = toc.locator("details");
    const summary = toc.locator("summary");
    const firstLink = page
      .locator("[data-article-toc-placement='rail']")
      .getByRole("link", { name: "Facebook as a platform" });
    const contentColumn = page.locator("[data-margin-sidebar-content]");
    const openContentBox = await visibleBoundingBox(
      contentColumn,
      "open reading content column",
    );

    await summary.focus();
    await expect(summary.getByText("Hide")).toBeVisible();
    await expect(summary.getByText("Show Contents")).toBeHidden();
    await expect(summary.getByText("Article Contents")).toHaveCount(0);
    await expectFocusVisible(page);
    await page.keyboard.press("Enter");
    await expect(details).not.toHaveAttribute("open", "");
    await expect(summary.getByText("Show Contents")).toBeVisible();
    await expect(summary.getByText("Hide")).toBeHidden();

    const closedContentBox = await visibleBoundingBox(
      contentColumn,
      "closed reading content column",
    );
    expect(Math.abs(openContentBox.x - closedContentBox.x)).toBeLessThanOrEqual(
      1,
    );
    expect(
      Math.abs(openContentBox.width - closedContentBox.width),
    ).toBeLessThanOrEqual(1);

    await page.keyboard.press("Enter");
    await expect(details).toHaveAttribute("open", "");
    await firstLink.click();
    await expect(page).toHaveURL(/#facebook-as-a-platform$/u);
    await expect(firstLink).toHaveAttribute("data-current", "true");
    await expect(firstLink).toHaveAttribute("aria-current", "location");
    await expectHashTargetBelowHeader(page, "#facebook-as-a-platform");
  });

  test("article direct hash navigation keeps target headings below the sticky header", async ({
    page,
  }) => {
    for (const viewport of [
      { height: 844, width: 390 },
      { height: 1024, width: 768 },
      { height: 900, width: 1280 },
    ] as const) {
      await page.setViewportSize(viewport);
      await page.goto("/articles/facebook-groups/#facebook-as-a-platform");
      await expect(page.locator("#facebook-as-a-platform")).toBeVisible();
      await expectHashTargetBelowHeader(page, "#facebook-as-a-platform");
    }
  });

  test("article table of contents collapse keeps the reading column centered on mobile and tablet", async ({
    page,
  }) => {
    for (const viewport of [
      { height: 844, width: 390 },
      { height: 1024, width: 768 },
      { height: 900, width: 1024 },
    ] as const) {
      await page.setViewportSize(viewport);
      await page.goto("/articles/facebook-groups/");

      const contentColumn = page.locator("[data-margin-sidebar-content]");
      const railToc = page.locator("[data-article-toc-placement='rail']");
      const inlineToc = page.locator("[data-article-toc-placement='inline']");

      await expect(railToc).toBeHidden();
      await expect(inlineToc).toBeVisible();
      await expect(
        inlineToc.locator("[data-toc-inline-heading]"),
      ).toBeVisible();
      await expect(inlineToc.locator("[data-toc-inline-action]")).toBeVisible();
      await expect(
        inlineToc.locator("[data-toc-section-label='1']"),
      ).toBeVisible();
      await expect(
        inlineToc
          .getByRole("link", { name: "Facebook as a platform" })
          .locator("[data-toc-section-label-text]"),
      ).toBeVisible();
      await expect(
        inlineToc.getByRole("link", { name: "Facebook as a platform" }),
      ).toBeVisible();
      await inlineToc.locator("summary").click();
      await expect(
        inlineToc.locator("[data-toc-inline-closed-label]"),
      ).toBeVisible();
      await expect(
        inlineToc.getByRole("link", { name: "Facebook as a platform" }),
      ).toBeHidden();

      const summaryBox = await visibleBoundingBox(
        inlineToc.locator("summary"),
        "collapsed inline table of contents summary",
      );
      const firstProseElementBox = await visibleBoundingBox(
        page.locator("[data-article-prose] > :first-child").first(),
        "first prose element after collapsed contents",
      );
      expect(
        firstProseElementBox.y - (summaryBox.y + summaryBox.height),
      ).toBeLessThanOrEqual(16);
      await expectCenteredInViewport(
        page,
        contentColumn,
        "reading content column without visible TOC",
      );
      await expectNoHorizontalOverflow(page);
    }
  });

  test("site header keeps category discovery on one locked-height row", async ({
    page,
  }) => {
    const expectedCategoryLabels = [
      "Culture",
      "Metamemetics",
      "Aesthetics",
      "Irony",
      "Game Studies",
      "History",
      "Philosophy",
      "Politics",
    ];

    for (const viewport of [
      {
        height: 1024,
        maxCategoryFontSize: 12.1,
        minCategoryFontSize: 0,
        width: 768,
      },
      {
        height: 900,
        maxCategoryFontSize: 12.1,
        minCategoryFontSize: 0,
        width: 900,
      },
      {
        height: 900,
        maxCategoryFontSize: 99,
        minCategoryFontSize: 13.9,
        width: 1024,
      },
      {
        height: 900,
        maxCategoryFontSize: 99,
        minCategoryFontSize: 13.9,
        width: 1280,
      },
      {
        height: 1100,
        maxCategoryFontSize: 99,
        minCategoryFontSize: 13.9,
        width: 1800,
      },
    ] as const) {
      await page.setViewportSize(viewport);
      await page.goto("/");

      const header = page.locator("[data-site-header]");
      const brand = page.locator("[data-brand-link]");
      const brandLabel = brand.locator("[data-brand-label]");
      const searchTrigger = page.locator("[data-search-reveal-trigger]");
      const themeToggle = header.locator(".theme-toggle").first();
      const primaryNav = page.getByRole("navigation", {
        name: "Primary navigation",
      });
      const support = header.locator("[data-support-link]");
      const primaryRow = page.locator("[data-site-header-primary-row]");
      const priorityCenter = primaryRow.locator(
        "[data-priority-inline-center]",
      );
      const categoryRow = page.locator("[data-site-header-category-row]");
      const categoryList = page.locator("[data-discovery-menu-list]");
      const categoryTriggers = page.locator(
        "[data-category-dropdown] [data-anchor-trigger]",
      );
      const headerBox = await visibleBoundingBox(header, "site header");
      const brandBox = await visibleBoundingBox(brand, "brand link");
      const primaryRowBox = await visibleBoundingBox(
        primaryRow,
        "primary header row",
      );
      const priorityCenterBox = await visibleBoundingBox(
        priorityCenter,
        "priority row center slot",
      );
      const rowBox = await visibleBoundingBox(categoryRow, "category row");
      const listBox = await visibleBoundingBox(categoryList, "category list");
      const brandMetrics = await brandLabel.evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
      const triggerRows = await categoryTriggers.evaluateAll((elements) =>
        elements
          .map((element) => element.getBoundingClientRect())
          .filter((rect) => rect.width > 0 && rect.height > 0)
          .map((rect) => ({
            bottom: rect.bottom,
            top: rect.top,
          })),
      );
      const categoryLabels = await categoryTriggers.evaluateAll((elements) =>
        elements.map((element) => {
          const label = element.querySelector("span");

          if (label === null) {
            throw new Error("Expected category trigger to render a label.");
          }

          const styles = window.getComputedStyle(label);

          return {
            clientWidth: label.clientWidth,
            fontSize: Number.parseFloat(styles.fontSize),
            scrollWidth: label.scrollWidth,
            text: label.textContent.trim(),
            textOverflow: styles.textOverflow,
          };
        }),
      );

      expect(triggerRows.length).toBeGreaterThan(0);
      await expect(primaryRow).toHaveAttribute("data-priority-inline-row", "");
      await expect(
        primaryRow.locator("[data-priority-inline-start]"),
      ).toHaveCount(1);
      await expect(priorityCenter).toHaveCount(1);
      await expect(
        primaryRow.locator("[data-priority-inline-end]"),
      ).toHaveCount(1);
      await expect(brandLabel).toHaveText("The Philosopher's Meme");
      expectApproximatelyEqual(
        brandBox.x + brandBox.width / 2,
        headerBox.x + headerBox.width / 2,
      );
      expectApproximatelyEqual(
        priorityCenterBox.x + priorityCenterBox.width / 2,
        headerBox.x + headerBox.width / 2,
      );
      expect(brandMetrics.scrollWidth).toBeLessThanOrEqual(
        brandMetrics.clientWidth + 1,
      );
      await expectNoOverlap(searchTrigger, brand, {
        first: "search trigger",
        second: "brand link",
      });
      await expectNoOverlap(themeToggle, brand, {
        first: "theme toggle",
        second: "brand link",
      });
      await expectNoOverlap(brand, primaryNav, {
        first: "brand link",
        second: "primary navigation",
      });
      await expectNoOverlap(brand, support, {
        first: "brand link",
        second: "support link",
      });
      expect(categoryLabels.map((label) => label.text)).toStrictEqual(
        expectedCategoryLabels,
      );
      for (const label of categoryLabels) {
        expect(label.textOverflow).not.toBe("ellipsis");
        expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth + 1);
      }
      expect(
        Math.max(...categoryLabels.map((label) => label.fontSize)),
      ).toBeLessThanOrEqual(viewport.maxCategoryFontSize);
      expect(
        Math.min(...categoryLabels.map((label) => label.fontSize)),
      ).toBeGreaterThanOrEqual(viewport.minCategoryFontSize);
      expect(headerBox.height).toBeLessThanOrEqual(104);
      expect(primaryRowBox.height).toBeLessThanOrEqual(40);
      expect(rowBox.height).toBeLessThanOrEqual(28);
      expect(listBox.height).toBeLessThanOrEqual(rowBox.height + 1);
      expect(
        Math.max(...triggerRows.map((row) => row.top)) -
          Math.min(...triggerRows.map((row) => row.top)),
      ).toBeLessThanOrEqual(2);
      expect(
        Math.max(...triggerRows.map((row) => row.bottom)) -
          Math.min(...triggerRows.map((row) => row.bottom)),
      ).toBeLessThanOrEqual(2);
      await expectHorizontallyContained(categoryList, header, {
        inner: "category list",
        outer: "site header",
      });
      await expectNoHorizontalOverflow(page);
    }
  });

  test("mobile header keeps discovery in the menu without exposing the desktop category row", async ({
    page,
  }) => {
    for (const viewport of [
      {
        compactSupportVisible: true,
        fullSupportVisible: false,
        height: 568,
        width: 320,
      },
      {
        compactSupportVisible: true,
        fullSupportVisible: false,
        height: 740,
        width: 360,
      },
      {
        compactSupportVisible: false,
        fullSupportVisible: true,
        height: 844,
        width: 390,
      },
    ] as const) {
      await page.setViewportSize(viewport);
      await page.goto("/");

      const header = page.locator("[data-site-header]");
      const menuButton = page.getByLabel("Open navigation menu");
      const brand = page.locator("[data-brand-link]");
      const brandLabel = brand.locator("[data-brand-label]");
      const support = header.locator("[data-support-link]");
      const fullSupportLabel = support.locator("[data-support-label-full]");
      const compactSupportLabel = support.locator(
        "[data-support-label-compact]",
      );
      const primaryRow = page.locator("[data-site-header-primary-row]");
      const priorityCenter = primaryRow.locator(
        "[data-priority-inline-center]",
      );
      const headerBox = await visibleBoundingBox(header, "mobile site header");
      const brandBox = await visibleBoundingBox(brand, "mobile brand link");
      const priorityCenterBox = await visibleBoundingBox(
        priorityCenter,
        "mobile priority row center slot",
      );
      const brandLabelMetrics = await brandLabel.evaluate((element) => ({
        clientWidth: element.clientWidth,
        fontSize: Number.parseFloat(window.getComputedStyle(element).fontSize),
        scrollWidth: element.scrollWidth,
      }));
      const supportLabelState = await support.evaluate((element) => {
        const fullLabel = element.querySelector("[data-support-label-full]");
        const compactLabel = element.querySelector(
          "[data-support-label-compact]",
        );

        if (fullLabel === null || compactLabel === null) {
          throw new Error(
            "Expected header support link to render both labels.",
          );
        }

        return {
          compactText: compactLabel.textContent.trim(),
          compactVisible:
            window.getComputedStyle(compactLabel).display !== "none",
          fullText: fullLabel.textContent.trim(),
          fullVisible: window.getComputedStyle(fullLabel).display !== "none",
        };
      });

      expect(headerBox.height).toBeLessThanOrEqual(72);
      await expect(page.locator("[data-discovery-menu]")).toBeHidden();
      await expect(primaryRow).toHaveAttribute("data-priority-inline-row", "");
      await expect(
        primaryRow.locator("[data-priority-inline-start]"),
      ).toHaveCount(1);
      await expect(priorityCenter).toHaveCount(1);
      await expect(
        primaryRow.locator("[data-priority-inline-end]"),
      ).toHaveCount(1);
      await expect(menuButton).toBeVisible();
      await expect(brand).toBeVisible();
      await expect(brandLabel).toHaveText("The Philosopher's Meme");
      await expect(support).toBeVisible();
      await expect(fullSupportLabel).toHaveText("Support Us");
      await expect(compactSupportLabel).toHaveText("Patreon");
      expect(supportLabelState).toStrictEqual({
        compactText: "Patreon",
        compactVisible: viewport.compactSupportVisible,
        fullText: "Support Us",
        fullVisible: viewport.fullSupportVisible,
      });
      expectApproximatelyEqual(
        brandBox.x + brandBox.width / 2,
        headerBox.x + headerBox.width / 2,
      );
      expectApproximatelyEqual(
        priorityCenterBox.x + priorityCenterBox.width / 2,
        headerBox.x + headerBox.width / 2,
      );
      expect(brandLabelMetrics.scrollWidth).toBeLessThanOrEqual(
        brandLabelMetrics.clientWidth + 1,
      );
      expect(brandLabelMetrics.fontSize).toBeGreaterThanOrEqual(
        viewport.width === 320 ? 12 : 13.5,
      );
      expect(brandLabelMetrics.fontSize).toBeLessThanOrEqual(14.5);
      await expectNoOverlap(menuButton, brand, {
        first: "mobile menu button",
        second: "brand link",
      });
      await expectNoOverlap(brand, support, {
        first: "brand link",
        second: "support link",
      });
      await expectHorizontallyContained(menuButton, header, {
        inner: "mobile menu button",
        outer: "mobile site header",
      });
      await expectHorizontallyContained(brand, header, {
        inner: "brand link",
        outer: "mobile site header",
      });
      await expectHorizontallyContained(support, header, {
        inner: "support link",
        outer: "mobile site header",
      });
      await expectNoHorizontalOverflow(page);
    }
  });

  test("header interactions do not move the centered brand", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 1024, width: 768 });
    await page.goto("/");

    const header = page.locator("[data-site-header]");
    const brand = page.locator("[data-brand-link]");
    const searchTrigger = page.locator("[data-search-reveal-trigger]");
    const categoryTrigger = page
      .locator("[data-category-dropdown] [data-anchor-trigger]")
      .first();
    const themeToggle = header.locator(".theme-toggle").first();

    await expect(brand).toBeVisible();
    await expect(searchTrigger).toBeVisible();
    await expect(categoryTrigger).toBeVisible();
    await expect(themeToggle).toBeVisible();

    async function headerCenter(): Promise<number> {
      const box = await visibleBoundingBox(header, "site header");

      return box.x + box.width / 2;
    }

    async function brandCenter(): Promise<number> {
      const box = await visibleBoundingBox(brand, "brand link");

      return box.x + box.width / 2;
    }

    const initialHeaderCenter = await headerCenter();
    const initialBrandCenter = await brandCenter();

    expectApproximatelyEqual(initialBrandCenter, initialHeaderCenter);

    await searchTrigger.click();
    expectApproximatelyEqual(await brandCenter(), initialHeaderCenter);

    await categoryTrigger.hover();
    expectApproximatelyEqual(await brandCenter(), initialHeaderCenter);

    await themeToggle.click();
    expectApproximatelyEqual(await brandCenter(), initialHeaderCenter);

    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto("/");

    const mobileHeader = page.locator("[data-site-header]");
    const mobileBrand = page.locator("[data-brand-link]");
    const menuButton = page.getByLabel("Open navigation menu");

    await expect(mobileBrand).toBeVisible();
    await expect(menuButton).toBeVisible();

    const mobileHeaderBox = await visibleBoundingBox(
      mobileHeader,
      "mobile site header",
    );
    const mobileBrandBox = await visibleBoundingBox(
      mobileBrand,
      "mobile brand link",
    );
    const mobileHeaderCenter = mobileHeaderBox.x + mobileHeaderBox.width / 2;

    expectApproximatelyEqual(
      mobileBrandBox.x + mobileBrandBox.width / 2,
      mobileHeaderCenter,
    );

    await menuButton.click();

    const openMobileBrandBox = await visibleBoundingBox(
      mobileBrand,
      "open mobile brand link",
    );

    expectApproximatelyEqual(
      openMobileBrandBox.x + openMobileBrandBox.width / 2,
      mobileHeaderCenter,
    );
    await expectNoHorizontalOverflow(page);
  });

  test("category discovery panels stay viewport-constrained at tablet and desktop widths", async ({
    page,
  }) => {
    for (const viewport of [
      { height: 1024, width: 768 },
      { height: 900, width: 1280 },
    ] as const) {
      await page.setViewportSize(viewport);
      await page.goto("/");

      const discovery = page.locator("[data-discovery-menu]");
      const firstCategory = page.locator("[data-category-dropdown]").first();
      const firstCategoryLink = firstCategory.getByRole("link").first();
      const preview = firstCategory.locator("[data-category-preview]");

      await expect(discovery).toBeVisible();
      await firstCategoryLink.hover();
      await expect(preview).toBeVisible();

      const headerBox = await visibleBoundingBox(
        page.locator("[data-site-header]"),
        "site header",
      );
      const previewBox = await visibleBoundingBox(
        preview,
        "category preview panel",
      );

      expect(previewBox.x).toBeGreaterThanOrEqual(0);
      expect(previewBox.x + previewBox.width).toBeLessThanOrEqual(
        viewport.width,
      );
      expect(previewBox.y).toBeGreaterThanOrEqual(
        headerBox.y + headerBox.height - 1,
      );
      expect(previewBox.y + previewBox.height).toBeLessThanOrEqual(
        viewport.height,
      );
      await expectNoHorizontalOverflow(page);
    }
  });

  test("search result highlights render as mark elements, not escaped text", async ({
    page,
  }) => {
    await page.goto("/search/?q=gamergate");

    const firstResult = page.locator(".search-result").first();
    await expect(firstResult).toBeVisible({ timeout: 10_000 });
    await expect(firstResult.locator("mark").first()).toBeVisible();
    await expect(firstResult).not.toContainText("<mark>");
  });
});
