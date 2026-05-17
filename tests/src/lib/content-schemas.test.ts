import { z } from "astro/zod";
import { describe, expect, test } from "bun:test";

import {
  announcementSchema,
  articleSchema,
  authorSchema,
  categorySchema,
  editorialCollectionSchema,
  filenameStem,
  pageSchema,
  publishableVisibilitySchema,
} from "../../../src/lib/content-schemas";

describe("content schemas", () => {
  const imageSchema = () =>
    z.object({
      format: z.enum([
        "png",
        "jpg",
        "jpeg",
        "tiff",
        "webp",
        "gif",
        "svg",
        "avif",
      ]),
      height: z.number(),
      src: z.string(),
      width: z.number(),
    });

  test("accepts valid article frontmatter and rejects unknown fields", () => {
    const schema = articleSchema({
      image: imageSchema,
    });

    const parsed = schema.safeParse({
      author: "Author",
      date: "2022-04-06",
      description: "Description",
      image: { format: "jpg", height: 640, src: "/article.jpg", width: 960 },
      tags: ["meme history", "c++"],
      title: "Article Title",
      updated: "2022-05-01",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect("pdf" in parsed.data && parsed.data.pdf).toBe(true);
      expect(parsed.data.updated).toEqual(new Date("2022-05-01"));
    }
    expect(
      schema.safeParse({
        author: "Author",
        date: "2022-04-06",
        description: "Description",
        pdf: false,
        title: "Article Title",
      }).success,
    ).toBe(true);
    expect(
      schema.safeParse({
        author: "Author",
        date: "2022-04-06",
        description: "Description",
        layout: "default",
        title: "Article Title",
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        author: "Author",
        date: "not a date",
        description: "Description",
        title: "Article Title",
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        author: "Author",
        date: "2022-04-06",
        description: "Description",
        tags: ["Meme History"],
        title: "Article Title",
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        author: "Author",
        date: "2022-04-06",
        description: "Description",
        tags: ["meme history", "meme   history"],
        title: "Article Title",
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        author: "Author",
        date: "2022-04-06",
        description: "Description",
        tags: ["/pol/"],
        title: "Article Title",
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        author: "Author",
        date: "2022-04-06",
        description: "Description",
        image: {
          format: "jpg",
          height: "bad",
          src: "/article.jpg",
          width: 960,
        },
        title: "Article Title",
      }).success,
    ).toBe(false);
  });

  test("accepts announcement frontmatter through the article-like schema", () => {
    const schema = announcementSchema({
      image: imageSchema,
    });

    expect(
      schema.safeParse({
        author: "The Philosopher's Meme",
        date: "2026-05-05",
        description: "Announcement description",
        tags: [],
        title: "Announcement Title",
      }).success,
    ).toBe(true);
    expect(
      schema.safeParse({
        author: "The Philosopher's Meme",
        date: "2026-05-05",
        description: "Announcement description",
        pdf: false,
        tags: [],
        title: "Announcement Title",
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        author: "The Philosopher's Meme",
        date: "2026-05-05",
        description: "Announcement description",
        section: "not a supported announcement field",
        tags: [],
        title: "Announcement Title",
      }).success,
    ).toBe(false);
  });

  test("defaults publishable visibility to every public surface", () => {
    expect(publishableVisibilitySchema().parse(undefined)).toEqual({
      directory: true,
      feed: true,
      homepage: true,
      search: true,
    });
    expect(
      publishableVisibilitySchema().parse({
        homepage: false,
      }),
    ).toEqual({
      directory: true,
      feed: true,
      homepage: false,
      search: true,
    });
    expect(
      articleSchema({ image: imageSchema }).parse({
        author: "Author",
        date: "2022-04-06",
        description: "Description",
        title: "Article Title",
        visibility: {
          homepage: false,
        },
      }).visibility,
    ).toEqual({
      directory: true,
      feed: true,
      homepage: false,
      search: true,
    });
  });

  test("honors site-owned content-type defaults while preserving frontmatter overrides", () => {
    const articleDefaults = {
      draft: true,
      pdf: { enabled: false },
      visibility: {
        directory: true,
        feed: false,
        homepage: false,
        search: true,
      },
    };
    const announcementDefaults = {
      draft: false,
      visibility: {
        directory: true,
        feed: true,
        homepage: true,
        search: false,
      },
    };

    expect(
      articleSchema({ image: imageSchema }, articleDefaults).parse({
        author: "Author",
        date: "2022-04-06",
        description: "Description",
        title: "Article Title",
        visibility: {
          homepage: true,
        },
      }),
    ).toMatchObject({
      draft: true,
      pdf: false,
      visibility: {
        directory: true,
        feed: false,
        homepage: true,
        search: true,
      },
    });
    expect(
      announcementSchema({ image: imageSchema }, announcementDefaults).parse({
        author: "The Philosopher's Meme",
        date: "2026-05-05",
        description: "Announcement description",
        tags: [],
        title: "Announcement Title",
      }).visibility,
    ).toEqual({
      directory: true,
      feed: true,
      homepage: true,
      search: false,
    });
  });

  test("validates category and standalone page frontmatter", () => {
    expect(
      categorySchema().safeParse({
        order: 1,
        title: "History",
      }).success,
    ).toBe(true);
    expect(
      categorySchema().safeParse({
        order: -1,
        title: "History",
      }).success,
    ).toBe(false);
    expect(
      categorySchema().safeParse({
        order: 1,
        slug: "history",
        title: "History",
      }).success,
    ).toBe(false);
    expect(
      pageSchema({ image: imageSchema }).safeParse({
        description: "About the site",
        hero: {
          darkImage: {
            format: "png",
            height: 360,
            src: "/dark.png",
            width: 960,
          },
          imageAlt: "Site logo",
          lightImage: {
            format: "png",
            height: 360,
            src: "/light.png",
            width: 960,
          },
        },
        startHere: ["what-is-a-meme"],
        title: "About",
      }).success,
    ).toBe(true);
  });

  test("validates editorial collection frontmatter", () => {
    expect(
      editorialCollectionSchema().safeParse({
        items: [
          "what-is-a-meme",
          {
            note: "Start here.",
            slug: "homesteading-the-memeosphere",
          },
        ],
        title: "Start Here",
      }).success,
    ).toBe(true);
    expect(
      editorialCollectionSchema().parse({
        title: "Featured",
      }),
    ).toEqual({
      draft: false,
      items: [],
      title: "Featured",
    });
    expect(
      editorialCollectionSchema().safeParse({
        items: [{ note: "", slug: "what-is-a-meme" }],
        title: "Bad Note",
      }).success,
    ).toBe(false);
    expect(
      editorialCollectionSchema().safeParse({
        item: ["what-is-a-meme"],
        title: "Unknown field",
      }).success,
    ).toBe(false);
  });

  test("validates author metadata frontmatter", () => {
    expect(
      authorSchema().safeParse({
        aliases: ["Seong-Young Her"],
        displayName: "Seong-Young Her",
        socials: [{ href: "https://example.com", label: "Website" }],
        type: "person",
        website: "https://example.com",
      }).success,
    ).toBe(true);
    expect(
      authorSchema().safeParse({
        displayName: "Seong-Young Her",
        handle: "@not-approved-metadata",
        type: "person",
      }).success,
    ).toBe(false);
    expect(
      authorSchema().safeParse({
        displayName: "Seong-Young Her",
        type: "unknown",
      }).success,
    ).toBe(false);
  });

  test("derives article IDs from Markdown and MDX filenames", () => {
    expect(filenameStem("history/article-title.md")).toBe("article-title");
    expect(filenameStem("history/article-title.mdx")).toBe("article-title");
    expect(filenameStem("history\\article-title.md")).toBe("article-title");
  });
});
