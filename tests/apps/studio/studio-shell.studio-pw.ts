import { AxeBuilder } from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { STUDIO_MVP_REQUIRED_SCREEN_STATE_IDS } from "../../../apps/studio/src/models/studio-fixtures";

async function expectNoDocumentOverflow(page: Page): Promise<void> {
  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );

  expect(hasHorizontalOverflow).toBe(false);
}

async function expectNoToolbarControlOverlap(page: Page): Promise<void> {
  const overlaps = await page
    .locator("header")
    .first()
    .evaluate((header) => {
      const controls = Array.from(
        header.querySelectorAll("button, [aria-live]"),
      )
        .filter(
          (element): element is HTMLElement => element instanceof HTMLElement,
        )
        .filter((element) => {
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();

          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            rect.width > 0 &&
            rect.height > 0
          );
        })
        .map((element) => {
          const ariaLabel = element.getAttribute("aria-label");
          const textLabel = element.textContent.trim();
          const fallbackLabel =
            textLabel.length === 0 ? element.tagName : textLabel;

          return {
            label:
              ariaLabel === null || ariaLabel.length === 0
                ? fallbackLabel
                : ariaLabel,
            rect: element.getBoundingClientRect(),
          };
        });

      return controls.flatMap((first, firstIndex) =>
        controls.slice(firstIndex + 1).flatMap((second) => {
          const intersects =
            first.rect.left < second.rect.right - 1 &&
            first.rect.right > second.rect.left + 1 &&
            first.rect.top < second.rect.bottom - 1 &&
            first.rect.bottom > second.rect.top + 1;

          return intersects ? [`${first.label} overlaps ${second.label}`] : [];
        }),
      );
    });

  expect(overlaps).toEqual([]);
}

async function expectNoSidebarArtifacts(page: Page): Promise<void> {
  await expect(page.getByLabel("Studio navigation")).toHaveCount(0);
  await expect(page.getByLabel("Sidebar collapsed")).toHaveCount(0);
  await expect(page.getByLabel("Resize sidebar")).toHaveCount(0);
}

async function expectNoPreviewArtifacts(page: Page): Promise<void> {
  await expect(page.getByLabel("Preview pane")).toHaveCount(0);
  await expect(page.getByLabel("Preview collapsed")).toHaveCount(0);
  await expect(page.getByLabel("Resize preview")).toHaveCount(0);
}

async function expectNoSeriousAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const severeViolations = results.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );

  expect(severeViolations).toEqual([]);
}

async function openStudio(page: Page, path = "/"): Promise<void> {
  await page.goto(path);
  await expect(page.locator('[data-studio-ready="true"]')).toBeVisible();
}

async function expectSingleSidebarSelection(
  page: Page,
  expectedLabel: string,
): Promise<void> {
  const selectedLabels = await page
    .getByLabel("Studio navigation")
    .locator('[data-selected="true"]')
    .evaluateAll((elements) =>
      elements.map((element) =>
        element.textContent.replace(/\s+/g, " ").trim(),
      ),
    );

  expect(selectedLabels).toHaveLength(1);
  expect(selectedLabels[0]).toContain(expectedLabel);
}

async function expectUniformArticleThumbnails(page: Page): Promise<void> {
  const thumbnailBoxes = await page
    .getByTestId("article-result-thumbnail")
    .evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();

        if (rect.height === 0) {
          return {
            height: rect.height,
            ratio: undefined,
            width: rect.width,
          };
        }

        return {
          height: rect.height,
          ratio: rect.width * rect.height ** -1,
          width: rect.width,
        };
      }),
    );

  expect(thumbnailBoxes.length).toBeGreaterThan(1);

  const firstBox = thumbnailBoxes[0];

  if (firstBox === undefined) {
    throw new Error("Expected article thumbnails to be present.");
  }

  for (const box of thumbnailBoxes) {
    expect(Math.abs(box.width - firstBox.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.height - firstBox.height)).toBeLessThanOrEqual(1);
    if (box.ratio === undefined) {
      throw new Error("Article thumbnail height must be greater than zero.");
    }

    expect(Math.abs(box.ratio - 1.91)).toBeLessThanOrEqual(0.08);
  }
}

async function expectStableArticleResultRows(page: Page): Promise<void> {
  const rowBoxes = await page
    .getByTestId("article-result-row")
    .evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();

        return {
          height: rect.height,
          width: rect.width,
        };
      }),
    );

  expect(rowBoxes.length).toBeGreaterThan(1);

  const firstBox = rowBoxes[0];

  if (firstBox === undefined) {
    throw new Error("Expected article result rows to be present.");
  }

  for (const box of rowBoxes) {
    expect(Math.abs(box.height - firstBox.height)).toBeLessThanOrEqual(2);
    expect(Math.abs(box.width - firstBox.width)).toBeLessThanOrEqual(1);
  }
}

type StudioScreenStateId =
  (typeof STUDIO_MVP_REQUIRED_SCREEN_STATE_IDS)[number];

interface StudioScreenStateAnchor {
  readonly id: StudioScreenStateId;
  readonly name: RegExp | string;
  readonly role?: "button" | "dialog" | "heading";
}

