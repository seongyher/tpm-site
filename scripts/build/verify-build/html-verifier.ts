import {
  createOutputDiagnostic,
  type OutputDiagnostic,
} from "../../../src/lib/diagnostics/output-verification";
import { htmlAttributeValue, htmlTags } from "./html-inspection";

/** Inputs used to verify rendered HTML semantics. */
export interface HtmlSemanticsVerificationInput {
  html: string;
  relativeHtmlPath: string;
}

/** Inputs used to verify static reading pages for hydration boundaries. */
export interface HydrationBoundaryVerificationInput extends HtmlSemanticsVerificationInput {
  staticReadingPages: readonly string[];
}

/**
 * Verifies generated image tags have accessible alt semantics.
 *
 * @param input Rendered HTML and output path.
 * @param input.html Rendered HTML text.
 * @param input.relativeHtmlPath Relative HTML output path.
 * @returns HTML diagnostics for missing image alt text.
 */
export function verifyHtmlImageAlt({
  html,
  relativeHtmlPath,
}: HtmlSemanticsVerificationInput): OutputDiagnostic[] {
  return htmlTags(html, "img").flatMap((image, index) => {
    const role = htmlAttributeValue(image, "role");
    const isDecorative =
      htmlAttributeValue(image, "aria-hidden") === "true" ||
      role === "presentation" ||
      role === "none";

    if (isDecorative || htmlAttributeValue(image, "alt") !== undefined) {
      return [];
    }

    return [
      missingImageAltDiagnostic(
        relativeHtmlPath,
        htmlAttributeValue(image, "src") ?? `image ${index + 1}`,
      ),
    ];
  });
}

/**
 * Verifies scoped media output follows generated media policy.
 *
 * This intentionally checks only media with platform data contracts so generic
 * external links, icons, and intentionally static files do not create noise.
 *
 * @param input Rendered HTML and output path.
 * @param input.html Rendered HTML text.
 * @param input.relativeHtmlPath Relative HTML output path.
 * @returns HTML diagnostics for media output policy regressions.
 */
export function verifyHtmlMediaOutput({
  html,
  relativeHtmlPath,
}: HtmlSemanticsVerificationInput): OutputDiagnostic[] {
  const diagnostics = scopedMediaImages(html).flatMap((image, index) =>
    mediaImageDiagnostics(relativeHtmlPath, image, index),
  );
  const embedFrameCount = attributeTrueOccurrenceCount(
    html,
    "data-article-embed-frame",
  );
  const embedFallbackCount = attributeTrueOccurrenceCount(
    html,
    "data-article-embed-fallback",
  );

  if (embedFrameCount > embedFallbackCount) {
    diagnostics.push(
      mediaOutputInvalidDiagnostic(
        relativeHtmlPath,
        `article embeds need static fallbacks; found ${embedFrameCount} embed frames and ${embedFallbackCount} fallbacks`,
      ),
    );
  }

  return diagnostics;
}

/**
 * Verifies static reading pages do not contain unexpected hydrated islands.
 *
 * @param input Rendered HTML, output path, and static reading page allowlist.
 * @param input.html Rendered HTML text.
 * @param input.relativeHtmlPath Relative HTML output path.
 * @param input.staticReadingPages Relative output paths expected to stay static.
 * @returns HTML diagnostics for unexpected hydration boundaries.
 */
export function verifyHydrationBoundaries({
  html,
  relativeHtmlPath,
  staticReadingPages,
}: HydrationBoundaryVerificationInput): OutputDiagnostic[] {
  if (
    !staticReadingPages.includes(relativeHtmlPath) ||
    !/<astro-island\b/iu.test(html)
  ) {
    return [];
  }

  return [unexpectedHydrationBoundaryDiagnostic(relativeHtmlPath)];
}

/**
 * Builds the canonical diagnostic for an image missing alt semantics.
 *
 * @param outputPath Relative HTML output path.
 * @param imageSource Image source or fallback label.
 * @returns HTML diagnostic.
 */
export function missingImageAltDiagnostic(
  outputPath: string,
  imageSource: string,
): OutputDiagnostic {
  const message = `${outputPath}: ${imageSource} is missing alt`;

  return createOutputDiagnostic({
    category: "html",
    code: "html.image-alt-missing",
    evidence: [`imageAltIssues: ${message}`],
    location: { outputPath },
    message,
    moduleId: "build.html",
    owner: "content",
    remediation:
      "Add meaningful alt text or mark the image decorative with valid semantics.",
    severity: "error",
  });
}

/**
 * Builds the canonical diagnostic for scoped media output regressions.
 *
 * @param outputPath Relative HTML output path.
 * @param reason Human-readable media policy issue.
 * @returns HTML diagnostic.
 */
export function mediaOutputInvalidDiagnostic(
  outputPath: string,
  reason: string,
): OutputDiagnostic {
  const message = `${outputPath}: ${reason}`;

  return createOutputDiagnostic({
    category: "html",
    code: "html.media-output-invalid",
    evidence: [`mediaOutputIssues: ${message}`],
    location: { outputPath },
    message,
    moduleId: "build.html",
    owner: "generated-output",
    remediation:
      "Inspect scoped article, hover, thumbnail, or embed media output against media policy.",
    severity: "error",
  });
}

/**
 * Builds the canonical diagnostic for an unexpected hydration boundary.
 *
 * @param outputPath Relative HTML output path.
 * @returns HTML diagnostic.
 */
export function unexpectedHydrationBoundaryDiagnostic(
  outputPath: string,
): OutputDiagnostic {
  return createOutputDiagnostic({
    category: "html",
    code: "html.hydration-boundary-unexpected",
    evidence: [`unexpectedHydrationBoundaries: ${outputPath}`],
    location: { outputPath },
    message: outputPath,
    moduleId: "build.html",
    owner: "platform",
    remediation:
      "Keep static reading pages free of unexpected hydrated islands.",
    severity: "error",
  });
}

function mediaImageDiagnostics(
  relativeHtmlPath: string,
  imageTag: string,
  index: number,
): OutputDiagnostic[] {
  const src = htmlAttributeValue(imageTag, "src") ?? "";
  const label = src === "" ? `scoped image ${index + 1}` : src;

  if (isRemoteUrl(src)) {
    return [
      mediaOutputInvalidDiagnostic(
        relativeHtmlPath,
        `${label} is a remote image in scoped media output`,
      ),
    ];
  }

  if (!src.startsWith("/_astro/")) {
    return [
      mediaOutputInvalidDiagnostic(
        relativeHtmlPath,
        `${label} is not an optimized Astro asset`,
      ),
    ];
  }

  return [];
}

function scopedMediaImages(html: string): string[] {
  return htmlTags(html, "img").filter(
    (image) =>
      htmlAttributeValue(image, "data-article-image") === "true" ||
      htmlAttributeValue(image, "data-hover-image-image") === "true" ||
      htmlAttributeValue(image, "data-publishable-media-image") === "true",
  );
}

function attributeTrueOccurrenceCount(html: string, attribute: string): number {
  const doubleQuoted = ` ${attribute}="true"`;
  const singleQuoted = ` ${attribute}='true'`;

  return (
    html.split(doubleQuoted).length - 1 + html.split(singleQuoted).length - 1
  );
}

function isRemoteUrl(src: string): boolean {
  const normalizedSrc = src.toLowerCase();

  return (
    normalizedSrc.startsWith("http://") ||
    normalizedSrc.startsWith("https://") ||
    normalizedSrc.startsWith("//")
  );
}
