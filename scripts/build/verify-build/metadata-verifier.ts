import { stat } from "node:fs/promises";
import path from "node:path";

import {
  createOutputDiagnostic,
  type OutputDiagnostic,
} from "../../../src/lib/diagnostics/output-verification";
import {
  maxSocialPreviewImageBytes,
  socialPreviewImageMimeType,
  socialPreviewImageSpec,
} from "../../../src/lib/media/social-images";
import {
  articleJsonLdImageValues,
  articleJsonLdNodes,
  htmlAttributeValue,
  htmlScriptTextsByType,
  htmlTags,
  htmlTitleText,
  jsonLdNodesByType,
  metaContentValues,
  metaPropertyContentValues,
} from "./html-inspection";

/** Inputs used to verify one rendered document's metadata. */
export interface HtmlMetadataVerificationInput {
  html: string;
  relativeHtmlPath: string;
}

/** Inputs used to verify article social image metadata and generated assets. */
export interface ArticleSocialImageVerificationInput extends HtmlMetadataVerificationInput {
  distDir: string;
}

/**
 * Verifies one rendered document's core metadata and share metadata.
 *
 * @param input Rendered HTML and output path.
 * @param input.html Rendered HTML text.
 * @param input.relativeHtmlPath Relative HTML output path.
 * @returns Metadata diagnostics for missing or invalid document metadata.
 */
export function verifyHtmlMetadata({
  html,
  relativeHtmlPath,
}: HtmlMetadataVerificationInput): OutputDiagnostic[] {
  const diagnostics: OutputDiagnostic[] = [];
  const title = htmlTitleText(html);
  const canonicalLinks = htmlTags(html, "link").filter(
    (tag) => htmlAttributeValue(tag, "rel") === "canonical",
  );
  const canonicalHref =
    canonicalLinks.length === 1
      ? htmlAttributeValue(canonicalLinks[0] ?? "", "href")
      : undefined;
  const description = metaContentValues(html, "description")[0];
  const robots = metaContentValues(html, "robots")[0];
  const jsonLdScripts = htmlScriptTextsByType(html, "application/ld+json");
  const parsedJsonLd: unknown[] = [];

  if (title === "") {
    diagnostics.push(
      metadataHtmlInvalidDiagnostic(relativeHtmlPath, "missing document title"),
    );
  }

  if (canonicalLinks.length !== 1) {
    diagnostics.push(
      metadataHtmlInvalidDiagnostic(
        relativeHtmlPath,
        `expected exactly one canonical link, found ${canonicalLinks.length}`,
      ),
    );
  } else if (canonicalHref === undefined || canonicalHref.trim() === "") {
    diagnostics.push(
      metadataHtmlInvalidDiagnostic(
        relativeHtmlPath,
        "canonical link is empty",
      ),
    );
  }

  if (description === undefined || description.trim() === "") {
    diagnostics.push(
      metadataHtmlInvalidDiagnostic(
        relativeHtmlPath,
        "missing meta description",
      ),
    );
  }

  if (robots === undefined || robots.trim() === "") {
    diagnostics.push(
      metadataHtmlInvalidDiagnostic(relativeHtmlPath, "missing robots policy"),
    );
  }

  if (jsonLdScripts.length === 0) {
    diagnostics.push(
      metadataHtmlInvalidDiagnostic(relativeHtmlPath, "missing JSON-LD"),
    );
  }

  for (const script of jsonLdScripts) {
    try {
      parsedJsonLd.push(JSON.parse(script.trim()));
    } catch {
      diagnostics.push(
        metadataHtmlInvalidDiagnostic(
          relativeHtmlPath,
          "invalid JSON-LD script",
        ),
      );
    }
  }

  if (
    canonicalHref !== undefined &&
    canonicalHref.trim() !== "" &&
    parsedJsonLd.length > 0 &&
    !jsonLdContainsId(parsedJsonLd, `${canonicalHref}#webpage`)
  ) {
    diagnostics.push(
      metadataHtmlInvalidDiagnostic(
        relativeHtmlPath,
        "JSON-LD is missing the stable route #webpage entity",
      ),
    );
  }

  if (robots !== undefined && !robots.includes("noindex")) {
    diagnostics.push(
      ...verifyShareableHtmlMetadata({
        canonicalHref,
        html,
        relativeHtmlPath,
      }),
    );
  }
  diagnostics.push(...verifyProfilePageJsonLd({ html, relativeHtmlPath }));

  return diagnostics;
}

