import type { ParsedBibtexEntry } from "./model";

/** Normalized citation source family derived from BibTeX. */
type CitationSourceType =
  | "article"
  | "book"
  | "chapter"
  | "conference-paper"
  | "dataset"
  | "misc"
  | "software"
  | "web";

/** Duplicate identity confidence for bibliography grouping. */
type CitationSourceIdentityConfidence = "exact" | "none" | "strong" | "weak";

/** Stable duplicate identity for a normalized citation source. */
export interface CitationSourceIdentity {
  confidence: CitationSourceIdentityConfidence;
  key: string;
}

/** Normalized citation source facts used by bibliography/export surfaces. */
export interface NormalizedCitationSource {
  accessDate?: string | undefined;
  archiveUrl?: string | undefined;
  authors: readonly string[];
  containerTitle?: string | undefined;
  date?: string | undefined;
  doi?: string | undefined;
  editors: readonly string[];
  entryType: string;
  fields: Readonly<Record<string, string>>;
  identity: CitationSourceIdentity;
  isbn?: string | undefined;
  key: string;
  normalizedKey: string;
  pages?: string | undefined;
  publisher?: string | undefined;
  sourceType: CitationSourceType;
  title?: string | undefined;
  url?: string | undefined;
  year?: string | undefined;
}

/** CSL-like JSON object for one normalized citation source. */
export interface CitationSourceCslJson {
  accessed?: CitationSourceCslDateParts;
  author?: readonly CitationSourceCslName[] | undefined;
  "container-title"?: string | undefined;
  DOI?: string | undefined;
  editor?: readonly CitationSourceCslName[] | undefined;
  id: string;
  ISBN?: string | undefined;
  issued?: CitationSourceCslDateParts;
  page?: string | undefined;
  publisher?: string | undefined;
  title?: string | undefined;
  type: string;
  URL?: string | undefined;
}

interface CitationSourceCslName {
  family?: string | undefined;
  given?: string | undefined;
  literal?: string | undefined;
}

interface CitationSourceCslDateParts {
  "date-parts": readonly [readonly [number, number?, number?]];
}

/**
 * Normalizes a parsed BibTeX entry into source facts consumed by outputs.
 *
 * @param entry Parsed BibTeX entry.
 * @returns Normalized citation source.
 */
export function normalizedCitationSource(
  entry: ParsedBibtexEntry,
): NormalizedCitationSource {
  const authors = peopleList(normalizedField(entry, "author"));
  const editors = peopleList(normalizedField(entry, "editor"));
  const date = normalizedField(entry, "date");
  const year = normalizedYear(entry);

  return {
    accessDate:
      normalizedField(entry, "urldate") ?? normalizedField(entry, "accessdate"),
    archiveUrl:
      normalizedField(entry, "archiveurl") ??
      normalizedField(entry, "archiveUrl"),
    authors,
    containerTitle: normalizedContainerTitle(entry),
    date,
    doi: normalizedDoiField(entry),
    editors,
    entryType: entry.entryType,
    fields: entry.fields,
    identity: citationSourceIdentity(entry),
    isbn: normalizedField(entry, "isbn"),
    key: entry.key,
    normalizedKey: entry.normalizedKey,
    pages: normalizedField(entry, "pages"),
    publisher:
      normalizedField(entry, "publisher") ??
      normalizedField(entry, "organization"),
    sourceType: citationSourceType(entry.entryType),
    title: normalizedField(entry, "title"),
    url: normalizedField(entry, "url"),
    year,
  };
}

/**
 * Builds the bibliography grouping key for a citation source.
 *
 * Exact and strong identities group automatically. Weak/no identities use an
 * exact field fingerprint so ambiguous sources do not merge silently.
 *
 * @param entry Parsed BibTeX entry.
 * @returns Stable grouping key.
 */
export function citationSourceIdentityKey(entry: ParsedBibtexEntry): string {
  const identity = citationSourceIdentity(entry);

  return identity.confidence === "exact" || identity.confidence === "strong"
    ? identity.key
    : exactSourceKey(entry);
}

/**
 * Builds duplicate identity for a parsed BibTeX source.
 *
 * @param entry Parsed BibTeX entry.
 * @returns Duplicate identity and confidence.
 */