const studioScreenStateAnchors = [
  { id: "article-directory-empty", name: "No articles yet", role: "heading" },
  {
    id: "article-directory-filtered",
    name: "How to Build a Writing Desk",
    role: "heading",
  },
  {
    id: "article-directory-no-results",
    name: "No articles match these filters",
    role: "heading",
  },
  {
    id: "article-directory-populated",
    name: "How to Build a Writing Desk",
    role: "heading",
  },
  {
    id: "article-directory-search-results",
    name: "How to Build a Writing Desk",
    role: "heading",
  },
  {
    id: "article-editor-clean",
    name: "How to Build a Writing Desk",
    role: "heading",
  },
  {
    id: "article-editor-dirty",
    name: "Small Shop Organization Ideas",
    role: "heading",
  },
  {
    id: "article-editor-invalid",
    name: "Add a title before publishing this article.",
  },
  {
    id: "article-editor-unsupported-body",
    name: "This article uses a custom MDX component",
  },
  { id: "first-launch", name: "Welcome to Studio", role: "heading" },
  { id: "media-browser", name: "writing-desk-hero.jpg", role: "heading" },
  {
    id: "media-missing-alt",
    name: "Add useful alt text before inserting",
  },
  {
    id: "media-selected",
    name: "writing-desk-hero.jpg",
    role: "heading",
  },
  { id: "preview-blocked", name: "Preview is blocked", role: "heading" },
  { id: "preview-failed", name: "Preview failed", role: "heading" },
  { id: "preview-loading", name: "Preparing preview", role: "heading" },
  {
    id: "preview-ready",
    name: "How to Build a Writing Desk",
    role: "heading",
  },
  { id: "preview-stale", name: "Preview out of date" },
  { id: "project-home", name: "Project Home", role: "heading" },
  {
    id: "publish-blocked",
    name: "Connect Cloudflare before publishing",
    role: "heading",
  },
  { id: "publish-confirm", name: "Confirm publish", role: "dialog" },
  { id: "publish-failed", name: "Publish failed", role: "heading" },
  { id: "publish-preview", name: "Publish preview" },
  {
    id: "publish-progress",
    name: "Publishing to Cloudflare...",
    role: "heading",
  },
  { id: "publish-success", name: "Publish complete", role: "heading" },
  { id: "recent-projects", name: "Recent Projects", role: "heading" },
  { id: "restore-checkpoints", name: "Restore version", role: "heading" },
  { id: "restore-confirm", name: "Confirm restore", role: "heading" },
  {
    id: "restore-failure",
    name: "We could not find this site folder.",
    role: "heading",
  },
  { id: "restore-restored", name: "Version restored", role: "heading" },
  {
    id: "restore-unavailable",
    name: "Checkpoint history is unavailable",
    role: "heading",
  },
  { id: "settings-dirty", name: "Unsaved settings changes" },
  {
    id: "settings-invalid",
    name: "Enter a valid site URL before publishing.",
  },
  { id: "settings-saved", name: "Site identity", role: "heading" },
] as const satisfies readonly StudioScreenStateAnchor[];

async function expectScreenStateAnchor(
  page: Page,
  anchor: StudioScreenStateAnchor,
): Promise<void> {
  switch (anchor.role) {
    case "button":
      await expect(
        page.getByRole("button", { name: anchor.name }),
      ).toBeVisible();
      return;
    case "dialog":
      await expect(
        page.getByRole("dialog", { name: anchor.name }),
      ).toBeVisible();
      return;
    case "heading":
      await expect(
        page.getByRole("heading", { name: anchor.name }).first(),
      ).toBeVisible();
      return;
    case undefined:
      await expect(page.getByText(anchor.name).first()).toBeVisible();
  }
}

function requiredScreenStateAnchor(
  screenStateId: StudioScreenStateId,
): StudioScreenStateAnchor {
  const anchor = studioScreenStateAnchors.find(
    (candidate) => candidate.id === screenStateId,
  );

  if (anchor === undefined) {
    throw new Error(`Missing Studio screen-state anchor: ${screenStateId}`);
  }

  return anchor;
}

const studioAxeScreens = [
  "article-editor-clean",
  "article-editor-invalid",
  "article-directory-populated",
  "media-selected",
  "settings-invalid",
  "publish-preview",
  "restore-checkpoints",
  "first-launch",
] as const;

for (const screen of studioAxeScreens) {
  test(`has no serious or critical axe violations on Studio ${screen}`, async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 1440 });
    await openStudio(page, `/?screen=${screen}`);

    if (screen === "publish-preview") {
      await page.getByRole("button", { name: "Confirm publish" }).click();
    }

    await expectNoSeriousAxeViolations(page);
  });
}

test("covers every required Studio screen state with a visible state anchor", async ({
  page,
}) => {
  expect(studioScreenStateAnchors.map((anchor) => anchor.id).sort()).toEqual(
    Array.from(STUDIO_MVP_REQUIRED_SCREEN_STATE_IDS).sort(),
  );

  await page.setViewportSize({ height: 900, width: 1440 });

  for (const screenStateId of STUDIO_MVP_REQUIRED_SCREEN_STATE_IDS) {
    await openStudio(page, `/?screen=${screenStateId}`);
    await expect(page.getByLabel("Studio workspace")).toBeVisible();
    await expect(page.getByText("Publishing workspace")).toHaveCount(0);
    await expect(page.getByText("Workspace status checked")).toHaveCount(0);
    await expectScreenStateAnchor(
      page,
      requiredScreenStateAnchor(screenStateId),
    );
    await expectNoDocumentOverflow(page);
    await expectNoToolbarControlOverlap(page);
  }
});

test("renders the standalone Studio shell without the legacy dashboard", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page);

  const shell = page.getByLabel("Studio workspace");
  const sidebar = page.getByLabel("Studio navigation");
  const toolbarBox = await page.locator("header").first().boundingBox();

  await expect(shell).toBeVisible();
  await expect(sidebar).toBeVisible();
  await expect(page.getByLabel("Preview pane")).toBeVisible();
  await expect(page.getByText("Publishing workspace")).toHaveCount(0);
  await expect(page.getByText("Workspace status checked")).toHaveCount(0);
  await expect(page.getByText("Diagnostics")).toHaveCount(0);

  const shellBox = await shell.boundingBox();
  const sidebarBox = await sidebar.boundingBox();

  expect(shellBox).toMatchObject({ x: 0, y: 0 });
  expect(shellBox?.width).toBe(1440);
  expect(shellBox?.height).toBe(900);
  expect(sidebarBox?.width).toBeGreaterThan(280);
  expect(sidebarBox?.width).toBeLessThan(330);
  expect(toolbarBox?.height).toBeLessThanOrEqual(56);
  await expect(
    page.getByRole("button", { name: "Toggle side panel" }),
  ).toHaveCSS("width", "32px");
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-shell-standalone", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("keeps sidebar and preview panel controls command-backed", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page);

  const sidebar = page.getByLabel("Studio navigation");
  const initialSidebarBox = await sidebar.boundingBox();

  expect(initialSidebarBox?.width).toBeGreaterThan(280);
  await expectSingleSidebarSelection(page, "How to Build a Writing Desk");

  await page.getByRole("button", { name: "Toggle side panel" }).click();
  await expectNoSidebarArtifacts(page);
  await expectNoDocumentOverflow(page);

  await page.getByRole("button", { name: "Toggle side panel" }).click();
  await expect(sidebar).toBeVisible();
  await expectSingleSidebarSelection(page, "How to Build a Writing Desk");

  const restoredSidebarBox = await sidebar.boundingBox();

  expect(restoredSidebarBox?.width).toBeGreaterThan(280);

  await page
    .getByLabel("Preview pane")
    .getByRole("button", {
      name: "Toggle preview",
    })
    .click();
  await expectNoPreviewArtifacts(page);
  await expectNoDocumentOverflow(page);
});