/**
 * Verifies one article page includes BlogPosting JSON-LD.
 *
 * @param input Rendered HTML and output path.
 * @param input.html Rendered HTML text.
 * @param input.relativeHtmlPath Relative HTML output path.
 * @returns Metadata diagnostics for missing article JSON-LD.
 */
export function verifyArticleJsonLdPresence({
  html,
  relativeHtmlPath,
}: HtmlMetadataVerificationInput): OutputDiagnostic[] {
  return articleJsonLdNodes(html).length === 0
    ? [missingArticleJsonLdDiagnostic(relativeHtmlPath)]
    : [];
}

/**
 * Verifies one article page's social image metadata and generated image file.
 *
 * @param input Rendered article HTML, output path, and build output root.
 * @param input.distDir Generated build output root.
 * @param input.html Rendered HTML text.
 * @param input.relativeHtmlPath Relative HTML output path.
 * @returns Metadata diagnostics for social preview regressions.
 */
export async function verifyArticleSocialImageHtml({
  distDir,
  html,
  relativeHtmlPath,
}: ArticleSocialImageVerificationInput): Promise<OutputDiagnostic[]> {
  const diagnostics: OutputDiagnostic[] = [];
  const ogImages = metaPropertyContentValues(html, "og:image");
  const twitterImages = metaContentValues(html, "twitter:image");
  const jsonLdImages = articleJsonLdImageValues(html);
  const ogWidths = metaPropertyContentValues(html, "og:image:width");
  const ogHeights = metaPropertyContentValues(html, "og:image:height");
  const ogTypes = metaPropertyContentValues(html, "og:image:type");

  if (ogImages.length !== 1) {
    diagnostics.push(
      socialPreviewInvalidDiagnostic(
        relativeHtmlPath,
        `expected exactly one og:image, found ${ogImages.length}`,
      ),
    );
  }

  if (twitterImages.length !== 1) {
    diagnostics.push(
      socialPreviewInvalidDiagnostic(
        relativeHtmlPath,
        `expected exactly one twitter:image, found ${twitterImages.length}`,
      ),
    );
  }

  if (jsonLdImages.length !== 1) {
    diagnostics.push(
      socialPreviewInvalidDiagnostic(
        relativeHtmlPath,
        `expected exactly one BlogPosting JSON-LD image, found ${jsonLdImages.length}`,
      ),
    );
  }

  const ogImage = ogImages[0];
  if (ogImage === undefined) {
    return diagnostics;
  }

  if (twitterImages[0] !== undefined && twitterImages[0] !== ogImage) {
    diagnostics.push(
      socialPreviewInvalidDiagnostic(
        relativeHtmlPath,
        "twitter:image does not match og:image",
      ),
    );
  }

  if (jsonLdImages[0] !== undefined && jsonLdImages[0] !== ogImage) {
    diagnostics.push(
      socialPreviewInvalidDiagnostic(
        relativeHtmlPath,
        "BlogPosting JSON-LD image does not match og:image",
      ),
    );
  }

  if (ogWidths[0] !== socialPreviewImageSpec.width.toString()) {
    diagnostics.push(
      socialPreviewInvalidDiagnostic(
        relativeHtmlPath,
        `og:image:width is not ${socialPreviewImageSpec.width}`,
      ),
    );
  }

  if (ogHeights[0] !== socialPreviewImageSpec.height.toString()) {
    diagnostics.push(
      socialPreviewInvalidDiagnostic(
        relativeHtmlPath,
        `og:image:height is not ${socialPreviewImageSpec.height}`,
      ),
    );
  }

  if (ogTypes[0] !== socialPreviewImageMimeType) {
    diagnostics.push(
      socialPreviewInvalidDiagnostic(
        relativeHtmlPath,
        `og:image:type is not ${socialPreviewImageMimeType}`,
      ),
    );
  }

  const localImagePath = localGeneratedSocialImagePath(ogImage, distDir);
  if (localImagePath === undefined) {
    diagnostics.push(
      socialPreviewInvalidDiagnostic(
        relativeHtmlPath,
        "og:image must point to a generated local JPG asset",
      ),
    );
    return diagnostics;
  }

  try {
    const imageStats = await stat(localImagePath);
    if (imageStats.size > maxSocialPreviewImageBytes) {
      diagnostics.push(
        socialPreviewInvalidDiagnostic(
          relativeHtmlPath,
          `social preview image is ${imageStats.size} bytes, above the ${maxSocialPreviewImageBytes} byte budget`,
        ),
      );
    }
  } catch {
    diagnostics.push(
      socialPreviewInvalidDiagnostic(
        relativeHtmlPath,
        `social preview image file is missing for ${ogImage}`,
      ),
    );
  }

  return diagnostics;
}

