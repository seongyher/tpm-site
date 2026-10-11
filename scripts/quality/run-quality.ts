import { spawn } from "node:child_process";

/** Captured result for one quality command. */
export interface CommandResult {
  command: QualityCommand;
  exitCode: number;
  output: string;
}

/** Command run by the quality dispatcher. */
export interface QualityCommand {
  args: string[];
  blocking: boolean;
  label: string;
}

/** Dependency-injected command runner for quality workflow tests. */
export type QualityCommandRunner = (
  command: QualityCommand,
  cwd: string,
) => Promise<CommandResult>;

/** Output level for quiet quality command reports. */
export type QualityOutputLevel = "error" | "warn";

/** Options for running the quiet quality workflow. */
export interface QualityWorkflowOptions {
  commands: QualityCommand[];
  cwd: string;
  runner?: QualityCommandRunner;
  write?: (message: string, level: QualityOutputLevel) => void;
}

const localCommands: QualityCommand[] = [
  {
    args: ["--silent", "run", "check"],
    blocking: true,
    label: "Normal quality gate",
  },
  {
    args: ["--silent", "run", "build"],
    blocking: true,
    label: "Production build",
  },
  {
    args: ["--silent", "run", "verify"],
    blocking: true,
    label: "Build verification",
  },
  {
    args: ["--silent", "run", "validate:html"],
    blocking: true,
    label: "HTML validation",
  },
  {
    args: ["--silent", "run", "review:assets"],
    blocking: false,
    label: "Asset review",
  },
  {
    args: ["--silent", "run", "coverage"],
    blocking: false,
    label: "Coverage review",
  },
];

const releaseCommands: QualityCommand[] = [
  {
    args: ["--silent", "run", "check:release"],
    blocking: true,
    label: "Release quality gate",
  },
  {
    args: ["--silent", "run", "review:assets"],
    blocking: false,
    label: "Asset review",
  },
  {
    args: ["--silent", "run", "test:a11y:built"],
    blocking: false,
    label: "Accessibility review",
  },
  {
    args: ["--silent", "run", "audit:all"],
    blocking: false,
    label: "All-severity dependency audit review",
  },
  {
    args: ["--silent", "run", "coverage"],
    blocking: false,
    label: "Coverage review",
  },
];

/**
 * Formats a noisy command result with label, command, and captured output.
 *
 * @param result Captured command result.
 * @returns Human-readable command report.
 */
export function formatCommandResult(result: CommandResult): string {
  let status = "produced warnings";
  if (result.exitCode !== 0) {
    status = result.command.blocking
      ? `failed with exit code ${result.exitCode}`
      : `produced review warnings with exit code ${result.exitCode}`;
  }
  const output = result.output.trim();

  return [
    `[quality] ${result.command.label} ${status}`,
    `$ ${commandLine(result.command)}`,
    output === "" ? undefined : output,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

/**
 * Detects whether captured command output contains actionable warning text.
 *
 * @param output Combined stdout and stderr from a command.
 * @returns True when the output should be shown to the user.
 */
export function outputHasWarningOrError(output: string): boolean {
  return output.split(/\r?\n/).some((line) => {
    if (line.trimStart().startsWith("$ ")) {
      return false;
    }

    const lineWithoutZeroCounts = line
      .replace(/\b(?:0|no)\s+(?:errors?|failures?|warnings?|warns?)\b/gi, "")
      .replace(/\b(?:errors?|failures?|warnings?|warns?)\s*[:=]\s*0\b/gi, "");

    return /\b(?:errors?|failed|failures?|fatal|warnings?|warns?)\b|[✖✗]/i.test(
      lineWithoutZeroCounts,
    );
  });
}

/**
 * Checks whether a command failure should fail the whole quality run.
 *
 * @param result Captured command result.
 * @returns True when a blocking command exited unsuccessfully.
 */
export function resultIsBlockingFailure(result: CommandResult): boolean {
  return result.command.blocking && result.exitCode !== 0;
}

/**
 * Runs the quiet quality-check command dispatcher.
 *
 * @param args Command-line arguments without the executable prefix.
 * @param cwd Working directory for Bun subprocesses.
 * @returns Process exit code.
 */
export async function runQualityCli(
  args = process.argv.slice(2),
  cwd = process.cwd(),
): Promise<number> {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage());
    return 0;
  }

  // Coverage note: the non-help CLI path intentionally launches the real
  // repository quality commands. Unit tests cover `runQualityWorkflow()` with
  // an injected runner instead of recursively running the whole toolchain.
  return runQualityWorkflow({
    commands: selectQualityCommands(args),
    cwd,
  });
}

/**
 * Decides whether a quality-command result should be printed.
 *
 * @param result Captured command result.
 * @returns True when the command failed or emitted warning-like output.
 */
