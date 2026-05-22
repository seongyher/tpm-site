import { SITE_TITLE } from "../../routes/routes";

/** Author data needed to generate article citations. */
interface ArticleCitationAuthor {
  displayName: string;
  type: "anonymous" | "collective" | "organization" | "person";
}

/** Input metadata for generated article citations. */
interface ArticleCitationInput {
  articleId: string;
  authors?: readonly ArticleCitationAuthor[] | undefined;
  canonicalUrl: string;
  legacyAuthor?: string | undefined;
  publishedAt: Date;
  siteTitle?: string | undefined;
  title: string;
}

/** Generated citation text for one supported format. */
interface GeneratedArticleCitation {
  id:
    | "apa"
    | "bibtex"
    | "chicago-author-date"
    | "chicago-notes"
    | "harvard"
    | "ieee"
    | "mla"
    | "ris";
  label:
    | "APA"
    | "BibTeX"
    | "Chicago Author-Date"
    | "Chicago Notes"
    | "Harvard"
    | "IEEE"
    | "MLA"
    | "RIS";
  text: string;
}

/** Display-ready view model consumed by ArticleCitationMenu. */
export interface ArticleCitationMenuViewModel {
  articleId: string;
  canonicalUrl: string;
  formats: readonly GeneratedArticleCitation[];
  title: string;
}

interface CitationPerson {
  displayName: string;
  type: ArticleCitationAuthor["type"];
}

const terminalPunctuationPattern = /[.?!]"?$/u;
const bibtexSpecialCharacters = new Map([
  ["#", "\\#"],
  ["$", "\\$"],
  ["%", "\\%"],
  ["&", "\\&"],
  ["\\", "\\textbackslash{}"],
  ["_", "\\_"],
  ["{", "\\{"],
  ["}", "\\}"],
]);
const mlaMonths = [
  "Jan.",
  "Feb.",
  "Mar.",
  "Apr.",
  "May",
  "June",
  "July",
  "Aug.",
  "Sept.",
  "Oct.",
  "Nov.",
  "Dec.",
] as const;
const longMonths = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/**
 * Builds the view model used by the article citation menu.
 *
 * @param input Article metadata needed for generated citations.
 * @returns Display-ready citation menu model.
 */
export function articleCitationMenuViewModel(
  input: ArticleCitationInput,
): ArticleCitationMenuViewModel {
  return {
    articleId: input.articleId,
    canonicalUrl: input.canonicalUrl,
    formats: generatedArticleCitations(input),
    title: input.title,
  };
}

/**
 * Generates every initially supported citation format for one article.
 *
 * @param input Article metadata needed for generated citations.
 * @returns Generated citation text in deterministic format order.
 */
function generatedArticleCitations(
  input: ArticleCitationInput,
): GeneratedArticleCitation[] {
  return [
    {
      id: "apa",
      label: "APA",
      text: articleApaCitation(input),
    },
    {
      id: "mla",
      label: "MLA",
      text: articleMlaCitation(input),
    },
    {
      id: "chicago-notes",
      label: "Chicago Notes",
      text: articleChicagoNotesCitation(input),
    },
    {
      id: "chicago-author-date",
      label: "Chicago Author-Date",
      text: articleChicagoAuthorDateCitation(input),
    },
    {
      id: "harvard",
      label: "Harvard",
      text: articleHarvardCitation(input),
    },
    {
      id: "ieee",
      label: "IEEE",
      text: articleIeeeCitation(input),
    },
    {
      id: "bibtex",
      label: "BibTeX",
      text: articleBibtexCitation(input),
    },
    {
      id: "ris",
      label: "RIS",
      text: articleRisCitation(input),
    },
  ];
}

/**
 * Generates an APA-style web-page citation for an article.
 *
 * @param input Article metadata needed for generated citations.
 * @returns APA-style citation text.
 */
export function articleApaCitation(input: ArticleCitationInput): string {
  const siteTitle = input.siteTitle ?? SITE_TITLE;
  const author = apaAuthor(input);
  const authorPrefix = author === undefined ? "" : `${author} `;

  return `${authorPrefix}(${apaDate(input.publishedAt)}). ${sentenceTitle(input.title)} ${siteTitle}. ${input.canonicalUrl}`;
}

/**
 * Generates a BibTeX-compatible citation for an article.
 *
 * @param input Article metadata needed for generated citations.
 * @returns BibTeX citation text.
 */
export function articleBibtexCitation(input: ArticleCitationInput): string {
  const siteTitle = input.siteTitle ?? SITE_TITLE;
  const date = isoDate(input.publishedAt);
  const year = String(input.publishedAt.getUTCFullYear());
  const author = bibtexAuthor(input);
  const fields = [
    field("author", author),
    field("title", input.title),
    field("year", year),
    field("date", date),
    field("organization", siteTitle),
    field("url", input.canonicalUrl),
  ].filter((line) => line !== undefined);

  return [`@online{${bibtexKey(input.articleId)},`, ...fields, "}"].join("\n");
}

