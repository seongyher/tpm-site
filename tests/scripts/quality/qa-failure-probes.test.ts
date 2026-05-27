import { existsSync } from "node:fs";

import { describe, expect, test } from "bun:test";

import { qaCommandRegistry } from "../../../scripts/quality/qa-command-registry";
import { qaFailureProbes } from "../../../scripts/quality/qa-failure-probes";

function duplicateValues(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return Array.from(duplicates).sort((left, right) =>
    left.localeCompare(right),
  );
}

describe("QA failure probes", () => {
  test("documents every probe with actionable ownership", () => {
    expect(duplicateValues(qaFailureProbes.map((probe) => probe.id))).toEqual(
      [],
    );

    for (const probe of qaFailureProbes) {
      expect(probe.id.trim()).not.toBe("");
      expect(probe.bugClass.trim()).not.toBe("");
      expect(probe.expectedSignal.trim()).not.toBe("");
      expect(probe.leakPrevention.trim()).not.toBe("");
      expect(probe.intendedCommands.length).toBeGreaterThan(0);
      expect(probe.testPaths.length).toBeGreaterThan(0);
    }
  });

  test("points probes at real QA scripts and tests", () => {
    for (const probe of qaFailureProbes) {
      for (const script of probe.intendedCommands) {
        expect(Object.hasOwn(qaCommandRegistry, script)).toBe(true);
      }

      for (const testPath of probe.testPaths) {
        expect(existsSync(testPath)).toBe(true);
      }
    }
  });

  test("keeps static bad fixtures outside production content and output roots", () => {
    const forbiddenPrefixes = ["dist/", "site/content/", "site/assets/"];

    for (const probe of qaFailureProbes) {
      for (const fixturePath of probe.fixturePaths) {
        expect(existsSync(fixturePath)).toBe(true);
        expect(
          forbiddenPrefixes.some((prefix) => fixturePath.startsWith(prefix)),
        ).toBe(false);
      }
    }
  });
});