export function shouldPrintResult(result: CommandResult): boolean {
  return result.exitCode !== 0 || outputHasWarningOrError(result.output);
}

/**
 * Runs quality commands quietly, printing only failures and warning-like
 * output.
 *
 * @param options Quality workflow options.
 * @param options.commands Commands to run sequentially.
 * @param options.cwd Working directory for Bun subprocesses.
 * @param options.runner Command runner dependency.
 * @param options.write Output sink for visible command reports.
 * @returns Process exit code.
 */
export async function runQualityWorkflow({
  commands,
  cwd,
  runner = runCommand,
  write = defaultWrite,
}: QualityWorkflowOptions): Promise<number> {
  const parallelReviewStart = parallelReviewStartIndex(commands);
  const blockingPrefix =
    parallelReviewStart === -1
      ? commands
      : commands.slice(0, parallelReviewStart);
  const reviewSuffix =
    parallelReviewStart === -1 ? [] : commands.slice(parallelReviewStart);
  const blockingExitCode = await runSequentialBlockingCommands({
    commands: blockingPrefix,
    cwd,
    runner,
    write,
  });

  if (blockingExitCode !== 0) {
    return blockingExitCode;
  }

  return runParallelReviewCommands({
    commands: reviewSuffix,
    cwd,
    runner,
    write,
  });
}

async function runSequentialBlockingCommands({
  commands,
  cwd,
  runner,
  write,
}: Required<QualityWorkflowOptions>): Promise<number> {
  for (const command of commands) {
    const result = await runner(command, cwd);

    if (shouldPrintResult(result)) {
      write(
        formatCommandResult(result),
        result.exitCode === 0 ? "warn" : "error",
      );
    }

    if (resultIsBlockingFailure(result)) {
      return 1;
    }
  }

  return 0;
}

async function runParallelReviewCommands({
  commands,
  cwd,
  runner,
  write,
}: Required<QualityWorkflowOptions>): Promise<number> {
  const reviewResults = await Promise.all(
    commands.map(async (command) => runner(command, cwd)),
  );

  for (const result of reviewResults) {
    if (shouldPrintResult(result)) {
      write(
        formatCommandResult(result),
        result.exitCode === 0 ? "warn" : "error",
      );
    }
  }

  return reviewResults.some(resultIsBlockingFailure) ? 1 : 0;
}

function commandEnvironment(): NodeJS.ProcessEnv {
  // Coverage note: this environment adapter is only used by the real
  // subprocess runner; workflow tests inject their runner to avoid nested Bun
  // process execution.
  const env = { ...process.env };
  env["NO_COLOR"] = "1";
  delete env["FORCE_COLOR"];
  return env;
}

function commandLine(command: QualityCommand): string {
  return ["bun", ...command.args].join(" ");
}

function defaultWrite(message: string, level: QualityOutputLevel): void {
  if (level === "error") {
    console.error(message);
    return;
  }

  console.warn(message);
}

async function runCommand(
  command: QualityCommand,
  cwd: string,
): Promise<CommandResult> {
  // Coverage note: this is the process boundary for the quality dispatcher.
  // Behavior above it is tested through dependency injection; exercising this
  // directly would rerun the repository quality suite inside unit tests.
  return new Promise<CommandResult>((resolve) => {
    const child = spawn("bun", command.args, {
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

/**
 * Selects the quality command list for local or release mode.
 *
 * @param args Command-line arguments without the executable prefix.
 * @returns Quality commands for the requested mode.
 */
export function selectQualityCommands(args: string[]): QualityCommand[] {
  return args.includes("--release") ? releaseCommands : localCommands;
}

function parallelReviewStartIndex(commands: QualityCommand[]): number {
  const firstReviewIndex = commands.findIndex((command) => !command.blocking);

  if (firstReviewIndex === -1) {
    return -1;
  }

  return commands.slice(firstReviewIndex).some((command) => command.blocking)
    ? -1
    : firstReviewIndex;
}

function usage(): string {
  return `Usage: bun run quality [--release]

Run quality checks quietly. Passing commands stay silent. Commands that fail or
emit warnings print their captured output. The workflow stops at the first
blocking failure because later checks often depend on earlier generated output.
After all blocking checks pass, trailing review-only commands run in parallel.

Default mode runs the local PR-quality path: check, build, verify,
validate:html, review:assets, and coverage review.

Use --release to run check:release plus non-blocking asset,
accessibility, all-severity audit, and coverage review checks.`;
}

// Coverage note: this wrapper only wires the exported CLI workflow to process
// exit state; tests exercise workflow behavior through `runQualityWorkflow()`.
if (import.meta.main) {
  try {
    process.exitCode = await runQualityCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
