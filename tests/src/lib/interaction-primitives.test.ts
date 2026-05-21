import { readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import {
  interactionPolicyScriptPaths,
  interactionSurfacePolicies,
} from "../../../src/lib/interaction-primitives";

describe("interaction primitive policy", () => {
  test("covers every browser script with a loading and accessibility policy", () => {
    const scriptPaths = readdirSync("src/scripts")
      .filter((fileName) => fileName.endsWith(".ts"))
      .map((fileName) => toPosix(path.join("src", "scripts", fileName)))
      .sort((left, right) => left.localeCompare(right));

    expect(interactionPolicyScriptPaths()).toEqual(scriptPaths);
  });

  test("keeps progressive interactions explicit about accessibility fallbacks", () => {
    for (const policy of interactionSurfacePolicies) {
      expect(policy.scriptPath).toStartWith("src/scripts/");
      expect(policy.accessibility.noJsFallback.trim().length).toBeGreaterThan(
        24,
      );

      if (policy.loadPolicy !== "immediate-document-state") {
        expect(policy.accessibility.keyboard).toBe(true);
        expect(policy.accessibility.touch).toBe(true);
      }
    }
  });
});

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}
