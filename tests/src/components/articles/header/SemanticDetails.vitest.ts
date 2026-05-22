import { describe, expect, test } from "vitest";

import SemanticDetails from "../../../../../src/components/articles/header/SemanticDetails.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("SemanticDetails", () => {
  test("renders compact visible semantic facts", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(SemanticDetails, {
      props: {
        details: {
          description: "Visible context for structured metadata.",
          heading: "Review details",
          items: [
            {
              href: "https://example.com/book",
              label: "Reviewed",
              value: "Example Book",
            },
            {
              label: "Rating",
              value: "4/5",
            },
          ],
        },
      },
    });

    expect(view).toContain("data-semantic-details");
    expect(view).toContain("Review details");
    expect(view).toContain("Visible context for structured metadata.");
    expect(view).toContain("Example Book");
    expect(view).toContain('href="https://example.com/book"');
    expect(view).toContain("4/5");
  });

  test("omits empty semantic detail blocks", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(SemanticDetails, {
      props: {
        details: {
          heading: "Empty details",
          items: [],
        },
      },
    });

    expect(view).not.toContain("data-semantic-details");
  });
});
