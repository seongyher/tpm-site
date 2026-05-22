import { extractLeadingDisplayLabel } from "./display-label";
import {
  articleReferenceBacklinkId,
  articleReferenceEntryId,
  articleReferenceMarkerDisplayText,
  articleReferenceMarkerId,
} from "./ids";
import type {
  ArticleCitation,
  ArticleNote,
  ArticleReferenceBlockContent,
  ArticleReferenceDefinitionInput,
  ArticleReferenceDiagnostic,
  ArticleReferenceDisplayLabel,
  ArticleReferenceInlineContent,
  ArticleReferenceKind,
  ArticleReferenceKindPrefix,
  ArticleReferenceLabel,
  ArticleReferenceMarker,
  ArticleReferenceOccurrenceInput,
  ArticleReferencesNormalizeResult,
  ParsedBibtexEntry,
} from "./model";
import { hasArticleReferenceDiagnostics } from "./validate";

const canonicalPrefixes = ["cite", "note"] as const;

/**
 * Classifies a raw Markdown footnote label into the article-reference domain.
 *
 * @param label Raw Markdown footnote label.
 * @returns Canonical label and kind, or undefined when the label is invalid.
 */
export function classifyArticleReferenceLabel(
  label: string,
): undefined | { kind: ArticleReferenceKind; label: ArticleReferenceLabel } {
  const parts = parseCanonicalLabelParts(label);

  if (parts === undefined) {
    return undefined;
  }

  if (parts.prefix === "cite") {
    return { kind: "citation", label: `cite-${parts.slug}` };
  }

  return { kind: "note", label: `note-${parts.slug}` };
}

/**
 * Normalizes collected Markdown footnote references and definitions.
 *
 * @param references Raw body reference occurrences in document order.
 * @param definitions Raw footnote definitions in document order.
 * @param bibtexEntries Parsed BibTeX entries collected from hidden data blocks.
 * @returns Renderable reference data or blocking diagnostics.
 */
