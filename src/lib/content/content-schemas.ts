import type { ImageMetadata } from "astro";
import { z } from "astro/zod";

import { semanticMetadataSchemaFor } from "../metadata/semantic-metadata";
import type { SemanticProfileKind } from "../metadata/semantic-profile-kinds";
import { tagDiagnostics } from "./tags";

const publishableVisibilityDefaults = {
  collections: true,
  directory: true,
  external: true,
  feed: true,
  homepage: true,
  pdf: true,
  related: true,
  search: true,
  sitemap: true,
} as const;

/** Content visibility defaults supplied by the platform or site config. */
interface PublishableVisibilityDefaults {
  collections: boolean;
  directory: boolean;
  external: boolean;
  feed: boolean;
  homepage: boolean;
  pdf: boolean;
  related: boolean;
  search: boolean;
  sitemap: boolean;
}

/** Content-type defaults supplied by the platform or site config. */
interface PublishableContentDefaults {
  draft: boolean;
  pdf?: undefined | { enabled: boolean };
  visibility: PublishableVisibilityDefaults;
}

/** Site-owner metadata defaults that influence publishable frontmatter. */
interface PublishableMetadataDefaults {
  semanticProfiles: {
    enabled: readonly SemanticProfileKind[];
  };
}

/** Local image schema factory supplied by Astro content collections. */
interface ImageSchemaContext {
  image: () => z.ZodType<ImageMetadata>;
}

/**
 * Creates the article frontmatter schema.
 *
 * @param context Astro image schema context.
 * @param context.image Astro local-image schema helper.
 * @param defaults Site-owned article defaults.
 * @param metadata Site-owned metadata defaults.
 * @returns Strict article frontmatter schema.
 */
export function articleSchema(
  context: ImageSchemaContext,
  defaults?: PublishableContentDefaults,
  metadata?: PublishableMetadataDefaults,
): ReturnType<typeof createArticleSchema> {
  return createArticleSchema(context, { defaults, includePdf: true, metadata });
}

/**
 * Creates the announcement frontmatter schema.
 *
 * @param context Astro image schema context.
 * @param context.image Astro local-image schema helper.
 * @param defaults Site-owned announcement defaults.
 * @param metadata Site-owned metadata defaults.
 * @returns Strict announcement frontmatter schema.
 */
export function announcementSchema(
  context: ImageSchemaContext,
  defaults?: PublishableContentDefaults,
  metadata?: PublishableMetadataDefaults,
): ReturnType<typeof createArticleSchema> {
  return createArticleSchema(context, {
    defaults,
    includePdf: false,
    metadata,
  });
}

/**
 * Creates the category metadata schema.
 *
 * @returns Strict category metadata schema.
 */
export function categorySchema(): ReturnType<typeof createCategorySchema> {
  return createCategorySchema();
}

/**
 * Creates the author metadata schema.
 *
 * @returns Strict author metadata schema.
 */
export function authorSchema(): ReturnType<typeof createAuthorSchema> {
  return createAuthorSchema();
}

/**
 * Creates the editor-owned publishable collection schema.
 *
 * @returns Strict editorial collection frontmatter schema.
 */
export function editorialCollectionSchema(): ReturnType<
  typeof createEditorialCollectionSchema
> {
  return createEditorialCollectionSchema();
}

/**
 * Converts a content entry path into the generated article ID.
 *
 * @param entry Content loader entry path.
 * @returns File stem without Markdown or MDX extension.
 */
export function filenameStem(entry: string): string {
  return fileName(entry).replace(/\.(?:md|mdx)$/i, "");
}

/**
 * Creates the shared publishable visibility schema.
 *
 * @param defaults Visibility defaults for omitted fields.
 * @returns Visibility schema with true defaults for every public surface.
 */
export function publishableVisibilitySchema(
  defaults: PublishableVisibilityDefaults = publishableVisibilityDefaults,
): ReturnType<typeof createPublishableVisibilitySchema> {
  return createPublishableVisibilitySchema(defaults);
}

/**
 * Creates the standalone page frontmatter schema.
 *
 * @param context Astro image schema context.
 * @param context.image Astro local-image schema helper.
 * @returns Strict page frontmatter schema.
 */
