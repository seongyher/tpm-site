import { describe, expect, test } from "vitest";

import ArticleShareMenu from "../../../../../src/components/articles/actions/ArticleShareMenu.astro";
import { articleShareMenuViewModel } from "../../../../../src/lib/site/share-targets";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("ArticleShareMenu", () => {
  test("renders an anchored article share popover from a normalized model", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleShareMenu, {
      props: {
        share: articleShareMenuViewModel({
          articleUrl:
            "https://thephilosophersmeme.com/articles/what-is-a-meme/",
          description: "A cluster definition of memes.",
          image: {
            alt: "Social preview",
            height: 630,
            src: "https://thephilosophersmeme.com/_astro/preview.hash.jpg",
            type: "image/jpeg",
            width: 1200,
          },
          title: "What Is A Meme?",
        }),
      },
    });

    expect(view).toContain('aria-label="Share this article"');
    expect(view).toContain(">Share</span>");
    expect(view).toContain("lucide-share-2");
    expect(view).toContain("data-article-share-menu");
    expect(view).toContain('data-anchor-preset="article-action-menu"');
    expect(view).toContain("data-article-share-trigger");
    expect(view).toContain('popover="auto"');
    expect(view).toContain("data-article-share-panel");
    expect(view).toContain("Share What Is A Meme?");
    expect(view).toMatch(/\[(?:&|&#38;|&amp;):not\(:popover-open\)\]:hidden/);
    expect(view).toContain("data-article-share-copy-button");
    expect(view).toContain("data-article-share-copy-text");
    expect(view).toContain("Copy link");
    expect(view).toContain("Email");
    expect(view).toContain("Bluesky");
    expect(view).toContain("Threads");
    expect(view).toContain("Hacker News");
    expect(view).toContain("Pinterest");
    expect(view).toContain("data-article-share-open-button");
    expect(view).toContain("data-article-share-open-url");
    expect(view).not.toContain('href="https://twitter.com');
    expect(view).not.toContain('href="https://www.facebook.com');
    expect(view).not.toContain('href="https://www.reddit.com');
    expect(view).toContain('aria-live="polite"');
    expect(view).toContain("<script");
    expect(view).not.toContain("navigator.share");
    expect(view).not.toContain("discord");
    expect(view).not.toContain("platform.twitter.com");
    expect(view).not.toContain("connect.facebook.net");
  });
});
