import type { ImageMetadata } from "astro";
import { describe, expect, test } from "bun:test";

import type { ArticleArchiveItem } from "../../../src/lib/archive";
import type { EditorialCollectionEntry } from "../../../src/lib/collections";
import {
  homepageDiscoveryLinks,
  homePageRouteViewModel,
  homePageViewModel,
} from "../../../src/lib/home";
import { defaultPublishableVisibility } from "../../../src/lib/publishable";
import { parseSiteConfig } from "../../../src/lib/site-config";
import { announcementEntry, articleEntry } from "../../helpers/content";

describe("homepage view model", () => {
  test("resolves Featured and Start Here from publishable collections", () => {
    const viewModel = homePageViewModel({
      announcements: [
        announcementEntry({
          id: "forum-priority",
        }),
      ],
      archiveItems: [
        archiveItem("latest"),
        archiveItem("what-is-a-meme"),
        archiveItem("homesteading-the-memeosphere"),
      ],
      collections: [
        collectionEntry("featured", {
          items: [
            {
              note: "Feature note.",
              slug: "homesteading-the-memeosphere",
            },
            "forum-priority",
          ],
        }),
        collectionEntry("start-here", {
          items: ["what-is-a-meme", "homesteading-the-memeosphere"],
        }),
      ],
    });

    expect(viewModel.featuredItems.map((item) => item.slug)).toEqual([
      "homesteading-the-memeosphere",
      "forum-priority",
    ]);
    expect(viewModel.featuredItems[0]?.note).toBe("Feature note.");
    expect(viewModel.featuredItems.map((item) => item.kind)).toEqual([
      "article",
      "announcement",
    ]);
    expect(viewModel.startHereItems.map((item) => item.title)).toEqual([
      "what-is-a-meme",
      "homesteading-the-memeosphere",
    ]);
  });

  test("uses newest visible announcements and normal articles for automatic homepage lists", () => {
    const viewModel = homePageViewModel({
      announcementLimit: 2,
      announcements: [
        announcementEntry({
          date: new Date("2026-05-05T00:00:00Z"),
          id: "new",
        }),
        announcementEntry({
          data: {
            visibility: {
              ...defaultPublishableVisibility,
              homepage: false,
            },
          },
          date: new Date("2026-05-04T00:00:00Z"),
          id: "hidden-announcement",
        }),
        announcementEntry({
          date: new Date("2026-05-03T00:00:00Z"),
          id: "old",
        }),
      ],
      archiveItems: [
        archiveItem("latest"),
        archiveItem("hidden", {
          visibility: {
            ...defaultPublishableVisibility,
            homepage: false,
          },
        }),
        archiveItem("older"),
      ],
      collections: [
        collectionEntry("featured", { items: ["latest"] }),
        collectionEntry("start-here", { items: ["older"] }),
      ],
      recentLimit: 2,
    });

    expect(viewModel.announcementItems.map((item) => item.href)).toEqual([
      "/announcements/new/",
      "/announcements/old/",
    ]);
    expect(viewModel.recentFeedItems.map((item) => item.href)).toEqual([
      "/articles/latest/",
      "/articles/older/",
    ]);
  });

  test("uses configured homepage collection IDs and list limits", () => {
    const viewModel = homePageViewModel({
      announcementLimit: 1,
      announcements: [
        announcementEntry({ id: "new" }),
        announcementEntry({ id: "old" }),
      ],
      archiveItems: [archiveItem("latest"), archiveItem("older")],
      collections: [
        collectionEntry("front-page", { items: ["latest"] }),
        collectionEntry("starter-pack", { items: ["older"] }),
      ],
      featuredCollectionId: "front-page",
      recentLimit: 1,
      startHereCollectionId: "starter-pack",
    });

    expect(viewModel.featuredItems.map((item) => item.slug)).toEqual([
      "latest",
    ]);
    expect(viewModel.startHereItems.map((item) => item.href)).toEqual([
      "/articles/older/",
    ]);
    expect(viewModel.announcementItems).toHaveLength(1);
    expect(viewModel.recentFeedItems).toHaveLength(1);
  });

  test("fails clearly when required homepage collections are missing", () => {
    expect(() =>
      homePageViewModel({
        announcements: [],
        archiveItems: [],
        collections: [],
      }),
    ).toThrow('Missing required homepage collection "featured".');
  });

  test("resolves configured discovery links and skips disabled route features", () => {
    const config = parseSiteConfig({
      identity: {
        description: "A configurable publication.",
        language: "en",
        title: "Example Blog",
        url: "https://example.com",
      },
      features: {
        authors: false,
      },
      homepage: {
        discoveryLinks: [
          { label: "Articles", route: "articles" },
          { label: "Authors", route: "authors" },
          { href: "https://example.com/newsletter", label: "Newsletter" },
        ],
      },
      navigation: {
        footer: [],
        primary: [],
      },
      routes: {
        allArticles: "/articles/all/",
        announcements: "/announcements/",
        articles: "/writing/",
        authors: "/authors/",
        bibliography: "/bibliography/",
        categories: "/categories/",
        collections: "/collections/",
        feed: "/feed.xml",
        home: "/",
        search: "/search/",
        tags: "/tags/",
      },
      support: {
        block: {
          body: "Keep publishing going.",
          title: "Support Example Blog",
        },
        discord: {
          href: "https://discord.gg/example",
          label: "Join Discord",
        },
        patreon: {
          href: "https://patreon.com/example",
          label: "Support Us",
        },
      },
    });

    expect(homepageDiscoveryLinks(config)).toEqual([
      { href: "/writing/", label: "Articles" },
      { href: "https://example.com/newsletter", label: "Newsletter" },
    ]);
  });

  test("resolves every configured homepage discovery route key", () => {
    const config = parseSiteConfig({
      identity: {
        description: "A configurable publication.",
        language: "en",
        title: "Example Blog",
        url: "https://example.com",
      },
      homepage: {
        discoveryLinks: [
          { label: "Home", route: "home" },
          { label: "Articles", route: "articles" },
          { label: "Archive", route: "allArticles" },
          { label: "Announcements", route: "announcements" },
          { label: "Authors", route: "authors" },
          { label: "Bibliography", route: "bibliography" },
          { label: "Categories", route: "categories" },
          { label: "Collections", route: "collections" },
          { label: "Feed", route: "feed" },
          { label: "Search", route: "search" },
          { label: "Tags", route: "tags" },
        ],
      },
      navigation: {
        footer: [],
        primary: [],
      },
      routes: {
        allArticles: "/archive/",
        announcements: "/news/",
        articles: "/writing/",
        authors: "/people/",
        bibliography: "/sources/",
        categories: "/topics/",
        collections: "/series/",
        feed: "/rss.xml",
        home: "/",
        search: "/find/",
        tags: "/labels/",
      },
      support: {
        block: {
          body: "Keep publishing going.",
          title: "Support Example Blog",
        },
        discord: {
          href: "https://discord.gg/example",
          label: "Join Discord",
        },
        patreon: {
          href: "https://patreon.com/example",
          label: "Support Us",
        },
      },
    });

    expect(homepageDiscoveryLinks(config)).toEqual([
      { href: "/", label: "Home" },
      { href: "/writing/", label: "Articles" },
      { href: "/archive/", label: "Archive" },
      { href: "/news/", label: "Announcements" },
      { href: "/people/", label: "Authors" },
      { href: "/sources/", label: "Bibliography" },
      { href: "/topics/", label: "Categories" },
      { href: "/series/", label: "Collections" },
      { href: "/rss.xml", label: "Feed" },
      { href: "/find/", label: "Search" },
      { href: "/labels/", label: "Tags" },
    ]);
  });

  test("builds full homepage route props from site config and loaded content", () => {
    const config = parseSiteConfig({
      identity: {
        description: "A configurable publication.",
        language: "en",
        shortTitle: "Example",
        title: "Example Blog",
        url: "https://example.com",
      },
      features: {
        announcements: false,
        categories: false,
        collections: true,
        support: false,
      },
      homepage: {
        discoveryLinks: [
          { label: "Articles", route: "articles" },
          { label: "Announcements", route: "announcements" },
        ],
        featuredCollection: "front-page",
        labels: {
          announcements: "News",
          categories: "Topics",
          featured: "Spotlight",
          read: "Browse",
          recent: "Latest",
          startHere: "Start",
        },
        startHereCollection: "starter-pack",
      },
      navigation: {
        footer: [],
        primary: [],
      },
      routes: {
        allArticles: "/articles/all/",
        announcements: "/announcements/",
        articles: "/writing/",
        authors: "/authors/",
        bibliography: "/bibliography/",
        categories: "/categories/",
        collections: "/collections/",
        feed: "/feed.xml",
        home: "/",
        search: "/search/",
        tags: "/tags/",
      },
      support: {
        block: {
          body: "Keep publishing going.",
          title: "Support Example Blog",
        },
        discord: {
          href: "https://discord.gg/example",
          label: "Join Discord",
        },
        patreon: {
          href: "https://patreon.com/example",
          label: "Support Us",
        },
      },
    });

    const viewModel = homePageRouteViewModel({
      announcements: [announcementEntry({ id: "news" })],
      articles: [
        articleEntry({ id: "latest" }),
        articleEntry({ id: "starter" }),
      ],
      authors: [],
      categories: [],
      collections: [
        collectionEntry("front-page", { items: ["latest"] }),
        collectionEntry("starter-pack", { items: ["starter"] }),
      ],
      config,
      home: {
        data: {
          hero: {
            imageAlt: "Example mark",
            lightImage: imageMetadata("/example.png"),
            tagline: "A concise tagline.",
          },
          startHere: [],
          title: "Home",
        },
      },
    });

    expect(viewModel.title).toBe("Home | Example Blog");
    expect(viewModel.description).toBe("A configurable publication.");
    expect(viewModel.discovery).toEqual({
      links: [{ href: "/writing/", label: "Articles" }],
      title: "Browse",
    });
    expect(viewModel.hero.headingTitle).toBe("Example Blog");
    expect(viewModel.hero.imageAlt).toBe("Example mark");
    expect(viewModel.hero.support.enabled).toBe(false);
    expect(viewModel.featured.title).toBe("Spotlight");
    expect(viewModel.featured.fallbackLabel).toBe("Example");
    expect(viewModel.startHere.titleHref).toBe("/collections/starter-pack/");
    expect(viewModel.announcements.titleHref).toBeUndefined();
    expect(viewModel.categories).toBeUndefined();
    expect(viewModel.recent.ariaLabel).toBe("Latest");
  });

  test("fails clearly when the homepage page is missing hero configuration", () => {
    const config = parseSiteConfig({
      identity: {
        description: "A configurable publication.",
        language: "en",
        title: "Example Blog",
        url: "https://example.com",
      },
      navigation: {
        footer: [],
        primary: [],
      },
      routes: {
        allArticles: "/articles/all/",
        announcements: "/announcements/",
        articles: "/writing/",
        authors: "/authors/",
        bibliography: "/bibliography/",
        categories: "/categories/",
        collections: "/collections/",
        feed: "/feed.xml",
        home: "/",
        search: "/search/",
        tags: "/tags/",
      },
      support: {
        block: {
          body: "Keep publishing going.",
          title: "Support Example Blog",
        },
        discord: {
          href: "https://discord.gg/example",
          label: "Join Discord",
        },
        patreon: {
          href: "https://patreon.com/example",
          label: "Support Us",
        },
      },
    });

    expect(() =>
      homePageRouteViewModel({
        announcements: [],
        articles: [],
        authors: [],
        categories: [],
        collections: [
          collectionEntry("featured", { items: [] }),
          collectionEntry("start-here", { items: [] }),
        ],
        config,
        home: {
          data: {
            startHere: [],
            title: "Home",
          },
        },
      }),
    ).toThrow(
      "Missing homepage hero config at site/content/pages/index.md frontmatter.",
    );
  });
});

function archiveItem(
  id: string,
  data: Partial<ReturnType<typeof articleEntry>["data"]> = {},
): ArticleArchiveItem {
  return {
    article: articleEntry({ data, id }),
    author: "Author",
    authors: [],
    date: "January 1, 2024",
    description: `${id} description`,
    title: id,
    url: `/articles/${id}/`,
  };
}

function collectionEntry(
  id: string,
  data: Partial<EditorialCollectionEntry["data"]> = {},
): EditorialCollectionEntry {
  return {
    body: "",
    collection: "collections",
    data: {
      draft: false,
      items: [],
      title: id,
      ...data,
    },
    id,
  };
}

function imageMetadata(src: string): ImageMetadata {
  return {
    format: "png",
    height: 600,
    src,
    width: 1200,
  };
}
