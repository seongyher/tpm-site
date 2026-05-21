import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";
import {
  format as formatWithPrettier,
  resolveConfig as resolvePrettierConfig,
} from "prettier";

import {
  generatedPlatformReferenceMarkdown,
  runGeneratePlatformReferencesCli,
} from "../../../scripts/docs/generate-platform-references";

function captureIo() {
  let stderr = "";
  let stdout = "";

  return {
    io: {
      stderr: {
        write: (chunk: string) => {
          stderr += chunk;
          return true;
        },
      },
      stdout: {
        write: (chunk: string) => {
          stdout += chunk;
          return true;
        },
      },
    },
    result: () => ({ stderr, stdout }),
  };
}

describe("platform reference generation", () => {
  test("documents the generated platform contract sections", () => {
    const markdown = generatedPlatformReferenceMarkdown();

    expect(markdown).toContain("# Generated Platform Reference");
    expect(markdown).toContain("## Site Config Fields");
    expect(markdown).toContain("| identity.title | string | yes |");
    expect(markdown).toContain("## Content Frontmatter Fields");
    expect(markdown).toContain("### Article frontmatter");
    expect(markdown).toContain("## Routes, Entities, Features, And Output");
    expect(markdown).toContain("## QA Commands And Domains");
  });

  test("writes formatted deterministic output and fails when generated docs are stale", async () => {
    const directory = mkdtempSync(path.join(tmpdir(), "tpm-platform-ref-"));
    const outputPath = path.join(directory, "platform-reference.md");
    const writeIo = captureIo();

    expect(
      await runGeneratePlatformReferencesCli(
        ["--quiet", "--output", outputPath],
        writeIo.io,
      ),
    ).toBe(0);

    const generatedText = readFileSync(outputPath, "utf8");
    expect(generatedText).toBe(await formatMarkdownWithRepoConfig(outputPath));

    const checkIo = captureIo();
    expect(
      await runGeneratePlatformReferencesCli(
        ["--check", "--quiet", "--output", outputPath],
        checkIo.io,
      ),
    ).toBe(0);

    writeFileSync(outputPath, "stale\n");

    const staleIo = captureIo();
    expect(
      await runGeneratePlatformReferencesCli(
        ["--check", "--quiet", "--output", outputPath],
        staleIo.io,
      ),
    ).toBe(1);
    expect(staleIo.result().stderr).toContain(
      "Generated platform reference is stale",
    );
  });

  test("check accepts Prettier-canonical generated Markdown", async () => {
    const directory = mkdtempSync(path.join(tmpdir(), "tpm-platform-ref-"));
    const outputPath = path.join(directory, "platform-reference.md");
    writeFileSync(outputPath, await formatMarkdownWithRepoConfig(outputPath));

    const checkIo = captureIo();

    expect(
      await runGeneratePlatformReferencesCli(
        ["--check", "--quiet", "--output", outputPath],
        checkIo.io,
      ),
    ).toBe(0);
  });
});

async function formatMarkdownWithRepoConfig(outputPath: string) {
  const options = await resolvePrettierConfig(
    path.join(process.cwd(), "docs/generated/platform-reference.md"),
  );

  return formatWithPrettier(generatedPlatformReferenceMarkdown(), {
    ...options,
    filepath: outputPath,
  });
}