export function citationSourceIdentity(
  entry: ParsedBibtexEntry,
): CitationSourceIdentity {
  const doi = normalizedDoiField(entry);
  const isbn = normalizedField(entry, "isbn");
  const url = normalizedField(entry, "url");
  const title = normalizedField(entry, "title");
  const contributor =
    normalizedField(entry, "author") ?? normalizedField(entry, "editor");
  const year = normalizedYear(entry);

  if (doi !== undefined) {
    return { confidence: "exact", key: `doi:${doi}` };
  }

  if (isbn !== undefined) {
    return {
      confidence: "exact",
      key: `isbn:${normalizeFingerprintValue(isbn)}`,
    };
  }

  if (url !== undefined) {
    return { confidence: "exact", key: `url:${normalizeUrl(url)}` };
  }

  if (title !== undefined && contributor !== undefined && year !== undefined) {
    return {
      confidence: "strong",
      key: [
        "fingerprint",
        citationSourceType(entry.entryType),
        normalizeFingerprintValue(contributor),
        normalizeFingerprintValue(year),
        normalizeFingerprintValue(title),
      ].join(":"),
    };
  }

  if (title !== undefined && contributor !== undefined) {
    return {
      confidence: "weak",
      key: [
        "possible",
        citationSourceType(entry.entryType),
        normalizeFingerprintValue(contributor),
        normalizeFingerprintValue(title),
      ].join(":"),
    };
  }

  return { confidence: "none", key: exactSourceKey(entry) };
}

/**
 * Serializes a normalized source as stable BibTeX.
 *
 * @param source Normalized citation source.
 * @returns BibTeX string with deterministic field ordering.
 */
export function citationSourceBibtexExport(
  source: NormalizedCitationSource,
): string {
  const fields = Object.entries(source.fields)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `  ${name} = {${escapeBibtexValue(value)}},`);

  return [`@${source.entryType}{${source.key},`, ...fields, "}"].join("\n");
}

/**
 * Serializes a normalized source as RIS.
 *
 * @param source Normalized citation source.
 * @returns RIS string with deterministic field ordering.
 */
