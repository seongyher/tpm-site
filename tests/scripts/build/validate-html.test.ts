import path from "node:path";

import { describe, expect, test } from "bun:test";

import {
  htmlValidationTargetsForSiteConfig,
  runValidateHtmlCli,
} from "../../../scripts/build/validate-html";
import { parseSiteConfig } from "../../../src/lib/site-config";

const config = parseSiteConfig({
  features: {
    announcements: false,
    authors: false,
    tags: false,
  },
  identity: {
    description: "A configurable publication.",
    language: "en",
    title: "Example Blog",
    url: "https://example.com",
  },
  navigation: {
    footer: [],
    primary: [],
  },
  routes: {
    allArticles: "/articles/all/",
    announcements: "/announcements/",
    articles: "/writing/",
    authors: "/authors/",
    bibliography: "/sources/",
    categories: "/topics/",
    collections: "/collections/",
    feed: "/feed.xml",
    home: "/",
    search: "/search/",
    tags: "/tags/",
  },
  support: {
    block: {
      body: "Keep publishing going.",
      title: "Support Example Blog",
    },
    discord: {
      href: "https://discord.gg/example",
      label: "Join Discord",
    },
    patreon: {
      href: "https://patreon.com/example",
      label: "Support Us",
    },
  },
});

describe("HTML validation runner", () => {
  test("builds representative targets from enabled route surfaces", () => {
    expect(htmlValidationTargetsForSiteConfig(config, "/repo/dist")).toEqual([
      path.join("/repo", "dist", "index.html"),
      path.join("/repo", "dist", "404.html"),
      path.join("/repo", "dist", "about", "**", "*.html"),
      path.join("/repo", "dist", "writing", "index.html"),
      path.join("/repo", "dist", "sources", "**", "*.html"),
      path.join("/repo", "dist", "topics", "**", "*.html"),
      path.join("/repo", "dist", "collections", "**", "*.html"),
      path.join("/repo", "dist", "search", "**", "*.html"),
    ]);
  });

  test("passes configured output targets to html-validate", () => {
    const runs: Array<{ args: string[]; command: string }> = [];
    const exitCode = runValidateHtmlCli(
      ["--dir", "dist/docs"],
      "/repo",
      (run) => {
        runs.push(run);

        return 0;
      },
    );

    expect(exitCode).toBe(0);
    expect(runs).toHaveLength(1);
    expect(runs[0]?.command).toBe(
      path.join(
        "/repo",
        "node_modules",
        ".bin",
        process.platform === "win32" ? "html-validate.cmd" : "html-validate",
      ),
    );
    expect(runs[0]?.args).toContain("--max-warnings=0");
    expect(runs[0]?.args).toContain(
      path.join("/repo", "dist", "docs", "index.html"),
    );
  });
});
