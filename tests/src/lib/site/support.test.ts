import { describe, expect, test } from "bun:test";

import { siteConfig } from "../../../../src/lib/site/site-config";
import {
  supportActionsViewModel,
  supportBlockViewModel,
} from "../../../../src/lib/site/support";

describe("support view models", () => {
  test("normalizes configured support actions and copy", () => {
    expect(supportBlockViewModel(siteConfig)).toEqual({
      body: "Help keep independent research and writing going.",
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
      title: "Support The Philosopher's Meme",
    });
  });

  test("falls back to visible labels for missing action aria labels", () => {
    const view = supportActionsViewModel({
      ...siteConfig,
      support: {
        ...siteConfig.support,
        discord: {
          href: "https://example.com/discord",
          label: "Discord",
        },
        patreon: {
          href: "https://example.com/patreon",
          label: "Patreon",
        },
      },
    });

    expect(view.discord.ariaLabel).toBe("Discord");
    expect(view.patreon.ariaLabel).toBe("Patreon");
  });
});
