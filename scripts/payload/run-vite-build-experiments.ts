import { spawn } from "node:child_process";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import astroConfig from "../../astro.config";
import { resolveSiteInstancePaths } from "../../src/lib/site-instance";
import {
  type BuildVerificationIssues,
  formatBuildVerificationReport,
  verifyBuild,
} from "../build/verify-build";
import {
  collectPayloadReport,
  type PayloadGroup,
  type PayloadReport,
} from "./report-payload";

/** Command used by a Vite build experiment gate. */
export interface ViteBuildGateCommand {
  args: string[];
  binary: "bunx";
  label: string;
}

/** Result from a Vite build experiment gate. */
export interface ViteBuildGateResult {
  command: ViteBuildGateCommand;
  exitCode: number;
  output: string;
}

/** Relative production-safety policy for a build experiment. */
export type ViteBuildScenarioPolicy =
  "candidate" | "measurement-only" | "unsupported";

/** JSON-serializable fragment merged into the base Astro Vite config. */
export interface ViteConfigExperimentFragment {
  build?: Record<string, unknown>;
  environments?: Record<string, unknown>;
}

/** One reproducible Vite/Astro build experiment. */
export interface ViteBuildScenario {
  config: ViteConfigExperimentFragment;
  name: string;
  policy: ViteBuildScenarioPolicy;
  rationale: string;
}

/** Paths allocated to one Vite build experiment. */
export interface ViteBuildScenarioPaths {
  configFile: string;
  outputDir: string;
  scenarioRoot: string;
}

/** Dependency-injected scenario runner used by tests. */
export type ViteBuildScenarioRunner = (
  scenario: ViteBuildScenario,
  paths: ViteBuildScenarioPaths,
  cwd: string,
) => Promise<ViteBuildGateResult[]>;

/** Result from one Vite/Astro build experiment. */
export interface ViteBuildScenarioResult {
  gates: ViteBuildGateResult[];
  output: PayloadReport | undefined;
  productionEligible: boolean;
  scenario: ViteBuildScenario;
}

/** Options for running the Vite/Astro build experiment suite. */
export interface ViteBuildExperimentSuiteOptions {
  cwd: string;
  outputRoot: string;
  reportFile?: string;
  runner?: ViteBuildScenarioRunner;
  scenarios?: ViteBuildScenario[];
}

/** Complete Vite/Astro build experiment suite result. */
export interface ViteBuildExperimentSuiteResult {
  baseline: undefined | ViteBuildScenarioResult;
  recommendedScenario: undefined | ViteBuildScenarioResult;
  report: string;
  results: ViteBuildScenarioResult[];
}

const defaultReportFile = path.join(
  "tmp",
  "vite-build-experiments",
  "experiment-report.md",
);

const pagefindGlob =
  "{index.html,about/**/*.html,articles/**/*.html,authors/**/*.html,categories/**/*.html,search/**/*.html}";

