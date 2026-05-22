import { describe, expect, test } from "vitest";

import { getAuthorProfiles } from "../../../../src/lib/content/authors";
import AuthorRoute from "../../../../src/pages/authors/[author].astro";
import {
  createAstroTestContainer,
  testSiteUrl,
} from "../../../helpers/astro-container";

describe("author detail route", () => {
  test("renders an author profile and its article list", async () => {
    const profile = (await getAuthorProfiles()).find(
      (entry) => entry.id === "seong-young-her",
    );

    if (profile === undefined) {
      throw new Error("Expected Seong-Young Her author profile.");
    }

    const container = await createAstroTestContainer();
    const view = await container.renderToString(AuthorRoute, {
      props: { profile },
      request: new Request(`${testSiteUrl}/authors/${profile.id}/`),
    });

    expect(view).toContain("Seong-Young Her");
    expect(view).toContain("Articles by Seong-Young Her");
    expect(view).toContain("<article");
  });
});
