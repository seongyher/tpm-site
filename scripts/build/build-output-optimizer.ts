import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { transform as transformCss } from "lightningcss";
import { type MinifyOptions, minifySync } from "oxc-minify";
import { optimize as optimizeSvg } from "svgo";

import {
  optionalFeatureRouteEntries,
  optionalRouteOwnsPathname,
} from "../../src/lib/routes/feature-routes";
import { type SiteConfig, siteConfig } from "../../src/lib/site/site-config";

/** Supported generated-output transform. */
export type BuildOutputTransformName =
  | "disabled-feature-routes"
  | "lightning-css"
  | "oxc-js-aggressive"
  | "oxc-js-conservative"
  | "svgo"
  | "unreferenced-astro-raster-assets";

/** Production-approved generated-output transform stack. */
export const productionBuildOutputTransforms = [
  "disabled-feature-routes",
  "lightning-css",
  "svgo",
  "oxc-js-conservative",
  "unreferenced-astro-raster-assets",
] as const satisfies readonly BuildOutputTransformName[];

/** Inputs for generated-output optimization. */
export interface BuildOutputOptimizationOptions {
  outputDir: string;
  site?: SiteConfig;
  transforms?: readonly BuildOutputTransformName[];
}

/** Summary of transformed generated files. */
export interface BuildOutputOptimizationResult {
  cssFiles: number;
  jsFiles: number;
  rasterFilesRemoved: number;
  routeEntriesRemoved: number;
  svgFiles: number;
  totalFiles: number;
  transforms: BuildOutputTransformName[];
}

interface OxcDiagnostic {
  message: string;
}

interface OxcMinifyOutput {
  code: string;
  errors: readonly OxcDiagnostic[];
}

/**
 * Optimizes generated static build output in place.
 *
 * @param options Optimization options.
 * @param options.outputDir Generated build output directory.
 * @param options.site Site config that owns feature availability.
 * @param options.transforms Transform stack to apply.
 * @returns Count of optimized generated files.
 */
export function optimizeBuildOutput({
  outputDir,
  site = siteConfig,
  transforms = productionBuildOutputTransforms,
}: BuildOutputOptimizationOptions): BuildOutputOptimizationResult {
  assertDirectory(outputDir);

  const result: BuildOutputOptimizationResult = {
    cssFiles: 0,
    jsFiles: 0,
    rasterFilesRemoved: 0,
    routeEntriesRemoved: 0,
    svgFiles: 0,
    totalFiles: 0,
    transforms: Array.from(transforms),
  };

  for (const transform of transforms) {
    if (transform === "disabled-feature-routes") {
      result.routeEntriesRemoved += removeDisabledFeatureRouteOutput(
        outputDir,
        site,
      );
    } else if (transform === "lightning-css") {
      result.cssFiles += optimizeCssFiles(outputDir);
    } else if (transform === "svgo") {
      result.svgFiles += optimizeSvgFiles(outputDir);
    } else if (transform === "oxc-js-conservative") {
      result.jsFiles += optimizeJavaScriptFiles(
        outputDir,
        conservativeOxcOptions(),
      );
    } else if (transform === "oxc-js-aggressive") {
      result.jsFiles += optimizeJavaScriptFiles(
        outputDir,
        aggressiveOxcOptions(),
      );
    } else {
      result.rasterFilesRemoved +=
        removeUnreferencedAstroRasterAssets(outputDir);
    }
  }

  return {
    ...result,
    totalFiles:
      result.cssFiles +
      result.jsFiles +
      result.rasterFilesRemoved +
      result.routeEntriesRemoved +
      result.svgFiles,
  };
}

function aggressiveOxcOptions(): MinifyOptions {
  return {
    codegen: {
      removeWhitespace: true,
    },
    compress: {
      dropConsole: false,
      dropDebugger: true,
      target: "esnext",
    },
    mangle: {
      keepNames: true,
      toplevel: false,
    },
    module: true,
    sourcemap: false,
  };
}

function assertDirectory(outputDir: string): void {
  if (!existsSync(outputDir)) {
    throw new Error(`Build output directory does not exist: ${outputDir}`);
  }

  if (!statSync(outputDir).isDirectory()) {
    throw new Error(`Build output path is not a directory: ${outputDir}`);
  }
}

function conservativeOxcOptions(): MinifyOptions {
  return {
    codegen: {
      removeWhitespace: true,
    },
    compress: false,
    mangle: false,
    module: true,
    sourcemap: false,
  };
}

function isOxcDiagnostic(value: unknown): value is OxcDiagnostic {
  return isRecord(value) && typeof value["message"] === "string";
}

function isOxcMinifyOutput(value: unknown): value is OxcMinifyOutput {
  return (
    isRecord(value) &&
    typeof value["code"] === "string" &&
    Array.isArray(value["errors"]) &&
    value["errors"].every(isOxcDiagnostic)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function listFiles(rootDir: string): string[] {
  return readdirSync(rootDir, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      return listFiles(absolutePath);
    }

    if (entry.isFile()) {
      return [absolutePath];
    }

    return [];
  });
}

function optimizeCssFiles(outputDir: string): number {
  const cssFiles = listFiles(outputDir).filter((item) => item.endsWith(".css"));

  for (const file of cssFiles) {
    const result = transformCss({
      code: readFileSync(file),
      filename: file,
      minify: true,
      sourceMap: false,
    });

    writeFileSync(file, result.code);
  }

  return cssFiles.length;
}

