import { describe, expect, test } from "bun:test";

import {
  defineExtensionManifest,
  extensionCapabilityFamilies,
  extensionCatalogEntries,
  extensionPointKinds,
  extensionTrustBoundaries,
  validateExtensionManifest,
} from "../../../src/platform/extensions";

describe("platform extension entrypoint", () => {
  test("exposes extension manifest helpers through the platform seam", () => {
    const manifest = defineExtensionManifest({
      capabilities: [
        {
          family: "metadata.profile",
          id: "review",
          summary: "Add review metadata profile support.",
        },
      ],
      disabledBehavior: {
        mode: "disable-capabilities",
        summary: "Review metadata fields are ignored.",
      },
      id: "official.review-metadata",
      kind: "optional-official",
      metadataProfiles: [
        {
          kind: "review",
          schemaRef: "schemas/review-metadata",
        },
      ],
      name: "Review Metadata",
      summary: "Adds review profile metadata.",
      version: "0.1.0",
    });

    expect(validateExtensionManifest(manifest)).toEqual([]);
    expect(extensionCatalogEntries([manifest])[0]?.trustBoundary).toBe(
      "bundled-official",
    );
    expect(extensionCapabilityFamilies).toContain("metadata.profile");
    expect(extensionPointKinds).toContain("metadata.profile");
    expect(extensionTrustBoundaries).toContain("third-party");
  });
});
