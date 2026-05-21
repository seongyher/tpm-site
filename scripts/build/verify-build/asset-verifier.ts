import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  createOutputDiagnostic,
  type OutputDiagnostic,
} from "../../../src/lib/output-verification";
import { scriptSources } from "./html-inspection";

const allowedStaticClientScriptPatterns = [
  /^\/_astro\/AnchoredRoot\.astro_astro_type_script_index_0_lang\.[\w-]+\.js$/u,
] as const;
const articleImageInspectorScriptPattern =
  /^\/_astro\/ArticleImageInspectorScript\.astro_astro_type_script_index_0_lang\.[\w-]+\.js$/u;
const articleCitationMenuScriptPattern =
  /^\/_astro\/ArticleCitationMenu\.astro_astro_type_script_index_0_lang\.[\w-]+\.js$/u;
const articleReferencePreviewScriptPattern =
  /^\/_astro\/ArticleReferences\.astro_astro_type_script_index_0_lang\.[\w-]+\.js$/u;
const articleShareMenuScriptPattern =
  /^\/_astro\/ArticleShareMenu\.astro_astro_type_script_index_0_lang\.[\w-]+\.js$/u;
const astroPrefetchPageScriptPattern = /^\/_astro\/page\.[\w-]+\.js$/u;
const astroPrefetchChunkImportPattern =
  /from\s*["'`]\.\/(_astro_prefetch\.[\w-]+\.js)["'`]/u;

/** Inputs used to verify generated file assets. */
export interface AssetOutputVerificationInput {
  distDir: string;
  files: readonly string[];
}

/** Inputs used to verify one static reading page's client scripts. */
export interface StaticReadingPageAssetVerificationInput {
  distDir: string;
  html: string;
  relativeHtmlPath: string;
  staticReadingPages: readonly string[];
}

/** Inputs used to verify generated cache-header policy. */
export interface GeneratedAssetCachePolicyVerificationInput {
  distDir: string;
}

/**
 * Verifies generated assets do not include public source maps.
 *
 * @param input Build output root and generated files.
 * @param input.distDir Generated build output root.
 * @param input.files Absolute generated file paths.
 * @returns Asset diagnostics for source-map output.
 */
export function verifySourceMapOutput({
  distDir,
  files,
}: AssetOutputVerificationInput): OutputDiagnostic[] {
  return files
    .map((file) => toPosix(path.relative(distDir, file)))
    .filter((file) => file.endsWith(".map"))
    .map(sourceMapLeakDiagnostic);
}

/**
 * Verifies static reading pages do not load unexpected client scripts.
 *
 * @param input Rendered HTML, output path, static-page allowlist, and output root.
 * @param input.distDir Generated build output root.
 * @param input.html Rendered HTML text.
 * @param input.relativeHtmlPath Relative HTML output path.
 * @param input.staticReadingPages Relative output paths expected to stay static.
 * @returns Asset diagnostics for unexpected client JavaScript.
 */
export async function verifyStaticReadingPageAssets({
  distDir,
  html,
  relativeHtmlPath,
  staticReadingPages,
}: StaticReadingPageAssetVerificationInput): Promise<OutputDiagnostic[]> {
  if (!staticReadingPages.includes(relativeHtmlPath)) {
    return [];
  }

  const unexpectedScriptSources: string[] = [];

  for (const source of scriptSources(html)) {
    if (
      /^\/_astro\/[^"']+\.js$/iu.test(source) &&
      !(await isAllowedStaticClientScript(distDir, relativeHtmlPath, source))
    ) {
      unexpectedScriptSources.push(source);
    }
  }

  return unexpectedScriptSources.length === 0
    ? []
    : [
        unexpectedClientScriptsDiagnostic(
          relativeHtmlPath,
          unexpectedScriptSources,
        ),
      ];
}

/**
 * Verifies generated hashed Astro assets have immutable cache policy.
 *
 * @param input Generated build output root.
 * @param input.distDir Generated build output root.
 * @returns Cache diagnostics for missing or incorrect generated headers.
 */
export async function verifyGeneratedAssetCachePolicy({
  distDir,
}: GeneratedAssetCachePolicyVerificationInput): Promise<OutputDiagnostic[]> {
  const headersPath = path.join(distDir, "_headers");
  const headersText = await safeReadText(headersPath);
  const hasAstroBlock = /^\/_astro\/\*\s*$/imu.test(headersText);
  const hasImmutableCache =
    /Cache-Control:\s*public,\s*max-age=31556952,\s*immutable/iu.test(
      headersText,
    );

  return hasAstroBlock && hasImmutableCache
    ? []
    : [
        generatedAssetCachePolicyDiagnostic(
          hasAstroBlock
            ? "missing immutable Cache-Control for /_astro/*"
            : "missing /_astro/* immutable cache header block",
        ),
      ];
}

/**
 * Builds the canonical source-map leak diagnostic.
 *
 * @param outputPath Relative source map output path.
 * @returns Asset diagnostic.
 */
export function sourceMapLeakDiagnostic(outputPath: string): OutputDiagnostic {
  return createOutputDiagnostic({
    category: "asset",
    code: "asset.source-map-leak",
    evidence: [`sourceMaps: ${outputPath}`],
    location: { outputPath },
    message: outputPath,
    moduleId: "build.assets",
    owner: "platform",
    remediation: "Remove source maps from public release output.",
    severity: "error",
  });
}

/**
 * Builds the canonical unexpected client-script diagnostic.
 *
 * @param outputPath Relative HTML output path.
 * @param scriptSources Unexpected script source paths.
 * @returns Asset diagnostic.
 */
export function unexpectedClientScriptsDiagnostic(
  outputPath: string,
  scriptSources: readonly string[],
): OutputDiagnostic {
  const message = `${outputPath} -> ${scriptSources.join(", ")}`;

  return createOutputDiagnostic({
    category: "asset",
    code: "asset.client-script-unexpected",
    evidence: [`unexpectedClientScripts: ${message}`],
    location: { outputPath },
    message,
    moduleId: "build.assets",
    owner: "platform",
    remediation:
      "Remove unexpected client JavaScript from static reading pages or explicitly allow a narrowly scoped script.",
    severity: "error",
  });
}

/**
 * Builds the canonical cache policy diagnostic for generated assets.
 *
 * @param reason Human-readable cache policy issue.
 * @returns Cache diagnostic.
 */
export function generatedAssetCachePolicyDiagnostic(
  reason: string,
): OutputDiagnostic {
  const message = `_headers: ${reason}`;

  return createOutputDiagnostic({
    category: "cache",
    code: "cache.immutable-asset-policy-missing",
    evidence: [`cachePolicyIssues: ${message}`],
    location: { outputPath: "_headers" },
    message,
    moduleId: "build.assets",
    owner: "site-config",
    remediation:
      "Keep `/_astro/*` cached with `Cache-Control: public, max-age=31556952, immutable` for hashed generated assets.",
    severity: "error",
  });
}

async function isAllowedStaticClientScript(
  distDir: string,
  relativeHtmlPath: string,
  source: string,
): Promise<boolean> {
  if (
    isArticleHtmlPath(relativeHtmlPath) &&
    (articleImageInspectorScriptPattern.test(source) ||
      articleCitationMenuScriptPattern.test(source) ||
      articleReferencePreviewScriptPattern.test(source) ||
      articleShareMenuScriptPattern.test(source))
  ) {
    return true;
  }

  if (
    allowedStaticClientScriptPatterns.some((pattern) => pattern.test(source))
  ) {
    return true;
  }

  if (!astroPrefetchPageScriptPattern.test(source)) {
    return false;
  }

  const scriptText = await staticClientScriptText(distDir, source);
  if (isAstroPrefetchRuntime(scriptText)) {
    return true;
  }

  const prefetchChunk = astroPrefetchChunkImport(scriptText);
  if (prefetchChunk === null) {
    return false;
  }

  return isAstroPrefetchRuntime(
    await staticClientScriptText(distDir, `/_astro/${prefetchChunk}`),
  );
}

function isAstroPrefetchRuntime(scriptText: string): boolean {
  return (
    readsAstroPrefetchDataset(scriptText) &&
    supportsPrefetchLinkCapabilityCheck(scriptText) &&
    preservesSlowConnectionGuard(scriptText)
  );
}

function astroPrefetchChunkImport(scriptText: string): null | string {
  const match = astroPrefetchChunkImportPattern.exec(scriptText);
  const prefetchChunk = match?.[1];

  return prefetchChunk ?? null;
}

function preservesSlowConnectionGuard(scriptText: string): boolean {
  return (
    scriptText.includes("ignoreSlowConnection") &&
    scriptText.includes("navigator.connection")
  );
}

function readsAstroPrefetchDataset(scriptText: string): boolean {
  return /dataset\s*\.\s*astroPrefetch/u.test(scriptText);
}

function supportsPrefetchLinkCapabilityCheck(scriptText: string): boolean {
  return /relList\s*\??\.\s*supports\s*\??\.\s*\(\s*["'`]prefetch["'`]\s*\)/u.test(
    scriptText,
  );
}

async function staticClientScriptText(
  distDir: string,
  source: string,
): Promise<string> {
  try {
    return await readFile(
      path.join(distDir, source.replace(/^\//u, "")),
      "utf8",
    );
  } catch {
    return "";
  }
}

async function safeReadText(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

function isArticleHtmlPath(relativeHtmlPath: string): boolean {
  return /^articles\/(?!all\/)[^/]+\/index\.html$/u.test(relativeHtmlPath);
}

function toPosix(file: string): string {
  return file.split(path.sep).join("/");
}
