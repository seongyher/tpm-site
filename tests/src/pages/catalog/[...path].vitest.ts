import { describe, expect, test } from "vitest";

import { siteConfig } from "../../../../src/lib/site/site-config";
import CatalogPage from "../../../../src/pages/catalog/[...path].astro";
import {
  createAstroTestContainer,
  testSiteUrl,
} from "../../../helpers/astro-container";

describe("catalog page", () => {
  test("renders the catalog page when the route is enabled", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(CatalogPage, {
      request: new Request(`${testSiteUrl}/catalog/`),
    });

    expect(view).toContain("Platform Component Catalog");
    expect(view).toContain(`${siteConfig.identity.url}/catalog/`);
  });
});