export function normalizeArticleReferences(
  references: readonly ArticleReferenceOccurrenceInput[],
  definitions: readonly ArticleReferenceDefinitionInput[],
  bibtexEntries: readonly ParsedBibtexEntry[] = [],
): ArticleReferencesNormalizeResult {
  const referenceClassifications = references.map((reference) => ({
    classification: classifyArticleReferenceLabel(reference.label),
    raw: reference,
  }));
  const definitionClassifications = definitions.map((definition) => ({
    classification: classifyArticleReferenceLabel(definition.label),
    raw: definition,
  }));
  const invalidDiagnostics: ArticleReferenceDiagnostic[] = [
    ...referenceClassifications
      .filter(({ classification }) => classification === undefined)
      .map(
        ({ raw }) =>
          ({
            code: "invalid-label",
            label: raw.label,
            source: "reference",
          }) as const,
      ),
    ...definitionClassifications
      .filter(({ classification }) => classification === undefined)
      .map(
        ({ raw }) =>
          ({
            code: "invalid-label",
            label: raw.label,
            source: "definition",
          }) as const,
      ),
  ];

  const validReferences = referenceClassifications.flatMap(
    ({ classification }) =>
      classification === undefined ? [] : [classification],
  );
  const validDefinitions = definitionClassifications.flatMap(
    ({ classification, raw }) =>
      classification === undefined ? [] : [{ ...classification, raw }],
  );
  const citationDefinitions = validDefinitions
    .filter((definition) => definition.kind === "citation")
    .map(
      (definition) =>
        ({ code: "citation-definition", label: definition.label }) as const,
    );
  const noteDefinitions = validDefinitions.filter(
    (definition) => definition.kind === "note",
  );
  const definitionDuplicates = duplicateLabels(
    validDefinitions.map((definition) => definition.label),
  ).map((label) => ({ code: "duplicate-definition", label }) as const);
  const definitionMap = new Map(
    noteDefinitions.map(
      (definition) => [definition.label, definition] as const,
    ),
  );
  const referencedNoteLabels = new Set(
    validReferences
      .filter((reference) => reference.kind === "note")
      .map((reference) => reference.label),
  );
  const referencedCitationKeys = new Set(
    validReferences
      .filter((reference) => reference.kind === "citation")
      .map((reference) => citationKeyFromLabel(reference.label)),
  );
  const missingDefinitions = Array.from(referencedNoteLabels)
    .filter((label) => !definitionMap.has(label))
    .map((label) => ({ code: "missing-definition", label }) as const);
  const unreferencedDefinitions = noteDefinitions
    .map((definition) => definition.label)
    .filter((label, index, labels) => labels.indexOf(label) === index)
    .filter((label) => !referencedNoteLabels.has(label))
    .map((label) => ({ code: "unreferenced-definition", label }) as const);
  const repeatedNotes = repeatedNoteDiagnostics(validReferences);
  const displayLabelResults = noteDefinitions.map((definition) => ({
    definition,
    result: extractLeadingDisplayLabel(
      definition.label,
      definition.raw.children,
    ),
  }));
  const malformedDisplayLabels = displayLabelResults.flatMap(({ result }) =>
    result.ok
      ? []
      : [{ code: "malformed-display-label", label: result.label } as const],
  );
  const emptyDefinitions = displayLabelResults.flatMap(
    ({ definition, result }) =>
      result.ok && !hasDefinitionContent(result.children)
        ? [{ code: "empty-definition", label: definition.label } as const]
        : [],
  );
  const duplicateBibtexKeys = duplicateValues(
    bibtexEntries.map((entry) => entry.normalizedKey),
  ).map((key) => ({ code: "duplicate-bibtex-key", key }) as const);
  const malformedBibtexEntries = malformedBibtexEntryDiagnostics(bibtexEntries);
  const bibtexMap = new Map(
    bibtexEntries.map((entry) => [entry.normalizedKey, entry] as const),
  );
  const missingBibtexEntries = Array.from(referencedCitationKeys)
    .filter((key) => !bibtexMap.has(key))
    .map(
      (key) =>
        ({
          code: "missing-bibtex-entry",
          key,
          label: `cite-${key}`,
        }) as const,
    );
  const preflightDiagnostics = [
    ...invalidDiagnostics,
    ...citationDefinitions,
    ...definitionDuplicates,
    ...missingDefinitions,
    ...unreferencedDefinitions,
    ...repeatedNotes,
    ...malformedDisplayLabels,
    ...emptyDefinitions,
    ...duplicateBibtexKeys,
    ...malformedBibtexEntries,
    ...missingBibtexEntries,
  ];

  if (hasArticleReferenceDiagnostics(preflightDiagnostics)) {
    return { diagnostics: preflightDiagnostics, ok: false };
  }

  const displayLabelMap = new Map(
    displayLabelResults.flatMap(({ definition, result }) => {
      if (!result.ok) {
        return [];
      }

      return [
        [
          definition.label,
          normalizedDefinition(result.children, result.displayLabel),
        ] as const,
      ];
    }),
  );
  const referencesByLabel = referencesByCanonicalLabel(validReferences);
  const orderedCitationLabels = orderedLabelsForKind(
    validReferences,
    "citation",
  );
  const orderedNoteLabels = orderedLabelsForKind(validReferences, "note");
  const referencedCitations = orderedCitationLabels.map((label, index) =>
    citationFromReferencedLabel(
      label,
      index + 1,
      referencesByLabel.get(label) ?? [],
      bibtexMap,
    ),
  );
  const bibliographyOnlyCitations = bibtexEntries
    .filter((entry) => !referencedCitationKeys.has(entry.normalizedKey))
    .map((entry, index) =>
      citationFromBibtexEntry(entry, referencedCitations.length + index + 1),
    );
  const citations = [...referencedCitations, ...bibliographyOnlyCitations];
  const notes = orderedNoteLabels.map((label, index) =>
    noteFromLabel(
      label,
      index + 1,
      referencesByLabel.get(label) ?? [],
      displayLabelMap,
    ),
  );
  const idCollisions = duplicateValues([
    ...citations.flatMap((citation) => [
      citation.id,
      ...citation.references.flatMap((reference) => [
        reference.id,
        reference.backlinkId,
      ]),
    ]),
    ...notes.flatMap((note) => [
      note.id,
      ...note.references.flatMap((reference) => [
        reference.id,
        reference.backlinkId,
      ]),
    ]),
  ]).map((id) => ({ code: "id-collision", id }) as const);

  if (hasArticleReferenceDiagnostics(idCollisions)) {
    return { diagnostics: idCollisions, ok: false };
  }

  return {
    data: { citations, notes },
    ok: true,
  };
}

function citationFromReferencedLabel(
  label: ArticleReferenceLabel,
  order: number,
  references: readonly LabelOccurrence[],
  bibtexMap: ReadonlyMap<string, ParsedBibtexEntry>,
): ArticleCitation {
  const bibtex = requiredBibtex(label, bibtexMap);
  const definition = definitionFromBibtex(bibtex);
  const displayLabel = citationDisplayLabel(bibtex);
  const markers = references.map((reference) =>
    markerFromOccurrence(reference, "citation", order, displayLabel),
  );

  return {
    bibtex,
    definition,
    ...(displayLabel === undefined ? {} : { displayLabel }),
    id: articleReferenceEntryId(label),
    kind: "citation",
    label,
    order,
    references: markers,
  };
}