/**
 * Generates a concise MLA-style citation for an article.
 *
 * @param input Article metadata needed for generated citations.
 * @returns MLA-style citation text.
 */
export function articleMlaCitation(input: ArticleCitationInput): string {
  const siteTitle = input.siteTitle ?? SITE_TITLE;
  const author = mlaAuthor(input);
  const authorPrefix = author === undefined ? "" : `${author}. `;
  const title = sentenceTitle(input.title);

  return `${authorPrefix}"${title}" ${siteTitle}, ${mlaDate(input.publishedAt)}, ${input.canonicalUrl}.`;
}

/**
 * Generates a Chicago notes-and-bibliography style citation for an article.
 *
 * @param input Article metadata needed for generated citations.
 * @returns Chicago notes-and-bibliography style citation text.
 */
export function articleChicagoNotesCitation(
  input: ArticleCitationInput,
): string {
  const siteTitle = input.siteTitle ?? SITE_TITLE;
  const author = chicagoAuthor(input);
  const authorPrefix = author === undefined ? "" : `${author}. `;
  const title = sentenceTitle(input.title);

  return `${authorPrefix}"${title}" ${siteTitle}. ${longDate(input.publishedAt)}. ${input.canonicalUrl}.`;
}

/**
 * Generates a Chicago author-date style citation for an article.
 *
 * @param input Article metadata needed for generated citations.
 * @returns Chicago author-date style citation text.
 */
export function articleChicagoAuthorDateCitation(
  input: ArticleCitationInput,
): string {
  const siteTitle = input.siteTitle ?? SITE_TITLE;
  const author = chicagoAuthor(input);
  const year = input.publishedAt.getUTCFullYear();
  const authorPrefix = author === undefined ? "" : `${author}. `;
  const title = sentenceTitle(input.title);

  return `${authorPrefix}${year}. "${title}" ${siteTitle}. ${longDate(input.publishedAt)}. ${input.canonicalUrl}.`;
}

/**
 * Generates a Harvard-style web-page citation for an article.
 *
 * @param input Article metadata needed for generated citations.
 * @returns Harvard-style citation text.
 */
export function articleHarvardCitation(input: ArticleCitationInput): string {
  const siteTitle = input.siteTitle ?? SITE_TITLE;
  const author = apaAuthor(input);
  const year = input.publishedAt.getUTCFullYear();
  const authorPrefix = author === undefined ? "" : `${author} `;

  return `${authorPrefix}(${year}) '${input.title}', ${siteTitle}, ${dayMonthYear(input.publishedAt)}. Available at: ${input.canonicalUrl}.`;
}

/**
 * Generates an IEEE-style web-page citation for an article.
 *
 * @param input Article metadata needed for generated citations.
 * @returns IEEE-style citation text.
 */
export function articleIeeeCitation(input: ArticleCitationInput): string {
  const siteTitle = input.siteTitle ?? SITE_TITLE;
  const author = ieeeAuthor(input);
  const authorPrefix = author === undefined ? "" : `${author}, `;

  return `${authorPrefix}"${input.title}," ${siteTitle}, ${ieeeDate(input.publishedAt)}. [Online]. Available: ${input.canonicalUrl}`;
}

/**
 * Generates an RIS citation-manager export for an article.
 *
 * @param input Article metadata needed for generated citations.
 * @returns RIS citation text.
 */
export function articleRisCitation(input: ArticleCitationInput): string {
  const siteTitle = input.siteTitle ?? SITE_TITLE;
  const authorLines = citationPeople(input).map(
    (author) => `AU  - ${risAuthorName(author)}`,
  );

  return [
    "TY  - ELEC",
    `TI  - ${input.title}`,
    ...authorLines,
    `T2  - ${siteTitle}`,
    `DA  - ${isoDate(input.publishedAt)}`,
    `UR  - ${input.canonicalUrl}`,
    "ER  -",
  ].join("\n");
}

function field(name: string, value: string | undefined): string | undefined {
  return value === undefined
    ? undefined
    : `  ${name} = {${bibtexValue(value)}},`;
}

function bibtexAuthor(input: ArticleCitationInput): string | undefined {
  const authors = citationPeople(input);

  return authors.length > 0
    ? authors.map((author) => author.displayName).join(" and ")
    : undefined;
}

function mlaAuthor(input: ArticleCitationInput): string | undefined {
  const authors = citationPeople(input);

  if (authors.length === 0) {
    return undefined;
  }

  if (authors.length > 2) {
    const [firstAuthor] = authors;

    return firstAuthor === undefined
      ? undefined
      : `${mlaAuthorName(firstAuthor)}, et al`;
  }

  return authors.map(mlaAuthorName).join(", and ");
}

