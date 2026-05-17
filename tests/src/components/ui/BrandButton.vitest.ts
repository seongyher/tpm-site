import { describe, expect, test } from "vitest";

import discordLogoWhite from "../../../../src/components/ui/assets/discord-logo-white.svg";
import BrandButton from "../../../../src/components/ui/BrandButton.astro";
import { createAstroTestContainer } from "../../../helpers/astro-container";

describe("BrandButton", () => {
  test("renders a branded external link frame with safe defaults", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(BrandButton, {
      props: {
        backgroundClass: "bg-[#5865F2]",
        hoverBackgroundClass: "hover:bg-[#4752C4]",
        href: "https://discord.gg/8MVFRMa",
        label: "Join Discord",
        logo: discordLogoWhite,
        target: "_blank",
      },
    });

    expect(view).toContain('href="https://discord.gg/8MVFRMa"');
    expect(view).toContain('aria-label="Join Discord"');
    expect(view).toContain('rel="noreferrer"');
    expect(view).toContain("bg-[#5865F2]");
    expect(view).toContain("hover:bg-[#4752C4]");
    expect(view).toContain("h-9 w-32");
    expect(view).toContain('width="106"');
    expect(view).toContain('height="16"');
    expect(view).toContain("discord-logo-white.svg");
  });
});
