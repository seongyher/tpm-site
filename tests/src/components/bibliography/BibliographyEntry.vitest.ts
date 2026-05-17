import { describe, expect, test } from "vitest";

import BibliographyEntry from "../../../../src/components/bibliography/BibliographyEntry.astro";
import { createAstroTestContainer } from "../../../helpers/astro-container";
import { bibliographyEntryFixture } from "./bibliography-fixture";

describe("BibliographyEntry", () => {
  test("renders one bibliography source without exposing raw BibTeX", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(BibliographyEntry, {
      props: { entry: bibliographyEntryFixture },
    });

    expect(view).toContain('id="bibliography-baudrillard-simulacra"');
    expect(view).toContain("Baudrillard, Jean");
    expect(view).toContain(
      'href="https://example.com/source-with-a-very-long-path-that-wraps"',
    );
    expect(view).toContain(">Source</a>");
    expect(view).toContain("https://example.com/source-with-a-very-long-path");
    expect(view).toContain("Cited by articles");
    expect(view).not.toContain("<h3");
    expect(view).not.toContain("first:pt-0");
    expect(view).not.toContain("last:pb-0");
    expect(view).not.toContain("@book");
  });
});
