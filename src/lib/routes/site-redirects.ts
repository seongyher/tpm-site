import { readFileSync } from "node:fs";

import { z } from "astro/zod";

import { projectRelativePath, siteInstance } from "../site/site-instance";

const SITE_REDIRECTS_PATH = projectRelativePath(siteInstance.config.redirects);
const sitePathSchema = z.string().min(1).refine(isSitePath, {
  message: "Expected a site path beginning with /.",
});
const redirectTargetSchema = z.string().min(1).refine(isRedirectTarget, {
  message: "Expected a site path beginning with / or an absolute URL.",
});
const siteRedirectsSchema = z.record(sitePathSchema, redirectTargetSchema);

/** Site-owned legacy redirects loaded for Astro config. */
type SiteRedirects = z.infer<typeof siteRedirectsSchema>;

/** Current site-instance legacy redirects consumed by Astro config. */
export const siteRedirects = parseSiteRedirects(readSiteRedirectsJson());

/**
 * Parses and validates site-owned legacy redirect config.
 *
 * @param value Unknown JSON-compatible input.
 * @returns Redirect map suitable for Astro config.
 */
export function parseSiteRedirects(value: unknown): SiteRedirects {
  const result = siteRedirectsSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new Error(
    `Invalid site redirects at ${SITE_REDIRECTS_PATH}:\n${formatIssues(
      result.error.issues,
    )}`,
  );
}

function readSiteRedirectsJson(): unknown {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Build-time redirect config is resolved through the site-instance path adapter.
  return JSON.parse(readFileSync(siteInstance.config.redirects, "utf8"));
}

function formatIssues(issues: readonly z.ZodIssue[]): string {
  return issues.map(formatIssue).join("\n");
}

function formatIssue(issue: z.ZodIssue): string {
  const path = issue.path.length === 0 ? "<root>" : issue.path.join("./routes");

  return `- ${path}: ${issue.message}`;
}

function isRedirectTarget(value: string): boolean {
  return isSitePath(value) || z.string().url().safeParse(value).success;
}

function isSitePath(value: string): boolean {
  return value.startsWith("/");
}
