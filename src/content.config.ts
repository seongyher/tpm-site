import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";

import {
  announcementSchema,
  articleSchema,
  authorSchema,
  categorySchema,
  editorialCollectionSchema,
  filenameStem,
  pageSchema,
} from "./lib/content/content-schemas";
import { siteConfig } from "./lib/site/site-config";
import { projectRelativePath, siteInstance } from "./lib/site/site-instance";

const articles = defineCollection({
  loader: glob({
    base: projectRelativePath(siteInstance.content.articles),
    pattern: "**/*.{md,mdx}",
    generateId: ({ entry }) => filenameStem(entry),
  }),
  schema: (context) =>
    articleSchema(
      context,
      siteConfig.contentDefaults.articles,
      siteConfig.metadata,
    ),
});

const announcements = defineCollection({
  loader: glob({
    base: projectRelativePath(siteInstance.content.announcements),
    generateId: ({ entry }) => filenameStem(entry),
    pattern: "**/*.{md,mdx}",
  }),
  schema: (context) =>
    announcementSchema(
      context,
      siteConfig.contentDefaults.announcements,
      siteConfig.metadata,
    ),
});

const categories = defineCollection({
  loader: glob({
    base: projectRelativePath(siteInstance.content.categories),
    pattern: "*.json",
  }),
  schema: categorySchema(),
});

const authors = defineCollection({
  loader: glob({
    base: projectRelativePath(siteInstance.content.authors),
    generateId: ({ entry }) => filenameStem(entry),
    pattern: "*.md",
  }),
  schema: authorSchema(),
});

const editorialCollections = defineCollection({
  loader: glob({
    base: projectRelativePath(siteInstance.content.collections),
    generateId: ({ entry }) => filenameStem(entry),
    pattern: "**/*.{md,mdx}",
  }),
  schema: editorialCollectionSchema(),
});

const pages = defineCollection({
  loader: glob({
    base: projectRelativePath(siteInstance.content.pages),
    generateId: ({ entry }) => filenameStem(entry),
    pattern: "**/*.{md,mdx}",
  }),
  schema: pageSchema,
});

const articleReferenceArticleFixtures = defineCollection({
  loader: glob({
    base: "./tests/fixtures/article-reference-articles",
    generateId: ({ entry }) => filenameStem(entry),
    pattern: "**/*.{md,mdx}",
  }),
  schema: articleSchema,
});

const articleReferenceProofFixtures = defineCollection({
  loader: glob({
    base: "./tests/fixtures/article-references",
    generateId: ({ entry }) => filenameStem(entry),
    pattern: "**/*.{md,mdx}",
  }),
  schema: pageSchema,
});

export const collections = {
  articleReferenceArticleFixtures,
  articleReferenceProofFixtures,
  announcements,
  articles,
  authors,
  categories,
  collections: editorialCollections,
  pages,
};
