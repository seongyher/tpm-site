import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

import {
  type ByteBudgetResult,
  evaluateByteBudget,
  immutableAstroAssetCachePolicy,
  type PayloadBudgetStatus,
  pdfPayloadBudget,
  routeClassHtmlOutputPath,
  type RouteClassPerformanceBudget,
  routeClassPerformanceBudgets,
  type RoutePerformanceClassId,
} from "../../src/lib/release/performance-budgets";

/** One measured file from built output. */
export interface PayloadFile {
  brotliBytes: number | undefined;
  extension: string;
  gzipBytes: number | undefined;
  path: string;
  rawBytes: number;
}

/** Asset role used by route-class payload reports. */
export type PayloadAssetRole =
  | "feed"
  | "font"
  | "html"
  | "image"
  | "metadata"
  | "other"
  | "pdf"
  | "script"
  | "search"
  | "stylesheet";

/** Aggregated payload data for a group of files. */
export interface PayloadGroup {
  brotliBytes: number | undefined;
  extension: string;
  files: number;
  gzipBytes: number | undefined;
  rawBytes: number;
}

/** Aggregated payload data for one semantic asset role. */
export interface PayloadAssetRoleGroup extends Omit<PayloadGroup, "extension"> {
  role: PayloadAssetRole;
}

/** Payload and budget data for one representative route. */
export interface PayloadRouteReport {
  budget: ByteBudgetResult | undefined;
  file: PayloadFile | undefined;
  htmlPath: string;
  route: string;
  status: PayloadBudgetStatus;
}

/** Payload and budget data for one route class. */
export interface PayloadRouteClassReport {
  description: string;
  id: RoutePerformanceClassId;
  label: string;
  routes: PayloadRouteReport[];
  status: PayloadBudgetStatus;
}

/** Generated PDF payload budget data. */
export interface PayloadPdfReport {
  failureBytes: number;
  files: PayloadFile[];
  status: PayloadBudgetStatus;
  targetBytes: number;
  warningBytes: number;
}

/** Cache-header policy result for generated output. */
export interface PayloadCacheHeaderReport {
  expectedHeader: string;
  headersPath: string;
  pathPattern: string;
  status: PayloadBudgetStatus;
}

/** Complete generated-output payload report. */
export interface PayloadReport {
  allFiles: PayloadGroup;
  byAssetRole: PayloadAssetRoleGroup[];
  byExtension: PayloadGroup[];
  cacheHeaders: PayloadCacheHeaderReport[];
  gzipEligibleFiles: PayloadGroup;
  htmlFiles: PayloadGroup;
  pdfs: PayloadPdfReport;
  routeClasses: PayloadRouteClassReport[];
  topHtmlByBrotli: PayloadFile[];
  topHtmlByGzip: PayloadFile[];
  topHtmlByRaw: PayloadFile[];
}

/** One deterministic payload budget failure that should block release. */
export interface PayloadReportBlockingFailure {
  readonly message: string;
  readonly owner: "cache" | "pdf" | "route-class";
}

/** Options for collecting payload data. */
export interface PayloadReportOptions {
  distDir: string;
  topCount?: number;
}

const defaultTopCount = 10;

const gzipEligibleExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".map",
  ".svg",
  ".txt",
  ".webmanifest",
  ".xml",
]);

/**
 * Collects raw and gzip payload sizes from generated static output.
 *
 * @param options Payload report options.
 * @param options.distDir Built output directory.
 * @param options.topCount Number of largest HTML files to include.
 * @returns Aggregated payload report.
 */
