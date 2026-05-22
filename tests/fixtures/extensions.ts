import { defineExtensionManifest } from "../../src/platform/extensions";

export const fixtureMarkdownExtension = defineExtensionManifest({
  capabilities: [
    {
      family: "content.kind",
      id: "markdown-mdx",
      summary: "Compile Markdown and MDX content entries.",
    },
    {
      family: "route.module",
      id: "article-pages",
      summary: "Generate article and page routes from content entries.",
    },
  ],
  contentKinds: [
    {
      collection: "articles",
      routeCapability: "article-pages",
      schemaRef: "schemas/article-frontmatter",
    },
    {
      collection: "pages",
      routeCapability: "article-pages",
      schemaRef: "schemas/page-frontmatter",
    },
  ],
  disabledBehavior: {
    mode: "reject-disable",
    summary: "Markdown and MDX content rendering is required by the platform.",
  },
  docs: [
    {
      audience: "author",
      path: "site/README.md",
    },
    {
      audience: "developer",
      path: "docs/SOURCE_CONTRACTS.md",
    },
  ],
  id: "fixture.markdown-mdx",
  kind: "essential-bundled",
  name: "Fixture Markdown And MDX",
  routes: [
    {
      pathPattern: "/articles/:slug/",
      routeKey: "article",
      surfaces: ["article", "sitemap", "feed", "metadata"],
    },
  ],
  summary: "Fixture essential bundled content extension.",
  tests: [
    {
      fixture: "tests/fixtures/extensions.ts",
      kind: "unit",
    },
  ],
  version: "0.1.0",
});

export const fixturePdfExtension = defineExtensionManifest({
  capabilities: [
    {
      family: "artifact.pdf",
      id: "article-pdf",
      summary: "Generate article PDFs.",
    },
    {
      family: "verifier.module",
      id: "pdf-output",
      summary: "Verify generated PDF output.",
    },
  ],
  disabledBehavior: {
    mode: "remove-artifacts",
    summary: "Remove PDF controls and generated PDF artifacts.",
  },
  docs: [
    {
      audience: "owner",
      path: "docs/ARTICLE_PDF_EXPORT.md",
    },
  ],
  generatedArtifacts: [
    {
      cachePolicy: "public-revalidate",
      kind: "pdf",
      owner: "extension",
      pathPattern: "/articles/:slug/:slug.pdf",
      verifierRef: "article-pdf-output",
    },
  ],
  id: "fixture.pdf",
  kind: "optional-official",
  name: "Fixture PDF",
  permissions: ["generated.output.write"],
  summary: "Fixture generated-artifact extension.",
  tests: [
    {
      fixture: "tests/fixtures/extensions.ts",
      kind: "verifier",
    },
  ],
  verifiers: [
    {
      moduleRef: "article-pdf-output",
      ownsArtifacts: ["output.articlePdfs"],
    },
  ],
  version: "0.1.0",
});

export const fixtureCalloutExtension = defineExtensionManifest({
  capabilities: [
    {
      family: "ui.component",
      id: "callout",
      summary: "Render article callouts.",
    },
  ],
  components: [
    {
      componentRef: "components/FixtureCallout.astro",
      fallback: {
        feed: "static-text",
        pdf: "static-render",
        search: "static-text",
      },
      name: "Fixture Callout",
      propsSchemaRef: "schemas/fixture-callout",
      surfaces: ["article", "editor"],
    },
  ],
  disabledBehavior: {
    mode: "keep-source-ignore-output",
    summary: "Keep callout source but omit rendered callout output.",
  },
  docs: [
    {
      audience: "extension-author",
      path: "docs/EXTENSION_ARCHITECTURE.md",
    },
  ],
  id: "fixture.callout",
  kind: "site",
  name: "Fixture Callout",
  summary: "Fixture UI component extension.",
  tests: [
    {
      fixture: "tests/fixtures/extensions.ts",
      kind: "unit",
    },
  ],
  version: "0.1.0",
});