test("keeps sidebar selection singular and article tree actions reliable", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=article-editor-clean");

  const sidebar = page.getByLabel("Studio navigation");
  const workshopFolder = sidebar.getByRole("button", { name: /Workshop/ });

  await expectSingleSidebarSelection(page, "How to Build a Writing Desk");

  await sidebar.getByTitle("Small Shop Organization Ideas").click();

  await expect(
    page.getByTestId("work").getByRole("heading", {
      name: "Small Shop Organization Ideas",
    }),
  ).toBeVisible();
  await expectSingleSidebarSelection(page, "Small Shop Organization Ideas");

  await expect(workshopFolder).toHaveAttribute("aria-expanded", "true");
  await workshopFolder.click();
  await expect(workshopFolder).toHaveAttribute("aria-expanded", "false");
  await expect(sidebar.getByTitle("How to Build a Writing Desk")).toHaveCount(
    0,
  );

  await workshopFolder.click();
  await expect(workshopFolder).toHaveAttribute("aria-expanded", "true");
  await expect(sidebar.getByTitle("How to Build a Writing Desk")).toBeVisible();
  await expectSingleSidebarSelection(page, "Small Shop Organization Ideas");
  await expect(
    sidebar.getByRole("button", {
      name: "Actions for Small Shop Organization Ideas",
    }),
  ).toBeVisible();
  await sidebar
    .getByRole("button", { name: "Actions for Small Shop Organization Ideas" })
    .click();
  await expect(
    page.getByRole("menuitem", { name: "Open editor" }),
  ).toBeVisible();
  await page.getByRole("menuitem", { name: "Restore version" }).click();
  await expect(
    page.getByTestId("work").getByRole("heading", { name: "Restore version" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(
    page.getByTestId("work").getByRole("heading", {
      name: "Small Shop Organization Ideas",
    }),
  ).toBeVisible();
  await expectNoDocumentOverflow(page);
});

test("scopes article live preview to article editing screens", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=article-editor-clean");

  const sidebar = page.getByLabel("Studio navigation");

  await expect(page.getByLabel("Preview pane")).toBeVisible();
  await expectSingleSidebarSelection(page, "How to Build a Writing Desk");

  await sidebar.getByRole("button", { name: "Settings" }).click();
  await expect(
    page.getByTestId("work").getByRole("heading", { name: "Site identity" }),
  ).toBeVisible();
  await expectNoPreviewArtifacts(page);
  await expectSingleSidebarSelection(page, "Settings");

  await sidebar.getByRole("button", { name: "Media" }).click();
  await expect(page.getByTestId("media-screen")).toBeVisible();
  await expectNoPreviewArtifacts(page);
  await expectSingleSidebarSelection(page, "Media");

  await sidebar.getByRole("button", { name: "Articles" }).click();
  await expect(page.getByLabel("Article directory")).toBeVisible();
  await expectNoPreviewArtifacts(page);
  await expectSingleSidebarSelection(page, "Articles");

  await sidebar.getByTitle("How to Build a Writing Desk").click();
  await expect(
    page.getByTestId("work").getByRole("heading", {
      name: "How to Build a Writing Desk",
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Preview pane")).toBeVisible();
  await expectSingleSidebarSelection(page, "How to Build a Writing Desk");
  await expectNoDocumentOverflow(page);
});

test("lets the article sidebar resize wider without clipping content", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page);

  const sidebar = page.getByLabel("Studio navigation");
  const resizeHandle = page.getByLabel("Resize sidebar");
  const initialSidebarBox = await sidebar.boundingBox();
  const handleBox = await resizeHandle.boundingBox();

  expect(initialSidebarBox?.width).toBeGreaterThan(280);
  expect(handleBox).not.toBeNull();

  if (handleBox === null) {
    throw new Error("Missing sidebar resize handle.");
  }

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + 80);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + 120, handleBox.y + 80);
  await page.mouse.up();

  const resizedSidebarBox = await sidebar.boundingBox();

  expect(resizedSidebarBox?.width).toBeGreaterThan(
    (initialSidebarBox?.width ?? 0) + 40,
  );
  await expect(page.getByText("Northwind Journal")).toBeVisible();
  await expect(page.getByTitle("How to Build a Writing Desk")).toBeVisible();
  await expectNoDocumentOverflow(page);
});

test("keeps the shell usable at compact desktop widths", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 760 });
  await openStudio(page);

  await expect(page.getByLabel("Studio workspace")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save draft" })).toBeVisible();
  await expect(
    page.getByRole("button", { exact: true, name: "Publish" }),
  ).toBeVisible();
  await expect(page.getByLabel("Studio navigation")).toBeVisible();
  await expect(page.getByLabel("Preview pane")).toBeVisible();
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-shell-compact", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("renders first launch as a non-technical startup screen", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=first-launch");

  const firstLaunchMain = page.getByTestId("work");

  await expect(
    page.getByRole("heading", { name: "Welcome to Studio" }),
  ).toBeVisible();
  await expect(
    firstLaunchMain.getByRole("button", { name: "Create site" }),
  ).toBeVisible();
  await expect(
    firstLaunchMain.getByRole("button", { name: "Open site" }),
  ).toBeVisible();
  await expect(
    firstLaunchMain.getByText("Create a site or open an existing one"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Templates" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Learn" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Cloud" })).toBeDisabled();
  await expect(page.getByRole("heading", { name: "Articles" })).toHaveCount(0);
  await expectNoDocumentOverflow(page);

  await firstLaunchMain.getByRole("button", { name: "Create site" }).click();
  await expect(
    page.getByRole("heading", { name: "Project Home" }),
  ).toBeVisible();
});

