import { existsSync, readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

import {
  performanceWorkbenchScriptNames,
  performanceWorkbenchTracks,
} from "../../../../src/lib/release/performance-workbench";

interface PackageJson {
  scripts: Record<string, string>;
}

describe("performance workbench policy", () => {
  test("keeps track identifiers unique and promotion rules actionable", () => {
    const ids = performanceWorkbenchTracks.map((track) => track.id);

    expect(new Set(ids).size).toBe(ids.length);

    for (const track of performanceWorkbenchTracks) {
      expect(track.decisionRule.length).toBeGreaterThan(64);
      expect(track.promotionGate.length).toBeGreaterThan(48);
      expect(track.rollbackRule.length).toBeGreaterThan(48);
      expect(track.docs.length).toBeGreaterThan(0);
    }
  });

  test("references existing docs and package scripts", () => {
    const packageJson = readPackageJson();
    const scripts = new Set(Object.keys(packageJson.scripts));

    for (const track of performanceWorkbenchTracks) {
      for (const docPath of track.docs) {
        expect(existsSync(docPath), `${docPath} should exist`).toBe(true);
      }

      for (const script of track.scripts) {
        expect(scripts.has(script), `${script} should exist`).toBe(true);
      }
    }
  });

  test("keeps workbench script ownership explicit", () => {
    expect(performanceWorkbenchScriptNames()).toEqual([
      "payload:check",
      "payload:critical-css:experiment",
      "payload:minify-html:experiment",
      "payload:minify-html:experiments",
      "payload:postbuild:experiments",
      "payload:report",
      "payload:vite:experiments",
    ]);
  });
});

function readPackageJson(): PackageJson {
  const parsed: unknown = JSON.parse(readFileSync("package.json", "utf8"));

  if (!isPackageJson(parsed)) {
    throw new TypeError("package.json has an unexpected shape.");
  }

  return parsed;
}

function isPackageJson(value: unknown): value is PackageJson {
  return (
    typeof value === "object" &&
    value !== null &&
    "scripts" in value &&
    typeof value.scripts === "object" &&
    value.scripts !== null &&
    Object.values(value.scripts).every((script) => typeof script === "string")
  );
}