export const fixtureThirdPartyEmbedExtension = defineExtensionManifest({
  capabilities: [
    {
      family: "ui.component",
      id: "embed-card",
      summary: "Render a third-party embed card.",
    },
  ],
  components: [
    {
      componentRef: "components/ThirdPartyEmbedCard.astro",
      fallback: {
        feed: "static-text",
        pdf: "static-link",
        search: "static-text",
      },
      name: "Third-Party Embed Card",
      surfaces: ["article", "editor"],
    },
  ],
  disabledBehavior: {
    mode: "keep-source-ignore-output",
    summary: "Keep source embed references and omit rendered embed cards.",
  },
  docs: [
    {
      audience: "extension-author",
      path: "docs/EXTENSION_ARCHITECTURE.md",
    },
  ],
  externalOrigins: [
    {
      origin: "https://example-embed.invalid",
      purpose: "Fixture third-party embed origin.",
      userTriggered: true,
    },
  ],
  id: "fixture.third-party-embed",
  kind: "third-party",
  name: "Fixture Third-Party Embed",
  permissions: ["external.origin"],
  summary: "Fixture third-party UI extension.",
  tests: [
    {
      fixture: "tests/fixtures/extensions.ts",
      kind: "unit",
    },
  ],
  version: "0.1.0",
});

export const fixtureReviewMetadataExtension = defineExtensionManifest({
  capabilities: [
    {
      family: "metadata.profile",
      id: "review",
      summary: "Add review metadata profile support.",
    },
  ],
  disabledBehavior: {
    mode: "disable-capabilities",
    summary: "Review metadata fields are ignored.",
  },
  id: "fixture.review-metadata",
  kind: "optional-official",
  metadataProfiles: [
    {
      kind: "review",
      schemaRef: "schemas/review-metadata",
    },
  ],
  name: "Fixture Review Metadata",
  requiredFeatures: ["advanced-metadata"],
  summary: "Fixture feature-gated metadata extension.",
  version: "0.1.0",
});

export const fixtureMigratingImporterExtension = defineExtensionManifest({
  capabilities: [
    {
      family: "import.source",
      id: "legacy-markdown",
      summary: "Import a legacy Markdown archive.",
    },
  ],
  disabledBehavior: {
    mode: "disable-capabilities",
    summary: "Hide legacy import actions.",
  },
  docs: [
    {
      audience: "owner",
      path: "docs/IMPORT_EXPORT_POLICY.md",
    },
  ],
  id: "fixture.legacy-importer",
  kind: "optional-official",
  migrations: [
    {
      dryRun: true,
      fromVersion: "0.1.0",
      id: "legacy-frontmatter-slugs",
      reversible: true,
      summary: "Normalize legacy frontmatter slugs before import.",
      touches: ["content"],
      toVersion: "0.2.0",
    },
  ],
  name: "Fixture Legacy Importer",
  permissions: ["migration.write"],
  summary: "Fixture importer with a pending migration.",
  tests: [
    {
      fixture: "tests/fixtures/extensions.ts",
      kind: "unit",
    },
  ],
  version: "0.2.0",
});

export const fixturePdfConflictExtension = defineExtensionManifest({
  capabilities: [
    {
      family: "artifact.pdf",
      id: "alternate-article-pdf",
      summary: "Generate alternate article PDFs.",
    },
  ],
  disabledBehavior: {
    mode: "remove-artifacts",
    summary: "Remove alternate PDF artifacts.",
  },
  generatedArtifacts: [
    {
      cachePolicy: "public-revalidate",
      kind: "pdf",
      owner: "extension",
      pathPattern: "/articles/:slug/:slug.pdf",
    },
  ],
  id: "fixture.pdf-conflict",
  kind: "third-party",
  name: "Fixture PDF Conflict",
  permissions: ["generated.output.write"],
  summary: "Fixture conflicting output extension.",
  version: "0.1.0",
});

export const fixtureDependentExtension = defineExtensionManifest({
  capabilities: [
    {
      family: "ui.block",
      id: "pdf-download-block",
      summary: "Render a PDF download block.",
    },
  ],
  components: [
    {
      componentRef: "components/PdfDownloadBlock.astro",
      fallback: {
        feed: "static-text",
        pdf: "omit",
        search: "static-text",
      },
      name: "PDF Download Block",
      surfaces: ["article"],
    },
  ],
  dependencies: [
    {
      id: "fixture.pdf",
      reason: "The block needs generated article PDF artifacts.",
    },
  ],
  disabledBehavior: {
    mode: "disable-capabilities",
    summary: "Hide the PDF download block.",
  },
  id: "fixture.pdf-download-block",
  kind: "site",
  name: "Fixture PDF Download Block",
  summary: "Fixture dependency extension.",
  version: "0.1.0",
});
