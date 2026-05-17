import { readFileSync } from "node:fs";

import { z } from "astro/zod";

import {
  defaultContentDefaultsConfig,
  defaultFeatureConfig,
  defaultHomepageConfig,
  defaultHomepageDiscoveryLinksConfig,
  defaultHomepageEmptyTextConfig,
  defaultHomepageLabelsConfig,
  defaultPublishableVisibilityConfig,
  siteRouteKeys,
  siteShareTargetIds,
} from "./site-config-defaults";
import { projectRelativePath, siteInstance } from "./site-instance";

export { siteShareTargetIds } from "./site-config-defaults";

const SITE_CONFIG_PATH = projectRelativePath(siteInstance.config.site);

const absoluteUrlSchema = z.string().url();
const sitePathSchema = z.string().min(1).refine(isSitePath, {
  message: "Expected a site path beginning with /.",
});
const pathOrUrlSchema = z.string().min(1).refine(isPathOrAbsoluteUrl, {
  message: "Expected a site path beginning with / or an absolute URL.",
});
const navigationLinkSchema = z
  .object({
    href: pathOrUrlSchema,
    label: z.string().min(1),
  })
  .strict();
const siteRouteKeySchema = z.enum(siteRouteKeys);
const siteShareTargetIdSchema = z.enum(siteShareTargetIds);
const homepageDiscoveryLinkSchema = z
  .object({
    href: pathOrUrlSchema.optional(),
    label: z.string().min(1),
    route: siteRouteKeySchema.optional(),
  })
  .strict()
  .refine((link) => (link.href === undefined) !== (link.route === undefined), {
    message: "Expected exactly one of href or route.",
    path: ["route"],
  });
const externalLinkSchema = z
  .object({
    ariaLabel: z.string().min(1).optional(),
    href: z.string().url(),
    label: z.string().min(1),
  })
  .strict();
const homepageConfigSchema = z
  .object({
    announcementLimit: z
      .number()
      .int()
      .positive()
      .default(defaultHomepageConfig.announcementLimit),
    discoveryLinks: z
      .array(homepageDiscoveryLinkSchema)
      .default(() =>
        defaultHomepageDiscoveryLinksConfig.map((link) => ({ ...link })),
      ),
    emptyText: z
      .object({
        announcements: z
          .string()
          .min(1)
          .default(defaultHomepageEmptyTextConfig.announcements),
        categories: z
          .string()
          .min(1)
          .default(defaultHomepageEmptyTextConfig.categories),
        featured: z
          .string()
          .min(1)
          .default(defaultHomepageEmptyTextConfig.featured),
        startHere: z
          .string()
          .min(1)
          .default(defaultHomepageEmptyTextConfig.startHere),
      })
      .strict()
      .default(defaultHomepageConfig.emptyText),
    featuredCollection: z
      .string()
      .min(1)
      .default(defaultHomepageConfig.featuredCollection),
    labels: z
      .object({
        announcements: z
          .string()
          .min(1)
          .default(defaultHomepageLabelsConfig.announcements),
        categories: z
          .string()
          .min(1)
          .default(defaultHomepageLabelsConfig.categories),
        featured: z
          .string()
          .min(1)
          .default(defaultHomepageLabelsConfig.featured),
        read: z.string().min(1).default(defaultHomepageLabelsConfig.read),
        recent: z.string().min(1).default(defaultHomepageLabelsConfig.recent),
        startHere: z
          .string()
          .min(1)
          .default(defaultHomepageLabelsConfig.startHere),
      })
      .strict()
      .default(defaultHomepageConfig.labels),
    recentLimit: z
      .number()
      .int()
      .positive()
      .default(defaultHomepageConfig.recentLimit),
    startHereCollection: z
      .string()
      .min(1)
      .default(defaultHomepageConfig.startHereCollection),
  })
  .strict()
  .default(() => ({
    announcementLimit: defaultHomepageConfig.announcementLimit,
    discoveryLinks: defaultHomepageDiscoveryLinksConfig.map((link) => ({
      ...link,
    })),
    emptyText: { ...defaultHomepageEmptyTextConfig },
    featuredCollection: defaultHomepageConfig.featuredCollection,
    labels: { ...defaultHomepageLabelsConfig },
    recentLimit: defaultHomepageConfig.recentLimit,
    startHereCollection: defaultHomepageConfig.startHereCollection,
  }));
const featureConfigSchema = z
  .object({
    announcements: z.boolean().default(defaultFeatureConfig.announcements),
    authors: z.boolean().default(defaultFeatureConfig.authors),
    bibliography: z.boolean().default(defaultFeatureConfig.bibliography),
    categories: z.boolean().default(defaultFeatureConfig.categories),
    collections: z.boolean().default(defaultFeatureConfig.collections),
    feed: z.boolean().default(defaultFeatureConfig.feed),
    pdf: z.boolean().default(defaultFeatureConfig.pdf),
    search: z.boolean().default(defaultFeatureConfig.search),
    support: z.boolean().default(defaultFeatureConfig.support),
    tags: z.boolean().default(defaultFeatureConfig.tags),
    themeToggle: z.boolean().default(defaultFeatureConfig.themeToggle),
  })
  .strict()
  .default(defaultFeatureConfig);
