import { readFile } from "node:fs/promises";

import { describe, expect, test } from "bun:test";

import {
  qaCiJobRegistry,
  qaCommandGroups,
  qaCommandRegistry,
} from "../../../scripts/quality/qa-command-registry";

interface PackageJson {
  scripts: Record<string, string>;
}

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function duplicateValues(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return Array.from(duplicates).sort(compareStrings);
}

function isPackageJson(value: unknown): value is PackageJson {
  return (
    typeof value === "object" &&
    value !== null &&
    "scripts" in value &&
    typeof value.scripts === "object" &&
    value.scripts !== null
  );
}

function jobBlock(workflow: string, jobName: string): string {
  const start = workflow.indexOf(`  ${jobName}:\n`);

  if (start === -1) {
    throw new Error(`Missing CI job ${jobName}.`);
  }

  const rest = workflow.slice(start + 1);
  const nextJob = rest.search(/\n {2}[a-z][\w-]*:\n/u);

  return nextJob === -1 ? rest : rest.slice(0, nextJob);
}

async function readPackageJson(): Promise<PackageJson> {
  const parsed: unknown = JSON.parse(await readFile("package.json", "utf8"));

  if (!isPackageJson(parsed)) {
    throw new TypeError("package.json does not contain a scripts object.");
  }

  return parsed;
}

async function readWorkflow(path: string): Promise<string> {
  return readFile(path, "utf8");
}

function workflowJobs(workflow: string): string[] {
  const jobsStart = workflow.indexOf("\njobs:\n");

  if (jobsStart === -1) {
    throw new Error("Workflow does not define a jobs block.");
  }

  return Array.from(
    workflow.slice(jobsStart).matchAll(/\n {2}([a-z][\w-]*):\n/gu),
    (match) => match[1],
  )
    .filter((jobName) => jobName !== undefined)
    .sort(compareStrings);
}

describe("QA command registry", () => {
  test("classifies every package script exactly once", async () => {
    const packageJson = await readPackageJson();
    const packageScripts = Object.keys(packageJson.scripts).sort(
      compareStrings,
    );
    const registeredScripts = qaCommandGroups.flatMap((group) =>
      Array.from(group.scripts),
    );

    expect(duplicateValues(registeredScripts)).toEqual([]);
    expect(Object.keys(qaCommandRegistry).sort(compareStrings)).toEqual(
      packageScripts,
    );
  });

  test("keeps registry entries actionable", () => {
    for (const [script, entry] of Object.entries(qaCommandRegistry)) {
      expect(script.trim()).not.toBe("");
      expect(entry.domain.trim()).not.toBe("");
      expect(entry.scope.trim()).not.toBe("");
      expect(entry.runtime.trim()).not.toBe("");
      expect(entry.class.trim()).not.toBe("");
      expect(entry.ciUsage.trim()).not.toBe("");
      expect(entry.mutation.trim()).not.toBe("");
    }
  });

  test("maps every CI job to local scripts or a documented CI-only reason", async () => {
    const packageJson = await readPackageJson();
    const packageScripts = new Set(Object.keys(packageJson.scripts));
    const workflows = new Map<string, string>();

    for (const entry of qaCiJobRegistry) {
      const workflow =
        workflows.get(entry.workflow) ?? (await readWorkflow(entry.workflow));
      workflows.set(entry.workflow, workflow);
      const block = jobBlock(workflow, entry.job);

      for (const snippet of entry.ciCommandSnippets) {
        expect(block).toContain(snippet);
      }

      if (!entry.blocking) {
        expect(block).toContain("continue-on-error: true");
      }

      if (entry.parity === "ci-only") {
        expect(entry.ciOnlyReason.trim()).not.toBe("");
        expect(entry.localScripts).toHaveLength(0);
      } else {
        expect(entry.localScripts.length).toBeGreaterThan(0);
      }

      for (const script of entry.localScripts) {
        expect(packageScripts.has(script)).toBe(true);
      }
    }
  });

  test("covers all configured CI jobs in the parity registry", async () => {
    const workflowPaths = [
      ".github/workflows/ci.yml",
      ".github/workflows/security.yml",
    ];

    for (const workflowPath of workflowPaths) {
      const workflow = await readWorkflow(workflowPath);
      const configuredJobs = workflowJobs(workflow);
      const registryJobs: string[] = qaCiJobRegistry
        .filter((entry) => entry.workflow === workflowPath)
        .map((entry) => entry.job)
        .sort(compareStrings);

      expect(registryJobs).toEqual(configuredJobs);
    }
  });
});