function apaAuthor(input: ArticleCitationInput): string | undefined {
  const authors = citationPeople(input);

  if (authors.length === 0) {
    return undefined;
  }

  if (authors.length === 1) {
    return authors.map(apaAuthorName).join("");
  }

  const authorNames = authors.map(apaAuthorName);
  const lastAuthor = authorNames.at(-1);
  const otherAuthors = authorNames.slice(0, -1);

  return lastAuthor === undefined
    ? authorNames.join(", ")
    : `${otherAuthors.join(", ")}, & ${lastAuthor}`;
}

function chicagoAuthor(input: ArticleCitationInput): string | undefined {
  const authors = citationPeople(input);

  if (authors.length === 0) {
    return undefined;
  }

  if (authors.length > 2) {
    const [firstAuthor] = authors;

    return firstAuthor === undefined
      ? undefined
      : `${mlaAuthorName(firstAuthor)}, et al`;
  }

  return authors.map(mlaAuthorName).join(", and ");
}

function ieeeAuthor(input: ArticleCitationInput): string | undefined {
  const authors = citationPeople(input);

  if (authors.length === 0) {
    return undefined;
  }

  if (authors.length > 3) {
    const [firstAuthor] = authors;

    return firstAuthor === undefined
      ? undefined
      : `${ieeeAuthorName(firstAuthor)} et al.`;
  }

  return authors.map(ieeeAuthorName).join(", ");
}

function citationPeople(input: ArticleCitationInput): CitationPerson[] {
  if (input.authors !== undefined && input.authors.length > 0) {
    return input.authors
      .map((author) => ({
        displayName: author.displayName.trim(),
        type: author.type,
      }))
      .filter((author) => author.displayName.length > 0);
  }

  const legacy = input.legacyAuthor?.trim();

  return legacy === undefined || legacy.length === 0
    ? []
    : legacy.split(/\s*&\s*/u).map((displayName) => ({
        displayName,
        type: "person",
      }));
}

function mlaAuthorName(author: CitationPerson): string {
  if (author.type !== "person") {
    return author.displayName;
  }

  const parts = author.displayName.split(/\s+/u);
  const last = parts.at(-1);
  const rest = parts.slice(0, -1).join(" ");

  return last === undefined || rest.length === 0
    ? author.displayName
    : `${last}, ${rest}`;
}

function apaAuthorName(author: CitationPerson): string {
  if (author.type !== "person") {
    return author.displayName;
  }

  const parts = author.displayName.split(/\s+/u);
  const last = parts.at(-1);
  const rest = parts.slice(0, -1).join(" ");

  return last === undefined || rest.length === 0
    ? author.displayName
    : `${last}, ${initials(rest)}`;
}

function ieeeAuthorName(author: CitationPerson): string {
  if (author.type !== "person") {
    return author.displayName;
  }

  const parts = author.displayName.split(/\s+/u);
  const last = parts.at(-1);
  const rest = parts.slice(0, -1).join(" ");

  return last === undefined || rest.length === 0
    ? author.displayName
    : `${initials(rest)} ${last}`;
}

function risAuthorName(author: CitationPerson): string {
  return author.type === "person" ? mlaAuthorName(author) : author.displayName;
}

function initials(name: string): string {
  return name
    .split(/\s+/u)
    .filter((part) => part.length > 0)
    .map((part) =>
      part
        .split("-")
        .filter((piece) => piece.length > 0)
        .map((piece) => `${piece[0]?.toUpperCase() ?? ""}.`)
        .join("-"),
    )
    .join(" ");
}

function bibtexKey(articleId: string): string {
  const slug = articleId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");

  return slug.length === 0 ? "site-article" : `site-${slug}`;
}

function bibtexValue(value: string): string {
  return Array.from(
    value,
    (character) => bibtexSpecialCharacters.get(character) ?? character,
  ).join("");
}

function sentenceTitle(title: string): string {
  return terminalPunctuationPattern.test(title) ? title : `${title}.`;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function mlaDate(date: Date): string {
  const month = mlaMonths[date.getUTCMonth()] ?? "";

  return `${date.getUTCDate()} ${month} ${date.getUTCFullYear()}`;
}

function apaDate(date: Date): string {
  const month = longMonths[date.getUTCMonth()] ?? "";

  return `${date.getUTCFullYear()}, ${month} ${date.getUTCDate()}`;
}

function longDate(date: Date): string {
  const month = longMonths[date.getUTCMonth()] ?? "";

  return `${month} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

function dayMonthYear(date: Date): string {
  const month = longMonths[date.getUTCMonth()] ?? "";

  return `${date.getUTCDate()} ${month} ${date.getUTCFullYear()}`;
}

function ieeeDate(date: Date): string {
  const month = mlaMonths[date.getUTCMonth()] ?? "";

  return `${month} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}