export function citationSourceRisExport(
  source: NormalizedCitationSource,
): string {
  return [
    `TY  - ${risType(source.sourceType)}`,
    ...source.authors.map((author) => `AU  - ${author}`),
    ...source.editors.map((editor) => `ED  - ${editor}`),
    risField("TI", source.title),
    risField("T2", source.containerTitle),
    risField("PY", source.year),
    risField("DA", source.date),
    risField("DO", source.doi),
    risField("SN", source.isbn),
    risField("UR", source.url),
    risField("Y2", source.accessDate),
    risField("PB", source.publisher),
    risField("SP", source.pages),
    "ER  -",
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");
}

/**
 * Serializes a normalized source as a CSL-like JSON object.
 *
 * @param source Normalized citation source.
 * @returns CSL-like JSON object for downstream adapters.
 */
export function citationSourceCslJson(
  source: NormalizedCitationSource,
): CitationSourceCslJson {
  const authors = source.authors.map(cslName);
  const editors = source.editors.map(cslName);
  const accessed = dateParts(source.accessDate);
  const issued = dateParts(source.date ?? source.year);

  return {
    ...(source.doi === undefined ? {} : { DOI: source.doi }),
    ...(source.isbn === undefined ? {} : { ISBN: source.isbn }),
    ...(source.url === undefined ? {} : { URL: source.url }),
    ...(accessed === undefined ? {} : { accessed }),
    ...(authors.length === 0 ? {} : { author: authors }),
    ...(editors.length === 0 ? {} : { editor: editors }),
    id: source.key,
    ...(issued === undefined ? {} : { issued }),
    ...(source.containerTitle === undefined
      ? {}
      : { "container-title": source.containerTitle }),
    ...(source.pages === undefined ? {} : { page: source.pages }),
    ...(source.publisher === undefined ? {} : { publisher: source.publisher }),
    ...(source.title === undefined ? {} : { title: source.title }),
    type: cslType(source.sourceType),
  };
}

function citationSourceType(entryType: string): CitationSourceType {
  switch (entryType) {
    case "article":
      return "article";
    case "book":
      return "book";
    case "dataset":
      return "dataset";
    case "inbook":
    case "incollection":
      return "chapter";
    case "inproceedings":
    case "proceedings":
      return "conference-paper";
    case "online":
    case "www":
      return "web";
    case "software":
      return "software";
    default:
      return "misc";
  }
}

function exactSourceKey(entry: ParsedBibtexEntry): string {
  return [
    "exact",
    entry.entryType,
    entry.normalizedKey,
    ...Object.entries(entry.fields)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${normalizeFingerprintValue(value)}`),
  ].join("\n");
}

function normalizedContainerTitle(
  entry: ParsedBibtexEntry,
): string | undefined {
  return (
    normalizedField(entry, "journal") ??
    normalizedField(entry, "journaltitle") ??
    normalizedField(entry, "booktitle")
  );
}

function normalizedYear(entry: ParsedBibtexEntry): string | undefined {
  return (
    normalizedField(entry, "year") ??
    normalizedField(entry, "date")?.match(/\d{4}/u)?.at(0)
  );
}

function normalizedDoiField(entry: ParsedBibtexEntry): string | undefined {
  const doi = normalizedField(entry, "doi");

  return doi === undefined ? undefined : normalizeDoi(doi);
}

function normalizedField(
  entry: ParsedBibtexEntry,
  name: string,
): string | undefined {
  const value = Object.entries(entry.fields).find(
    ([key]) => key.toLowerCase() === name.toLowerCase(),
  )?.[1];
  const normalized =
    value === undefined
      ? undefined
      : value.replace(/[{}]/gu, "").replace(/\s+/gu, " ").trim();

  return normalized === "" ? undefined : normalized;
}

function peopleList(value: string | undefined): string[] {
  return value === undefined
    ? []
    : value
        .split(/\s+and\s+/iu)
        .map((person) => person.trim())
        .filter((person) => person.length > 0);
}

function normalizeDoi(value: string): string {
  return value.replace(/^https?:\/\/(?:dx\.)?doi\.org\//iu, "").toLowerCase();
}

function normalizeUrl(value: string): string {
  return value.trim();
}

function normalizeFingerprintValue(value: string): string {
  return value.trim().toLowerCase().replace(/[{}]/gu, "").replace(/\s+/gu, " ");
}

function escapeBibtexValue(value: string): string {
  return value.replace(/[{}]/gu, (character) => `\\${character}`);
}

function risType(sourceType: CitationSourceType): string {
  switch (sourceType) {
    case "article":
      return "JOUR";
    case "book":
      return "BOOK";
    case "chapter":
      return "CHAP";
    case "conference-paper":
      return "CPAPER";
    case "dataset":
      return "DATA";
    case "misc":
      return "GEN";
    case "software":
      return "COMP";
    case "web":
      return "ELEC";
  }
}

function cslType(sourceType: CitationSourceType): string {
  switch (sourceType) {
    case "article":
      return "article-journal";
    case "book":
      return "book";
    case "chapter":
      return "chapter";
    case "conference-paper":
      return "paper-conference";
    case "dataset":
      return "dataset";
    case "misc":
      return "document";
    case "software":
      return "software";
    case "web":
      return "webpage";
  }
}

function risField(
  label: string,
  value: string | undefined,
): string | undefined {
  return value === undefined ? undefined : `${label}  - ${value}`;
}

function cslName(value: string): CitationSourceCslName {
  const parts = value.split(",").map((part) => part.trim());

  return parts.length === 2 && parts[0] !== "" && parts[1] !== ""
    ? { family: parts[0], given: parts[1] }
    : { literal: value };
}

function dateParts(
  value: string | undefined,
): CitationSourceCslDateParts | undefined {
  if (value === undefined) {
    return undefined;
  }

  const [yearPart, monthPart, dayPart] = value.split(/[-/]/u);
  const year = Number.parseInt(yearPart ?? "", 10);
  const month =
    monthPart === undefined ? undefined : Number.parseInt(monthPart, 10);
  const day = dayPart === undefined ? undefined : Number.parseInt(dayPart, 10);

  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    return undefined;
  }

  if (month === undefined) {
    return { "date-parts": [[year]] };
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return undefined;
  }

  if (day === undefined) {
    return { "date-parts": [[year, month]] };
  }

  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return undefined;
  }

  return { "date-parts": [[year, month, day]] };
}