function citationFromBibtexEntry(
  bibtex: ParsedBibtexEntry,
  order: number,
): ArticleCitation {
  const label: ArticleReferenceLabel = `cite-${bibtex.normalizedKey}`;
  const definition = definitionFromBibtex(bibtex);
  const displayLabel = citationDisplayLabel(bibtex);

  return {
    bibtex,
    definition,
    ...(displayLabel === undefined ? {} : { displayLabel }),
    id: articleReferenceEntryId(label),
    kind: "citation",
    label,
    order,
    references: [],
  };
}

function noteFromLabel(
  label: ArticleReferenceLabel,
  order: number,
  references: readonly LabelOccurrence[],
  displayLabelMap: ReadonlyMap<ArticleReferenceLabel, NormalizedDefinition>,
): ArticleNote {
  const definition = requiredDefinition(label, displayLabelMap);
  const [reference] = references;

  if (reference === undefined) {
    throw new Error(`Missing normalized note reference for ${label}.`);
  }

  return {
    definition: { children: definition.children },
    ...(definition.displayLabel === undefined
      ? {}
      : { displayLabel: definition.displayLabel }),
    id: articleReferenceEntryId(label),
    kind: "note",
    label,
    order,
    references: [markerFromOccurrence(reference, "note", order, undefined)],
  };
}

interface LabelOccurrence {
  occurrenceIndexForLabel: number;
  order: number;
  reference: {
    kind: ArticleReferenceKind;
    label: ArticleReferenceLabel;
  };
}

interface NormalizedDefinition {
  children: readonly ArticleReferenceBlockContent[];
  displayLabel?: ArticleReferenceDisplayLabel;
}

function normalizedDefinition(
  children: readonly ArticleReferenceBlockContent[],
  displayLabel: ArticleReferenceDisplayLabel | undefined,
): NormalizedDefinition {
  return {
    children,
    ...(displayLabel === undefined ? {} : { displayLabel }),
  };
}

function markerFromOccurrence(
  occurrence: LabelOccurrence,
  kind: ArticleReferenceKind,
  entryOrder: number,
  displayLabel: ArticleReferenceDisplayLabel | undefined,
): ArticleReferenceMarker {
  return {
    backlinkId: articleReferenceBacklinkId(
      occurrence.reference.label,
      occurrence.occurrenceIndexForLabel,
    ),
    displayText: articleReferenceMarkerDisplayText(
      kind,
      entryOrder,
      displayLabel,
    ),
    entryId: articleReferenceEntryId(occurrence.reference.label),
    id: articleReferenceMarkerId(
      occurrence.reference.label,
      occurrence.occurrenceIndexForLabel,
    ),
    kind,
    label: occurrence.reference.label,
    order: occurrence.order,
  };
}

function orderedLabelsForKind(
  references: ReadonlyArray<{
    kind: ArticleReferenceKind;
    label: ArticleReferenceLabel;
  }>,
  kind: ArticleReferenceKind,
): ArticleReferenceLabel[] {
  return Array.from(
    new Set(
      references
        .filter((reference) => reference.kind === kind)
        .map((reference) => reference.label),
    ),
  );
}

function referencesByCanonicalLabel(
  references: ReadonlyArray<{
    kind: ArticleReferenceKind;
    label: ArticleReferenceLabel;
  }>,
): ReadonlyMap<ArticleReferenceLabel, LabelOccurrence[]> {
  return references.reduce((groups, reference) => {
    const previous = groups.get(reference.label) ?? [];
    const matchingKindOrder = references
      .slice(0, references.indexOf(reference) + 1)
      .filter(({ kind }) => kind === reference.kind).length;

    groups.set(reference.label, [
      ...previous,
      {
        occurrenceIndexForLabel: previous.length,
        order: matchingKindOrder,
        reference,
      },
    ]);
    return groups;
  }, new Map<ArticleReferenceLabel, LabelOccurrence[]>());
}

function duplicateLabels(
  labels: readonly ArticleReferenceLabel[],
): ArticleReferenceLabel[] {
  return duplicateValues(labels);
}

function duplicateValues<T extends string>(values: readonly T[]): T[] {
  return Array.from(
    values.reduce(
      (state, value) => ({
        duplicates: state.seen.has(value)
          ? state.duplicates.add(value)
          : state.duplicates,
        seen: state.seen.add(value),
      }),
      { duplicates: new Set<T>(), seen: new Set<T>() },
    ).duplicates,
  );
}

