export { parseBibtexEntries } from "../lib/references/article-references/bibtex";
export { extractLeadingDisplayLabel } from "../lib/references/article-references/display-label";
export {
  articleReferenceBacklinkId,
  articleReferenceEntryId,
  articleReferenceMarkerDisplayText,
  articleReferenceMarkerId,
} from "../lib/references/article-references/ids";
export type {
  ArticleCitation,
  ArticleNote,
  ArticleReferenceBlockContent,
  ArticleReferenceData,
  ArticleReferenceDefinitionInput,
  ArticleReferenceDiagnostic,
  ArticleReferenceDisplayLabel,
  ArticleReferenceHtmlId,
  ArticleReferenceInlineContent,
  ArticleReferenceKind,
  ArticleReferenceKindPrefix,
  ArticleReferenceLabel,
  ArticleReferenceMarker,
  ArticleReferenceOccurrenceInput,
  ArticleReferencesNormalizeResult,
  ParsedBibtexEntry,
} from "../lib/references/article-references/model";
export {
  classifyArticleReferenceLabel,
  normalizeArticleReferences,
} from "../lib/references/article-references/normalize";
export type {
  CitationSourceCslJson,
  CitationSourceIdentity,
  NormalizedCitationSource,
} from "../lib/references/article-references/source";
export {
  citationSourceBibtexExport,
  citationSourceCslJson,
  citationSourceIdentity,
  citationSourceIdentityKey,
  citationSourceRisExport,
  normalizedCitationSource,
} from "../lib/references/article-references/source";
export {
  articleReferenceDiagnosticMessage,
  hasArticleReferenceDiagnostics,
} from "../lib/references/article-references/validate";
