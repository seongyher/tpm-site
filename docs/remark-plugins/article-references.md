# Article References Remark Plugin Design

## Purpose

The article references plugin gives The Philosopher's Meme one canonical way to
handle article-local explanatory notes and bibliographic citations in Markdown
and MDX articles.

It must make these things true:

- authors can keep writing normal Markdown articles;
- explanatory notes and bibliography citations are structurally distinct;
- citation-manager output can be pasted as structured BibTeX data;
- BibTeX authoring blocks never render as article prose;
- invalid citation state fails early with actionable diagnostics;
- article-local reference components and the global bibliography page render
  from the same normalized data model.

This is project infrastructure, not a reusable package. Keep it under
`src/remark-plugins/` and `src/lib/references/article-references/` unless it later proves
useful outside the site.

## Current Design Decision

Citations use inline footnote-style markers plus hidden BibTeX data blocks.
Explanatory notes continue to use normal GFM footnote definitions.

Canonical authoring shape:

````md
This claim cites a source.[^cite-baudrillard-1981]
This sentence needs an explanatory aside.[^note-context]

[^note-context]: This is normal explanatory note prose.

```tpm-bibtex
@book{baudrillard-1981,
  author = {Baudrillard, Jean},
  title = {Simulacra and Simulation},
  year = {1981}
}
```
````

Rules:

- `[^cite-<key>]` marks a bibliographic citation.
- The `<key>` part after `cite-` must match a BibTeX entry key in a
  `tpm-bibtex` fenced block. The BibTeX key itself should not include the
  `cite-` prefix.
- Citation markers do not require `[^cite-*]:` Markdown footnote definitions.
- `[^note-<slug>]` remains an explanatory note and requires a normal Markdown
  footnote definition.
- `tpm-bibtex` fenced code blocks are source data. They are consumed by the
  plugin and removed from rendered Markdown.
- Ordinary `bibtex` fences are not the canonical data channel. Published
  articles should reject visible BibTeX fences unless an explicit visible-code
  escape hatch is later designed.
- Ordinary inline links are not bibliography entries.
- Legacy references sections can be migrated, but they do not define the future
  model.

This design keeps authoring copy-paste friendly for citation managers while
keeping rendering decisions programmatic and site-owned.

## Non-Goals

- Do not parse MLA, APA, Chicago, or other prose citation styles.
- Do not infer citations from ordinary inline links.
- Do not expose raw BibTeX blocks to readers.
- Do not require a new Markdown extension, file extension, or submodule.
- Do not make visual components parse Markdown or BibTeX.
- Do not mutate article wording during plugin implementation.

## Markdown Plugin Model

Astro renders article bodies through content collections and the unified
Markdown pipeline. The plugin receives a Markdown AST before the article body is
rendered.

The transformer should use parsed AST nodes where the Markdown parser exposes
them:

- `footnoteReference` for `[^cite-*]` and `[^note-*]` markers;
- `footnoteDefinition` for `[^note-*]: ...` explanatory notes;
- `code` nodes with `lang === "tpm-bibtex"` for hidden BibTeX data.

Important parser nuance: GFM footnote references are not always exposed as
`footnoteReference` nodes when there is no matching Markdown definition. Since
canonical citations intentionally do not have `[^cite-*]:` definitions, the
plugin must also recognize literal `[^cite-*]` text markers in ordinary text
nodes and replace only the validated markers it owns. It must not scan code
blocks, inline code, note definitions, or link text as citation markers.

The plugin should:

1. collect note references and note definitions;
2. collect citation references;
3. collect and parse `tpm-bibtex` code blocks;
4. normalize all parsed data into typed article-reference data;
5. fail with diagnostics for invalid state;
6. inject normalized data into Astro remark plugin frontmatter;
7. replace inline note/citation markers with accessible links;
8. remove consumed note definitions and `tpm-bibtex` blocks from the Markdown
   body.

MDX inherits the project Markdown config, so the same behavior applies to
`.md` and `.mdx` articles.

## Parser Architecture Requirements

This work is parser work. Do not implement it as a loose collection of broad
regex replacements.

Apply "parse, don't validate":

- The Markdown parser turns raw authoring syntax into AST nodes.
- The BibTeX parser turns raw BibTeX text into typed entries or precise parse
  diagnostics.
- The article-reference normalizer turns note/citation occurrences, note
  definitions, and parsed BibTeX entries into renderable data or blocking
  diagnostics.
- Components receive normalized data. They should never ask whether a string
  "looks like" a citation.

Use type-driven design:

```ts
type ArticleReferenceEntry = ArticleNoteReference | ArticleCitationReference;

interface ArticleCitationReference {
  bibtex: ParsedBibtexEntry;
  kind: "citation";
  label: `cite-${string}`;
  references: readonly ArticleReferenceMarker[];
}
```

Invalid states should not be representable after normalization:

- a citation with no matching BibTeX entry;
- duplicate BibTeX keys;
- duplicate note definitions;
- repeated note markers, unless later explicitly designed;
- visible `tpm-bibtex` output;
- empty note definitions;
- malformed BibTeX.

## BibTeX Authoring Contract

