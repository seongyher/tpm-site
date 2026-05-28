import { describe, expect, test } from "vitest";

import BibliographyCatalogSection from "../../../../src/catalog/sections/BibliographyCatalogSection.astro";
import type { BibliographyEntry } from "../../../../src/lib/bibliography";
import { createAstroTestContainer } from "../../../helpers/astro-container";

const entries = [
  {
    display: {
      authors: "Baudrillard, Jean",
      fallbackText: "Baudrillard, Jean. Simulacra and Simulation. 1981.",
      title: "Simulacra and Simulation",
      year: "1981",
    },
    id: "bibliography-baudrillard-simulacra",
    sourceArticles: [
      {
        articleId: "catalog-article",
        date: "January 12, 2026",
        href: "/articles/catalog-article/",
        markerIds: ["cite-ref-baudrillard-1981"],
        publishedAt: new Date("2026-01-12T00:00:00.000Z"),
        title: "Catalog Article",
      },
    ],
    sourceContent: [
      {
        children: [
          {
            kind: "text",
            text: "Baudrillard, Jean. Simulacra and Simulation. 1981.",
          },
        ],
        kind: "paragraph",
        text: "Baudrillard, Jean. Simulacra and Simulation. 1981.",
      },
    ],
    sourceKey: "doi:catalog-baudrillard",
    sourceText: "Baudrillard, Jean. Simulacra and Simulation. 1981.",
  },
] as const satisfies readonly BibliographyEntry[];

describe("BibliographyCatalogSection", () => {
  test("renders bibliography catalog examples from a domain section", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(BibliographyCatalogSection, {
      props: { entries },
    });

    expect(view).toContain("Bibliography Components");
    expect(view).toContain(
      "src/components/bibliography/BibliographyPage.astro",
    );
    expect(view).toContain(
      "src/components/bibliography/BibliographyList.astro",
    );
    expect(view).toContain(
      "src/components/bibliography/BibliographyEntry.astro",
    );
    expect(view).toContain(
      "src/components/bibliography/BibliographySourceArticles.astro",
    );
    expect(view).toContain(
      "src/components/bibliography/BibliographyEmptyState.astro",
    );
    expect(view).toContain("Simulacra and Simulation");
  });
});
