/** Parsed `justfile` recipe name. */
export type JustRecipeName = string;

/**
 * Parses recipe names from a `justfile` without regular-expression backtracking.
 *
 * @param justfile Raw justfile text.
 * @returns Recipe names in source order.
 */
export function parseJustRecipes(justfile: string): JustRecipeName[] {
  return justfile
    .split("\n")
    .map((line) => (line.endsWith("\r") ? line.slice(0, -1) : line))
    .flatMap((line) => {
      const recipeName = parseJustRecipeName(line);

      return recipeName === undefined ? [] : [recipeName];
    });
}

/**
 * Returns one recipe block from a raw `justfile`.
 *
 * @param justfile Raw justfile text.
 * @param recipeName Recipe name to locate.
 * @returns Source text for the recipe.
 */
export function justRecipeBlock(
  justfile: string,
  recipeName: JustRecipeName,
): string {
  const lines = justfile
    .split("\n")
    .map((line) => (line.endsWith("\r") ? line.slice(0, -1) : line));
  const start = lines.findIndex(
    (line) => parseJustRecipeName(line) === recipeName,
  );

  if (start === -1) {
    throw new Error(`Missing just recipe ${recipeName}.`);
  }

  const nextRecipe = lines.findIndex(
    (line, index) => index > start && parseJustRecipeName(line) !== undefined,
  );
  const blockLines =
    nextRecipe === -1 ? lines.slice(start) : lines.slice(start, nextRecipe);

  return blockLines.join("\n");
}

function parseJustRecipeName(line: string): JustRecipeName | undefined {
  if (line === "" || line.startsWith("#") || startsWithWhitespace(line)) {
    return undefined;
  }

  const colonIndex = line.indexOf(":");

  if (colonIndex === -1) {
    return undefined;
  }

  const token = firstToken(line.slice(0, colonIndex));
  const normalizedToken = token.startsWith("@") ? token.slice(1) : token;

  return isJustRecipeName(normalizedToken) ? normalizedToken : undefined;
}

function firstToken(value: string): string {
  const trimmed = value.trim();
  const spaceIndex = trimmed.indexOf(" ");
  const tabIndex = trimmed.indexOf("\t");
  const endCandidates = [spaceIndex, tabIndex].filter((index) => index !== -1);
  const end =
    endCandidates.length === 0 ? trimmed.length : Math.min(...endCandidates);

  return trimmed.slice(0, end);
}

function isJustRecipeName(value: string): value is JustRecipeName {
  if (value.length === 0 || !isLowercaseAsciiLetter(value.charCodeAt(0))) {
    return false;
  }

  return Array.from(value)
    .slice(1)
    .every((character) => {
      const codePoint = character.charCodeAt(0);

      return (
        isLowercaseAsciiLetter(codePoint) ||
        isAsciiDigit(codePoint) ||
        character === "-"
      );
    });
}

function isLowercaseAsciiLetter(codePoint: number): boolean {
  return codePoint >= 97 && codePoint <= 122;
}

function isAsciiDigit(codePoint: number): boolean {
  return codePoint >= 48 && codePoint <= 57;
}

function startsWithWhitespace(value: string): boolean {
  return value.startsWith(" ") || value.startsWith("\t");
}
