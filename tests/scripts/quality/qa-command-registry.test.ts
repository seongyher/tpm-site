import { readFile } from "node:fs/promises";

import { describe, expect, test } from "bun:test";

import {
  qaCiJobRegistry,
  qaCommandGroups,
  qaCommandRegistry,
  type QaDomainCoverageEntry,
  qaDomainCoverageRegistry,
} from "../../../scripts/quality/qa-command-registry";
import { parseJustRecipes } from "../../helpers/justfile";

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

function jobBlock(workflow: string, jobName: string): string {
  const start = workflow.indexOf(`  ${jobName}:\n`);

  if (start === -1) {
    throw new Error(`Missing CI job ${jobName}.`);
  }

  const rest = workflow.slice(start + 1);
  const nextJob = rest.search(/\n {2}[a-z][\w-]*:\n/u);

  return nextJob === -1 ? rest : rest.slice(0, nextJob);
}

async function readJustfile(): Promise<string> {
  return readFile("justfile", "utf8");
}

async function readWorkflow(path: string): Promise<string> {
  return readFile(path, "utf8");
}

function justRecipes(justfile: string): string[] {
  return parseJustRecipes(justfile).sort(compareStrings);
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
  test("classifies every just recipe exactly once", async () => {
    const recipes = justRecipes(await readJustfile());
    const registeredCommands = qaCommandGroups.flatMap((group) =>
      Array.from(group.commands),
    );

    expect(duplicateValues(registeredCommands)).toEqual([]);
    expect(Object.keys(qaCommandRegistry).sort(compareStrings)).toEqual(
      recipes,
    );
  });

  test("keeps registry entries actionable", () => {
    for (const [command, entry] of Object.entries(qaCommandRegistry)) {
      expect(command.trim()).not.toBe("");
      expect(entry.domain.trim()).not.toBe("");
      expect(entry.scope.trim()).not.toBe("");
      expect(entry.runtime.trim()).not.toBe("");
      expect(entry.class.trim()).not.toBe("");
      expect(entry.ciUsage.trim()).not.toBe("");
      expect(entry.mutation.trim()).not.toBe("");
    }
  });

  test("accounts for every command domain with focused and release evidence or an exception", () => {
    const domainCoverage: readonly QaDomainCoverageEntry[] =
      qaDomainCoverageRegistry;
    const commandDomains = Array.from(
      new Set(qaCommandGroups.map((group) => group.domain)),
    ).sort(compareStrings);
    const coverageDomains = domainCoverage
      .map((entry) => entry.domain)
      .sort(compareStrings);
    const justCommands = new Set(Object.keys(qaCommandRegistry));
    const ciJobs: ReadonlySet<string> = new Set(
      qaCiJobRegistry.map((entry) => entry.job),
    );

    expect(duplicateValues(coverageDomains)).toEqual([]);
    expect(
      commandDomains.every((domain) => coverageDomains.includes(domain)),
    ).toBe(true);

    for (const entry of domainCoverage) {
      expect(entry.purpose.trim()).not.toBe("");

      for (const command of [
        ...entry.focusedCommands,
        ...entry.releaseCommands,
      ]) {
        const recipe = command.replace(/^just\s+/u, "");
        expect(justCommands.has(recipe), `${command} should exist`).toBe(true);
      }

      for (const job of entry.ciJobs) {
        expect(ciJobs.has(job)).toBe(true);
      }

      if (entry.releaseCommands.length === 0 && entry.ciJobs.length === 0) {
        expect(entry.exception?.trim()).toBeTruthy();
      }
    }
  });

  test("maps every CI job to local just commands or a documented CI-only reason", async () => {
    const justCommands = new Set(justRecipes(await readJustfile()));
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
        expect(entry.ciOnlyReason?.trim()).toBeTruthy();
        expect(entry.localCommands).toHaveLength(0);
      } else {
        expect(entry.localCommands.length).toBeGreaterThan(0);
      }

      for (const command of entry.localCommands) {
        const recipe = command.replace(/^just\s+/u, "");
        expect(justCommands.has(recipe), `${command} should exist`).toBe(true);
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
