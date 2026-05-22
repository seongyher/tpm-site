# Import, Export, And Preservation Policy

This document completes the design pass for `IRK-126`. It defines the durable
format and policy expectations for moving site data into and out of the
platform without losing author intent, historical metadata, source provenance,
or reviewable uncertainty.

The goal is not to make every legacy migration fully automatic. The goal is to
make migrations, backups, studio exports, CLI imports, and future provider
syncs use one preservation-aware contract instead of one-off scripts.

## Design Principles

- Preserve source truth before normalizing it.
- Keep author intent, historical metadata, and citation intent reviewable even
  when the imported data is messy.
- Make uncertainty explicit. Do not silently invent canonical data.
- Prefer dry-run reports before writing files.
- Support round-trip tests for platform-native content.
- Treat import/export as a platform domain, not a script collection.
- Separate stable fields from experimental fields so migrations can evolve
  without breaking backups.

## Canonical Export Envelope

Every export should produce one envelope with a schema version:

```ts
interface PlatformExportEnvelope {
  schemaVersion: string;
  exportedAt: string;
  exportedBy: ExportToolSummary;
  site: ExportedSiteIdentity;
  sourceSnapshot: SourceSnapshotReference;
  records: ExportRecord[];
  assets: ExportedAssetRecord[];
  redirects: ExportedRedirectRecord[];
  sourceMaps: SourceMapRecord[];
  preservation: PreservationReport;
  diagnostics: ExportDiagnostic[];
  extensions?: ExtensionExportRecord[];
}
```

The envelope is the stable boundary. Individual records can contain
record-type-specific payloads.

## Record Kinds

The platform should support these record kinds:

- `article`;
- `announcement`;
- `page`;
- `author`;
- `category`;
- `tag`;
- `collection`;
- `redirect`;
- `asset`;
- `citation-source`;
- `site-config`;
- `theme`;
- `public-file`;
- `generated-artifact-reference`.

Generated artifacts such as PDFs, search indexes, feeds, and social images are
usually references rather than canonical source records. They can be exported
when a backup product mode needs a complete site snapshot, but source records
remain the rebuildable truth.

## Source Maps

Every imported or exported record should be able to point back to its origin.

Source maps should include:

- source system, such as platform-native, WordPress, legacy TPM, static HTML,
  Substack-like export, or manual folder import;
- original identifier;
- original URL when available;
- source file path or archive entry;
- line, column, or field path when available;
- generated entry ID;
- generated route;
- related asset IDs;
- import decision IDs;
- preservation status.

Source maps are important for:

- debugging migrations;
- preserving citation and redirect accountability;
- showing authors what changed;
- enabling future re-import or diff workflows;
- explaining why an imported field requires review.

## Preservation States

Each imported field can have a preservation state:

- `exact`: copied without semantic change;
- `normalized`: represented in canonical platform form;
- `inferred`: filled from surrounding evidence;
- `lossy`: migrated with known loss;
- `omitted`: intentionally not migrated;
- `manual-review`: imported but needs human review;
- `unsupported`: recognized but not currently representable;
- `unknown`: source intent could not be determined.

The platform should prefer `manual-review` over guessing. Diagnostics should
make uncertain data visible before publication.

## Import Pipeline

Imports should move through explicit phases:

1. Identify source format and source system.
2. Parse source records without rewriting meaning.
3. Normalize records into platform source models.
4. Resolve authors, taxonomy, collections, citations, routes, and redirects.
5. Resolve assets and media references.
6. Create source maps and preservation records.
7. Validate against platform schemas.
8. Emit a dry-run report with diagnostics and review queues.
9. Materialize files only after dry-run output is acceptable.

Materialization should be adapter-driven. The same normalized import record
should be able to become files in `site/`, a studio draft database record, or a
future remote source-provider record.

## Import Review Queues

Imports should produce review queues for:

- ambiguous authors;
- missing or conflicting dates;
- unresolved assets;
- remote images that should be localized;
- citation records with incomplete or suspicious fields;
- historical URLs that do not match current slugs;
- HTML that cannot map cleanly to Markdown or MDX;
- embeds without PDF or static fallbacks;
- unknown frontmatter fields;
- unsupported extension data;
- duplicate routes or aliases.

Review items should include file or source references, severity, suggested
actions, and a stable diagnostic code when practical.

## Stable And Experimental Fields

Stable fields are the minimum platform contract for backup, restore, and native
round-trip import:

- envelope schema version;
- record kind;
- record ID;
- source maps;
- core source payload;
- asset references;
- route references;
- preservation states;
- diagnostics;
- extension namespace ownership.

Experimental fields may be emitted for future studio, provider-sync, or
third-party migration features, but stable importers must not require them.

Experimental fields should be namespaced:

```json
{
  "experimental": {
    "studioDraftState": {},
    "providerSyncState": {}
  }
}
```

Unknown extension namespaces must round-trip if possible, but they should not
affect platform publication unless an installed extension declares ownership.

## Native Round-Trip Guarantee

For platform-native exports, the platform should aim for this guarantee:

1. Export a valid site.
2. Import the export into an empty site instance.
3. Build the imported site.
4. Compare route registry, redirects, metadata, references, taxonomy,
   collections, and generated-output ownership.

Exact byte-for-byte source file identity is not required. Semantic platform
identity is required.

## Legacy Source Policy

Legacy imports should preserve enough evidence for human correction.

Supported migration sources can include:

- legacy TPM article files and generated HTML;
- WordPress-style archives;
- Markdown folder imports;
- Substack-like post exports;
- static HTML archives;
- manually curated CSV or JSON inventories.

When a legacy source has malformed data, the platform should keep the original
value in the source map or preservation record and emit a normalized value only
when the rule is explicit.

## Asset Preservation

Asset records should distinguish:

- original source URL or file;
- locally preserved source asset;
- optimized generated assets;
- social image derivatives;
- PDF-compatible derivatives;
- alt text and caption data;
- media role;
- licensing or credit fields when available;
- missing or failed fetch state.

Imports should never assume remote assets will stay available. Remote assets
should become review items unless the source provider intentionally remains
remote.

## Citation Preservation

Citation imports should preserve:

- original citation text;
- original BibTeX block when present;
- normalized BibTeX fields;
- DOI, ISBN, URL, archive URL, and accessed date when available;
- source article and inline citation relationships;
- evidence used for normalization;
- manual review status.

This is necessary because the current TPM citation corpus includes best-effort
legacy translations that require manual correction.

## Security And Privacy

Exports must not include:

- raw deploy credentials;
- private API tokens;
- local absolute paths unless explicitly requested for a local-only backup;
- hidden environment variables;
- provider secrets;
- unredacted build logs.

When local absolute paths are useful for diagnostics, they should be optional
and clearly marked as local-machine data.

## Verification Plan

Implementation work should add:

- native export/import round-trip fixtures;
- legacy fixture imports with expected review queues;
- source-map snapshot tests;
- preservation-state tests for exact, normalized, inferred, lossy, omitted, and
  manual-review fields;
- asset import fixtures for local, remote, missing, and optimized assets;
- citation import fixtures for complete, incomplete, malformed, and duplicate
  source records;
- tests proving unknown extension fields can round-trip without affecting
  publication;
- security tests proving secrets and local-only data are omitted by default.

The design issue is complete when downstream migration and studio issues can
use this document as the import/export contract instead of inventing their own
formats.
