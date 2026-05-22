import type { ParsedBibtexEntry } from "./model";

/** Diagnostic emitted when a `tpm-bibtex` data block cannot be parsed. */
interface BibtexParseDiagnostic {
  message: string;
  offset: number;
}

/** Result of parsing one or more BibTeX entries from a source block. */
type BibtexParseResult =
  | { diagnostics: readonly BibtexParseDiagnostic[]; ok: false }
  | { entries: readonly ParsedBibtexEntry[]; ok: true };

interface ParserState {
  index: number;
  source: string;
}

type ParseEntryResult =
  | { diagnostic: BibtexParseDiagnostic; ok: false }
  | { entry: ParsedBibtexEntry; ok: true };

type ParseFieldsResult =
  | { diagnostic: BibtexParseDiagnostic; ok: false }
  | { fields: Readonly<Record<string, string>>; ok: true };

type ParseValueResult =
  | { diagnostic: BibtexParseDiagnostic; ok: false }
  | { ok: true; value: string };

type SkipIgnoredEntryResult =
  | { diagnostic: BibtexParseDiagnostic; ok: false }
  | { ok: true };

/**
 * Parses BibTeX data blocks into serializable entries.
 *
 * This intentionally handles the common citation-manager subset used by the
 * site: `@type{key, field = {value}}` and `@type(key, field = "value")`.
 *
 * @param source Raw `tpm-bibtex` fenced-code value.
 * @returns Parsed entries or precise parse diagnostics.
 */
export function parseBibtexEntries(source: string): BibtexParseResult {
  const state: ParserState = { index: 0, source };
  const entries: ParsedBibtexEntry[] = [];
  const diagnostics: BibtexParseDiagnostic[] = [];

  while (state.index < source.length) {
    skipIgnorable(state);

    if (state.index >= source.length) {
      break;
    }

    if (source.at(state.index) !== "@") {
      diagnostics.push(
        diagnostic(state, "Expected a BibTeX entry starting with '@'."),
      );
      break;
    }

    const entry = parseEntry(state);

    if (entry.ok) {
      if (!isIgnoredEntryType(entry.entry.entryType)) {
        entries.push(entry.entry);
      }
    } else {
      diagnostics.push(entry.diagnostic);
      break;
    }
  }

  return diagnostics.length > 0
    ? { diagnostics, ok: false }
    : { entries, ok: true };
}

function parseEntry(state: ParserState): ParseEntryResult {
  const rawStart = state.index;
  state.index += 1;

  const entryType = parseIdentifier(state).toLowerCase();

  if (entryType === "") {
    return {
      diagnostic: diagnostic(state, "Expected a BibTeX entry type after '@'."),
      ok: false,
    };
  }

  skipWhitespace(state);

  const opener = state.source.at(state.index);

  if (opener !== "{" && opener !== "(") {
    return {
      diagnostic: diagnostic(state, "Expected '{' or '(' after BibTeX type."),
      ok: false,
    };
  }

  state.index += 1;
  skipWhitespace(state);

  if (isIgnoredEntryType(entryType)) {
    const skipped = skipIgnoredEntryBody(state, opener);

    if (!skipped.ok) {
      return skipped;
    }

    return {
      entry: {
        entryType,
        fields: {},
        key: `ignored-${rawStart}`,
        normalizedKey: `ignored-${rawStart}`,
        raw: state.source.slice(rawStart, state.index),
      },
      ok: true,
    };
  }

  const key = parseKey(state);

  if (key === "") {
    return {
      diagnostic: diagnostic(state, "Expected a BibTeX key."),
      ok: false,
    };
  }

  skipWhitespace(state);

  if (state.source.at(state.index) !== ",") {
    return {
      diagnostic: diagnostic(state, "Expected ',' after BibTeX key."),
      ok: false,
    };
  }

  state.index += 1;

  const fields = parseFields(state, matchingCloser(opener));

  if (!fields.ok) {
    return fields;
  }

  const raw = state.source.slice(rawStart, state.index);

  return {
    entry: {
      entryType,
      fields: fields.fields,
      key,
      normalizedKey: key.toLowerCase(),
      raw,
    },
    ok: true,
  };
}

function parseFields(state: ParserState, closer: string): ParseFieldsResult {
  const fields = new Map<string, string>();

  while (state.index < state.source.length) {
    skipWhitespace(state);

    if (state.source.at(state.index) === closer) {
      state.index += 1;
      return { fields: Object.fromEntries(fields), ok: true };
    }

    const fieldName = parseIdentifier(state).toLowerCase();

    if (fieldName === "") {
      return {
        diagnostic: diagnostic(state, "Expected a BibTeX field name."),
        ok: false,
      };
    }

    skipWhitespace(state);

    if (state.source.at(state.index) !== "=") {
      return {
        diagnostic: diagnostic(state, "Expected '=' after BibTeX field name."),
        ok: false,
      };
    }

    state.index += 1;
    skipWhitespace(state);

    const value = parseValue(state, closer);

    if (!value.ok) {
      return value;
    }

    fields.set(fieldName, value.value);
    skipWhitespace(state);

    if (state.source.at(state.index) === ",") {
      state.index += 1;
    } else if (state.source.at(state.index) !== closer) {
      return {
        diagnostic: diagnostic(
          state,
          "Expected ',' or the end of the BibTeX entry after a field value.",
        ),
        ok: false,
      };
    }
  }

  return {
    diagnostic: diagnostic(state, "Unterminated BibTeX entry."),
    ok: false,
  };
}