function repeatedNoteDiagnostics(
  references: ReadonlyArray<{
    kind: ArticleReferenceKind;
    label: ArticleReferenceLabel;
  }>,
): ArticleReferenceDiagnostic[] {
  return duplicateValues(
    references
      .filter((reference) => reference.kind === "note")
      .map((reference) => reference.label),
  ).map((label) => ({ code: "repeated-note-reference", label }));
}

function malformedBibtexEntryDiagnostics(
  entries: readonly ParsedBibtexEntry[],
): ArticleReferenceDiagnostic[] {
  return entries.flatMap((entry) => {
    const literalCitation = field(entry, "citation");

    return literalCitation !== undefined &&
      !hasBibliographyDisplayText(literalCitation)
      ? [
          {
            code: "malformed-bibtex",
            message: `Entry "${entry.key}" has an unusable literal citation field. Replace it with real source text or remove the entry.`,
          } as const,
        ]
      : [];
  });
}

function hasBibliographyDisplayText(value: string): boolean {
  return /[\p{L}\p{N}]/u.test(value);
}

function hasDefinitionContent(
  children: readonly ArticleReferenceBlockContent[],
): boolean {
  return children.some((child) => child.text.trim() !== "");
}

function parseCanonicalLabelParts(label: string):
  | undefined
  | {
      prefix: ArticleReferenceKindPrefix;
      slug: string;
    } {
  const separatorIndex = label.indexOf("-");

  if (separatorIndex <= 0) {
    return undefined;
  }

  const prefix = label.slice(0, separatorIndex);
  const slug = label.slice(separatorIndex + 1);

  if (!isCanonicalPrefix(prefix) || !isCanonicalSlug(slug)) {
    return undefined;
  }

  return { prefix, slug };
}

function isCanonicalPrefix(
  prefix: string,
): prefix is ArticleReferenceKindPrefix {
  return canonicalPrefixes.some(
    (canonicalPrefix) => canonicalPrefix === prefix,
  );
}

function isCanonicalSlug(slug: string): boolean {
  return (
    slug !== "" &&
    slug
      .split("-")
      .every((segment) => segment !== "" && hasOnlySlugCharacters(segment))
  );
}

function hasOnlySlugCharacters(segment: string): boolean {
  return Array.from(segment).every(isAsciiSlugCharacter);
}

function isAsciiSlugCharacter(character: string): boolean {
  const codePoint = character.codePointAt(0);

  return (
    codePoint !== undefined &&
    ((codePoint >= 48 && codePoint <= 57) ||
      (codePoint >= 97 && codePoint <= 122))
  );
}

function requiredDefinition(
  label: ArticleReferenceLabel,
  displayLabelMap: ReadonlyMap<ArticleReferenceLabel, NormalizedDefinition>,
): NormalizedDefinition {
  const definition = displayLabelMap.get(label);

  if (definition === undefined) {
    throw new Error(`Missing normalized definition for ${label}.`);
  }

  return definition;
}

function requiredBibtex(
  label: ArticleReferenceLabel,
  bibtexMap: ReadonlyMap<string, ParsedBibtexEntry>,
): ParsedBibtexEntry {
  const bibtex = bibtexMap.get(citationKeyFromLabel(label));

  if (bibtex === undefined) {
    throw new Error(`Missing normalized BibTeX entry for ${label}.`);
  }

  return bibtex;
}

function citationKeyFromLabel(label: ArticleReferenceLabel): string {
  return label.slice("cite-".length);
}

function definitionFromBibtex(entry: ParsedBibtexEntry): {
  children: readonly ArticleReferenceBlockContent[];
} {
  const literalCitation = field(entry, "citation");

  if (literalCitation !== undefined) {
    return paragraphDefinition(literalCitationContent(literalCitation));
  }

  const children: ArticleReferenceInlineContent[] = [];
  const contributor = field(entry, "author") ?? field(entry, "editor");
  const title = field(entry, "title");
  const container =
    field(entry, "journal") ??
    field(entry, "journaltitle") ??
    field(entry, "booktitle");
  const publisher = field(entry, "publisher");
  const year = field(entry, "year") ?? yearFromDate(field(entry, "date"));
  const url = field(entry, "url");
  const doi = field(entry, "doi");

  appendText(children, contributor === undefined ? "" : `${contributor}. `);

  if (title === undefined) {
    appendText(children, `${entry.key}. `);
  } else {
    children.push({
      children: [{ kind: "text", text: title }],
      kind: "emphasis",
      text: title,
    });
    appendText(children, ". ");
  }

  appendText(children, container === undefined ? "" : `${container}. `);
  appendText(children, publisher === undefined ? "" : `${publisher}. `);
  appendText(children, year === undefined ? "" : `${year}. `);

  if (url !== undefined) {
    appendLink(children, "Source", url);
    appendText(children, ".");
  } else if (doi !== undefined) {
    const doiUrl = `https://doi.org/${doi}`;
    appendLink(children, doi, doiUrl);
    appendText(children, ".");
  }

  if (children.length === 0) {
    appendText(children, entry.key);
  }

  return paragraphDefinition(children);
}

