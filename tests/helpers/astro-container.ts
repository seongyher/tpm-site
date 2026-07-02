import { getContainerRenderer as getMdxContainerRenderer } from "@astrojs/mdx/container-renderer";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { loadRenderers } from "astro:container";

/** Site URL used by Astro container tests that render SEO metadata. */
export const testSiteUrl = "https://thephilosophersmeme.com";

let renderersPromise:
  Promise<Awaited<ReturnType<typeof loadRenderers>>> | undefined;

/**
 * Creates an Astro component-test container with the project's static-site
 * settings.
 *
 * @returns Astro container configured for component rendering tests.
 */
export async function createAstroTestContainer(): Promise<AstroContainer> {
  renderersPromise ??= loadRenderers([getMdxContainerRenderer()]);
  const renderers = await renderersPromise;

  return AstroContainer.create({
    astroConfig: {
      site: testSiteUrl,
      trailingSlash: "always",
    },
    renderers,
  });
}
