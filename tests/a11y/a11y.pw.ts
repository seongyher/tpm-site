import { AxeBuilder } from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

type AxeResult = Awaited<
  ReturnType<InstanceType<typeof AxeBuilder>["analyze"]>
>["violations"][number];

const routes = [
  "/",
  "/announcements/",
  "/articles/",
  "/articles/gamergate-as-metagaming/",
  "/authors/",
  "/bibliography/",
  "/categories/",
  "/categories/history/",
  "/collections/",
  "/collections/start-here/",
  "/tags/",
  "/about/",
  "/search/",
];

for (const route of routes) {
  test(`has no serious or critical axe violations on ${route}`, async ({
    page,
  }) => {
    await page.goto(route);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const severeViolations = results.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical",
    );
    const { firstPartyViolations } = await partitionAccessibilityViolations(
      page,
      severeViolations,
    );

    expect(firstPartyViolations).toEqual([]);
  });
}

async function partitionAccessibilityViolations(
  page: Page,
  violations: readonly AxeResult[],
): Promise<{
  externalFrameViolations: AxeResult[];
  firstPartyViolations: AxeResult[];
}> {
  const classified = await Promise.all(
    violations.map(async (violation) => ({
      isExternalFrameContent: await isExternalFrameContentViolation(
        page,
        violation,
      ),
      violation,
    })),
  );

  return {
    externalFrameViolations: classified
      .filter(({ isExternalFrameContent }) => isExternalFrameContent)
      .map(({ violation }) => violation),
    firstPartyViolations: classified
      .filter(({ isExternalFrameContent }) => !isExternalFrameContent)
      .map(({ violation }) => violation),
  };
}

async function isExternalFrameContentViolation(
  page: Page,
  violation: AxeResult,
): Promise<boolean> {
  if (violation.nodes.length === 0) {
    return false;
  }

  const nodeResults = await Promise.all(
    violation.nodes.map(async (node) => {
      const frameSelector = node.target[0];
      if (node.target.length < 2 || typeof frameSelector !== "string") {
        return false;
      }

      const frame = page.locator(frameSelector).first();
      if ((await frame.count()) === 0) {
        return false;
      }

      return frame.evaluate((element) => {
        if (!(element instanceof HTMLIFrameElement)) {
          return false;
        }

        try {
          return !element.src.startsWith(`${window.location.origin}/`);
        } catch {
          return false;
        }
      });
    }),
  );

  return nodeResults.every(Boolean);
}