export function collectPayloadReport({
  distDir,
  topCount = defaultTopCount,
}: PayloadReportOptions): PayloadReport {
  if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
    throw new Error(`Build output directory not found: ${distDir}`);
  }

  const files = listFiles(distDir).map((absolutePath) =>
    measureFile(distDir, absolutePath),
  );
  const htmlFiles = files.filter((file) => file.extension === ".html");
  const gzipEligibleFiles = files.filter(
    (
      file,
    ): file is PayloadFile & {
      brotliBytes: number;
      gzipBytes: number;
    } => file.gzipBytes !== undefined && file.brotliBytes !== undefined,
  );
  const fileByPath = new Map(files.map((file) => [file.path, file]));

  return {
    allFiles: groupFiles("*", files),
    byAssetRole: groupByAssetRole(files),
    byExtension: groupByExtension(files),
    cacheHeaders: [cacheHeaderReport(distDir)],
    gzipEligibleFiles: groupFiles("gzip-eligible", gzipEligibleFiles),
    htmlFiles: groupFiles(".html", htmlFiles),
    pdfs: pdfReport(files),
    routeClasses: routeClassPerformanceBudgets.map((budget) =>
      routeClassReport(fileByPath, budget),
    ),
    topHtmlByBrotli: Array.from(htmlFiles)
      .sort(compareBrotliDescending)
      .slice(0, topCount),
    topHtmlByGzip: Array.from(htmlFiles)
      .sort(compareGzipDescending)
      .slice(0, topCount),
    topHtmlByRaw: Array.from(htmlFiles)
      .sort((left, right) => right.rawBytes - left.rawBytes)
      .slice(0, topCount),
  };
}

/**
 * Formats a generated-output payload report for human review.
 *
 * @param report Payload report.
 * @returns Human-readable payload report.
 */
export function formatPayloadReport(report: PayloadReport): string {
  const lines = [
    "Payload report:",
    `All assets: ${formatGroup(report.allFiles)}`,
    `Gzip-eligible assets: ${formatGroup(report.gzipEligibleFiles)}`,
    `HTML assets: ${formatGroup(report.htmlFiles)}`,
    "",
    "By extension:",
    ...report.byExtension.map(
      (group) => `- ${group.extension}: ${formatGroup(group)}`,
    ),
    "",
    "Largest HTML by Brotli:",
    ...formatFileList(report.topHtmlByBrotli),
    "",
    "Largest HTML by gzip:",
    ...formatFileList(report.topHtmlByGzip),
    "",
    "Largest HTML by raw size:",
    ...formatFileList(report.topHtmlByRaw),
    "",
    "By asset role:",
    ...report.byAssetRole.map(
      (group) => `- ${group.role}: ${formatGroup(group)}`,
    ),
    "",
    "Route classes:",
    ...formatRouteClassReports(report.routeClasses),
    "",
    "Generated PDFs:",
    ...formatPdfReport(report.pdfs),
    "",
    "Cache headers:",
    ...formatCacheHeaderReports(report.cacheHeaders),
  ];

  return lines.join("\n");
}

/**
 * Returns deterministic payload failures that should block release.
 *
 * @param report Payload report.
 * @returns Blocking failure descriptions.
 */
export function payloadReportBlockingFailures(
  report: PayloadReport,
): PayloadReportBlockingFailure[] {
  return [
    ...report.routeClasses.flatMap((routeClass) =>
      routeClass.routes.flatMap((route) => {
        if (route.status !== "fail" && route.status !== "missing") {
          return [];
        }

        return [
          {
            message: `${routeClass.label} route ${route.route} ${route.status}: ${formatBudgetResult(route.budget)}`,
            owner: "route-class" as const,
          },
        ];
      }),
    ),
    ...(report.pdfs.status === "fail" || report.pdfs.status === "missing"
      ? [
          {
            message: `Generated PDFs ${report.pdfs.status}: target ${formatBytes(report.pdfs.targetBytes)}, warning ${formatBytes(report.pdfs.warningBytes)}, failure ${formatBytes(report.pdfs.failureBytes)}`,
            owner: "pdf" as const,
          },
        ]
      : []),
    ...report.cacheHeaders.flatMap((cacheHeader) => {
      if (cacheHeader.status !== "fail" && cacheHeader.status !== "missing") {
        return [];
      }

      return [
        {
          message: `Cache header ${cacheHeader.status}: expected "${cacheHeader.expectedHeader}" under ${cacheHeader.pathPattern} in ${cacheHeader.headersPath}`,
          owner: "cache" as const,
        },
      ];
    }),
  ];
}