function optimizeJavaScriptFiles(
  outputDir: string,
  options: MinifyOptions,
): number {
  const jsFiles = listFiles(outputDir).filter((item) => item.endsWith(".js"));

  for (const file of jsFiles) {
    const result: unknown = minifySync(
      file,
      readFileSync(file, "utf8"),
      options,
    );

    if (!isOxcMinifyOutput(result)) {
      throw new Error(
        `Oxc returned an unexpected result for ${path.relative(outputDir, file)}.`,
      );
    }

    if (result.errors.length > 0) {
      throw new Error(
        `Oxc failed to minify ${path.relative(outputDir, file)}: ${result.errors
          .map((error) => error.message)
          .join("; ")}`,
      );
    }

    writeFileSync(file, `${result.code}\n`);
  }

  return jsFiles.length;
}

function optimizeSvgFiles(outputDir: string): number {
  const svgFiles = listFiles(outputDir).filter((item) => item.endsWith(".svg"));

  for (const file of svgFiles) {
    const original = readFileSync(file, "utf8");
    const result = optimizeSvg(original, {
      multipass: true,
      path: file,
      plugins: ["preset-default"],
    });

    if (/\sviewBox=/u.test(original) && !/\sviewBox=/u.test(result.data)) {
      throw new Error(
        `SVGO removed viewBox from ${path.relative(outputDir, file)}.`,
      );
    }

    writeFileSync(file, result.data);
  }

  return svgFiles.length;
}

const rasterAssetExtensions = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

const textReferenceExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".svg",
  ".txt",
  ".webmanifest",
  ".xml",
]);

function isAstroRasterAsset(outputDir: string, file: string): boolean {
  const relativePath = toPosix(path.relative(outputDir, file));
  return (
    relativePath.startsWith("_astro/") &&
    rasterAssetExtensions.has(path.extname(file).toLowerCase())
  );
}

function isTextReferenceFile(file: string): boolean {
  return textReferenceExtensions.has(path.extname(file).toLowerCase());
}

function removeUnreferencedAstroRasterAssets(outputDir: string): number {
  const files = listFiles(outputDir);
  const textReferences = files
    .filter(isTextReferenceFile)
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
  const rasterAssets = files.filter((file) =>
    isAstroRasterAsset(outputDir, file),
  );
  let removed = 0;

  for (const file of rasterAssets) {
    if (isGeneratedAssetReferenced(outputDir, file, textReferences)) {
      continue;
    }

    unlinkSync(file);
    removed += 1;
  }

  return removed;
}

function removeDisabledFeatureRouteOutput(
  outputDir: string,
  config: SiteConfig,
): number {
  const disabledRoutes = optionalFeatureRouteEntries(config).filter(
    (entry) => !entry.enabled,
  );
  let removed = 0;

  for (const route of disabledRoutes) {
    removed += removeGeneratedOutputEntry(
      path.join(outputDir, route.outputPath),
    );
  }

  if (!config.features.search) {
    removed += removeGeneratedOutputEntry(path.join(outputDir, "pagefind"));
  }

  return (
    removed +
    removeDisabledFeatureSitemapEntries(
      outputDir,
      disabledRoutes.map((route) => route.route),
    )
  );
}

function removeGeneratedOutputEntry(file: string): number {
  if (!existsSync(file)) {
    return 0;
  }

  const entryCount = statSync(file).isDirectory() ? listFiles(file).length : 1;
  rmSync(file, { force: true, recursive: true });

  return Math.max(entryCount, 1);
}

function removeDisabledFeatureSitemapEntries(
  outputDir: string,
  disabledRoutes: readonly string[],
): number {
  if (disabledRoutes.length === 0) {
    return 0;
  }

  const sitemapFiles = listFiles(outputDir).filter((file) =>
    /^sitemap-\d+\.xml$/u.test(toPosix(path.relative(outputDir, file))),
  );
  let removed = 0;

  for (const file of sitemapFiles) {
    const original = readFileSync(file, "utf8");
    const next = original.replaceAll(
      /<url\b[^>]*>[\s\S]*?<\/url>/giu,
      (entry) => {
        const pathname = sitemapLocPathname(entry);
        const isDisabledRoute =
          pathname !== undefined &&
          disabledRoutes.some((route) =>
            optionalRouteOwnsPathname(pathname, route),
          );

        if (!isDisabledRoute) {
          return entry;
        }

        removed += 1;
        return "";
      },
    );

    if (next !== original) {
      writeFileSync(file, next);
    }
  }

  return removed;
}

function sitemapLocPathname(entry: string): string | undefined {
  const match = /<loc>(?<loc>[^<]+)<\/loc>/iu.exec(entry);
  const loc = match?.groups?.["loc"];

  if (loc === undefined) {
    return undefined;
  }

  const schemeIndex = loc.indexOf("://");
  if (schemeIndex !== -1) {
    const pathStart = loc.indexOf("/", schemeIndex + "://".length);
    const absolutePath = pathStart === -1 ? "/" : loc.slice(pathStart);

    return absolutePath.split("#")[0]?.split("?")[0] ?? "/";
  }

  return loc.startsWith("/") ? loc : undefined;
}

function isGeneratedAssetReferenced(
  outputDir: string,
  file: string,
  textReferences: string,
): boolean {
  const relativePath = toPosix(path.relative(outputDir, file));
  const fileName = path.basename(file);
  const references = [
    fileName,
    encodeURI(fileName),
    relativePath,
    `/${relativePath}`,
    encodeURI(relativePath),
    `/${encodeURI(relativePath)}`,
  ];

  return references.some((reference) => textReferences.includes(reference));
}

function toPosix(value: string): string {
  return value.split(path.sep).join(path.posix.sep);
}
