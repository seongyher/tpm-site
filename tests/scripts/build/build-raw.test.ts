import path from "node:path";

import { describe, expect, test } from "bun:test";

import {
  pagefindGlobsForSiteConfig,
  runBuildRawCli,
} from "../../../scripts/build/build-raw";
import { parseSiteConfig } from "../../../src/lib/site-config";

const config = parseSiteConfig({
  features: {
    announcements: false,
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
    announcements: "/updates/",
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

describe("raw build runner", () => {
  test("builds Pagefind globs from enabled route surfaces", () => {
    expect(pagefindGlobsForSiteConfig(config)).toEqual([
      "index.html",
      "about/**/*.html",
      "writing/**/*.html",
      "authors/**/*.html",
      "sources/**/*.html",
      "topics/**/*.html",
      "collections/**/*.html",
      "search/**/*.html",
    ]);
  });

  test("skips Pagefind globs when search is disabled", () => {
    expect(
      pagefindGlobsForSiteConfig({
        ...config,
        features: {
          ...config.features,
          search: false,
        },
      }),
    ).toEqual([]);
  });

  test("runs Astro and Pagefind against the same output directory", () => {
    const runs: Array<{
      args: string[];
      command: string;
      outputDir: string | undefined;
    }> = [];
    const exitCode = runBuildRawCli(["--dir", "dist/docs"], "/repo", (run) => {
      runs.push({
        args: run.args,
        command: run.command,
        outputDir: run.env["SITE_OUTPUT_DIR"],
      });

      return 0;
    });

    expect(exitCode).toBe(0);
    expect(runs).toEqual([
      {
        args: ["astro", "build", "--force"],
        command: "bunx",
        outputDir: path.join("dist", "docs"),
      },
      {
        args: [
          "--site",
          path.join("/repo", "dist", "docs"),
          "--glob",
          "{index.html,about/**/*.html,articles/**/*.html,announcements/**/*.html,authors/**/*.html,bibliography/**/*.html,categories/**/*.html,collections/**/*.html,search/**/*.html,tags/**/*.html}",
        ],
        command: "pagefind",
        outputDir: undefined,
      },
    ]);
  });

  test("skips Pagefind when the active site disables search", () => {
    const runs: Array<{ command: string }> = [];
    const exitCode = runBuildRawCli(
      ["--dir", "dist/docs"],
      "/repo",
      (run) => {
        runs.push({ command: run.command });

        return 0;
      },
      {
        ...config,
        features: {
          ...config.features,
          search: false,
        },
      },
    );

    expect(exitCode).toBe(0);
    expect(runs.map((run) => run.command)).toEqual(["bunx"]);
  });
});
