export { parseBibtexEntries } from "../lib/article-references/bibtex";
export { extractLeadingDisplayLabel } from "../lib/article-references/display-label";
export {
  articleReferenceBacklinkId,
  articleReferenceEntryId,
  articleReferenceMarkerDisplayText,
  articleReferenceMarkerId,
} from "../lib/article-references/ids";
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
} from "../lib/article-references/model";
export {
  classifyArticleReferenceLabel,
  normalizeArticleReferences,
} from "../lib/article-references/normalize";
export type {
  CitationSourceCslJson,
  CitationSourceIdentity,
  NormalizedCitationSource,
} from "../lib/article-references/source";
export {
  citationSourceBibtexExport,
  citationSourceCslJson,
  citationSourceIdentity,
  citationSourceIdentityKey,
  citationSourceRisExport,
  normalizedCitationSource,
} from "../lib/article-references/source";
export {
  articleReferenceDiagnosticMessage,
  hasArticleReferenceDiagnostics,
} from "../lib/article-references/validate";
