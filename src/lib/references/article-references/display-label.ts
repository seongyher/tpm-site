import type {
  ArticleReferenceBlockContent,
  ArticleReferenceDisplayLabel,
  ArticleReferenceInlineContent,
  ArticleReferenceLabel,
} from "./model";

/** Result of display-label extraction from a reference definition. */
type DisplayLabelExtractionResult =
  | {
      children: readonly ArticleReferenceBlockContent[];
      displayLabel?: ArticleReferenceDisplayLabel;
      ok: true;
    }
  | {
      label: ArticleReferenceLabel;
      ok: false;
    };

const displayLabelOpen = "[@";
const displayLabelClose = "]";

/**
 * Extracts a valid leading `[@...]` definition display label.
 *
 * @param label Canonical reference label used for diagnostics.
 * @param children Serializable definition content.
 * @returns Definition content with leading display label metadata removed.
 */
export function extractLeadingDisplayLabel(
  label: ArticleReferenceLabel,
  children: readonly ArticleReferenceBlockContent[],
): DisplayLabelExtractionResult {
  const [firstBlock, ...restBlocks] = children;

  if (
    firstBlock === undefined ||
    !("children" in firstBlock) ||
    firstBlock.children.length === 0
  ) {
    return { children, ok: true };
  }

  const [firstInline, ...restInline] = firstBlock.children;

  if (firstInline?.kind !== "text") {
    return { children, ok: true };
  }

  if (!firstInline.text.startsWith(displayLabelOpen)) {
    return { children, ok: true };
  }

  const closeIndex = firstInline.text.indexOf(displayLabelClose);

  if (closeIndex < displayLabelOpen.length) {
    return { label, ok: false };
  }

  const displayLabel = firstInline.text
    .slice(displayLabelOpen.length, closeIndex)
    .trim();

  if (displayLabel === "" || /[\r\n\]]/u.test(displayLabel)) {
    return { label, ok: false };
  }

  const remainingText = firstInline.text
    .slice(closeIndex + 1)
    .replace(/^ /u, "");
  const nextInlineChildren =
    remainingText === ""
      ? restInline
      : [{ ...firstInline, text: remainingText }, ...restInline];
  const nextFirstBlock = {
    ...firstBlock,
    children: nextInlineChildren,
    text: textFromInlineContent(nextInlineChildren),
  };

  return {
    children: [nextFirstBlock, ...restBlocks],
    displayLabel,
    ok: true,
  };
}

function textFromInlineContent(
  children: readonly ArticleReferenceInlineContent[],
): string {
  return children.map((child) => child.text).join("");
}