const defaultScenarios = [
  {
    config: {},
    name: "baseline",
    policy: "candidate",
    rationale:
      "Current Astro/Vite production build with no experiment override.",
  },
  {
    config: {
      build: {
        cssMinify: "lightningcss",
      },
    },
    name: "css-minify-lightningcss",
    policy: "candidate",
    rationale:
      "Check whether explicitly using Lightning CSS improves compressed CSS compared with Astro/Vite defaults.",
  },
  {
    config: {
      build: {
        cssMinify: "esbuild",
      },
    },
    name: "css-minify-esbuild",
    policy: "candidate",
    rationale:
      "Measure the legacy esbuild CSS minifier path against the current default-compatible build.",
  },
  {
    config: {
      build: {
        assetsInlineLimit: 0,
      },
    },
    name: "assets-inline-never",
    policy: "candidate",
    rationale:
      "Measure whether avoiding base64 inlining helps compressed payloads without changing generated routes.",
  },
  {
    config: {
      build: {
        modulePreload: {
          polyfill: false,
        },
      },
    },
    name: "modulepreload-polyfill-false",
    policy: "candidate",
    rationale:
      "Confirm whether disabling Vite's modulepreload polyfill changes static output; Astro already disables this internally for part of its build.",
  },
  {
    config: {
      build: {
        target: "baseline-widely-available",
      },
    },
    name: "target-baseline",
    policy: "measurement-only",
    rationale:
      "Verify whether Astro's static build honors a Vite browser target override; Astro currently hardcodes esnext for static client output.",
  },
  {
    config: {
      build: {
        minify: false,
      },
    },
    name: "minify-disabled",
    policy: "measurement-only",
    rationale:
      "Upper-bound measurement for how much current Astro/Vite minification matters; never a production optimization.",
  },
  {
    config: {
      environments: {
        client: {
          build: {
            sourcemap: "hidden",
          },
        },
      },
    },
    name: "client-sourcemap-hidden",
    policy: "measurement-only",
    rationale:
      "Measure the payload cost of production source maps; useful for debugging policy, not payload optimization.",
  },
  {
    config: {
      build: {
        minify: "oxc",
      },
    },
    name: "oxc-minify",
    policy: "unsupported",
    rationale:
      "Probe current Vite support for Oxc minification. Vite 8 documents this path, but this repo currently builds through Vite 7.3.2.",
  },
] as const satisfies readonly ViteBuildScenario[];

/**
 * Formats a Vite/Astro build experiment report.
 *
 * @param result Suite result without its final report string.
 * @returns Markdown report.
 */
export function formatViteBuildExperimentSuiteReport(
  result: Omit<ViteBuildExperimentSuiteResult, "report">,
): string {
  const baseline = result.baseline?.output;
  const lines = [
    "# Vite Build Experiments",
    "",
    "This report is generated by `bun run payload:vite:experiments` so Vite",
    "and Astro build-option experiments can be rerun after site, dependency,",
    "or requirement changes. It measures raw bytes, gzip bytes, and Brotli",
    "bytes because the production target is a static site served by",
    "compression-capable hosting.",
    "",
    "## Toolchain Context",
    "",
    "- Astro: 6.2.1 in the current lockfile.",
    "- Vite: 7.3.2 in the current lockfile.",
    "- Current Vite 7 types expose `build.minify` as `false`, `true`,",
    '  `"esbuild"`, or `"terser"`; they do not expose `"oxc"`.',
    "- Current Vite 8 docs expose Oxc minification, so Oxc remains a future",
    "  dependency/toolchain-upgrade candidate rather than a safe current",
    "  `astro.config.ts` flag.",
    "",
    "## Baseline",
    "",
    baseline === undefined
      ? "No baseline was captured."
      : payloadGroupTable([
          ["All assets", baseline.allFiles],
          ["Gzip/Brotli-eligible assets", baseline.gzipEligibleFiles],
          ["HTML assets", baseline.htmlFiles],
          ["CSS assets", groupByExtension(baseline, ".css")],
          ["JS assets", groupByExtension(baseline, ".js")],
        ]),
    "",
    "## Scenario Results",
    "",
    scenarioTable(result.results, result.baseline),
    "",
    "## Scenario Details",
    "",
    ...result.results.flatMap((scenarioResult) =>
      formatScenarioDetails(scenarioResult, result.baseline),
    ),
    "## Conclusion",
    "",
    conclusionText(result.recommendedScenario),
    "",
    "## Follow-Up Candidates",
    "",
    followUpText(result.results, result.baseline),
  ];

  return lines.join("\n");
}

/**
 * Runs the reproducible Vite/Astro build experiment suite.
 *
 * @param options Suite options.
 * @param options.cwd Repository root.
 * @param options.outputRoot Directory where temporary configs and builds go.
 * @param options.reportFile Optional Markdown report path.
 * @param options.runner Scenario runner; tests inject a fixture runner.
 * @param options.scenarios Scenario list.
 * @returns Complete suite result.
 */
