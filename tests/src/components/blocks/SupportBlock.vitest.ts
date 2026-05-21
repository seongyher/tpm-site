import { describe, expect, test } from "vitest";

import SupportBlock from "../../../../src/components/blocks/SupportBlock.astro";
import { createAstroTestContainer } from "../../../helpers/astro-container";

describe("SupportBlock", () => {
  test("renders a reusable support call to action", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(SupportBlock, {
      props: {
        headingId: "test-support-block",
        support: {
          body: "Support independent writing.",
          discord: {
            ariaLabel: "Join the TPM Discord",
            href: "https://discord.gg/8MVFRMa",
            label: "Join Discord",
          },
          enabled: true,
          patreon: {
            ariaLabel: "Support The Philosopher's Meme on Patreon",
            href: "https://patreon.com/thephilosophersmeme",
            label: "Support Us",
          },
          title: "Support TPM",
        },
      },
    });

    expect(view).toContain('aria-labelledby="test-support-block"');
    expect(view).toContain("Support TPM");
    expect(view).toContain("Support independent writing.");
    expect(view).toContain("Support The Philosopher's Meme on Patreon");
    expect(view).toContain("Join the TPM Discord");
    expect(view).toContain("patreon-lockup-white");
    expect(view).toContain("discord-logo-white");
    expect(view).toContain("w-full");
    expect(view).toContain("text-xl font-semibold");
  });

  test("renders nothing when support is disabled upstream", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(SupportBlock, {
      props: {
        support: {
          body: "Support independent writing.",
          discord: {
            ariaLabel: "Join Discord",
            href: "https://discord.gg/example",
            label: "Discord",
          },
          enabled: false,
          patreon: {
            ariaLabel: "Support on Patreon",
            href: "https://patreon.com/example",
            label: "Patreon",
          },
          title: "Support TPM",
        },
      },
    });

    expect(view.trim()).toBe("");
  });
});
