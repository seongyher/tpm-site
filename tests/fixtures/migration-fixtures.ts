import type { MigrationFixture } from "../../src/lib/import-export/migration-fixtures";

/** Representative migration fixtures for portability testing. */
export const representativeMigrationFixtures: readonly MigrationFixture[] = [
  {
    assets: [
      {
        alt: "Legacy meme chart",
        id: "wp-chart",
        sourceUrl: "https://old.example/uploads/chart.jpg",
        state: "manual-review",
        targetPath: "site/assets/articles/wp-post/chart.jpg",
      },
    ],
    records: [
      {
        assets: ["wp-chart"],
        authors: ["Legacy Author"],
        body: "Imported WordPress body with a preserved image reference.",
        category: "Culture",
        citations: ["Smith, A. (2019). TODO journal details."],
        fields: [
          {
            fieldPath: "frontmatter.title",
            state: "exact",
            value: "WordPress Fixture",
          },
          {
            fieldPath: "frontmatter.author",
            note: "Author display name was inferred from WordPress user slug.",
            state: "inferred",
            value: "Legacy Author",
          },
        ],
        id: "wp-1",
        legacyPermalink: "/2019/01/01/wordpress-fixture/",
        pubDate: "2019-01-01",
        slug: "wordpress-fixture",
        source: {
          archiveEntry: "wordpress/export.xml#post-1",
          originalId: "1",
          originalUrl: "https://old.example/2019/01/01/wordpress-fixture/",
          sourceKind: "wordpress",
        },
        tags: ["Migration", "WordPress"],
        title: "WordPress Fixture",
      },
    ],
    redirects: [
      {
        destination: "/articles/wordpress-fixture/",
        source: "/2019/01/01/wordpress-fixture/",
        state: "exact",
        status: 301,
      },
    ],
    sourceKind: "wordpress",
  },
  {
    assets: [
      {
        alt: "Old TPM image",
        id: "legacy-tpm-image",
        sourceUrl: "https://thephilosophersmeme.com/assets/old.jpg",
        state: "normalized",
        targetPath: "site/assets/articles/legacy-tpm/old.jpg",
      },
    ],
    records: [
      {
        assets: ["legacy-tpm-image"],
        authors: ["TPM"],
        body: "Legacy TPM article body.",
        category: "Metamemetics",
        fields: [
          {
            fieldPath: "frontmatter.legacyPermalink",
            state: "normalized",
            value: "/2015/11/03/legacy-tpm/",
          },
          {
            fieldPath: "frontmatter.category",
            state: "normalized",
            value: "Metamemetics",
          },
        ],
        id: "legacy-tpm-1",
        legacyPermalink: "/2015/11/03/legacy-tpm/",
        pubDate: "2015-11-03",
        slug: "legacy-tpm",
        source: {
          archiveEntry: "legacy-tpm/posts/legacy-tpm.md",
          originalId: "legacy-tpm",
          originalUrl: "https://thephilosophersmeme.com/2015/11/03/legacy-tpm/",
          sourceKind: "legacy-tpm",
        },
        tags: ["TPM"],
        title: "Legacy TPM",
      },
    ],
    redirects: [
      {
        destination: "/articles/legacy-tpm/",
        source: "/2015/11/03/legacy-tpm/",
        state: "normalized",
        status: 301,
      },
    ],
    sourceKind: "legacy-tpm",
  },
  {
    assets: [],
    records: [
      {
        authors: ["Newsletter Author"],
        body: "Substack-like body with an iframe.",
        category: "Politics",
        embeds: [
          '<iframe src="https://www.youtube.com/embed/example"></iframe>',
        ],
        fields: [
          {
            fieldPath: "body.embed[0]",
            state: "manual-review",
            value: "https://www.youtube.com/embed/example",
          },
        ],
        id: "substack-1",
        legacyPermalink: "/p/substack-fixture",
        pubDate: "2020-05-04",
        slug: "substack-fixture",
        source: {
          archiveEntry: "substack/posts/substack-fixture.html",
          originalId: "post_123",
          originalUrl: "https://newsletter.example/p/substack-fixture",
          sourceKind: "substack-like",
        },
        tags: ["Newsletter"],
        title: "Substack Fixture",
      },
    ],
    redirects: [
      {
        destination: "/articles/substack-fixture/",
        source: "/p/substack-fixture",
        state: "manual-review",
        status: 301,
      },
    ],
    sourceKind: "substack-like",
  },
  {
    assets: [],
    records: [
      {
        authors: ["Markdown Author"],
        body: "Plain Markdown folder body.",
        fields: [
          {
            fieldPath: "frontmatter.tags",
            state: "exact",
            value: "markdown",
          },
        ],
        id: "markdown-1",
        pubDate: "2021-02-03",
        slug: "markdown-folder-fixture",
        source: {
          archiveEntry: "markdown-folder/markdown-folder-fixture.md",
          originalId: "markdown-folder-fixture.md",
          sourceKind: "markdown-folder",
        },
        tags: ["Markdown"],
        title: "Markdown Folder Fixture",
      },
    ],
    redirects: [],
    sourceKind: "markdown-folder",
  },
  {
    assets: [],
    records: [
      {
        authors: ["Unknown"],
        body: "Static HTML body converted to Markdown with known loss.",
        category: "Aesthetics",
        fields: [
          {
            fieldPath: "body.html",
            note: "Nested table layout cannot be represented exactly.",
            state: "lossy",
            value: "<table><tr><td>layout</td></tr></table>",
          },
        ],
        id: "static-html-1",
        legacyPermalink: "/essay/static-html-fixture.html",
        slug: "static-html-fixture",
        source: {
          archiveEntry: "static-html/essay/static-html-fixture.html",
          originalId: "static-html-fixture.html",
          originalUrl: "https://archive.example/essay/static-html-fixture.html",
          sourceKind: "static-html",
        },
        tags: ["HTML"],
        title: "Static HTML Fixture",
      },
    ],
    redirects: [
      {
        destination: "/articles/static-html-fixture/",
        source: "/essay/static-html-fixture.html",
        state: "lossy",
        status: 301,
      },
    ],
    sourceKind: "static-html",
  },
];