export async function runViteBuildExperimentSuite({
  cwd,
  outputRoot,
  reportFile,
  runner = runRealViteBuildScenario,
  scenarios = Array.from(defaultScenarios),
}: ViteBuildExperimentSuiteOptions): Promise<ViteBuildExperimentSuiteResult> {
  const resolvedOutputRoot = path.resolve(cwd, outputRoot);
  const results: ViteBuildScenarioResult[] = [];

  for (const scenario of scenarios) {
    const scenarioRoot = path.join(resolvedOutputRoot, scenario.name);
    const paths = {
      configFile: path.join(scenarioRoot, "astro.config.ts"),
      outputDir: path.join(scenarioRoot, "dist"),
      scenarioRoot,
    };
    const gates = await runner(scenario, paths, cwd);
    const output = scenarioOutputIsMeasurable(gates, paths.outputDir)
      ? collectPayloadReport({ distDir: paths.outputDir })
      : undefined;

    results.push({
      gates,
      output,
      productionEligible: false,
      scenario,
    });
  }

  const baseline = results.find(
    (result) => result.scenario.name === "baseline",
  );
  const completedResults = results.map((result) => ({
    ...result,
    productionEligible: isProductionEligible(result, baseline),
  }));
  const recommendedScenario = chooseRecommendedScenario(
    completedResults,
    baseline,
  );
  const report = formatViteBuildExperimentSuiteReport({
    baseline,
    recommendedScenario,
    results: completedResults,
  });

  if (reportFile !== undefined) {
    const resolvedReportFile = path.resolve(cwd, reportFile);
    mkdirSync(path.dirname(resolvedReportFile), { recursive: true });
    writeFileSync(resolvedReportFile, `${report}\n`);
  }

  return {
    baseline,
    recommendedScenario,
    report,
    results: completedResults,
  };
}

/**
 * Runs the Vite/Astro build experiment CLI.
 *
 * @param args Command-line arguments without executable prefix.
 * @param cwd Repository root.
 * @returns Process exit code.
 */
export async function runViteBuildExperimentSuiteCli(
  args = process.argv.slice(2),
  cwd = process.cwd(),
): Promise<number> {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage());
    return 0;
  }

  try {
    const outputRoot =
      readValueArg(args, "--out") ?? path.join("tmp", "vite-build-experiments");
    const reportFile = args.includes("--no-report")
      ? undefined
      : (readValueArg(args, "--report") ?? defaultReportFile);
    const scenarioNames = readRepeatedValueArg(args, "--scenario");
    const scenarios =
      scenarioNames.length === 0
        ? Array.from(defaultScenarios)
        : scenariosByName(scenarioNames);
    const suiteOptions: ViteBuildExperimentSuiteOptions = {
      cwd,
      outputRoot,
      scenarios,
    };
    if (reportFile !== undefined) {
      suiteOptions.reportFile = reportFile;
    }

    const result = await runViteBuildExperimentSuite(suiteOptions);

    if (args.includes("--json")) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(result.report);
    }

    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function allGatesPassed(result: ViteBuildScenarioResult): boolean {
  return result.gates.every((gate) => gate.exitCode === 0);
}

function buildVerificationHasIssues(issues: BuildVerificationIssues): boolean {
  const issueLists: string[][] = [
    issues.articleCountIssues,
    issues.brokenLinks,
    issues.catalogLeaks,
    issues.draftLeaks,
    issues.invalidLegacyRedirects,
    issues.missingArticleJsonLd,
    issues.missingLegacyRedirects,
    issues.missingRequired,
    issues.sourceMaps,
    issues.socialImageIssues,
    issues.unexpectedClientScripts,
    issues.unexpectedDatedPages,
    issues.unexpectedHydrationBoundaries,
  ];

  return issueLists.some((issueList) => issueList.length > 0);
}

