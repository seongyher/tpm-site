import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import {
  auditBibtexCitations,
  formatBibtexCitationAudit,
  runBibtexCitationAuditCli,
} from "../../../scripts/content/audit-bibtex-citations";

async function withTempRoot<T>(callback: (root: string) => Promise<T>) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-bibtex-audit-test-"));

  try {
    return await callback(root);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

async function writeText(root: string, relativePath: string, text: string) {
  const fullPath = path.join(root, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, text);
}

describe("BibTeX citation audit", () => {
  test("accounts for every marker and hidden BibTeX entry", async () =>
    withTempRoot(async (root) => {
      await writeText(
        root,
        "site/content/articles/culture/example.md",
        [
          "---",
          "title: Example",
          "---",
          "",
          "Claim.[^cite-source] Repeat.[^cite-source] Missing.[^cite-missing]",
          "",
          "```tpm-bibtex",
          "@misc{source,",
          "  citation = {Example Author. Example source. Available at: https://example.com/source},",
          "}",
          "",
          "@book{unused,",
          "  author = {Unused Author},",
          "  title = {Unused Book},",
          "  publisher = {Press},",
          "  year = {2026}",
          "}",
          "```",
          "",
        ].join("\n"),
      );

      const audit = await auditBibtexCitations({
        articleDir: path.join(root, "site/content/articles"),
        generatedDate: "May 17, 2026",
        rootDir: root,
      });

      expect(audit.totals.articlesScanned).toBe(1);
      expect(audit.totals.markerOccurrences).toBe(3);
      expect(audit.totals.inventoryEntries).toBe(2);
      expect(audit.totals.missingEntries).toBe(1);
      expect(audit.totals.unusedEntries).toBe(1);
      expect(audit.inventory[0]?.markerCount).toBe(2);
      expect(audit.inventory[0]?.flags).toContain(
        "citation-field-transitional",
      );
      expect(audit.inventory[0]?.flags).toContain("citation-only-entry");
      expect(audit.missingEntries[0]).toMatchObject({
        key: "missing",
        markerCount: 1,
      });
    }));

  test("detects duplicate candidates across articles", async () =>
    withTempRoot(async (root) => {
      await writeText(
        root,
        "site/content/articles/culture/one.md",
        [
          "---",
          "title: One",
          "---",
          "",
          "One.[^cite-first]",
          "",
          "```tpm-bibtex",
          "@online{first, title = {Shared Source}, url = {https://example.com/shared?utm_source=test}}",
          "```",
          "",
        ].join("\n"),
      );
      await writeText(
        root,
        "site/content/articles/culture/two.md",
        [
          "---",
          "title: Two",
          "---",
          "",
          "Two.[^cite-second]",
          "",
          "```tpm-bibtex",
          "@online{second, title = {Shared Source}, url = {https://example.com/shared}}",
          "```",
          "",
        ].join("\n"),
      );

      const audit = await auditBibtexCitations({
        articleDir: path.join(root, "site/content/articles"),
        generatedDate: "May 17, 2026",
        rootDir: root,
      });

      expect(
        audit.duplicateClusters.some((cluster) => cluster.kind === "url"),
      ).toBeTrue();
      expect(
        audit.inventory.every((entry) =>
          entry.flags.includes("duplicate-candidate"),
        ),
      ).toBeTrue();
      expect(formatBibtexCitationAudit(audit)).toContain(
        "Duplicate Review Clusters",
      );
    }));

  test("writes the Markdown report through the CLI", async () =>
    withTempRoot(async (root) => {
      await writeText(
        root,
        "site/content/articles/culture/example.md",
        [
          "---",
          "title: Example",
          "---",
          "",
          "Claim.[^cite-source]",
          "",
          "```tpm-bibtex",
          "@article{source, author = {Author}, title = {Title}, journal = {Journal}, year = {2026}}",
          "```",
          "",
        ].join("\n"),
      );

      const exitCode = await runBibtexCitationAuditCli(
        ["--write", "--quiet"],
        root,
      );
      const report = await readFile(
        path.join(root, "docs/CITATION_BIBTEX_AUDIT.md"),
        "utf8",
      );

      expect(exitCode).toBe(0);
      expect(report).toContain("# Citation BibTeX Audit");
      expect(report).toContain("Parsed BibTeX entries in full inventory: 1");
      expect(report).toContain(
        "| `site/content/articles/culture/example.md` | 1 | 1 | 1 |",
      );
    }));
});