/**
 * Runs the payload reporting command-line workflow.
 *
 * @param args Command-line arguments without the executable prefix.
 * @param cwd Working directory for relative paths.
 * @returns Process exit code.
 */
export function runPayloadReportCli(
  args = process.argv.slice(2),
  cwd = process.cwd(),
): number {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Usage: bun run payload:report [--dist <path>] [--json] [--top <count>] [--check]

Report raw, gzip, and Brotli sizes for generated static build output. Run bun
run build first unless a custom --dist directory is supplied. Add --check to
fail on deterministic route-class, PDF, or cache-header budget failures.`);
    return 0;
  }

  const check = args.includes("--check");
  const json = args.includes("--json");

  try {
    const report = collectPayloadReport({
      distDir: path.resolve(cwd, readValueArg(args, "--dist") ?? "dist"),
      topCount: readPositiveIntegerArg(args, "--top") ?? defaultTopCount,
    });

    console.log(
      json ? JSON.stringify(report, null, 2) : formatPayloadReport(report),
    );

    const blockingFailures = check ? payloadReportBlockingFailures(report) : [];

    if (blockingFailures.length === 0) {
      return 0;
    }

    console.error("Payload budget check failed:");

    for (const failure of blockingFailures) {
      console.error(`- ${failure.owner}: ${failure.message}`);
    }

    return 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function brotliSize(contents: Buffer): number {
  return brotliCompressSync(contents, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
    },
  }).byteLength;
}

function compareBrotliDescending(
  left: PayloadFile,
  right: PayloadFile,
): number {
  return (right.brotliBytes ?? 0) - (left.brotliBytes ?? 0);
}

function compareGzipDescending(left: PayloadFile, right: PayloadFile): number {
  return (right.gzipBytes ?? 0) - (left.gzipBytes ?? 0);
}

function extensionForFile(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  return extension === "" ? "[none]" : extension;
}

function assetRoleForFile(file: PayloadFile): PayloadAssetRole {
  if (file.path.startsWith("pagefind/")) {
    return "search";
  }

  switch (file.extension) {
    case ".avif":
    case ".gif":
    case ".jpeg":
    case ".jpg":
    case ".png":
    case ".svg":
    case ".webp":
      return "image";
    case ".css":
      return "stylesheet";
    case ".html":
      return "html";
    case ".js":
    case ".mjs":
      return "script";
    case ".json":
    case ".webmanifest":
      return "metadata";
    case ".pdf":
      return "pdf";
    case ".ttf":
    case ".woff":
    case ".woff2":
      return "font";
    case ".xml":
      return "feed";
    default:
      return "other";
  }
}

function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined) {
    return "n/a";
  }

  return `${new Intl.NumberFormat("en-US").format(bytes)} B`;
}

function formatFileList(files: PayloadFile[]): string[] {
  if (files.length === 0) {
    return ["- none"];
  }

  return files.map(
    (file) =>
      `- ${file.path}: ${formatBytes(file.rawBytes)} raw, ${formatBytes(file.gzipBytes)} gzip, ${formatBytes(file.brotliBytes)} Brotli`,
  );
}

function formatGroup(group: Omit<PayloadGroup, "extension">): string {
  return `${group.files} files, ${formatBytes(group.rawBytes)} raw, ${formatBytes(group.gzipBytes)} gzip, ${formatBytes(group.brotliBytes)} Brotli`;
}

function formatBudgetResult(result: ByteBudgetResult | undefined): string {
  if (result === undefined) {
    return "no route HTML budget";
  }

  return `${result.status}, ${formatBytes(result.measuredBytes)} measured, ${formatBytes(result.warningBytes)} warning, ${formatBytes(result.failureBytes)} failure`;
}

function formatCacheHeaderReports(
  reports: PayloadCacheHeaderReport[],
): string[] {
  if (reports.length === 0) {
    return ["- none"];
  }

  return reports.map(
    (report) =>
      `- ${report.pathPattern}: ${report.status}, expected "${report.expectedHeader}" in ${report.headersPath}`,
  );
}

function formatPdfReport(report: PayloadPdfReport): string[] {
  if (report.files.length === 0) {
    return [
      `- status: ${report.status}, 0 files, target ${formatBytes(report.targetBytes)}, warning ${formatBytes(report.warningBytes)}, failure ${formatBytes(report.failureBytes)}`,
    ];
  }

  const oversizedFiles = report.files.filter(
    (file) => file.rawBytes > report.warningBytes,
  );

  return [
    `- status: ${report.status}, ${report.files.length} files, target ${formatBytes(report.targetBytes)}, warning ${formatBytes(report.warningBytes)}, failure ${formatBytes(report.failureBytes)}`,
    ...(oversizedFiles.length === 0
      ? ["- no PDFs above the review warning threshold"]
      : oversizedFiles.map(
          (file) => `- ${file.path}: ${formatBytes(file.rawBytes)} raw`,
        )),
  ];
}

function formatRouteClassReports(reports: PayloadRouteClassReport[]): string[] {
  if (reports.length === 0) {
    return ["- none"];
  }

  return reports.flatMap((report) => [
    `- ${report.label}: ${report.status}`,
    ...report.routes.map(
      (route) =>
        `  - ${route.route} (${route.htmlPath}): ${formatBudgetResult(route.budget)}`,
    ),
  ]);
}

function groupByAssetRole(files: PayloadFile[]): PayloadAssetRoleGroup[] {
  const roles = Array.from(new Set(files.map(assetRoleForFile))).sort(
    (left, right) => left.localeCompare(right),
  );

  return roles.map((role) => {
    const group = groupFiles(
      role,
      files.filter((file) => assetRoleForFile(file) === role),
    );

    return {
      brotliBytes: group.brotliBytes,
      files: group.files,
      gzipBytes: group.gzipBytes,
      rawBytes: group.rawBytes,
      role,
    };
  });
}

function groupByExtension(files: PayloadFile[]): PayloadGroup[] {
  const extensions = Array.from(
    new Set(files.map((file) => file.extension)),
  ).sort((left, right) => left.localeCompare(right));

  return extensions.map((extension) =>
    groupFiles(
      extension,
      files.filter((file) => file.extension === extension),
    ),
  );
}

function groupFiles(extension: string, files: PayloadFile[]): PayloadGroup {
  const gzipValues = files.flatMap((file) =>
    file.gzipBytes === undefined ? [] : [file.gzipBytes],
  );
  const brotliValues = files.flatMap((file) =>
    file.brotliBytes === undefined ? [] : [file.brotliBytes],
  );

  return {
    brotliBytes:
      brotliValues.length === 0
        ? undefined
        : brotliValues.reduce((total, bytes) => total + bytes, 0),
    extension,
    files: files.length,
    gzipBytes:
      gzipValues.length === 0
        ? undefined
        : gzipValues.reduce((total, bytes) => total + bytes, 0),
    rawBytes: files.reduce((total, file) => total + file.rawBytes, 0),
  };
}

function highestStatus(
  statuses: readonly PayloadBudgetStatus[],
): PayloadBudgetStatus {
  if (statuses.includes("fail")) {
    return "fail";
  }
  if (statuses.includes("missing")) {
    return "missing";
  }
  if (statuses.includes("warn")) {
    return "warn";
  }

  return "pass";
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

function measureFile(rootDir: string, absolutePath: string): PayloadFile {
  const contents = readFileSync(absolutePath);
  const relativePath = path
    .relative(rootDir, absolutePath)
    .split(path.sep)
    .join("/");
  const extension = extensionForFile(relativePath);
  const isCompressionEligible = gzipEligibleExtensions.has(extension);

  return {
    brotliBytes: isCompressionEligible ? brotliSize(contents) : undefined,
    extension,
    gzipBytes: isCompressionEligible
      ? gzipSync(contents, { level: 9 }).byteLength
      : undefined,
    path: relativePath,
    rawBytes: contents.byteLength,
  };
}

function cacheHeaderPresent(headersText: string): boolean {
  const lines = headersText.split(/\r?\n/u);

  return lines.some((line, index) => {
    if (line.trim() !== immutableAstroAssetCachePolicy.pathPattern) {
      return false;
    }

    const headerLines: string[] = [];

    for (const candidate of lines.slice(index + 1)) {
      if (!/^\s+\S/u.test(candidate)) {
        break;
      }

      headerLines.push(candidate.trim());
    }

    return headerLines.includes(immutableAstroAssetCachePolicy.expectedHeader);
  });
}

function cacheHeaderReport(distDir: string): PayloadCacheHeaderReport {
  const headersPath = "_headers";
  const absolutePath = path.join(distDir, headersPath);
  const present =
    existsSync(absolutePath) &&
    cacheHeaderPresent(readFileSync(absolutePath, "utf8"));

  return {
    expectedHeader: immutableAstroAssetCachePolicy.expectedHeader,
    headersPath,
    pathPattern: immutableAstroAssetCachePolicy.pathPattern,
    status: present ? "pass" : "missing",
  };
}

function pdfReport(files: PayloadFile[]): PayloadPdfReport {
  const pdfFiles = files
    .filter((file) => file.extension === ".pdf")
    .sort((left, right) => right.rawBytes - left.rawBytes);
  const statuses = pdfFiles.map(
    (file) =>
      evaluateByteBudget("PDF raw bytes", file.rawBytes, pdfPayloadBudget)
        .status,
  );

  return {
    failureBytes: pdfPayloadBudget.failureBytes,
    files: pdfFiles,
    status: pdfFiles.length === 0 ? "missing" : highestStatus(statuses),
    targetBytes: pdfPayloadBudget.targetBytes,
    warningBytes: pdfPayloadBudget.warningBytes,
  };
}

function routeClassReport(
  files: ReadonlyMap<string, PayloadFile>,
  routeClass: RouteClassPerformanceBudget,
): PayloadRouteClassReport {
  const routes = routeClass.routes.map((route) => {
    const htmlPath = routeClassHtmlOutputPath(route);
    const file = files.get(htmlPath);
    const budget =
      routeClass.htmlBrotliBudget === undefined
        ? undefined
        : evaluateByteBudget(
            "HTML Brotli bytes",
            file?.brotliBytes,
            routeClass.htmlBrotliBudget,
          );

    return {
      budget,
      file,
      htmlPath,
      route,
      status: budget?.status ?? (file === undefined ? "missing" : "pass"),
    };
  });

  return {
    description: routeClass.description,
    id: routeClass.id,
    label: routeClass.label,
    routes,
    status:
      routes.length === 0
        ? "pass"
        : highestStatus(routes.map((route) => route.status)),
  };
}

function readPositiveIntegerArg(
  args: string[],
  flag: string,
): number | undefined {
  const rawValue = readValueArg(args, flag);

  if (rawValue === undefined) {
    return undefined;
  }

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${flag} must be a positive integer.`);
  }

  return value;
}

function readValueArg(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  const value = args[index + 1];
  if (value === undefined || value.startsWith("-")) {
    throw new Error(`Missing value for ${flag}.`);
  }

  return value;
}

// Coverage note: this wrapper only connects the exported CLI workflow to
// process exit state; tests call `runPayloadReportCli()` directly.
if (import.meta.main) {
  try {
    process.exitCode = runPayloadReportCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