/**
 * Builds the canonical metadata HTML diagnostic.
 *
 * @param outputPath Relative HTML output path.
 * @param reason Human-readable metadata issue.
 * @returns Metadata diagnostic.
 */
export function metadataHtmlInvalidDiagnostic(
  outputPath: string,
  reason: string,
): OutputDiagnostic {
  const message = `${outputPath}: ${reason}`;

  return createOutputDiagnostic({
    category: "metadata",
    code: "metadata.html-invalid",
    evidence: [`metadataIssues: ${message}`],
    location: { outputPath },
    message,
    moduleId: "build.metadata",
    owner: "generated-output",
    remediation:
      "Inspect the page metadata, robots policy, JSON-LD, sitemap policy, or share metadata.",
    severity: "error",
  });
}

/**
 * Builds the canonical missing article JSON-LD diagnostic.
 *
 * @param outputPath Relative article HTML output path.
 * @returns Metadata diagnostic.
 */
export function missingArticleJsonLdDiagnostic(
  outputPath: string,
): OutputDiagnostic {
  return createOutputDiagnostic({
    category: "metadata",
    code: "metadata.article-json-ld-missing",
    evidence: [`missingArticleJsonLd: ${outputPath}`],
    location: { outputPath },
    message: outputPath,
    moduleId: "build.metadata",
    owner: "generated-output",
    remediation:
      "Ensure every generated article page includes BlogPosting JSON-LD.",
    severity: "error",
  });
}

/**
 * Builds the canonical social preview diagnostic.
 *
 * @param outputPath Relative article HTML output path.
 * @param reason Human-readable social image issue.
 * @returns Metadata diagnostic.
 */
export function socialPreviewInvalidDiagnostic(
  outputPath: string,
  reason: string,
): OutputDiagnostic {
  const message = `${outputPath}: ${reason}`;

  return createOutputDiagnostic({
    category: "metadata",
    code: "metadata.social-preview-invalid",
    evidence: [`socialImageIssues: ${message}`],
    location: { outputPath },
    message,
    moduleId: "build.social-preview",
    owner: "generated-output",
    remediation:
      "Ensure social preview metadata points to one generated local JPG within the configured size and dimension policy.",
    severity: "error",
  });
}

