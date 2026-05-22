import { existsSync, readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

import {
  assessSupplyChainPolicy,
  redactSecretLikeValues,
} from "../../../../src/lib/release/supply-chain-policy";

const packageScripts = packageScriptsFromPackageJson(
  JSON.parse(readFileSync("package.json", "utf8")) as unknown,
);
const gitignoreText = readFileSync(".gitignore", "utf8");
// Assemble provider-shaped fake tokens at runtime so these tests exercise the
// default policy without committing contiguous token-like literals.
const fakeGithubToken = ["gh", "p_", "1".repeat(10), "a".repeat(20)].join("");
const fakeAwsAccessKey = ["AK", "IA", "1".repeat(16)].join("");
const fakeOpenAiKey = ["sk", "-", "1".repeat(24)].join("");

describe("supply-chain policy", () => {
  test("accepts current release security command ownership", () => {
    const assessment = assessSupplyChainPolicy({
      gitignoreText,
      lockfilePresent: existsSync("bun.lock"),
      packageScripts,
    });

    expect(assessment.diagnostics).toEqual([]);
    expect(
      assessment.checks.map(({ command, id, workflowStages }) => ({
        command,
        id,
        workflowStages,
      })),
    ).toContainEqual({
      command: "bun --silent run audit",
      id: "dependency-audit-high",
      workflowStages: ["pr", "release", "package-release", "starter-template"],
    });
  });

  test("reports missing release gates, lockfile, and ignored secret env files", () => {
    const assessment = assessSupplyChainPolicy({
      gitignoreText: "node_modules/\n",
      lockfilePresent: false,
      packageScripts: { "check:release": "bun --silent run check" },
    });

    expect(assessment.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(
      [
        "security.release-security-command-missing",
        "security.release-security-command-missing",
        "security.secret-env-ignore-missing",
        "security.secret-env-ignore-missing",
        "security.lockfile-missing",
      ],
    );
  });

  test("rejects secret-like public env names and generated output values", () => {
    const assessment = assessSupplyChainPolicy({
      generatedOutputSamples: [
        {
          outputPath: "dist/index.html",
          text: `window.token = '${fakeGithubToken}';`,
        },
      ],
      gitignoreText,
      lockfilePresent: true,
      packageScripts,
      publicEnvNames: ["PUBLIC_ANALYTICS_TOKEN"],
    });

    expect(
      assessment.diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "security.public-env-secret-name" &&
          diagnostic.message ===
            "PUBLIC_ANALYTICS_TOKEN looks like a secret but would be public in client output.",
      ),
    ).toBe(true);
    expect(
      assessment.diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "security.generated-output-secret" &&
          (diagnostic.evidence ?? []).includes(
            "window.token = '[REDACTED_SECRET]';",
          ) &&
          diagnostic.location?.outputPath === "dist/index.html",
      ),
    ).toBe(true);
  });

  test("redacts known secret-like token shapes", () => {
    expect(
      redactSecretLikeValues(
        `github=${fakeGithubToken} aws=${fakeAwsAccessKey} openai=${fakeOpenAiKey}`,
      ),
    ).toBe(
      "github=[REDACTED_SECRET] aws=[REDACTED_SECRET] openai=[REDACTED_SECRET]",
    );
  });
});

function packageScriptsFromPackageJson(value: unknown): Record<string, string> {
  if (
    typeof value === "object" &&
    value !== null &&
    "scripts" in value &&
    isStringRecord(value.scripts)
  ) {
    return value.scripts;
  }

  throw new Error("package.json must contain a string-valued scripts object.");
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((entry) => typeof entry === "string")
  );
}