function citationDisplayLabel(
  entry: ParsedBibtexEntry,
): ArticleReferenceDisplayLabel | undefined {
  const contributor = field(entry, "author") ?? field(entry, "editor");
  const year = field(entry, "year") ?? yearFromDate(field(entry, "date"));
  const name =
    contributor === undefined ? undefined : firstLastName(contributor);

  if (name === undefined) {
    return undefined;
  }

  return year === undefined ? name : `${name} ${year}`;
}

function field(entry: ParsedBibtexEntry, name: string): string | undefined {
  const value = Object.entries(entry.fields)
    .find(([key]) => key === name)
    ?.at(1);
  const cleaned = value === undefined ? undefined : cleanBibtexValue(value);

  return cleaned === "" ? undefined : cleaned;
}

function cleanBibtexValue(value: string): string {
  return value.replace(/[{}]/gu, "").replace(/\s+/gu, " ").trim();
}

function firstLastName(contributors: string): string | undefined {
  const firstContributor = contributors
    .split(/\s+and\s+/iu)
    .at(0)
    ?.trim();

  if (firstContributor === undefined || firstContributor === "") {
    return undefined;
  }

  if (firstContributor.includes(",")) {
    return firstContributor.split(",").at(0)?.trim();
  }

  return firstContributor.split(/\s+/u).at(-1);
}

function yearFromDate(date: string | undefined): string | undefined {
  return date?.match(/\d{4}/u)?.at(0);
}

function appendText(
  children: ArticleReferenceInlineContent[],
  text: string,
): void {
  if (text !== "") {
    children.push({ kind: "text", text });
  }
}

function appendLink(
  children: ArticleReferenceInlineContent[],
  text: string,
  url: string,
): void {
  children.push({
    children: [{ kind: "text", text }],
    kind: "link",
    text,
    url,
  });
}

function literalCitationContent(
  citation: string,
): ArticleReferenceInlineContent[] {
  const children: ArticleReferenceInlineContent[] = [];
  const urlPattern = /<(https?:\/\/[^>]+)>|https?:\/\/[^\s<]+/giu;
  let cursor = 0;

  for (const match of citation.matchAll(urlPattern)) {
    const raw = match[0];
    const index = match.index;

    appendText(children, citation.slice(cursor, index));

    if (match.at(1) !== undefined) {
      const bracketedUrl = match.at(1) ?? "";
      const url = normalizeBracketedUrl(bracketedUrl);

      appendText(children, "<");
      appendLiteralCitationUrl(children, url, bracketedUrl);
      appendText(children, ">");
      cursor = index + raw.length;
      continue;
    }

    const { trailing, url } = trimTrailingUrlPunctuation(raw);

    appendLiteralCitationUrl(children, url, raw);
    appendText(children, trailing);
    cursor = index + raw.length;
  }

  appendText(children, citation.slice(cursor));

  return children.length === 0 ? [{ kind: "text", text: citation }] : children;
}

function appendLiteralCitationUrl(
  children: ArticleReferenceInlineContent[],
  url: string,
  fallbackText: string,
): void {
  if (!isHttpUrl(url)) {
    appendText(children, fallbackText);
    return;
  }

  appendLink(children, url, url);
}

function normalizeBracketedUrl(url: string): string {
  return url.replace(/\s+/gu, "");
}

function trimTrailingUrlPunctuation(url: string): {
  trailing: string;
  url: string;
} {
  const trimmedUrl = url.replace(/[),.;:!?]+$/gu, "");

  return {
    trailing: url.slice(trimmedUrl.length),
    url: trimmedUrl,
  };
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\/[^\s<>]+$/iu.test(value);
}

function paragraphDefinition(
  children: readonly ArticleReferenceInlineContent[],
): {
  children: readonly ArticleReferenceBlockContent[];
} {
  return {
    children: [
      {
        children,
        kind: "paragraph",
        text: children.map((child) => child.text).join(""),
      },
    ],
  };
}