function verifyShareableHtmlMetadata({
  canonicalHref,
  html,
  relativeHtmlPath,
}: HtmlMetadataVerificationInput & {
  canonicalHref: string | undefined;
}): OutputDiagnostic[] {
  const requiredMeta = [
    ["property", "og:site_name"],
    ["property", "og:locale"],
    ["property", "og:type"],
    ["property", "og:title"],
    ["property", "og:description"],
    ["property", "og:url"],
    ["property", "og:image"],
    ["name", "twitter:card"],
    ["name", "twitter:title"],
    ["name", "twitter:description"],
    ["name", "twitter:image"],
  ] as const;

  const diagnostics = requiredMeta.flatMap(
    ([attributeName, attributeValue]) => {
      const value =
        attributeName === "name"
          ? metaContentValues(html, attributeValue)[0]
          : metaPropertyContentValues(html, attributeValue)[0];

      if (value !== undefined && value.trim() !== "") {
        return [];
      }

      return [
        metadataHtmlInvalidDiagnostic(
          relativeHtmlPath,
          `missing ${attributeName}="${attributeValue}" metadata`,
        ),
      ];
    },
  );
  const ogUrl = metaPropertyContentValues(html, "og:url")[0];

  if (
    canonicalHref !== undefined &&
    ogUrl !== undefined &&
    ogUrl.trim() !== "" &&
    ogUrl !== canonicalHref
  ) {
    diagnostics.push(
      metadataHtmlInvalidDiagnostic(
        relativeHtmlPath,
        "og:url does not match canonical link",
      ),
    );
  }

  return diagnostics;
}

function verifyProfilePageJsonLd({
  html,
  relativeHtmlPath,
}: HtmlMetadataVerificationInput): OutputDiagnostic[] {
  return jsonLdNodesByType(html, "ProfilePage").flatMap((node) =>
    isProfilePageMainEntity(node["mainEntity"])
      ? []
      : [
          metadataHtmlInvalidDiagnostic(
            relativeHtmlPath,
            "ProfilePage JSON-LD missing mainEntity Person or Organization",
          ),
        ],
  );
}

function isProfilePageMainEntity(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  const name = value["name"];

  return (
    (jsonLdTypeIncludes(value["@type"], "Person") ||
      jsonLdTypeIncludes(value["@type"], "Organization")) &&
    typeof name === "string" &&
    name.trim().length > 0
  );
}

function localGeneratedSocialImagePath(
  value: string,
  distDir: string,
): string | undefined {
  const pathname = absoluteUrlPathname(value);
  if (pathname === undefined) {
    return undefined;
  }

  if (!pathname.startsWith("/_astro/") || !/\.jpe?g$/iu.test(pathname)) {
    return undefined;
  }

  return path.join(distDir, decodeURIComponent(pathname.slice(1)));
}

function absoluteUrlPathname(value: string): string | undefined {
  const authoritySeparator = value.indexOf("://");
  if (authoritySeparator <= 0) {
    return undefined;
  }

  const pathStart = value.indexOf("/", authoritySeparator + 3);
  if (pathStart === -1) {
    return "/";
  }

  const queryStart = value.indexOf("?", pathStart);
  const hashStart = value.indexOf("#", pathStart);
  const pathEndCandidates = [queryStart, hashStart].filter(
    (index) => index >= 0,
  );
  const pathEnd =
    pathEndCandidates.length === 0
      ? value.length
      : Math.min(...pathEndCandidates);

  const pathname = value.slice(pathStart, pathEnd);
  return pathname === "" ? "/" : pathname;
}

function jsonLdContainsId(values: readonly unknown[], id: string): boolean {
  return values.some((value) => jsonLdValueContainsId(value, id));
}

function jsonLdValueContainsId(value: unknown, id: string): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => jsonLdValueContainsId(item, id));
  }

  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!isRecord(value)) {
    return false;
  }

  const record = value;

  if (record["@id"] === id) {
    return true;
  }

  return Object.values(record).some((item) => jsonLdValueContainsId(item, id));
}

function jsonLdTypeIncludes(value: unknown, type: string): boolean {
  return (
    value === type ||
    (Array.isArray(value) &&
      value.some((entry) => typeof entry === "string" && entry === type))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