function chooseRecommendedScenario(
  results: ViteBuildScenarioResult[],
  baseline: undefined | ViteBuildScenarioResult,
): undefined | ViteBuildScenarioResult {
  if (baseline?.output?.gzipEligibleFiles.brotliBytes === undefined) {
    return undefined;
  }

  const resolvedBaseline = baseline;
  const eligible = results.filter(
    (result) =>
      result.productionEligible &&
      result.scenario.name !== "baseline" &&
      brotliDelta(result, resolvedBaseline) < 0,
  );

  return eligible.sort(
    (left, right) =>
      brotliDelta(left, resolvedBaseline) -
      brotliDelta(right, resolvedBaseline),
  )[0];
}

function commandEnvironment(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  env["ASTRO_TELEMETRY_DISABLED"] = "1";
  env["NO_COLOR"] = "1";
  delete env["FORCE_COLOR"];
  return env;
}

function commandLine(command: ViteBuildGateCommand): string {
  return [command.binary, ...command.args.map(displayCommandArg)].join(" ");
}

function conclusionText(
  recommendedScenario: undefined | ViteBuildScenarioResult,
): string {
  if (recommendedScenario === undefined) {
    return [
      "No Vite/Astro build override currently qualifies as a production",
      "optimization. Keep `astro.config.ts` on the existing build defaults and",
      "rerun this suite after Astro/Vite upgrades, especially once Vite 8/Oxc",
      "is available through the project toolchain. The current Oxc probe is",
      "kept as a documented no-adopt scenario because Vite 7 does not expose",
      '`"oxc"` in its build minify type and Astro produced byte-identical output.',
    ].join("\n");
  }

  return [
    `Recommended candidate: \`${recommendedScenario.scenario.name}\`.`,
    "It passed every experiment gate and reduced Brotli-compressed",
    "gzip/Brotli-eligible output relative to baseline.",
  ].join("\n");
}

function conciseGateOutput(output: string): string[] {
  return output
    .trim()
    .split(/\r?\n/)
    .map((line) => line.replaceAll(`${process.cwd()}${path.sep}`, ""))
    .filter((line) => line.trim() !== "")
    .slice(0, 24);
}

function displayCommandArg(arg: string): string {
  const relativePath = path.relative(process.cwd(), arg);

  if (
    relativePath !== "" &&
    !relativePath.startsWith("..") &&
    !path.isAbsolute(relativePath)
  ) {
    return relativePath.split(path.sep).join("/");
  }

  return arg;
}

function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined) {
    return "n/a";
  }

  return `${new Intl.NumberFormat("en-US").format(bytes)} B`;
}

function formatDelta(bytes: number | undefined): string {
  if (bytes === undefined) {
    return "n/a";
  }

  const sign = bytes > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("en-US").format(bytes)} B`;
}

function followUpText(
  results: ViteBuildScenarioResult[],
  baseline: undefined | ViteBuildScenarioResult,
): string {
  const promisingRejected = results.filter(
    (result) =>
      result.scenario.policy === "candidate" &&
      !result.productionEligible &&
      brotliDeltaOrUndefined(result, baseline) !== undefined &&
      (brotliDeltaOrUndefined(result, baseline) ?? 0) < 0,
  );
  const lines = promisingRejected.map(
    (result) =>
      `- \`${result.scenario.name}\` reduced compressed payload but failed a release gate. Treat it as a follow-up design/performance question, not a config-only adoption.`,
  );

  lines.push(
    "- `oxc-minify` is intentionally retained as an unsupported probe. Current Vite 7/Astro output was byte-identical to baseline, so Oxc should be revisited through an Astro/Vite toolchain upgrade rather than a local config flag.",
  );

  return lines.join("\n");
}

function formatGate(gate: ViteBuildGateResult): string {
  return gate.exitCode === 0 ? "pass" : `fail (${gate.exitCode})`;
}

