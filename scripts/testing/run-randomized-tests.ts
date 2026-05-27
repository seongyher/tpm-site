import { spawn } from "node:child_process";
import { randomInt } from "node:crypto";

const defaultRunCount = 20;
const maxSeedExclusive = 2_147_483_647;

/** Command run for one randomized test attempt. */
export interface RandomizedTestCommand {
  args: string[];
  label: string;
  seed: number;
}

/** Captured result for one randomized test attempt. */
export interface RandomizedTestCommandResult {
  command: RandomizedTestCommand;
  exitCode: number;
  output: string;
}

/** Dependency-injected command runner for randomized test attempts. */
export type RandomizedTestRunner = (
  command: RandomizedTestCommand,
  cwd: string,
) => Promise<RandomizedTestCommandResult>;

/** Options for the randomized test workflow. */
export interface RandomizedTestWorkflowOptions {
  cwd: string;
  runCount: number;
  runner?: RandomizedTestRunner;
  seedGenerator?: () => number;
  write?: (message: string, error: boolean) => void;
}

/**
 * Formats a randomized test failure with the reproduction seed.
 *
 * @param result Captured failed command result.
 * @param attempt One-based attempt number.
 * @param runCount Total requested attempt count.
 * @returns Human-readable failure report.
 */
export function formatRandomizedTestFailure(
  result: RandomizedTestCommandResult,
  attempt: number,
  runCount: number,
): string {
  const output = result.output.trim();

  return [
    `[flake] Randomized test attempt ${attempt}/${runCount} failed with seed ${result.command.seed}.`,
    `$ ${commandLine(result.command)}`,
    output === "" ? undefined : output,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

/**
 * Builds one seeded unit-test command.
 *
 * @param seed Bun test randomization seed.
 * @returns Command matching the `just test-unit` recipe.
 */
export function randomizedUnitTestCommand(seed: number): RandomizedTestCommand {
  return {
    args: [
      "test",
      "tests/config",
      "tests/eslint",
      "tests/src",
      "tests/types",
      "tests/lib",
      "tests/scripts",
      "tests/components",
      "tests/pages",
      "--reporter=dots",
      "--randomize",
      "--concurrent",
      "--seed",
      String(seed),
    ],
    label: `Randomized unit tests seed ${seed}`,
    seed,
  };
}

/**
 * Runs the randomized test command-line workflow.
 *
 * @param args Command-line arguments without the executable prefix.
 * @param cwd Working directory for Bun subprocesses.
 * @returns Process exit code.
 */
export async function runRandomizedTestsCli(
  args = process.argv.slice(2),
  cwd = process.cwd(),
): Promise<number> {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage());
    return 0;
  }

  const parsedRunCount = runCountFromArgs(args);
  if (parsedRunCount === undefined) {
    console.error(`Invalid run count.\n\n${usage()}`);
    return 1;
  }

  return runRandomizedTestWorkflow({
    cwd,
    runCount: parsedRunCount,
  });
}

/**
 * Runs unit tests in multiple randomized orders, stopping on first failure.
 *
 * @param options Randomized test workflow options.
 * @param options.cwd Working directory for commands.
 * @param options.runCount Number of randomized orders to try.
 * @param options.runner Command runner dependency.
 * @param options.seedGenerator Seed generator dependency.
 * @param options.write Output sink for failure reports.
 * @returns Process exit code.
 */
export async function runRandomizedTestWorkflow({
  cwd,
  runCount,
  runner = runCommand,
  seedGenerator = testSeed,
  write = defaultWrite,
}: RandomizedTestWorkflowOptions): Promise<number> {
  for (const attempt of attemptNumbers(runCount)) {
    const command = randomizedUnitTestCommand(seedGenerator());
    const result = await runner(command, cwd);

    if (result.exitCode !== 0) {
      write(formatRandomizedTestFailure(result, attempt, runCount), true);
      return 1;
    }
  }

  return 0;
}

function attemptNumbers(runCount: number): number[] {
  return Array.from({ length: runCount }, (_, index) => index + 1);
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

function commandLine(command: RandomizedTestCommand): string {
  return ["bun", ...command.args].join(" ");
}

function defaultWrite(message: string, error: boolean): void {
  if (error) {
    console.error(message);
    return;
  }

  console.log(message);
}

async function runCommand(
  command: RandomizedTestCommand,
  cwd: string,
): Promise<RandomizedTestCommandResult> {
  // Coverage note: this is the process boundary for repeated test execution.
  // Behavior above it is tested through dependency injection; exercising this
  // directly would recursively run the repository test suite from unit tests.
  return new Promise<RandomizedTestCommandResult>((resolve) => {
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

function runCountFromArgs(args: readonly string[]): number | undefined {
  const runFlagIndex = args.findIndex(
    (arg) => arg === "--runs" || arg === "-n",
  );
  if (runFlagIndex !== -1 && args[runFlagIndex + 1] === undefined) {
    return undefined;
  }

  const runFlagValue = runFlagIndex === -1 ? undefined : args[runFlagIndex + 1];
  const equalsValue = args
    .find((arg) => arg.startsWith("--runs="))
    ?.replace(/^--runs=/u, "");
  const positionalValue = args.find((arg) => /^\d+$/u.test(arg));

  return positiveInteger(
    runFlagValue ?? equalsValue ?? positionalValue ?? String(defaultRunCount),
  );
}

function positiveInteger(value: string): number | undefined {
  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function testSeed(): number {
  return randomInt(1, maxSeedExclusive);
}

function usage(): string {
  return `Usage: just test-flake [runs]
       just test-flake --runs <runs>

Run unit tests in N randomized orders. Passing attempts stay silent. The first
failure prints the attempt number, seed, command, and captured test output.`;
}

// Coverage note: this wrapper only wires the exported CLI workflow to process
// exit state; tests exercise workflow behavior through dependency injection.
if (import.meta.main) {
  try {
    process.exitCode = await runRandomizedTestsCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
