import { describe, expect, spyOn, test } from "bun:test";

import {
  type CatalogTestCommand,
  catalogTestCommands,
  parseCatalogTestOptions,
  runCatalogTestsCli,
} from "../../../scripts/testing/run-catalog-tests";

describe("catalog test runner", () => {
  test.serial("prints command usage without running catalog tests", () => {
    const log = spyOn(console, "log").mockImplementation(() => undefined);

    try {
      const exitCode = runCatalogTestsCli(["--help"], process.cwd());

      expect(exitCode).toBe(0);
      expect(String(log.mock.calls[0]?.[0])).toContain(
        "Usage: just test-catalog",
      );
    } finally {
      log.mockRestore();
    }
  });

  test("builds catalog commands with an isolated output directory", () => {
    const commands = catalogTestCommands(
      parseCatalogTestOptions(["--dir", "dist-custom-catalog", "--list"]),
      process.cwd(),
    );

    expect(commands.map((command) => command.label)).toEqual([
      "Catalog build",
      "Catalog browser invariants",
    ]);
    for (const command of commands) {
      expect(command.env["PLATFORM_COMPONENT_CATALOG"]).toBe("true");
      expect(command.env["SITE_OUTPUT_DIR"]).toBe("dist-custom-catalog");
    }
    expect(commands[0]).toMatchObject({
      args: ["catalog-build"],
      command: "just",
    });
    expect(commands[1]).toMatchObject({
      args: [
        "playwright",
        "test",
        "tests/e2e/catalog-invariants.pw.ts",
        "--list",
      ],
      command: "bunx",
    });
  });

  test("stops before browser checks when the catalog build fails", () => {
    const calls: CatalogTestCommand[] = [];
    const exitCode = runCatalogTestsCli(
      ["--dir", "dist-catalog-test"],
      process.cwd(),
      (command) => {
        calls.push(command);

        return command.label === "Catalog build" ? 1 : 0;
      },
    );

    expect(exitCode).toBe(1);
    expect(calls.map((command) => command.label)).toEqual(["Catalog build"]);
  });
});