function formatScenarioDetails(
  result: ViteBuildScenarioResult,
  baseline: undefined | ViteBuildScenarioResult,
): string[] {
  const failedOutput = result.gates
    .filter((gate) => gate.exitCode !== 0)
    .flatMap((gate) => conciseGateOutput(gate.output));
  const lines = [
    `### ${result.scenario.name}`,
    "",
    `Policy: ${result.scenario.policy}`,
    "",
    result.scenario.rationale,
    "",
    result.output === undefined
      ? "No payload report was captured because a required build gate failed."
      : payloadGroupTable([
          ["All assets", result.output.allFiles],
          ["Gzip/Brotli-eligible assets", result.output.gzipEligibleFiles],
          ["HTML assets", result.output.htmlFiles],
          ["CSS assets", groupByExtension(result.output, ".css")],
          ["JS assets", groupByExtension(result.output, ".js")],
        ]),
    "",
    `Compressed delta vs baseline: ${formatDelta(brotliDeltaOrUndefined(result, baseline))} Brotli, ${formatDelta(gzipDeltaOrUndefined(result, baseline))} gzip.`,
    "",
    "Gates:",
    ...result.gates.map(
      (gate) =>
        `- ${gate.command.label}: ${formatGate(gate)} via \`${commandLine(gate.command)}\``,
    ),
  ];

  if (failedOutput.length > 0) {
    lines.push("", "Failure excerpt:", "", "```text", ...failedOutput, "```");
  }

  return [...lines, ""];
}

function groupByExtension(
  report: PayloadReport,
  extension: string,
): PayloadGroup {
  return (
    report.byExtension.find((group) => group.extension === extension) ?? {
      brotliBytes: undefined,
      extension,
      files: 0,
      gzipBytes: undefined,
      rawBytes: 0,
    }
  );
}

function gzipDeltaOrUndefined(
  result: ViteBuildScenarioResult,
  baseline: undefined | ViteBuildScenarioResult,
): number | undefined {
  const baselineBytes = baseline?.output?.gzipEligibleFiles.gzipBytes;
  const resultBytes = result.output?.gzipEligibleFiles.gzipBytes;

  if (baselineBytes === undefined || resultBytes === undefined) {
    return undefined;
  }

  return resultBytes - baselineBytes;
}

function brotliDelta(
  result: ViteBuildScenarioResult,
  baseline: ViteBuildScenarioResult,
): number {
  return (
    (result.output?.gzipEligibleFiles.brotliBytes ?? 0) -
    (baseline.output?.gzipEligibleFiles.brotliBytes ?? 0)
  );
}

function brotliDeltaOrUndefined(
  result: ViteBuildScenarioResult,
  baseline: undefined | ViteBuildScenarioResult,
): number | undefined {
  const baselineBytes = baseline?.output?.gzipEligibleFiles.brotliBytes;
  const resultBytes = result.output?.gzipEligibleFiles.brotliBytes;

  if (baselineBytes === undefined || resultBytes === undefined) {
    return undefined;
  }

  return resultBytes - baselineBytes;
}

function htmlValidateCommand(outputDir: string): ViteBuildGateCommand {
  return {
    args: [
      "html-validate",
      "--max-warnings=0",
      path.join(outputDir, "index.html"),
      path.join(outputDir, "404.html"),
      path.join(outputDir, "about", "**", "*.html"),
      path.join(outputDir, "articles", "index.html"),
      path.join(outputDir, "authors", "**", "*.html"),
      path.join(outputDir, "categories", "**", "*.html"),
      path.join(outputDir, "search", "**", "*.html"),
    ],
    binary: "bunx",
    label: "HTML validation",
  };
}

function isProductionEligible(
  result: ViteBuildScenarioResult,
  baseline: undefined | ViteBuildScenarioResult,
): boolean {
  if (
    result.scenario.policy !== "candidate" ||
    result.output === undefined ||
    !allGatesPassed(result)
  ) {
    return false;
  }

  if (result.scenario.name === "baseline") {
    return true;
  }

  return baseline?.output !== undefined;
}

function pagefindCommand(outputDir: string): ViteBuildGateCommand {
  return {
    args: ["pagefind", "--site", outputDir, "--quiet", "--glob", pagefindGlob],
    binary: "bunx",
    label: "Pagefind indexing",
  };
}

