import { describe, expect, test } from "bun:test";

import {
  articleListDescriptionFitClass,
  articleListDescriptionFitVariant,
  articleListTitleFitClass,
  articleListTitleFitVariant,
} from "../../../../src/lib/articles/article-list-title-fit";

describe("article list title fitting", () => {
  test("keeps short article-list titles at the default size", () => {
    expect(articleListTitleFitVariant("Article Title", true)).toBe("default");
    expect(articleListTitleFitClass("Article Title", true)).toBe(
      "text-xl md:text-2xl",
    );
  });

  test("shrinks dense titles before falling back to truncation", () => {
    const denseTitle =
      "Wittgenstein's Most Beloved Quote Was Real, But It's Fake Now";

    expect(articleListTitleFitVariant(denseTitle, true)).toBe("dense");
    expect(articleListTitleFitClass(denseTitle, true)).toBe(
      "text-lg md:text-xl",
    );
  });

  test("uses the compact lower-bound size for hostile long titles", () => {
    const compactTitle =
      "A Long Article Title Containing metamemeticcounterinterpretation";

    expect(articleListTitleFitVariant(compactTitle, true)).toBe("compact");
    expect(articleListTitleFitClass(compactTitle, true)).toBe(
      "text-base md:text-lg",
    );
  });

  test("uses the minimum emergency size before the hard clamp", () => {
    const minimumTitle =
      "A Very Long Article Title Containing metamemeticcountercounterinterpretationwithoutnaturalbreakpoints";

    expect(articleListTitleFitVariant(minimumTitle, true)).toBe("minimum");
    expect(articleListTitleFitClass(minimumTitle, true)).toBe(
      "text-sm md:text-base",
    );
  });

  test("accounts for thumbnail columns reducing available text width", () => {
    const borderlineTitle =
      "Memes and Humor: Reply to Claudia Vulliamy's What Is a Meme?";

    expect(articleListTitleFitVariant(borderlineTitle, false)).toBe("default");
    expect(articleListTitleFitVariant(borderlineTitle, true)).toBe("dense");
  });
});

describe("article list description fitting", () => {
  test("keeps short article-list descriptions at the default size", () => {
    expect(
      articleListDescriptionFitVariant("A concise article description.", true),
    ).toBe("default");
    expect(
      articleListDescriptionFitClass("A concise article description.", true),
    ).toBe("text-sm leading-6 md:text-base md:leading-7");
  });

  test("uses a compact description size before truncation", () => {
    const compactDescription =
      "A longer article description that should stay readable in three lines while preserving the concise editorial rhythm of repeated archive rows, even with an image column.";

    expect(articleListDescriptionFitVariant(compactDescription, true)).toBe(
      "compact",
    );
    expect(articleListDescriptionFitClass(compactDescription, true)).toBe(
      "text-sm leading-6",
    );
  });

  test("uses a tight readable description size for very long excerpts", () => {
    const tightDescription =
      "A very long article description containing a hostile metamemeticcountercounterinterpretationwithoutnaturalbreakpoints sequence and enough surrounding prose to exceed the normal three-line budget while preserving scannable row rhythm.";

    expect(articleListDescriptionFitVariant(tightDescription, true)).toBe(
      "tight",
    );
    expect(articleListDescriptionFitClass(tightDescription, true)).toBe(
      "text-sm leading-5",
    );
  });

  test("ignores excerpt highlight markup when choosing description density", () => {
    const plainDescription =
      "A longer article description with highlighted search text that should compact based on readable text, not markup.";
    const markedDescription =
      "A longer article description with <mark>highlighted</mark> search text that should compact based on readable text, not markup.";

    expect(articleListDescriptionFitVariant(markedDescription, false)).toBe(
      articleListDescriptionFitVariant(plainDescription, false),
    );
  });
});
