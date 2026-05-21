import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "bun:test";

const minimalFixtureRoot = path.join("tests", "fixtures", "site-instance");

const requiredContentCollections = [
  "announcements",
  "articles",
  "authors",
  "categories",
  "collections",
  "pages",
] as const;

describe("fixture-site matrix", () => {
  test("keeps the minimal external site fixture representative", () => {
    expect(
      existsSync(path.join(minimalFixtureRoot, "config", "site.json")),
    ).toBe(true);
    expect(
      existsSync(path.join(minimalFixtureRoot, "config", "redirects.json")),
    ).toBe(true);
    expect(existsSync(path.join(minimalFixtureRoot, "theme.css"))).toBe(true);
    expect(
      existsSync(path.join(minimalFixtureRoot, "public", "favicon.svg")),
    ).toBe(true);
    expect(
      existsSync(path.join(minimalFixtureRoot, "public", "robots.txt")),
    ).toBe(true);
    expect(
      filesUnder(path.join(minimalFixtureRoot, "assets")).length,
    ).toBeGreaterThan(0);

    for (const collection of requiredContentCollections) {
      expect(
        filesUnder(path.join(minimalFixtureRoot, "content", collection)).length,
        `${collection} should have at least one fixture file`,
      ).toBeGreaterThan(0);
    }
  });
});

function filesUnder(rootDir: string): string[] {
  if (!existsSync(rootDir)) {
    return [];
  }

  return readdirSync(rootDir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      return filesUnder(entryPath);
    }

    return entry.isFile() ? [entryPath] : [];
  });
}