function parseValue(state: ParserState, entryCloser: string): ParseValueResult {
  const token = state.source.at(state.index);

  switch (token) {
    case '"':
      return parseQuotedValue(state);
    case undefined:
      return {
        diagnostic: diagnostic(state, "Expected a BibTeX field value."),
        ok: false,
      };
    case "{":
      return parseBracedValue(state);
    default:
      return parseBareValue(state, entryCloser);
  }
}

function parseBracedValue(state: ParserState): ParseValueResult {
  state.index += 1;
  const start = state.index;
  let depth = 1;

  while (state.index < state.source.length) {
    const character = state.source.at(state.index);

    if (character === "\\") {
      state.index += 2;
      continue;
    }

    if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        const value = state.source.slice(start, state.index).trim();
        state.index += 1;
        return { ok: true, value };
      }
    }

    state.index += 1;
  }

  return {
    diagnostic: diagnostic(state, "Unterminated braced BibTeX value."),
    ok: false,
  };
}

function parseQuotedValue(state: ParserState): ParseValueResult {
  state.index += 1;
  const start = state.index;

  while (state.index < state.source.length) {
    const character = state.source.at(state.index);

    if (character === "\\") {
      state.index += 2;
      continue;
    }

    if (character === '"') {
      const value = state.source.slice(start, state.index).trim();
      state.index += 1;
      return { ok: true, value };
    }

    state.index += 1;
  }

  return {
    diagnostic: diagnostic(state, "Unterminated quoted BibTeX value."),
    ok: false,
  };
}

function parseBareValue(
  state: ParserState,
  entryCloser: string,
): ParseValueResult {
  const start = state.index;

  while (
    state.index < state.source.length &&
    state.source.at(state.index) !== "," &&
    state.source.at(state.index) !== entryCloser
  ) {
    state.index += 1;
  }

  const value = state.source.slice(start, state.index).trim();

  if (value === "") {
    return {
      diagnostic: diagnostic(state, "Expected a BibTeX field value."),
      ok: false,
    };
  }

  if (value.includes("#")) {
    return {
      diagnostic: diagnostic(
        state,
        "BibTeX string concatenation is not supported; paste a resolved field value.",
      ),
      ok: false,
    };
  }

  return { ok: true, value };
}

function parseIdentifier(state: ParserState): string {
  const start = state.index;

  while (
    state.index < state.source.length &&
    isIdentifierCharacter(state.source.at(state.index) ?? "")
  ) {
    state.index += 1;
  }

  return state.source.slice(start, state.index);
}

function parseKey(state: ParserState): string {
  const start = state.index;

  while (
    state.index < state.source.length &&
    state.source.at(state.index) !== "," &&
    !isWhitespace(state.source.at(state.index) ?? "")
  ) {
    state.index += 1;
  }

  return state.source.slice(start, state.index);
}

function skipIgnorable(state: ParserState): void {
  while (state.index < state.source.length) {
    skipWhitespace(state);

    if (state.source.at(state.index) === "%") {
      skipLine(state);
    } else {
      return;
    }
  }
}

function skipWhitespace(state: ParserState): void {
  while (
    state.index < state.source.length &&
    isWhitespace(state.source.at(state.index) ?? "")
  ) {
    state.index += 1;
  }
}

function skipLine(state: ParserState): void {
  while (
    state.index < state.source.length &&
    state.source.at(state.index) !== "\n"
  ) {
    state.index += 1;
  }
}

function skipIgnoredEntryBody(
  state: ParserState,
  opener: string,
): SkipIgnoredEntryResult {
  const closer = matchingCloser(opener);
  let depth = 1;

  while (state.index < state.source.length) {
    const character = state.source.at(state.index);

    if (character === "\\") {
      state.index += 2;
      continue;
    }

    if (character === opener) {
      depth += 1;
    } else if (character === closer) {
      depth -= 1;

      if (depth === 0) {
        state.index += 1;
        return { ok: true };
      }
    }

    state.index += 1;
  }

  return {
    diagnostic: diagnostic(state, "Unterminated ignored BibTeX entry."),
    ok: false,
  };
}

function diagnostic(
  state: ParserState,
  message: string,
): BibtexParseDiagnostic {
  return { message, offset: state.index };
}

function matchingCloser(opener: string): string {
  return opener === "{" ? "}" : ")";
}

function isIdentifierCharacter(character: string): boolean {
  return /[\w-]/u.test(character);
}

function isWhitespace(character: string): boolean {
  return /\s/u.test(character);
}

function isIgnoredEntryType(entryType: string): boolean {
  return entryType === "comment" || entryType === "preamble";
}