function payloadGroupTable(
  groups: Array<
    [
      string,
      Pick<PayloadGroup, "brotliBytes" | "files" | "gzipBytes" | "rawBytes">,
    ]
  >,
): string {
  return [
    "| Group | Files | Raw Bytes | Gzip Bytes | Brotli Bytes |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...groups.map(
      ([label, group]) =>
        `| ${label} | ${group.files} | ${formatBytes(group.rawBytes)} | ${formatBytes(group.gzipBytes)} | ${formatBytes(group.brotliBytes)} |`,
    ),
  ].join("\n");
}

function configuredStringRedirects(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(astroConfig.redirects ?? {}).flatMap(([source, target]) =>
      typeof target === "string" ? [[source, target]] : [],
    ),
  );
}

function readRepeatedValueArg(args: string[], flag: string): string[] {
  return args.flatMap((arg, index) => {
    if (arg !== flag) {
      return [];
    }

    const value = args[index + 1];
    if (value === undefined || value.startsWith("-")) {
      throw new Error(`Missing value for ${flag}.`);
    }

    return [value];
  });
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

async function runCommand(
  command: ViteBuildGateCommand,
  cwd: string,
): Promise<ViteBuildGateResult> {
  return new Promise<ViteBuildGateResult>((resolve) => {
    const child = spawn(command.binary, command.args, {
      cwd,
      env: commandEnvironment(),
      stdio: ["ignore", "pipe", "pipe"],
    });
    const chunks: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    child.on("error", (error) => {
      resolve({
        command,
        exitCode: 1,
        output: error.message,
      });
    });
    child.on("close", (code) => {
      resolve({
        command,
        exitCode: code ?? 1,
        output: Buffer.concat(chunks).toString("utf8"),
      });
    });
  });
}

async function runRealViteBuildScenario(
  scenario: ViteBuildScenario,
  paths: ViteBuildScenarioPaths,
  cwd: string,
): Promise<ViteBuildGateResult[]> {
  mkdirSync(paths.scenarioRoot, { recursive: true });
  writeFileSync(
    paths.configFile,
    temporaryAstroConfigSource({
      cwd,
      outputDir: paths.outputDir,
      scenario,
    }),
  );

  const build = await runCommand(
    {
      args: [
        "astro",
        "--config",
        path.relative(cwd, paths.configFile),
        "build",
      ],
      binary: "bunx",
      label: "Astro build",
    },
    cwd,
  );
  if (build.exitCode !== 0) {
    return [build];
  }

  const pagefind = await runCommand(pagefindCommand(paths.outputDir), cwd);
  if (pagefind.exitCode !== 0) {
    return [build, pagefind];
  }

  const htmlValidate = await runCommand(
    htmlValidateCommand(paths.outputDir),
    cwd,
  );
  const buildVerification = await runVerifyBuildGate(paths.outputDir, cwd);

  return [build, pagefind, htmlValidate, buildVerification];
}

async function runVerifyBuildGate(
  outputDir: string,
  cwd: string,
): Promise<ViteBuildGateResult> {
  const command = {
    args: ["scripts/build/verify-build.ts", "--quiet"],
    binary: "bunx",
    label: "Build verification",
  } satisfies ViteBuildGateCommand;

  try {
    const sitePaths = resolveSiteInstancePaths({ cwd });
    const result = await verifyBuild({
      announcementDir: sitePaths.content.announcements,
      articleDir: sitePaths.content.articles,
      categoryDir: sitePaths.content.categories,
      collectionDir: sitePaths.content.collections,
      distDir: outputDir,
      expectedRedirects: configuredStringRedirects(),
    });
    const output = formatBuildVerificationReport(result);

    return {
      command,
      exitCode: buildVerificationHasIssues(result.issues) ? 1 : 0,
      output,
    };
  } catch (error) {
    return {
      command,
      exitCode: 1,
      output: error instanceof Error ? error.message : String(error),
    };
  }
}

function scenarioTable(
  results: ViteBuildScenarioResult[],
  baseline: undefined | ViteBuildScenarioResult,
): string {
  return [
    "| Scenario | Policy | Brotli Delta | Gzip Delta | HTML Brotli | CSS Brotli | JS Brotli | Gates | Production Eligible |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |",
    ...results.map((result) => {
      const html = result.output?.htmlFiles.brotliBytes;
      const css = result.output
        ? groupByExtension(result.output, ".css").brotliBytes
        : undefined;
      const js = result.output
        ? groupByExtension(result.output, ".js").brotliBytes
        : undefined;

      return `| \`${result.scenario.name}\` | ${result.scenario.policy} | ${formatDelta(brotliDeltaOrUndefined(result, baseline))} | ${formatDelta(gzipDeltaOrUndefined(result, baseline))} | ${formatBytes(html)} | ${formatBytes(css)} | ${formatBytes(js)} | ${result.gates.map(formatGate).join(", ")} | ${result.productionEligible ? "yes" : "no"} |`;
    }),
  ].join("\n");
}

function scenarioOutputIsMeasurable(
  gates: ViteBuildGateResult[],
  outputDir: string,
): boolean {
  const astroBuildPassed = gates.some(
    (gate) => gate.command.label === "Astro build" && gate.exitCode === 0,
  );
  const pagefindPassed = gates.some(
    (gate) => gate.command.label === "Pagefind indexing" && gate.exitCode === 0,
  );

  return (
    astroBuildPassed &&
    pagefindPassed &&
    existsSync(outputDir) &&
    statSync(outputDir).isDirectory()
  );
}

function scenariosByName(names: string[]): ViteBuildScenario[] {
  return names.map((name) => {
    const scenario = defaultScenarios.find((item) => item.name === name);

    if (scenario === undefined) {
      throw new Error(
        `Unknown Vite build scenario "${name}". Expected one of: ${defaultScenarios.map((item) => item.name).join(", ")}.`,
      );
    }

    return scenario;
  });
}

function temporaryAstroConfigSource({
  cwd,
  outputDir,
  scenario,
}: {
  cwd: string;
  outputDir: string;
  scenario: ViteBuildScenario;
}): string {
  const astroConfigUrl = pathToFileURL(path.join(cwd, "astro.config.ts")).href;
  const outputDirLiteral = JSON.stringify(outputDir);
  const scenarioConfigLiteral = JSON.stringify(scenario.config, null, 2);

  return `import { defineConfig } from "astro/config";
import baseConfig from ${JSON.stringify(astroConfigUrl)};

const experimentConfig = ${scenarioConfigLiteral};
const baseVite = baseConfig.vite ?? {};
const experimentClientEnvironment = experimentConfig.environments?.client ?? {};
const baseClientEnvironment = baseVite.environments?.client ?? {};

export default defineConfig({
  ...baseConfig,
  outDir: ${outputDirLiteral},
  vite: {
    ...baseVite,
    ...experimentConfig,
    build: {
      ...(baseVite.build ?? {}),
      ...(experimentConfig.build ?? {}),
    },
    environments: {
      ...(baseVite.environments ?? {}),
      ...(experimentConfig.environments ?? {}),
      client: {
        ...baseClientEnvironment,
        ...experimentClientEnvironment,
        build: {
          ...(baseClientEnvironment.build ?? {}),
          ...(experimentClientEnvironment.build ?? {}),
        },
      },
    },
  },
});
`;
}

function usage(): string {
  return `Usage: bun run payload:vite:experiments [--out <dir>] [--report <file>] [--scenario <name>] [--no-report] [--json]

Run reproducible Astro/Vite build-option scenarios, index each build with
Pagefind, validate generated HTML, run build verification, and compare
raw/gzip/Brotli output. Use --scenario multiple times to limit the suite.

Default report path: ${defaultReportFile}`;
}

if (import.meta.main) {
  try {
    process.exitCode = await runViteBuildExperimentSuiteCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