export function pageSchema(
  context: ImageSchemaContext,
): ReturnType<typeof createPageSchema> {
  return createPageSchema(context);
}

function createArticleSchema(
  { image }: ImageSchemaContext,
  {
    defaults = {
      draft: false,
      pdf: { enabled: true },
      visibility: publishableVisibilityDefaults,
    },
    includePdf,
    metadata,
  }: {
    defaults: PublishableContentDefaults | undefined;
    includePdf: boolean;
    metadata?: PublishableMetadataDefaults | undefined;
  },
) {
  const publishableSchemaFields = {
    author: z.string().min(1),
    date: z.coerce.date(),
    description: z.string().min(1),
    draft: z.boolean().default(defaults.draft),
    image: image().optional(),
    imageAlt: z.string().optional(),
    legacyBanner: z.string().optional(),
    legacyPermalink: z.string().optional(),
    semantic: semanticMetadataSchemaFor(metadata?.semanticProfiles.enabled),
    tags: tagListSchema(),
    title: z.string().min(1),
    updated: z.coerce.date().optional(),
    visibility: publishableVisibilitySchema(defaults.visibility),
  };

  return z
    .object(
      includePdf
        ? {
            ...publishableSchemaFields,
            pdf: z.boolean().default(defaults.pdf?.enabled ?? true),
          }
        : publishableSchemaFields,
    )
    .strict();
}

function tagListSchema() {
  return z
    .array(z.string())
    .default([])
    .superRefine((tags, context) => {
      tagDiagnostics(tags).forEach((diagnostic) => {
        context.addIssue({
          code: "custom",
          message: diagnostic.message,
          path: [diagnostic.index],
        });
      });
    });
}

function createCategorySchema() {
  return z
    .object({
      description: z.string().optional(),
      order: z.number().int().nonnegative(),
      title: z.string().min(1),
    })
    .strict();
}

function createAuthorSchema() {
  const socialLinkSchema = z
    .object({
      href: z.string().url(),
      label: z.string().min(1),
    })
    .strict();

  return z
    .object({
      aliases: z.array(z.string().min(1)).default([]),
      displayName: z.string().min(1),
      shortBio: z.string().optional(),
      socials: z.array(socialLinkSchema).default([]),
      type: z.enum(["anonymous", "collective", "organization", "person"]),
      website: z.string().url().optional(),
    })
    .strict();
}

function createPublishableVisibilitySchema(
  defaults: PublishableVisibilityDefaults,
) {
  return z
    .object({
      collections: z.boolean().default(defaults.collections),
      directory: z.boolean().default(defaults.directory),
      external: z.boolean().default(defaults.external),
      feed: z.boolean().default(defaults.feed),
      homepage: z.boolean().default(defaults.homepage),
      pdf: z.boolean().default(defaults.pdf),
      related: z.boolean().default(defaults.related),
      search: z.boolean().default(defaults.search),
      sitemap: z.boolean().default(defaults.sitemap),
    })
    .strict()
    .default(defaults);
}

function createEditorialCollectionSchema() {
  const collectionItemSchema = z.union([
    z.string().min(1),
    z
      .object({
        note: z.string().min(1).optional(),
        slug: z.string().min(1),
      })
      .strict(),
  ]);

  return z
    .object({
      description: z.string().optional(),
      draft: z.boolean().default(false),
      items: z.array(collectionItemSchema).default([]),
      title: z.string().min(1),
    })
    .strict();
}

function createPageSchema({ image }: ImageSchemaContext) {
  return z
    .object({
      description: z.string().optional(),
      draft: z.boolean().optional(),
      hero: z
        .object({
          darkImage: image().optional(),
          imageAlt: z.string().min(1).optional(),
          lightImage: image(),
          tagline: z.string().min(1).optional(),
        })
        .strict()
        .optional(),
      startHere: z.array(z.string().min(1)).default([]),
      title: z.string(),
    })
    .strict();
}

function fileName(entry: string): string {
  const normalized = entry.replace(/\\/g, "/");
  const segments = normalized.split("/");

  return segments.at(-1) ?? normalized;
}
