/** The two canonical article-reference kinds supported by article Markdown. */
export type ArticleReferenceKind = "citation" | "note";

/** A canonical `note-*` or `cite-*` Markdown footnote label. */
export type ArticleReferenceLabel = `${ArticleReferenceKindPrefix}-${string}`;

/** Canonical label prefixes used in article Markdown footnotes. */
export type ArticleReferenceKindPrefix = "cite" | "note";

/** Stable HTML ID generated for reference entries, markers, and backlinks. */
export type ArticleReferenceHtmlId = string;

/** Optional note metadata or generated citation label used for inline markers. */
export type ArticleReferenceDisplayLabel = string;

/** Inline serializable content preserved from a Markdown reference definition. */
export type ArticleReferenceInlineContent =
  | ArticleReferenceBreakContent
  | ArticleReferenceContainerInlineContent
  | ArticleReferenceInlineCodeContent
  | ArticleReferenceLinkContent
  | ArticleReferenceTextContent
  | ArticleReferenceUnknownInlineContent;

/** Block serializable content preserved from a Markdown reference definition. */
export type ArticleReferenceBlockContent =
  | ArticleReferenceCodeBlockContent
  | ArticleReferenceContainerBlockContent
  | ArticleReferenceUnknownBlockContent;

/** Serializable reference data consumed by article reference components. */
export interface ArticleReferenceData {
  citations: readonly ArticleCitation[];
  notes: readonly ArticleNote[];
}

/** One normalized bibliography citation entry. */
export interface ArticleCitation extends ArticleReferenceEntryBase {
  bibtex: ParsedBibtexEntry;
  kind: "citation";
  references: readonly ArticleReferenceMarker[];
}

/** One normalized explanatory note entry. */
export interface ArticleNote extends ArticleReferenceEntryBase {
  kind: "note";
  references: readonly [ArticleReferenceMarker];
}

/** One normalized inline marker occurrence. */
export interface ArticleReferenceMarker {
  backlinkId: ArticleReferenceHtmlId;
  displayText: string;
  entryId: ArticleReferenceHtmlId;
  id: ArticleReferenceHtmlId;
  kind: ArticleReferenceKind;
  label: ArticleReferenceLabel;
  order: number;
}

/** Raw body reference occurrence collected by the remark transformer. */
export interface ArticleReferenceOccurrenceInput {
  label: string;
}

/** Raw definition collected by the remark transformer. */
export interface ArticleReferenceDefinitionInput {
  children: readonly ArticleReferenceBlockContent[];
  label: string;
}

/** Parsed structured citation data collected from `tpm-bibtex` source blocks. */
export interface ParsedBibtexEntry {
  entryType: string;
  fields: Readonly<Record<string, string>>;
  key: string;
  normalizedKey: string;
  raw: string;
}

/** Successful pure-normalization result. */
interface ArticleReferencesNormalizeSuccess {
  data: ArticleReferenceData;
  ok: true;
}

/** Failed pure-normalization result with author-readable diagnostics. */
interface ArticleReferencesNormalizeFailure {
  diagnostics: readonly ArticleReferenceDiagnostic[];
  ok: false;
}

/** Pure-normalization result. Invalid states never carry renderable data. */
export type ArticleReferencesNormalizeResult =
  | ArticleReferencesNormalizeFailure
  | ArticleReferencesNormalizeSuccess;

/** Blocking diagnostic emitted by pure reference normalization. */
export type ArticleReferenceDiagnostic =
  | CitationDefinitionDiagnostic
  | DuplicateBibtexKeyDiagnostic
  | DuplicateDefinitionDiagnostic
  | EmptyDefinitionDiagnostic
  | IdCollisionDiagnostic
  | InvalidLabelDiagnostic
  | MalformedBibtexDiagnostic
  | MalformedDisplayLabelDiagnostic
  | MissingBibtexEntryDiagnostic
  | MissingDefinitionDiagnostic
  | RepeatedNoteReferenceDiagnostic
  | UnreferencedDefinitionDiagnostic;

interface ArticleReferenceEntryBase {
  definition: ArticleReferenceDefinitionContent;
  displayLabel?: ArticleReferenceDisplayLabel;
  id: ArticleReferenceHtmlId;
  label: ArticleReferenceLabel;
  order: number;
}

interface ArticleReferenceDefinitionContent {
  children: readonly ArticleReferenceBlockContent[];
}

interface ArticleReferenceTextContent {
  kind: "text";
  text: string;
}

interface ArticleReferenceInlineCodeContent {
  kind: "inlineCode";
  text: string;
}

interface ArticleReferenceBreakContent {
  kind: "break";
  text: "";
}

interface ArticleReferenceContainerInlineContent {
  children: readonly ArticleReferenceInlineContent[];
  kind: "emphasis" | "strong";
  text: string;
}

interface ArticleReferenceLinkContent {
  children: readonly ArticleReferenceInlineContent[];
  kind: "link";
  text: string;
  title?: string;
  url: string;
}

interface ArticleReferenceUnknownInlineContent {
  children?: readonly ArticleReferenceInlineContent[];
  kind: "unknown";
  nodeType: string;
  text: string;
}

interface ArticleReferenceCodeBlockContent {
  kind: "code";
  lang?: string;
  text: string;
}

interface ArticleReferenceContainerBlockContent {
  children: readonly ArticleReferenceInlineContent[];
  kind: "heading" | "list" | "paragraph";
  text: string;
}

interface ArticleReferenceUnknownBlockContent {
  children?: readonly ArticleReferenceInlineContent[];
  kind: "unknown";
  nodeType: string;
  text: string;
}

interface InvalidLabelDiagnostic {
  code: "invalid-label";
  label: string;
  source: "definition" | "reference";
}

interface DuplicateDefinitionDiagnostic {
  code: "duplicate-definition";
  label: ArticleReferenceLabel;
}

interface DuplicateBibtexKeyDiagnostic {
  code: "duplicate-bibtex-key";
  key: string;
}

interface CitationDefinitionDiagnostic {
  code: "citation-definition";
  label: ArticleReferenceLabel;
}

interface MissingDefinitionDiagnostic {
  code: "missing-definition";
  label: ArticleReferenceLabel;
}

interface MissingBibtexEntryDiagnostic {
  code: "missing-bibtex-entry";
  key: string;
  label: ArticleReferenceLabel;
}

interface MalformedBibtexDiagnostic {
  code: "malformed-bibtex";
  message: string;
}

interface UnreferencedDefinitionDiagnostic {
  code: "unreferenced-definition";
  label: ArticleReferenceLabel;
}

interface RepeatedNoteReferenceDiagnostic {
  code: "repeated-note-reference";
  label: ArticleReferenceLabel;
}

interface IdCollisionDiagnostic {
  code: "id-collision";
  id: ArticleReferenceHtmlId;
}

interface EmptyDefinitionDiagnostic {
  code: "empty-definition";
  label: ArticleReferenceLabel;
}

interface MalformedDisplayLabelDiagnostic {
  code: "malformed-display-label";
  label: ArticleReferenceLabel;
}
