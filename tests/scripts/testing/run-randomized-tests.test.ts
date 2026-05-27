import { describe, expect, spyOn, test } from "bun:test";

import {
  formatRandomizedTestFailure,
  type RandomizedTestCommand,
  type RandomizedTestCommandResult,
  randomizedUnitTestCommand,
  runRandomizedTestsCli,
  runRandomizedTestWorkflow,
} from "../../../scripts/testing/run-randomized-tests";

describe("randomized test runner", () => {
  test.serial("prints command usage without running tests", async () => {
    const log = spyOn(console, "log").mockImplementation(() => undefined);

    try {
      const exitCode = await runRandomizedTestsCli(["--help"], process.cwd());

      expect(exitCode).toBe(0);
      expect(String(log.mock.calls[0]?.[0])).toContain(
        "Usage: just test-flake",
      );
    } finally {
      log.mockRestore();
    }
  });

  test.serial("rejects invalid run counts", async () => {
    const error = spyOn(console, "error").mockImplementation(() => undefined);

    try {
      const exitCode = await runRandomizedTestsCli(
        ["--runs", "0"],
        process.cwd(),
      );

      expect(exitCode).toBe(1);
      expect(String(error.mock.calls[0]?.[0])).toContain("Invalid run count");
    } finally {
      error.mockRestore();
    }
  });

  test.serial("rejects missing flag values", async () => {
    const error = spyOn(console, "error").mockImplementation(() => undefined);

    try {
      const exitCode = await runRandomizedTestsCli(["--runs"], process.cwd());

      expect(exitCode).toBe(1);
      expect(String(error.mock.calls[0]?.[0])).toContain("Invalid run count");
    } finally {
      error.mockRestore();
    }
  });

  test("builds seeded unit-test commands from the canonical just recipe behavior", () => {
    const command = randomizedUnitTestCommand(1234);

    expect(command.args).toContain("tests/config");
    expect(command.args).toContain("--randomize");
    expect(command.args).toContain("--concurrent");
    expect(command.args.slice(-2)).toEqual(["--seed", "1234"]);
    expect(command.label).toBe("Randomized unit tests seed 1234");
    expect(command.seed).toBe(1234);
  });

  test("stays silent when every randomized attempt passes", async () => {
    const calls: RandomizedTestCommand[] = [];
    const reports: string[] = [];
    const exitCode = await runRandomizedTestWorkflow({
      cwd: process.cwd(),
      runCount: 3,
      runner: async (command) => {
        calls.push(command);
        await Promise.resolve();

        return passingResult(command);
      },
      seedGenerator: seededSequence(10),
      write: (message) => {
        reports.push(message);
      },
    });

    expect(exitCode).toBe(0);
    expect(calls.map((command) => command.seed)).toEqual([10, 11, 12]);
    expect(reports).toEqual([]);
  });

  test("prints failure details and stops at the first failing seed", async () => {
    const calls: RandomizedTestCommand[] = [];
    const reports: string[] = [];
    const exitCode = await runRandomizedTestWorkflow({
      cwd: process.cwd(),
      runCount: 5,
      runner: async (command) => {
        calls.push(command);
        await Promise.resolve();

        return command.seed === 42
          ? failingResult(command, "Expected current section to change")
          : passingResult(command);
      },
      seedGenerator: seededSequence(41),
      write: (message) => {
        reports.push(message);
      },
    });

    expect(exitCode).toBe(1);
    expect(calls.map((command) => command.seed)).toEqual([41, 42]);
    expect(reports.join("\n")).toContain("attempt 2/5 failed with seed 42");
    expect(reports.join("\n")).toContain("Expected current section to change");
  });

  test("formats failures with command lines and captured output", () => {
    const report = formatRandomizedTestFailure(
      failingResult(randomizedUnitTestCommand(99), "document is not defined"),
      1,
      10,
    );

    expect(report).toContain("$ bun test tests/config");
    expect(report).toContain("--seed 99");
  });
});

function failingResult(
  command: RandomizedTestCommand,
  output: string,
): RandomizedTestCommandResult {
  return {
    command,
    exitCode: 1,
    output,
  };
}

function passingResult(
  command: RandomizedTestCommand,
): RandomizedTestCommandResult {
  return {
    command,
    exitCode: 0,
    output: "",
  };
}

function seededSequence(start: number): () => number {
  let nextSeed = start;

  return () => {
    const seed = nextSeed;
    nextSeed += 1;
    return seed;
  };
}
