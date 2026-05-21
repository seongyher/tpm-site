import { describe, expect, test } from "bun:test";

import {
  type ArticleShareAction,
  articleShareMenuViewModel,
} from "../../../src/lib/share-targets";

const articleUrl = "https://thephilosophersmeme.com/articles/what-is-a-meme/";
const title = "What Is A Meme? & Why It Matters";
const description = "A cluster definition of memes, jokes, and visual culture.";
const image = {
  alt: "Social preview",
  height: 630,
  src: "https://thephilosophersmeme.com/_astro/preview.hash.jpg",
  type: "image/jpeg",
  width: 1200,
} as const;

describe("article share targets", () => {
  test("builds deterministic copy, email, and external share actions", () => {
    const share = articleShareMenuViewModel({
      articleUrl,
      description,
      image,
      title,
    });

    expect(share.copyText).toBe(articleUrl);
    expect(share.actions.map((action) => action.id)).toEqual([
      "copy-link",
      "email",
      "bluesky",
      "x",
      "threads",
      "facebook",
      "linkedin",
      "reddit",
      "hacker-news",
      "pinterest",
    ]);
    expect(share.actions.map((action) => action.label)).toEqual([
      "Copy link",
      "Email",
      "Bluesky",
      "X",
      "Threads",
      "Facebook",
      "LinkedIn",
      "Reddit",
      "Hacker News",
      "Pinterest",
    ]);
    expect(share.actions.map((action) => action.icon)).toEqual([
      "copy-link",
      "email",
      "message",
      "x",
      "at-sign",
      "facebook",
      "linkedin",
      "reddit",
      "hacker-news",
      "pinterest",
    ]);
  });

  test("encodes platform share URLs and owned social attribution", () => {
    const share = articleShareMenuViewModel({
      articleUrl,
      description,
      image,
      title,
    });

    expect(search(href(share, "x"), "text")).toBe(title);
    expect(search(href(share, "x"), "url")).toBe(articleUrl);
    expect(search(href(share, "x"), "via")).toBe("philo_meme");
    expect(
      href(share, "x").startsWith("https://twitter.com/intent/tweet?"),
    ).toBe(true);

    expect(search(href(share, "threads"), "text")).toContain(
      "@the_philosophers_meme",
    );
    expect(search(href(share, "threads"), "text")).toContain(articleUrl);
    expect(
      href(share, "threads").startsWith("https://www.threads.com/intent/post?"),
    ).toBe(true);

    expect(search(href(share, "bluesky"), "text")).toBe(
      `${title}\n\n${articleUrl}`,
    );
    expect(search(href(share, "facebook"), "u")).toBe(articleUrl);
    expect(search(href(share, "linkedin"), "url")).toBe(articleUrl);
    expect(search(href(share, "reddit"), "title")).toBe(title);
    expect(search(href(share, "reddit"), "url")).toBe(articleUrl);
    expect(search(href(share, "hacker-news"), "t")).toBe(title);
    expect(search(href(share, "hacker-news"), "u")).toBe(articleUrl);
    expect(search(href(share, "pinterest"), "url")).toBe(articleUrl);
    expect(search(href(share, "pinterest"), "media")).toBe(image.src);
    expect(search(href(share, "pinterest"), "description")).toBe(description);
  });

  test("omits Pinterest when there is no generated social preview image", () => {
    const share = articleShareMenuViewModel({
      articleUrl,
      description,
      title,
    });

    expect(share.actions.map((action) => action.id)).not.toContain("pinterest");
  });

  test("honors configured third-party share target order", () => {
    const share = articleShareMenuViewModel({
      articleUrl,
      description,
      image,
      targetIds: ["reddit", "x"],
      title,
    });

    expect(share.actions.map((action) => action.id)).toEqual([
      "copy-link",
      "email",
      "reddit",
      "x",
    ]);
  });

  test("fails loudly if a caller bypasses config validation with an unsupported target", () => {
    expect(() =>
      articleShareMenuViewModel({
        articleUrl,
        description,
        // @ts-expect-error: Intentionally bypass config validation to exercise the runtime guard.
        targetIds: ["unsupported-target"],
        title,
      }),
    ).toThrow("Unsupported article share target: unsupported-target");
  });

  test("builds email with the article title, URL, and site attribution", () => {
    const share = articleShareMenuViewModel({
      articleUrl,
      description,
      title,
    });

    expect(href(share, "email").startsWith("mailto:?")).toBe(true);
    expect(search(href(share, "email"), "subject")).toBe(title);
    expect(search(href(share, "email"), "body")).toBe(
      `${title}\n\n${articleUrl}\n\nThe Philosopher's Meme`,
    );
  });

  test("truncates only the Threads title before the handle or URL can be cut", () => {
    const longTitle = "A".repeat(700);
    const share = articleShareMenuViewModel({
      articleUrl,
      description,
      title: longTitle,
    });
    const text = search(href(share, "threads"), "text");

    if (text === null) {
      throw new Error("Expected Threads share text.");
    }

    expect(text.length).toBeLessThanOrEqual(500);
    expect(text).toContain(articleUrl);
    expect(text).toContain("@the_philosophers_meme");
    expect(text).toMatch(/^A+\.\.\./u);
  });
});

function href(
  share: ReturnType<typeof articleShareMenuViewModel>,
  id: string,
): string {
  const action = share.actions.find(
    (
      shareAction,
    ): shareAction is Extract<ArticleShareAction, { href: string }> =>
      shareAction.id === id && "href" in shareAction,
  );

  if (action === undefined) {
    throw new Error(`Missing share action: ${id}`);
  }

  return action.href;
}

function search(href: string, key: string): null | string {
  const queryStart = href.indexOf("?");
  const query = queryStart === -1 ? "" : href.slice(queryStart + 1);

  return new URLSearchParams(query).get(key);
}
