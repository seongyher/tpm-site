import heroLightImage from "@site/assets/shared/tpm_home_hero_light.png";
import heroDarkImage from "@site/assets/site/tpm_home_hero_dark.png";
import { describe, expect, test } from "vitest";

import HomeMastheadBlock from "../../../../../src/components/blocks/home/HomeMastheadBlock.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";
import { articleItems } from "../../articles/article-fixture";

describe("HomeMastheadBlock", () => {
  test("composes start-here, centered hero, and current panels", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeMastheadBlock, {
      props: {
        currentLinks: [
          {
            href: "https://discord.gg/8MVFRMa",
            label: "Join Discord",
          },
        ],
        darkImage: heroDarkImage,
        headingTitle: "The Philosopher's Meme",
        imageAlt: "The Philosopher's Meme",
        lightImage: heroLightImage,
        startHereItems: articleItems,
        support: {
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
        },
        tagline: "The philosophy of memes.",
      },
    });

    expect(view).toContain("data-home-masthead");
    expect(view).toContain("data-home-start-here-panel");
    expect(view).toContain("data-home-hero-block");
    expect(view).toContain("data-home-current-panel");
    expect(view).toContain("Article Title");
    expect(view).toContain("Join Discord");
  });
});
