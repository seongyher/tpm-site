import { describe, expect, test } from "vitest";

import ArticleCard from "../../../../../src/components/articles/lists/ArticleCard.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";
import { articleItems } from "../article-fixture";

describe("ArticleCard", () => {
  test("renders a linked article teaser", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleCard, {
      props: articleItems[0],
    });

    expect(view).toContain("<article");
    expect(view).toContain("/articles/article-title/");
    expect(view).toContain("/authors/seong-young-her/");
    expect(view).toContain("Article Title");
    expect(view).toContain("Article description.");
    expect(view).toContain('data-astro-prefetch="hover"');
    expect(view).toContain('data-article-card-has-image="true"');
    expect(view).toContain("data-article-card-kicker");
    expect(view).toContain('alt="Article preview image"');
    expect(view).toContain('width="288"');
    expect(view).toContain('height="176"');
    expect(view).toContain(
      'sizes="(min-width: 64rem) 18rem, (min-width: 48rem) 15rem, (min-width: 40rem) 6rem, 5rem"',
    );
    expect(view).toContain("grid-cols-[minmax(0,1fr)_5rem]");
    expect(view).toContain("md:h-40");
    expect(view).toContain("lg:w-72");
    expect(view).toContain("line-clamp-2");
    expect(view).toContain('data-article-card-title-fit="default"');
    expect(view).toContain("text-xl");
    expect(view).toContain("md:text-2xl");
    expect(view).toContain("data-article-card-description");
    expect(view).toContain('data-article-card-description-fit="default"');
    expect(view).toContain("line-clamp-3");
    expect(view).toContain("md:text-base");
    expect(view).toContain("md:leading-7");
    expect(view).toMatch(
      /href="\/categories\/history\/"[^>]*data-astro-prefetch="hover"/,
    );
  });

  test("lets no-image rows render without a media placeholder", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleCard, {
      props: articleItems[1],
    });

    expect(view).toContain('data-article-card-has-image="false"');
    expect(view).not.toContain("data-article-card-image-link");
    expect(view).toContain("grid-cols-1");
    expect(view).toContain("min-h-28");
  });

  test("shrinks hostile article-list titles before the two-line clamp", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleCard, {
      props: {
        ...articleItems[0],
        title:
          "A Very Long Article Title Containing metamemeticcountercounterinterpretationwithoutnaturalbreakpoints",
      },
    });

    expect(view).toContain('data-article-card-title-fit="minimum"');
    expect(view).toContain("text-sm");
    expect(view).toContain("md:text-base");
    expect(view).toContain("line-clamp-2");
  });

  test("shrinks hostile article-list descriptions before the three-line clamp", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleCard, {
      props: {
        ...articleItems[0],
        description:
          "A very long article description containing a hostile metamemeticcountercounterinterpretationwithoutnaturalbreakpoints sequence and enough surrounding prose to exceed the normal three-line budget while preserving scannable row rhythm.",
      },
    });

    expect(view).toContain('data-article-card-description-fit="tight"');
    expect(view).toContain("text-sm");
    expect(view).toContain("leading-5");
    expect(view).not.toMatch(
      /data-article-card-description[^>]*text-xs|text-xs[^>]*data-article-card-description/u,
    );
    expect(view).toContain("line-clamp-3");
  });
});