const publishableVisibilityConfigSchema = z
  .object({
    directory: z
      .boolean()
      .default(defaultPublishableVisibilityConfig.directory),
    feed: z.boolean().default(defaultPublishableVisibilityConfig.feed),
    homepage: z.boolean().default(defaultPublishableVisibilityConfig.homepage),
    search: z.boolean().default(defaultPublishableVisibilityConfig.search),
  })
  .strict()
  .default(defaultPublishableVisibilityConfig);
const baseContentDefaultsConfigSchema = z.object({
  draft: z.boolean().default(false),
  visibility: publishableVisibilityConfigSchema,
});
const contentDefaultsConfigSchema = z
  .object({
    announcements: baseContentDefaultsConfigSchema
      .strict()
      .default(defaultContentDefaultsConfig.announcements),
    articles: baseContentDefaultsConfigSchema
      .extend({
        pdf: z
          .object({
            enabled: z
              .boolean()
              .default(defaultContentDefaultsConfig.articles.pdf.enabled),
          })
          .strict()
          .default(defaultContentDefaultsConfig.articles.pdf),
      })
      .strict()
      .default(defaultContentDefaultsConfig.articles),
  })
  .strict()
  .default(defaultContentDefaultsConfig);
export const siteConfigSchema = z
  .object({
    contentDefaults: contentDefaultsConfigSchema,
    features: featureConfigSchema,
    homepage: homepageConfigSchema,
    identity: z
      .object({
        description: z.string().min(1),
        language: z.string().min(2),
        locale: z.string().min(2).default("en_US"),
        logo: pathOrUrlSchema.optional(),
        publisherName: z.string().min(1).optional(),
        publisherType: z
          .enum(["organization", "person"])
          .default("organization"),
        sameAs: z.array(z.string().url()).default([]),
        shortTitle: z.string().min(1).optional(),
        themeColor: z
          .string()
          .regex(/^#[\da-f]{6}$/iu, {
            message: "Expected a 6-digit hex color such as #b65a35.",
          })
          .optional(),
        timezone: z.string().min(1).optional(),
        title: z.string().min(1),
        url: z.string().url(),
      })
      .strict(),
    navigation: z
      .object({
        footer: z.array(navigationLinkSchema).default([]),
        primary: z.array(navigationLinkSchema).default([]),
      })
      .strict(),
    routes: z
      .object({
        allArticles: sitePathSchema,
        announcements: sitePathSchema,
        articles: sitePathSchema,
        authors: sitePathSchema,
        bibliography: sitePathSchema,
        categories: sitePathSchema,
        collections: sitePathSchema,
        feed: sitePathSchema,
        home: sitePathSchema,
        search: sitePathSchema,
        tags: sitePathSchema,
      })
      .strict(),
    share: z
      .object({
        targets: z
          .array(siteShareTargetIdSchema)
          .refine(hasUniqueValues, {
            message: "Expected unique share target IDs.",
          })
          .default(() => Array.from(siteShareTargetIds)),
        threadsMention: z.string().min(1).optional(),
        xViaHandle: z.string().min(1).optional(),
      })
      .strict()
      .default(() => ({
        targets: Array.from(siteShareTargetIds),
      })),
    support: z
      .object({
        block: z
          .object({
            body: z.string().min(1),
            title: z.string().min(1),
          })
          .strict(),
        discord: externalLinkSchema,
        patreon: externalLinkSchema.extend({
          compactLabel: z.string().min(1).optional(),
        }),
      })
      .strict(),
  })
  .strict();

/** Site-owner editable configuration normalized for platform code. */
export type SiteConfig = z.infer<typeof siteConfigSchema>;

/** Named route keys exposed by the validated site config. */
export type SiteRouteKey = keyof SiteConfig["routes"];

/** Supported third-party article share target IDs. */
export type SiteShareTargetId = (typeof siteShareTargetIds)[number];

/** Current site-instance configuration consumed by the Astro platform. */
export const siteConfig = parseSiteConfig(readSiteConfigJson());

/**
 * Parses and validates a site-owner config object.
 *
 * @param value Unknown JSON-compatible input.
 * @returns Normalized site config.
 */
export function parseSiteConfig(value: unknown): SiteConfig {
  const result = siteConfigSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new Error(
    `Invalid site config at ${SITE_CONFIG_PATH}:\n${formatIssues(
      result.error.issues,
    )}`,
  );
}

/**
 * Builds a standard document title with the configured site title suffix.
 *
 * @param title Page or article title.
 * @returns Title suffixed by the current site title.
 */
export function titleWithSite(title: string): string {
  return `${title} | ${siteConfig.identity.title}`;
}

function readSiteConfigJson(): unknown {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Build-time site config is resolved through the site-instance path adapter.
  return JSON.parse(readFileSync(siteInstance.config.site, "utf8"));
}

function formatIssues(issues: readonly z.ZodIssue[]): string {
  return issues.map(formatIssue).join("\n");
}

function formatIssue(issue: z.ZodIssue): string {
  const path = issue.path.length === 0 ? "<root>" : issue.path.join(".");

  return `- ${path}: ${issue.message}`;
}

function isPathOrAbsoluteUrl(value: string): boolean {
  return isSitePath(value) || absoluteUrlSchema.safeParse(value).success;
}

function isSitePath(value: string): boolean {
  return value.startsWith("/");
}

function hasUniqueValues(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}