Supported first-pass BibTeX should cover ordinary citation-manager exports:

- entries begin with `@type{key, ...}` or `@type(key, ...)`;
- keys use lowercase ASCII slugs when referenced from Markdown;
- fields use `field = {value}` or `field = "value"`;
- nested braces in values are supported;
- comments and whitespace are ignored where BibTeX normally allows them;
- unknown fields are preserved in `fields` instead of discarded.

Required baseline fields:

- every entry: `title` unless the entry type is explicitly exempted later;
- books: `author` or `editor`, plus `year` when available;
- articles/in-collection entries: `author`, `title`, `year` when available;
- web-like entries: `title`, plus `url` when the source is online.

TPM also supports a conservative `citation` field for corpus migrations. When
present, `citation` is the literal source-list wording to render in article and
global bibliography views. Parsed fields such as `author`, `title`, `year`,
`url`, and `doi` may still accompany it for sorting, deduplication, and future
format exports, but the visible bibliography entry preserves the literal
author-approved source text.

Missing optional fields should not block rendering. Missing fields that make a
source unusable should produce diagnostics in strict mode and clear fallback
text in non-strict migration mode.

The parser should preserve:

- `entryType`;
- `key`;
- normalized lowercase key for lookup;
- raw BibTeX text for future export/copy behavior;
- parsed field map;
- author/editor names as raw field strings until a dedicated name parser exists.

Do not add fuzzy source deduplication to the parser. Global deduplication, if
needed, belongs to a bibliography aggregation helper with explicit deterministic
rules.

## Normalized Data Model

Article rendering should receive serializable data:

```ts
interface ArticleReferenceData {
  citations: readonly ArticleCitation[];
  notes: readonly ArticleNote[];
}

interface ArticleCitation {
  bibtex: ParsedBibtexEntry;
  definition: ArticleReferenceDefinitionContent;
  displayLabel?: string;
  kind: "citation";
  label: `cite-${string}`;
  references: readonly ArticleReferenceMarker[];
}

interface ParsedBibtexEntry {
  entryType: string;
  fields: Readonly<Record<string, string>>;
  key: string;
  raw: string;
}
```

`definition` for a citation is generated from parsed BibTeX for article-local
rendering. It is not copied from raw Markdown prose. Rendering components can
later change style without editing article content.

## Rendering Contract

Inline explanatory-note markers and bibliography-citation markers must be
visually distinguishable. Explanatory notes render as naked clickable
superscript numbers, for example `1`, with no brackets. Bibliographic
citations render as bracketed numeric citation markers by default, for example
`[1]`.

The data model still preserves generated citation labels such as
`Baudrillard 1981` for future explicit style overrides, but the default body
marker remains numeric so author-written prose citations do not duplicate
themselves.

Article-local rendering:

- explanatory notes render in `ArticleFootnotes`;
- citations render in `ArticleBibliography`;
- notes appear before bibliography when both exist;
- references render after article endcap discovery and before final tags;
- raw BibTeX is not visible in the article body.

Global bibliography rendering:

- consumes normalized citation data from every article;
- groups exact or explicitly canonicalized source identities;
- links each source to every article that cited it;
- never infers sources from inline links.

## Diagnostics

Diagnostics should be author-readable and point at the repair:

- invalid reference label: use `note-*` or `cite-*`;
- missing note definition;
- empty note definition;
- repeated note reference;
- missing BibTeX entry for `[^cite-*]`;
- duplicate BibTeX key;
- malformed BibTeX;
- forbidden visible `bibtex` fence in published articles if enforcement is
  enabled;
- duplicate generated HTML IDs.

Strict release validation should be enabled only after the corpus is normalized
or explicit exceptions are documented.

## Corpus Migration

Article-content migration requires explicit user approval.

Migration rules:

- Preserve author wording and article intent.
- Convert true sources to `[^cite-*]` markers plus `tpm-bibtex` entries.
- Convert broad bibliography/source-list entries to bibliography-only
  `tpm-bibtex` entries when no precise inline citation point exists.
- Convert explanatory notes to `[^note-*]` definitions.
- Leave ordinary inline links alone.
- Leave ambiguous links alone until reviewed.
- Do not invent bibliographic metadata that cannot be recovered with
  confidence.
- Prefer one article or one legacy pattern per reviewable change.

## Testing Requirements

Unit tests:

- BibTeX parser accepts citation-manager-shaped entries;
- parser preserves unknown fields and raw text;
- parser rejects malformed entries with precise diagnostics;
- normalization catches missing and duplicate citation keys;
- normalization keeps uncited BibTeX entries as bibliography-only sources;
- notes and citations are independently normalized;
- generated citation definitions have stable fallback text.

Remark/plugin tests:

- `tpm-bibtex` blocks are removed from rendered Markdown;
- citation markers link to generated bibliography entries;
- explanatory notes still render from Markdown definitions;
- visible `bibtex` fences are rejected when strict validation is enabled;
- MDX articles get the same behavior.

Integration tests:

- article-local references render after endcap and before tags;
- no raw BibTeX appears on article pages;
- global bibliography aggregation receives structured citation data;
- long citation fields wrap without horizontal overflow.
