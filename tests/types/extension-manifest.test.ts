import { describe, expect, test } from "bun:test";

import {
  defineExtensionManifest,
  type ExtensionManifest,
} from "../../src/platform/extensions";

describe("extension manifest type fixtures", () => {
  test("preserves literal manifest types for valid declarations", () => {
    const manifest = defineExtensionManifest({
      capabilities: [
        {
          family: "ui.component",
          id: "support-button",
          summary: "Render a support button.",
        },
      ],
      components: [
        {
          componentRef: "components/SupportButton.astro",
          fallback: {
            feed: "static-text",
            pdf: "static-link",
            search: "static-text",
          },
          name: "Support Button",
          propsSchemaRef: "schemas/support-button",
          surfaces: ["article", "home"],
        },
      ],
      disabledBehavior: {
        mode: "disable-capabilities",
        summary: "Hide support button surfaces.",
      },
      id: "site.support-button",
      kind: "site",
      name: "Support Button",
      summary: "Site-owned support component.",
      version: "0.1.0",
    } satisfies ExtensionManifest);

    const [capability] = manifest.capabilities;

    expect(capability?.family).toBe("ui.component");
  });

  test("rejects unknown extension enum values at type level", () => {
    const manifest = {
      capabilities: [
        {
          // @ts-expect-error Unknown capability families cannot be declared.
          family: "misc.anything",
          id: "invalid",
          summary: "Invalid capability.",
        },
      ],
      disabledBehavior: {
        mode: "disable-capabilities",
        summary: "No-op.",
      },
      id: "invalid.capability",
      // @ts-expect-error Unknown extension kinds cannot be declared.
      kind: "partner",
      name: "Invalid Capability",
      summary: "Invalid manifest.",
      version: "0.1.0",
    } satisfies ExtensionManifest;

    expect(manifest.id).toBe("invalid.capability");
  });
});
