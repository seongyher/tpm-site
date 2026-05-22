import heroLightImage from "@site/assets/shared/tpm_home_hero_light.png";
import heroDarkImage from "@site/assets/site/tpm_home_hero_dark.png";
import { describe, expect, test } from "vitest";

import HomeHeroBlock from "../../../../../src/components/blocks/home/HomeHeroBlock.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("HomeHeroBlock", () => {
  test("renders the homepage identity, tagline, and primary links", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeHeroBlock, {
      props: {
        darkImage: heroDarkImage,
        headingTitle: "The Philosopher's Meme",
        imageAlt: "The Philosopher's Meme",
        lightImage: heroLightImage,
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

    expect(view).toContain("home-hero-heading");
    expect(view).toContain("dark:hidden");
    expect(view).toContain("dark:block");
    expect(view).toContain('loading="eager"');
    expect(view).toContain('loading="lazy"');
    expect(view).toContain('fetchpriority="high"');
    expect(view).toContain('fetchpriority="low"');
    expect(view).toContain(
      'sizes="(min-width: 80rem) 48rem, (min-width: 64rem) 64vw, calc(100vw - 2rem)"',
    );
    expect(view).toContain("max-w-3xl");
    expect(view).toContain("The philosophy of memes.");
    expect(view).toContain(
      `aria-label="Support The Philosopher's Meme on Patreon"`,
    );
    expect(view).toContain('aria-label="Join the TPM Discord"');
    expect(view).not.toContain("Visit YouTube");
    expect(view).not.toContain("https://www.youtube.com/@ThePhilosophersMeme");
  });

  test("omits primary links when support is disabled upstream", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeHeroBlock, {
      props: {
        darkImage: heroDarkImage,
        headingTitle: "The Philosopher's Meme",
        imageAlt: "The Philosopher's Meme",
        lightImage: heroLightImage,
        support: {
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
        },
      },
    });

    expect(view).not.toContain("data-home-hero-cta-row");
  });
});
