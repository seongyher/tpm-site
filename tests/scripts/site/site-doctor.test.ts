import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import {
  formatSiteDoctorIssues,
  runSiteDoctorCli,
  siteDoctorAuthorDiagnostics,
  siteDoctorIssues,
} from "../../../scripts/site/site-doctor";
import { parseSiteConfig } from "../../../src/lib/site/site-config";
import { resolveSiteInstancePaths } from "../../../src/lib/site/site-instance";

const validConfig = {
  identity: {
    description: "A configurable publication.",
    language: "en",
    title: "Example Blog",
    url: "https://example.com",
  },
  navigation: {
    footer: [{ href: "/feed.xml", label: "RSS" }],
    primary: [{ href: "/articles/", label: "Articles" }],
  },
  routes: {
    allArticles: "/articles/all/",
    announcements: "/announcements/",
    articles: "/articles/",
    authors: "/authors/",
    bibliography: "/bibliography/",
    categories: "/categories/",
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
} as const;

async function withTempRoot<T>(callback: (root: string) => Promise<T> | T) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-site-doctor-test-"));

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

async function createMinimalSite(root: string) {
  await Promise.all([
    writeText(root, "site/config/site.json", "{}\n"),
    writeText(root, "site/theme.css", ":root { --background: white; }\n"),
    writeText(root, "site/config/redirects.json", "{}\n"),
    writeText(
      root,
      "site/content/articles/proof.md",
      [
        "---",
        "title: Proof",
        "description: Proof article.",
        "date: 2026-01-01",
        "author: Proof Author",
        "tags: []",
        "---",
        "",
      ].join("\n"),
    ),
    writeText(
      root,
      "site/content/announcements/proof.md",
      [
        "---",
        "title: Proof",
        "description: Proof announcement.",
        "date: 2026-01-02",
        "author: Proof Author",
        "tags: []",
        "---",
        "",
      ].join("\n"),
    ),
    writeText(
      root,
      "site/content/authors/proof.md",
      "---\ndisplayName: Proof Author\ntype: person\n---\n",
    ),
    writeText(
      root,
      "site/content/categories/proof.json",
      '{"title":"Proof"}\n',
    ),
    writeText(
      root,
      "site/content/collections/featured.md",
      "---\ntitle: Featured\nitems: []\n---\n",
    ),
    writeText(
      root,
      "site/content/collections/start-here.md",
      "---\ntitle: Start Here\nitems: []\n---\n",
    ),
    writeText(root, "site/content/pages/index.md", "---\ntitle: Home\n---\n"),
    writeText(root, "site/public/robots.txt", "User-agent: *\n"),
  ]);
}

describe("site doctor", () => {
  test("passes a complete minimal site instance", async () =>
    withTempRoot(async (root) => {
      await createMinimalSite(root);

      const issues = siteDoctorIssues({
        config: parseSiteConfig(validConfig),
        paths: resolveSiteInstancePaths({ cwd: root }),
      });

      expect(issues).toEqual([]);
    }));

  test("reports disabled features still linked from navigation", () => {
    const config = parseSiteConfig({
      ...validConfig,
      features: {
        tags: false,
      },
      navigation: {
        footer: [{ href: "/tags/", label: "Tags" }],
        primary: [],
      },
    });
    const issues = siteDoctorIssues({
      config,
      exists: () => true,
    });

    expect(issues).toContainEqual({
      message:
        'footer navigation link "Tags" points to disabled feature "tags".',
      repair:
        "Either enable the feature or remove this link from site/config/site.json.",
      severity: "error",
    });
  });

  test("reports disabled features still linked from homepage discovery", () => {
    const config = parseSiteConfig({
      ...validConfig,
      features: {
        authors: false,
      },
      homepage: {
        discoveryLinks: [{ label: "Authors", route: "authors" }],
      },
    });
    const issues = siteDoctorIssues({
      config,
      exists: () => true,
    });

    expect(issues).toContainEqual({
      message:
        'homepage discovery link "Authors" points to disabled feature "authors".',
      repair:
        "Either enable the feature or remove this link from site/config/site.json.",
      severity: "error",
    });
  });

  test("maps site-doctor issues into author-facing diagnostics", () => {
    const config = parseSiteConfig({
      ...validConfig,
      features: {
        tags: false,
      },
      navigation: {
        footer: [{ href: "/tags/", label: "Tags" }],
        primary: [],
      },
    });
    const diagnostics = siteDoctorAuthorDiagnostics({
      config,
      exists: () => true,
    });

    expect(diagnostics).toContainEqual({
      category: "config",
      code: "config.disabled-feature-linked",
      fixability: "source-edit",
      relatedDocs: ["docs/SITE_ANATOMY.md"],
      remediation:
        "Either enable the feature or remove this link from site/config/site.json.",
      repairOwner: "site-owner",
      severity: "error",
      source: "site-doctor",
      summary:
        'footer navigation link "Tags" points to disabled feature "tags".',
    });
  });

  test("maps route-shape site-doctor issues into route diagnostics", () => {
    const config = parseSiteConfig({
      ...validConfig,
      routes: {
        ...validConfig.routes,
        articles: "/articles",
      },
    });
    const diagnostics = siteDoctorAuthorDiagnostics({
      config,
      exists: () => true,
    });

    expect(diagnostics).toContainEqual({
      category: "routes",
      code: "routes.configured-shape-invalid",
      fixability: "source-edit",
      relatedDocs: ["docs/SOURCE_CONTRACTS.md"],
      remediation: "Set routes.articles to a path ending in /.",
      repairOwner: "site-owner",
      severity: "error",
      source: "site-doctor",
      summary: "Route articles should be trailing-slashed.",
    });
  });

  test("reports inclusive-default warnings for non-English site config", () => {
    const config = parseSiteConfig({
      ...validConfig,
      identity: {
        ...validConfig.identity,
        language: "fr",
        locale: "fr_FR",
      },
    });
    const issues = siteDoctorIssues({
      config,
      exists: () => true,
    });
    const diagnostics = siteDoctorAuthorDiagnostics({
      config,
      exists: () => true,
    });

    expect(
      issues.some(
        (issue) =>
          issue.message.includes("homepage.labels.read") &&
          issue.severity === "warning",
      ),
    ).toBe(true);
    expect(
      diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "config.inclusive-defaults-warning" &&
          diagnostic.relatedDocs?.includes("docs/LOCALIZATION_CONTRACTS.md") ===
            true,
      ),
    ).toBe(true);
  });

  test("reports missing homepage collections and route collisions", () => {
    const config = parseSiteConfig({
      ...validConfig,
      routes: {
        ...validConfig.routes,
        authors: "/articles/",
      },
    });
    const issues = siteDoctorIssues({
      config,
      exists: (targetPath) =>
        !targetPath.endsWith("featured.md") &&
        !targetPath.endsWith("featured.mdx"),
    });
    const report = formatSiteDoctorIssues(issues);

    expect(report).toContain(
      "Homepage featured collection `featured` does not exist.",
    );
    expect(report).toContain(
      "Routes articles, authors all point to /articles/.",
    );
  });

  test("reports source relationship issues in author language", async () =>
    withTempRoot(async (root) => {
      await createMinimalSite(root);
      await writeText(
        root,
        "site/content/articles/missing-category/bad.md",
        [
          "---",
          "title: Bad",
          "description: Bad article.",
          "date: 2026-01-03",
          "author: Ghost Author",
          "tags: []",
          "---",
          "",
        ].join("\n"),
      );
      await writeText(
        root,
        "site/content/collections/featured.md",
        [
          "---",
          "title: Featured",
          "items:",
          "  - missing-entry",
          "---",
          "",
        ].join("\n"),
      );

      const issues = siteDoctorIssues({
        config: parseSiteConfig(validConfig),
        paths: resolveSiteInstancePaths({ cwd: root }),
      });

      expect(
        issues.some(
          (issue) =>
            issue.message ===
              'Article bad references unknown author "Ghost Author".' &&
            issue.severity === "error",
        ),
      ).toBe(true);
      expect(
        issues.some(
          (issue) =>
            issue.message ===
              'Article bad uses category "missing-category" without category metadata.' &&
            issue.severity === "error",
        ),
      ).toBe(true);
      expect(
        issues.some(
          (issue) =>
            issue.message ===
              'Collection item "missing-entry" in featured does not match an article or announcement.' &&
            issue.severity === "error",
        ),
      ).toBe(true);
    }));

  test("reports redirect conflicts and missing configured public assets", async () =>
    withTempRoot(async (root) => {
      await createMinimalSite(root);
      await writeText(
        root,
        "site/config/redirects.json",
        '{"/old/":"/new/"}\n',
      );
      await writeText(
        root,
        "site/content/articles/proof.md",
        [
          "---",
          "title: Proof",
          "description: Proof article.",
          "date: 2026-01-01",
          "author: Proof Author",
          "legacyPermalink: /old/",
          "tags: []",
          "---",
          "",
        ].join("\n"),
      );

      const issues = siteDoctorIssues({
        config: parseSiteConfig({
          ...validConfig,
          identity: {
            ...validConfig.identity,
            logo: "/missing.svg?v=1",
          },
        }),
        paths: resolveSiteInstancePaths({ cwd: root }),
      });

      expect(
        issues.some(
          (issue) =>
            issue.message ===
              "Configured site logo /missing.svg?v=1 does not exist in site/public." &&
            issue.severity === "error",
        ),
      ).toBe(true);
      expect(
        issues.some(
          (issue) =>
            issue.message ===
              "Redirect /old/ has conflicting destinations: /new/, /articles/proof/." &&
            issue.severity === "error",
        ),
      ).toBe(true);
    }));

  test("maps source relationship issues into stable author diagnostic codes", async () =>
    withTempRoot(async (root) => {
      await createMinimalSite(root);
      await writeText(
        root,
        "site/content/collections/featured.md",
        [
          "---",
          "title: Featured",
          "items:",
          "  - missing-entry",
          "---",
          "",
        ].join("\n"),
      );

      const diagnostics = siteDoctorAuthorDiagnostics({
        config: parseSiteConfig(validConfig),
        paths: resolveSiteInstancePaths({ cwd: root }),
      });

      expect(
        diagnostics.some(
          (diagnostic) =>
            diagnostic.category === "content" &&
            diagnostic.code === "content.unknown-collection-item" &&
            diagnostic.repairOwner === "author" &&
            diagnostic.source === "site-doctor",
        ),
      ).toBe(true);
    }));

  test("prints concise CLI success output", () => {
    let output = "";

    expect(
      runSiteDoctorCli([], {
        stderr: {
          write: (text) => {
            output += String(text);
            return true;
          },
        },
        stdout: {
          write: (text) => {
            output += String(text);
            return true;
          },
        },
      }),
    ).toBe(0);
    expect(output).toBe("Site doctor passed.\n");
  });

  test("prints JSON diagnostic reports for machine consumers", () => {
    let output = "";

    expect(
      runSiteDoctorCli(["--json"], {
        stderr: {
          write: (text) => {
            output += String(text);
            return true;
          },
        },
        stdout: {
          write: (text) => {
            output += String(text);
            return true;
          },
        },
      }),
    ).toBe(0);

    expect(JSON.parse(output)).toMatchObject({
      diagnostics: [],
      summary: {
        errors: 0,
        info: 0,
        total: 0,
        warnings: 0,
      },
    });
  });
});
