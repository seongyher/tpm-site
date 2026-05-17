import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import {
  collectLegacyRedirectRules,
  formatCloudflareRedirects,
  generateCloudflareRedirects,
  type LegacyRedirectSource,
} from "../../../scripts/build/generate-cloudflare-redirects";

async function testRoot(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), "tpm-cloudflare-redirects-"));
}

async function writeText(root: string, relativePath: string, text: string) {
  const file = path.join(root, relativePath);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text);
  return file;
}

function sources(root: string): LegacyRedirectSource[] {
  return [
    {
      dir: path.join(root, "site/content/announcements"),
      routePrefix: "/announcements/",
    },
    {
      dir: path.join(root, "site/content/articles"),
      routePrefix: "/articles/",
    },
  ];
}

describe("Cloudflare redirect generation", () => {
  test("generates stable 301 redirects from legacy permalink frontmatter", async () => {
    const root = await testRoot();
    await writeText(
      root,
      "site/content/articles/culture/what-is-a-meme.md",
      "---\ntitle: What Is A Meme?\nlegacyPermalink: 2021/11/30/what-is-a-meme\n---\n",
    );
    await writeText(
      root,
      "site/content/announcements/discord-community.mdx",
      "---\ntitle: Discord\nlegacyPermalink: /announcements//discord\n---\n",
    );
    await writeText(
      root,
      "site/content/articles/culture/no-legacy.md",
      "---\ntitle: No Legacy\n---\n",
    );

    const outputDir = path.join(root, "dist");
    const result = await generateCloudflareRedirects({
      outputDir,
      quiet: true,
      siteRedirects: {},
      sources: sources(root),
    });

    expect(result.count).toBe(2);
    expect(await readFile(path.join(outputDir, "_redirects"), "utf8")).toBe(
      [
        "# Generated from site redirects and article legacyPermalink metadata. Do not edit by hand.",
        "/2021/11/30/what-is-a-meme/ /articles/what-is-a-meme/ 301",
        "/announcements/discord/ /announcements/discord-community/ 301",
        "",
      ].join("\n"),
    );
  });

  test("formats collected rules without reading build output", () => {
    expect(
      formatCloudflareRedirects([
        { destination: "/articles/example/", source: "/2020/example/" },
      ]),
    ).toBe(
      [
        "# Generated from site redirects and article legacyPermalink metadata. Do not edit by hand.",
        "/2020/example/ /articles/example/ 301",
        "",
      ].join("\n"),
    );
  });

  test("merges hand-written site redirects into generated output", async () => {
    const root = await testRoot();
    await writeText(
      root,
      "site/content/articles/culture/what-is-a-meme.md",
      "---\ntitle: What Is A Meme?\nlegacyPermalink: 2021/11/30/what-is-a-meme\n---\n",
    );
    await mkdir(path.join(root, "site/content/announcements"), {
      recursive: true,
    });

    const outputDir = path.join(root, "dist");
    const result = await generateCloudflareRedirects({
      outputDir,
      quiet: true,
      siteRedirects: {
        "/memeculture/": "/categories/memeculture/",
      },
      sources: sources(root),
    });

    expect(result.count).toBe(2);
    expect(await readFile(path.join(outputDir, "_redirects"), "utf8")).toBe(
      [
        "# Generated from site redirects and article legacyPermalink metadata. Do not edit by hand.",
        "/2021/11/30/what-is-a-meme/ /articles/what-is-a-meme/ 301",
        "/memeculture/ /categories/memeculture/ 301",
        "",
      ].join("\n"),
    );
  });

  test("deduplicates matching hand-written and generated redirects", async () => {
    const root = await testRoot();
    await writeText(
      root,
      "site/content/articles/culture/what-is-a-meme.md",
      "---\ntitle: What Is A Meme?\nlegacyPermalink: 2021/11/30/what-is-a-meme\n---\n",
    );
    await mkdir(path.join(root, "site/content/announcements"), {
      recursive: true,
    });

    const outputDir = path.join(root, "dist");
    const result = await generateCloudflareRedirects({
      outputDir,
      quiet: true,
      siteRedirects: {
        "/2021/11/30/what-is-a-meme/": "/articles/what-is-a-meme/",
      },
      sources: sources(root),
    });

    expect(result.count).toBe(1);
    expect(await readFile(path.join(outputDir, "_redirects"), "utf8")).toBe(
      [
        "# Generated from site redirects and article legacyPermalink metadata. Do not edit by hand.",
        "/2021/11/30/what-is-a-meme/ /articles/what-is-a-meme/ 301",
        "",
      ].join("\n"),
    );
  });

  test("rejects conflicting hand-written and generated redirects", async () => {
    const root = await testRoot();
    await writeText(
      root,
      "site/content/articles/culture/what-is-a-meme.md",
      "---\ntitle: What Is A Meme?\nlegacyPermalink: 2021/11/30/what-is-a-meme\n---\n",
    );
    await mkdir(path.join(root, "site/content/announcements"), {
      recursive: true,
    });

    let message = "";

    try {
      await generateCloudflareRedirects({
        outputDir: path.join(root, "dist"),
        quiet: true,
        siteRedirects: {
          "/2021/11/30/what-is-a-meme/": "/articles/other/",
        },
        sources: sources(root),
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toContain(
      "Conflicting redirect destinations for /2021/11/30/what-is-a-meme/",
    );
  });

  test("rejects duplicate legacy permalink sources", async () => {
    const root = await testRoot();
    await writeText(
      root,
      "site/content/articles/culture/one.md",
      "---\ntitle: One\nlegacyPermalink: /old-path/\n---\n",
    );
    await writeText(
      root,
      "site/content/articles/culture/two.md",
      "---\ntitle: Two\nlegacyPermalink: old-path\n---\n",
    );
    await mkdir(path.join(root, "site/content/announcements"), {
      recursive: true,
    });

    let message = "";

    try {
      await collectLegacyRedirectRules(sources(root));
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toContain("duplicate legacyPermalink /old-path/");
  });

  test("rejects non-string legacy permalinks", async () => {
    const root = await testRoot();
    await writeText(
      root,
      "site/content/articles/culture/bad.md",
      "---\ntitle: Bad\nlegacyPermalink:\n  - /old/\n---\n",
    );
    await mkdir(path.join(root, "site/content/announcements"), {
      recursive: true,
    });

    let message = "";

    try {
      await collectLegacyRedirectRules(sources(root));
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toContain("legacyPermalink must be a string");
  });
});