test("renders recent projects and removes missing folders from the fixture list", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=restore-failure");

  await expect(
    page.getByRole("heading", { name: "Recent Projects" }),
  ).toBeVisible();
  await expect(page.getByText("Cedar Notes")).toBeVisible();
  await expect(
    page.getByText(
      "We could not find this site folder. Locate it to continue.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Locate" })).toBeVisible();

  await page.getByRole("button", { name: "Remove" }).click();

  await expect(page.getByText("Cedar Notes")).toHaveCount(0);
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-restore-failure-recovery", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("opens available recent projects through the project command", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=recent-projects");

  await page.getByRole("button", { name: "Open" }).first().click();

  await expect(
    page.getByRole("heading", { name: "Project Home" }),
  ).toBeVisible();
  await expect(page.getByText("Provider connected")).toBeVisible();
});

test("renders project home actions and summaries at compact desktop size", async ({
  page,
}) => {
  await page.setViewportSize({ height: 768, width: 1024 });
  await openStudio(page, "/?screen=project-home");

  await expect(
    page.getByRole("heading", { name: "Project Home" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /New article/ }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Open article/ }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Publish/ }).first(),
  ).toBeVisible();
  await expect(page.getByText("Recently edited")).toBeVisible();
  await expect(page.getByText("Recent drafts")).toBeVisible();
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-project-home-compact", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("avoids narrated copy on compact utility screens", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });

  await openStudio(page, "/?screen=project-home");
  await expect(
    page.getByText(/Create, manage, and publish content/),
  ).toHaveCount(0);

  await openStudio(page, "/?screen=article-directory-populated");
  await expect(
    page.getByText("Browse, filter, and open articles."),
  ).toHaveCount(0);
  await expect(page.getByLabel("Article directory")).toBeVisible();

  await openStudio(page, "/?screen=media-selected");
  await expect(page.getByText("Media library")).toHaveCount(0);
  await expect(
    page.getByText(/Browse images, repair image metadata/),
  ).toHaveCount(0);

  await openStudio(page, "/?screen=settings-saved");
  await expect(page.getByText("Project settings")).toHaveCount(0);
  await expect(page.getByText(/Update site details/)).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Site identity" }),
  ).toBeVisible();

  await expectNoDocumentOverflow(page);
});

