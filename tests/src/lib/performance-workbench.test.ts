import { existsSync, readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

import {
  performanceWorkbenchScriptNames,
  performanceWorkbenchTracks,
} from "../../../src/lib/performance-workbench";
import { parseJustRecipes } from "../../helpers/justfile";

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

  test("references existing docs and just commands", () => {
    const commands = new Set(justRecipes(readFileSync("justfile", "utf8")));

    for (const track of performanceWorkbenchTracks) {
      for (const docPath of track.docs) {
        expect(existsSync(docPath), `${docPath} should exist`).toBe(true);
      }

      for (const command of track.commands) {
        expect(commands.has(command), `${command} should exist`).toBe(true);
      }
    }
  });

  test("keeps workbench script ownership explicit", () => {
    expect(performanceWorkbenchScriptNames()).toEqual([
      "build-optimize",
      "payload-check",
      "payload-report",
      "validate-html",
      "verify",
    ]);
  });
});

function justRecipes(justfile: string): string[] {
  return parseJustRecipes(justfile);
}
