import { describe, expect, test } from "vitest";

import ArticleHeaderActionLink from "../../../../../src/components/articles/actions/ArticleHeaderActionLink.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("ArticleHeaderActionLink", () => {
  test("renders a normal link action for PDF downloads", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleHeaderActionLink, {
      props: {
        download: true,
        href: "/articles/example/example.pdf",
        label: "Save PDF",
      },
      slots: {
        default: "PDF",
      },
    });

    expect(view).toContain("<a");
    expect(view).toContain('href="/articles/example/example.pdf"');
    expect(view).toContain('aria-label="Save PDF"');
    expect(view).toContain("download");
    expect(view).toContain("text-muted-foreground");
    expect(view).toContain("PDF");
  });
});