test("renders descriptor-backed settings sections and local draft state", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=settings-saved");

  const work = page.getByTestId("work");
  const toolbar = page.locator("header").first();

  await expect(toolbar.getByText("All changes saved")).toBeVisible();
  await expect(
    work.getByRole("heading", { name: "Site identity" }),
  ).toBeVisible();
  await expect(work.getByText("Settings saved automatically")).toHaveCount(0);
  await expect(work.getByText("Last saved just now.")).toHaveCount(0);
  await expect(work.getByLabel("Settings sections")).toBeVisible();
  await expect(work.getByLabel("Site name")).toHaveValue("Northwind Journal");
  await expect(work.getByText("Advanced options")).toBeVisible();
  const settingsNav = work
    .getByLabel("Settings sections")
    .locator("xpath=ancestor::aside[1]");
  const initialSettingsNavBox = await settingsNav.boundingBox();

  await work.getByRole("button", { name: /Homepage/ }).click();
  await expect(work.getByRole("heading", { name: "Home page" })).toBeVisible();
  await expect(work.getByLabel("Home page intro")).toBeVisible();
  await expect(work.getByLabel("Featured collection")).toHaveValue(
    "Workshop essentials",
  );
  const settingsNavBox = await settingsNav.boundingBox();

  expect(settingsNavBox?.height).toBe(initialSettingsNavBox?.height);
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-settings-saved-homepage", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("renders dirty and invalid settings as local, actionable states", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=settings-dirty");

  const work = page.getByTestId("work");
  const toolbar = page.locator("header").first();

  await expect(toolbar.getByText("Unsaved settings changes")).toBeVisible();
  await expect(work.getByText("Unsaved settings changes")).toBeVisible();
  await expect(work.getByRole("heading", { name: "Navigation" })).toBeVisible();
  await expect(
    work.getByLabel("Show Articles in navigation"),
  ).not.toBeChecked();
  await expect(
    work.getByRole("button", { name: /Navigation/ }),
  ).toHaveAttribute("aria-current", "page");
  await expectNoDocumentOverflow(page);

  await openStudio(page, "/?screen=settings-invalid");

  await expect(toolbar.getByText("Settings need attention")).toBeVisible();
  await expect(work.getByText("1 setting needs attention")).toBeVisible();
  await expect(work.getByRole("heading", { name: "Domain" })).toBeVisible();
  await expect(work.getByLabel("Site URL")).toHaveValue("northwindjournal");
  await expect(work.getByLabel("Site URL")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(work.getByText("Use a complete URL such as")).toBeVisible();
  await expect(work.getByRole("button", { name: /Domain/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-settings-invalid", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("renders article directory rows, filters, and warning markers", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=article-directory-populated");

  const work = page.getByTestId("work");

  await expect(work.getByLabel("Article directory")).toBeVisible();
  await expect(
    work.getByRole("button", { exact: true, name: "All" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(work.getByText("How to Build a Writing Desk")).toBeVisible();
  await expect(work.getByText("Small Shop Organization Ideas")).toBeVisible();
  await expect(
    work.getByText("The media source file is missing."),
  ).toBeVisible();
  await expectUniformArticleThumbnails(page);
  await expectStableArticleResultRows(page);
  await expect(
    work.getByText("Browse, filter, and open articles."),
  ).toHaveCount(0);

  await work.getByRole("button", { name: "Drafts" }).click();
  await expect(work.getByRole("button", { name: "Drafts" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await work
    .getByRole("button", { name: "Actions for How to Build a Writing Desk" })
    .click();
  await expect(
    page.getByRole("menuitem", { name: "Open editor" }),
  ).toBeVisible();
  await expect(page.getByText("Article actions")).toHaveCount(0);
  await expect(
    page.getByRole("menuitem", { name: "Restore version" }),
  ).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("menuitem", { name: "Open editor" }).click();
  await expect(work.getByRole("button", { name: "Properties" })).toBeVisible();
  await expect(
    work.getByRole("heading", { name: "How to Build a Writing Desk" }),
  ).toBeVisible();
  await expectNoDocumentOverflow(page);
});

test("renders article directory search, reset, and empty states", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=article-directory-populated");

  const work = page.getByTestId("work");

  await work.getByLabel("Search articles").fill("luthiery");
  await expect(work.getByText("No articles match these filters")).toBeVisible();
  await work.getByRole("button", { name: "Reset filters" }).click();
  await expect(work.getByText("How to Build a Writing Desk")).toBeVisible();

  await openStudio(page, "/?screen=article-directory-empty");
  await expect(work.getByText("No articles yet")).toBeVisible();
  await expect(
    work.getByRole("button", { name: "New article" }).first(),
  ).toBeVisible();
  await expectNoDocumentOverflow(page);
});

test("keeps the article directory readable at compact desktop widths", async ({
  page,
}) => {
  await page.setViewportSize({ height: 768, width: 1024 });
  await openStudio(page, "/?screen=article-directory-populated");

  const work = page.getByTestId("work");

  await expect(work.getByLabel("Article directory")).toBeVisible();
  await expect(work.getByLabel("Search articles")).toBeVisible();
  await expect(work.getByText("How to Build a Writing Desk")).toBeVisible();
  await expect(
    work.getByRole("button", { name: "Open editor" }).first(),
  ).toBeVisible();
  await expectUniformArticleThumbnails(page);
  await expectStableArticleResultRows(page);
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-article-directory-compact", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("renders the article editor properties form, source editor, and preview", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=article-editor-clean");

  const work = page.getByTestId("work");

  await expect(
    work.getByRole("heading", { name: "How to Build a Writing Desk" }),
  ).toBeVisible();
  await expect(
    work.getByRole("button", { name: "Edit article title" }),
  ).toBeVisible();
  await expect(
    work.getByRole("button", { name: "Properties" }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(work.getByText("Identity")).toHaveCount(0);
  await expect(work.getByLabel("Article title", { exact: true })).toHaveCount(
    0,
  );
  await expect(work.getByLabel("Title", { exact: true })).toHaveCount(0);
  await expect(work.getByLabel(/Description/)).toBeVisible();
  await expect(
    work.getByRole("img", {
      name: "Minimal solid wood writing desk in a bright workshop",
    }),
  ).toBeVisible();
  await expect(work.getByTestId("markdown-editor")).toBeVisible();
  await expect(work.getByTestId("markdown-editor-shell")).toBeVisible();
  await expect(work.locator(".cm-lineNumbers")).toHaveCount(0);
  await expect(work.locator(".cm-gutters")).toHaveCount(0);
  await expect(
    work.getByRole("button", { name: "Toggle preview" }),
  ).toHaveCount(0);
  await expect(
    page.getByLabel("Preview pane").getByRole("button", {
      name: "Toggle preview",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { exact: true, name: "Preview" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { exact: true, name: "Preview" }),
  ).not.toHaveAttribute("aria-label", "Toggle preview");
  await expect(work.getByText("1,024 words")).toBeVisible();
  await expect(page.getByLabel("Preview pane")).toBeVisible();
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-article-editor-default", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("edits the article title inline and keeps Properties collapsible", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=article-editor-clean");

  const work = page.getByTestId("work");
  const properties = work.getByRole("button", { name: "Properties" });

  await expect(properties).toHaveAttribute("aria-expanded", "true");
  await expect(work.getByLabel(/Description/)).toBeVisible();
  await properties.click();
  await expect(properties).toHaveAttribute("aria-expanded", "false");
  await expect(work.getByLabel(/Description/)).toHaveCount(0);
  await properties.click();
  await expect(properties).toHaveAttribute("aria-expanded", "true");

  await work.getByRole("button", { name: "Edit article title" }).click();
  const titleInput = work.getByLabel("Article title", { exact: true });

  await expect(titleInput).toBeFocused();
  await expect(titleInput).toHaveValue("How to Build a Writing Desk");
  await titleInput.fill("");
  await expect(
    work.getByText("Add a title before publishing this article."),
  ).toBeVisible();
  await expect(work.getByText("This article has errors")).toHaveCount(0);
  await expect(
    work.getByRole("button", { name: "Apply title" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { exact: true, name: "Publish" }),
  ).toBeDisabled();

  await titleInput.fill("  A Better Writing Desk  ");
  await work.getByRole("button", { name: "Apply title" }).click();
  await expect(
    work.getByRole("heading", { name: "A Better Writing Desk" }),
  ).toBeVisible();
  await expect(work.getByText("Unsaved local changes")).toBeVisible();

  await work.getByRole("button", { name: "Edit article title" }).click();
  await work
    .getByLabel("Article title", { exact: true })
    .fill("Temporary title");
  await work.getByRole("button", { name: "Cancel title edit" }).click();
  await expect(
    work.getByRole("heading", { name: "A Better Writing Desk" }),
  ).toBeVisible();
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-article-editor-inline-title", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("keeps editor toolbar and context menu actions command-backed", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=article-editor-clean");

  const work = page.getByTestId("work");

  await work.getByRole("button", { name: "Bold" }).click();
  await expect(work.getByText("Last: Bold")).toBeVisible();
  await expect(work.getByText("Unsaved local changes")).toBeVisible();

  await work.getByTestId("markdown-editor").click({ button: "right" });
  await expect(page.getByText("Cursor actions")).toHaveCount(0);
  await expect(page.getByText("Insert image")).toBeVisible();
  await expect(
    page.getByText("Open the media browser for image insertion."),
  ).toHaveCount(0);
  await expect(page.getByText("⇧⌘I")).toBeVisible();
  await page.keyboard.press("Escape");

  await work.getByTestId("markdown-editor").focus();
  await page.keyboard.press("Shift+F10");
  await expect(page.getByText("Cursor actions")).toHaveCount(0);
  await expect(page.getByText("Insert image")).toBeVisible();
  await page.keyboard.press("Escape");
  await expectNoDocumentOverflow(page);
});

test("opens the command palette from toolbar search and invokes shared commands", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=article-editor-invalid");

  await page.getByRole("button", { name: /Search articles/ }).click();

  const palette = page.getByRole("dialog", {
    name: "Studio command palette",
  });

  await expect(palette).toBeVisible();
  await expect(
    palette.getByPlaceholder("Search commands, screens, and actions..."),
  ).toBeFocused();
  await expect(
    palette.getByText("Fix article errors before publishing."),
  ).toBeVisible();

  await palette
    .getByPlaceholder("Search commands, screens, and actions...")
    .fill("media");
  await expect(palette.getByText("Open the media library.")).toHaveCount(0);
  const mediaOption = palette.getByRole("option", {
    name: /Media Navigation/,
  });
  await expect(mediaOption).toBeVisible();
  await mediaOption.click();
  await expect(page.getByTestId("media-screen")).toBeVisible();
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-command-palette-filtered", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("maps global hotkeys to command registry actions", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=article-editor-clean");

  await page.keyboard.press("Control+B");
  await expect(page.getByText("Last: Bold")).toBeVisible();
  await expect(
    page.getByTestId("work").getByText("Unsaved local changes"),
  ).toBeVisible();

  await page.keyboard.press("Control+S");
  await expect(page.getByText("All changes saved")).toBeVisible();

  await page.keyboard.press("Control+K");
  await expect(
    page.getByRole("dialog", { name: "Studio command palette" }),
  ).toBeVisible();
  await page
    .getByPlaceholder("Search commands, screens, and actions...")
    .fill("media");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("media-screen")).toBeVisible();

  await page.keyboard.press("Control+K");
  await expect(
    page.getByRole("dialog", { name: "Studio command palette" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Studio command palette" }),
  ).toHaveCount(0);

  await page.keyboard.press("Control+Alt+B");
  await expectNoSidebarArtifacts(page);
  await expectNoDocumentOverflow(page);
});

test("respects reduced motion and high text zoom without breaking the workspace", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ height: 768, width: 1024 });
  await openStudio(page, "/?screen=article-directory-populated");
  await page.addStyleTag({ content: "html { font-size: 125%; }" });

  const work = page.getByTestId("work");

  await expect(work.getByLabel("Article directory")).toBeVisible();
  await expect(page.getByLabel("Studio navigation")).toBeVisible();
  await expect(page.getByLabel("Search articles")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open editor" }).first(),
  ).toBeVisible();
  await expectNoDocumentOverflow(page);
  await expectNoToolbarControlOverlap(page);

  const longestTransitionMs = await page
    .getByRole("button", { name: "Open editor" })
    .first()
    .evaluate((element) => {
      const durations = getComputedStyle(element)
        .transitionDuration.split(",")
        .map((duration) => duration.trim());

      return Math.max(
        ...durations.map((duration) =>
          duration.endsWith("ms")
            ? Number(duration.replace("ms", ""))
            : Number(duration.replace("s", "")) * 1000,
        ),
      );
    });

  expect(longestTransitionMs).toBeLessThanOrEqual(1);

  await test.info().attach("studio-high-text-zoom-reduced-motion", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("renders command-backed dropdowns, disabled reasons, and shortcut tooltips", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=article-editor-clean");

  await page.getByRole("button", { name: "More publish options" }).click();
  const menu = page.getByRole("menu", { name: "Publish options" });

  await expect(menu).toBeVisible();
  await expect(menu.getByText("Publish options")).toHaveCount(0);
  await expect(
    menu.getByText("Prepare a publish preview before confirming."),
  ).toBeVisible();
  await expect(
    menu.getByText("Prepare a publish preview and plan."),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Toggle side panel" }).hover();
  const tooltip = page.getByRole("tooltip");

  await expect(tooltip.getByText("Toggle side panel")).toBeVisible();
  await expect(tooltip.getByText("Show or hide the left sidebar.")).toHaveCount(
    0,
  );
  await expect(tooltip.getByText("⌥⌘B")).toBeVisible();
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-command-dropdown-tooltip", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("renders invalid article editor state with blocked publish affordances", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=article-editor-invalid");

  const work = page.getByTestId("work");

  await expect(work.getByText("This article has errors")).toHaveCount(0);
  await expect(work.getByLabel("Article title", { exact: true })).toHaveValue(
    "",
  );
  await expect(
    work.getByText("Add a title before publishing this article."),
  ).toBeVisible();
  await expect(
    work.getByRole("button", { name: "Apply title" }),
  ).toBeDisabled();
  await expect(
    work.getByRole("button", { name: "Properties" }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(work.getByLabel(/Description/)).toBeVisible();
  await expect(
    page.getByRole("button", { exact: true, name: "Publish" }),
  ).toBeDisabled();
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-article-editor-invalid", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("renders unsupported body and preview-hidden writing modes", async ({
  page,
}) => {
  await page.setViewportSize({ height: 768, width: 1024 });
  await openStudio(page, "/?screen=article-editor-unsupported-body");

  const work = page.getByTestId("work");

  await expect(
    work.getByText("This article uses a custom MDX component"),
  ).toBeVisible();
  await expect(work.getByText("MDX", { exact: true })).toBeVisible();

  await page
    .getByLabel("Preview pane")
    .getByRole("button", {
      name: "Toggle preview",
    })
    .click();
  await expect(page.getByLabel("Preview pane")).toHaveCount(0);
  await expect(page.getByLabel("Preview collapsed")).toHaveCount(0);
  await expect(work.getByText("Preview hidden")).toBeVisible();
  await expect(
    work.getByRole("button", { name: "Open preview" }),
  ).toBeVisible();
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-article-editor-preview-hidden", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("renders media browser grid, list, detail, and missing-alt states", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=media-selected");

  const work = page.getByTestId("work");

  await expect(page.getByTestId("media-screen")).toBeVisible();
  await expect(work.getByLabel("Search media")).toBeVisible();
  await expect(work.getByText("Media library")).toHaveCount(0);
  await expect(
    work.getByText(/Browse images, repair image metadata/),
  ).toHaveCount(0);
  await expect(
    work.getByRole("button", { name: /writing-desk-hero.jpg/ }),
  ).toBeVisible();
  await expect(work.getByText(/^\d+ items$/)).toBeVisible();
  await expect(work.getByRole("button", { name: "Add" })).toBeDisabled();
  await expect(work.getByRole("button", { name: "Add" })).toHaveAttribute(
    "title",
    "Connect a writable media source to add files.",
  );
  await expect(
    work.getByRole("heading", { name: "writing-desk-hero.jpg" }),
  ).toBeVisible();
  await expect(work.getByLabel("Alt text")).toHaveValue(
    "Minimal solid wood writing desk in a bright workshop",
  );
  await expect(work.getByText("Used in")).toBeVisible();
  await expect(work.getByText("How to Build a Writing Desk")).toBeVisible();
  await expect(
    work.getByRole("button", { name: "Insert into article" }),
  ).toHaveAttribute("title", "Open an article before inserting media.");
  await expect(
    work.getByRole("button", { name: /More media actions/ }),
  ).toBeDisabled();

  await work.getByRole("button", { name: /desk-sketch.jpg/ }).click();
  await expect(
    work.getByRole("button", { name: /Missing alt desk-sketch.jpg/ }),
  ).toBeVisible();
  await expect(work.getByLabel("Alt text")).toHaveValue("");
  await expect(
    work.getByText("Add useful alt text before inserting"),
  ).toBeVisible();
  await work.getByLabel("Alt text").fill("Sketch of desk measurements");
  await expect(
    work.getByText("Great. This image has descriptive alt text."),
  ).toHaveCount(0);
  await expect(
    work.getByText("This image needs descriptive alt text."),
  ).toHaveCount(0);
  await expect(work.getByText("Missing alt")).toHaveCount(0);

  await work.getByRole("button", { name: "Show media list" }).click();
  await expect(
    work.getByRole("button", { name: /pegboard-tools.jpg/ }),
  ).toBeVisible();
  await work.getByLabel("Search media").fill("luthiery");
  await expect(work.getByText("No media matches this search")).toBeVisible();
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-media-browser-detail", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("inserts selected media through the shared editor command model", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=article-editor-clean");

  const work = page.getByTestId("work");

  await work.getByRole("button", { name: "Insert image" }).click();
  await expect(page.getByTestId("media-screen")).toBeVisible();
  await expect(
    work.getByRole("button", { name: "Insert into article" }),
  ).toBeEnabled();

  await work.getByRole("button", { name: "Insert into article" }).click();
  await expect(
    work.getByRole("heading", { name: "How to Build a Writing Desk" }),
  ).toBeVisible();
  await expect(work.getByText("Unsaved local changes")).toBeVisible();
  await expect(work.getByText("Last: Insert selected image")).toBeVisible();
  await expectNoDocumentOverflow(page);
});

test("routes publish through preview, confirmation, progress, and success", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=article-editor-clean");

  await page.getByRole("button", { exact: true, name: "Publish" }).click();

  const work = page.getByTestId("work");
  const sidebarBox = await page.getByLabel("Studio navigation").boundingBox();

  expect(sidebarBox?.width).toBeGreaterThan(280);
  await expect(page.getByLabel("Preview pane")).toHaveCount(0);
  await expectNoPreviewArtifacts(page);
  await expect(work.getByText("Publish preview")).toBeVisible();
  await expect(
    work.getByText("/articles/how-to-build-a-writing-desk/"),
  ).toBeVisible();
  await expect(
    work.getByText("No Cloudflare deploy runs from this prototype."),
  ).toHaveCount(0);
  await expect(work.getByText(/fixture|prototype/i)).toHaveCount(0);

  await work.getByRole("button", { name: "Confirm publish" }).click();

  const dialog = page.getByRole("dialog", { name: "Confirm publish" });

  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Cloudflare Workers" }),
  ).toBeVisible();
  await expect(dialog.getByText("A checkpoint will be saved")).toBeVisible();
  await expect(
    dialog.getByText("Studio will use the connected publish credential"),
  ).toBeVisible();

  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true);
  await page.keyboard.press("Tab");
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true);

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    work.getByRole("button", { name: "Confirm publish" }),
  ).toBeFocused();

  await work.getByRole("button", { name: "Confirm publish" }).click();
  await page
    .getByRole("dialog", { name: "Confirm publish" })
    .getByRole("button", { exact: true, name: "Publish" })
    .click();

  await expect(
    work.getByRole("heading", { name: "Publishing to Cloudflare..." }),
  ).toBeVisible();
  await expect(work.getByLabel("Publishing progress")).toBeVisible();
  await expect(
    work.getByText("The confirmed publish plan is being applied."),
  ).toBeVisible();

  await work.getByRole("button", { name: "Complete publish" }).click();
  await expect(
    work.getByRole("heading", { name: "Publish complete" }),
  ).toBeVisible();
  await expect(work.getByRole("link", { name: "View site" })).toBeVisible();
  await expect(
    work.getByRole("button", { name: "Restore checkpoint" }),
  ).toBeVisible();
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-publish-preview-confirm-success", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("renders publish blocked and retryable failure states", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=publish-blocked");

  let work = page.getByTestId("work");

  await expect(
    work.getByRole("heading", { name: "Connect Cloudflare before publishing" }),
  ).toBeVisible();
  await expect(work.getByText("Provider not connected")).toBeVisible();
  await expect(
    work.getByText("Connect Cloudflare before publishing this site."),
  ).toBeVisible();
  await expect(
    work.getByRole("button", { name: "Connect Cloudflare" }),
  ).toBeVisible();

  await work.getByRole("button", { name: "Connect Cloudflare" }).click();
  await expect(work.getByRole("heading", { name: "Publishing" })).toBeVisible();
  await expect(
    work.getByRole("button", { name: "Publishing" }),
  ).toHaveAttribute("aria-current", "page");

  await openStudio(page, "/?screen=publish-failed");
  work = page.getByTestId("work");

  await expect(
    work.getByRole("heading", { name: "Publish failed" }),
  ).toBeVisible();
  await expect(work.getByText("STUDIO-PUBLISH-FAILED")).toBeVisible();
  await expect(
    work.getByRole("button", { name: "Retry publish" }),
  ).toBeVisible();

  await work.getByRole("button", { name: "Retry publish" }).click();
  await expect(
    work.getByRole("heading", { name: "Publishing to Cloudflare..." }),
  ).toBeVisible();
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-publish-blocked-failed", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("renders checkpoint restore selection, confirmation, and completion", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=restore-checkpoints");

  const work = page.getByTestId("work");

  await expect(
    work.getByRole("heading", { name: "Restore version" }),
  ).toBeVisible();
  await expect(work.getByText("Choose a saved version")).toBeVisible();
  await expect(
    work.getByRole("button", { name: /Before latest edits/ }),
  ).toHaveAttribute("aria-pressed", "true");

  await work.getByRole("button", { name: /Draft saved/ }).click();
  await expect(
    work.getByRole("button", { name: /Draft saved/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(work.getByText("A checkpoint remains available")).toBeVisible();
  await expect(work.getByText(/fixture|prototype/i)).toHaveCount(0);

  await work.getByRole("button", { name: "Review restore" }).click();
  await expect(
    work.getByRole("heading", { name: "Confirm restore" }),
  ).toBeVisible();
  await work.getByRole("button", { name: "Cancel" }).last().click();
  await expect(
    work.getByRole("heading", { name: "Confirm restore" }),
  ).toHaveCount(0);

  await work.getByRole("button", { name: "Review restore" }).click();
  await work.getByRole("button", { exact: true, name: "Restore" }).click();
  await expect(
    work.getByRole("heading", { name: "Version restored" }),
  ).toBeVisible();
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-restore-checkpoints", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("renders unavailable checkpoint history as an actionable capability state", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=restore-unavailable");

  const work = page.getByTestId("work");

  await expect(
    work.getByRole("heading", { name: "Checkpoint history is unavailable" }),
  ).toBeVisible();
  await expect(work.getByText("Connect a history provider")).toBeVisible();
  await expect(
    work.getByRole("button", { name: "Back to editor" }),
  ).toBeVisible();
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-restore-unavailable", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("renders preview-ready and preview-stale route states", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=preview-ready");

  const previewPane = page.getByLabel("Preview pane");

  await expect(previewPane.getByTestId("route-preview")).toBeVisible();
  await expect(
    previewPane.getByRole("heading", { name: "How to Build a Writing Desk" }),
  ).toBeVisible();
  await expect(
    previewPane.getByText("/articles/how-to-build-a-writing-desk/"),
  ).toBeVisible();
  await expect(previewPane.getByText("Ready")).toBeVisible();
  await expect(
    previewPane.getByRole("button", { name: "Open preview externally" }),
  ).toBeDisabled();
  await previewPane.getByRole("button", { name: "Mobile preview" }).click();
  await expect(previewPane.getByTestId("route-preview")).toHaveAttribute(
    "data-preview-viewport",
    "mobile",
  );
  await previewPane.getByRole("button", { name: "Desktop preview" }).click();
  await expect(previewPane.getByTestId("route-preview")).toHaveAttribute(
    "data-preview-viewport",
    "desktop",
  );
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-preview-ready", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });

  await openStudio(page, "/?screen=preview-stale");
  await expect(previewPane.getByText("Preview out of date")).toBeVisible();
  await expect(previewPane.getByText("Stale")).toBeVisible();

  await previewPane.getByRole("button", { name: "Refresh preview" }).click();

  await expect(previewPane.getByText("Preview out of date")).toHaveCount(0);
  await expect(previewPane.getByText("Ready")).toBeVisible();
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-preview-stale-refreshed", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("renders preview loading, blocked, and failed recovery states", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=preview-loading");

  const previewPane = page.getByLabel("Preview pane");

  await expect(
    previewPane.getByRole("heading", { name: "Preparing preview" }),
  ).toBeVisible();
  await expect(
    previewPane.getByRole("button", { name: "Retry preview" }),
  ).toBeEnabled();
  await expectNoDocumentOverflow(page);

  await previewPane.getByRole("button", { name: "Retry preview" }).click();
  await expect(previewPane.getByTestId("route-preview")).toBeVisible();

  await openStudio(page, "/?screen=preview-blocked");
  await expect(
    previewPane.getByRole("heading", { name: "Preview is blocked" }),
  ).toBeVisible();
  await expect(previewPane.getByText("STUDIO-PREVIEW-BLOCKED")).toBeVisible();
  await expect(
    previewPane.getByRole("button", { name: "Retry preview" }),
  ).toBeDisabled();

  await test.info().attach("studio-preview-blocked", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });

  await openStudio(page, "/?screen=preview-failed");
  await expect(
    previewPane.getByRole("heading", { name: "Preview failed" }),
  ).toBeVisible();
  await expect(previewPane.getByText("STUDIO-PREVIEW-FAILED")).toBeVisible();
  await previewPane.getByRole("button", { name: "Retry preview" }).click();
  await expect(previewPane.getByTestId("route-preview")).toBeVisible();
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-preview-failed-retry", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("does not leak article live preview into project preview context", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openStudio(page, "/?screen=project-home");

  await expect(page.getByLabel("Preview pane")).toHaveCount(0);
  await expect(page.getByLabel("Preview collapsed")).toHaveCount(0);
  await page.getByRole("button", { exact: true, name: "Preview" }).click();

  await expect(page.getByLabel("Preview pane")).toHaveCount(0);
  await expect(page.getByLabel("Preview collapsed")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Project Home" }),
  ).toBeVisible();
  await expectNoDocumentOverflow(page);

  await test.info().attach("studio-preview-home-route", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});
