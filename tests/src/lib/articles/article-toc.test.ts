import { describe, expect, test } from "bun:test";

import {
  articleTableOfContentsHeadings,
  hasUsefulTableOfContents,
} from "../../../../src/lib/articles/article-toc";
import { articleReferenceFixture } from "../../components/articles/reference-fixtures";

describe("article table of contents data", () => {
  test("normalizes Astro rendered h2 and h3 headings into hash links", () => {
    expect(
      articleTableOfContentsHeadings([
        { depth: 1, slug: "article-title", text: "Article Title" },
        { depth: 2, slug: "first-section", text: "First Section" },
        { depth: 3, slug: "nested-section", text: "Nested Section" },
        { depth: 4, slug: "too-deep", text: "Too Deep" },
      ]),
    ).toEqual([
      {
        depth: 2,
        href: "#first-section",
        id: "first-section",
        level: 1,
        order: 0,
        text: "First Section",
      },
      {
        depth: 3,
        href: "#nested-section",
        id: "nested-section",
        level: 2,
        order: 1,
        text: "Nested Section",
      },
    ]);
  });

  test("preserves deterministic duplicate heading links from Astro metadata", () => {
    expect(
      articleTableOfContentsHeadings([
        { depth: 2, slug: "repeat", text: "Repeat" },
        { depth: 2, slug: "repeat-1", text: "Repeat" },
      ]),
    ).toEqual([
      {
        depth: 2,
        href: "#repeat",
        id: "repeat",
        level: 1,
        order: 0,
        text: "Repeat",
      },
      {
        depth: 2,
        href: "#repeat-1",
        id: "repeat-1",
        level: 1,
        order: 1,
        text: "Repeat",
      },
    ]);
  });

  test("uses the shallowest included heading as the first displayed level", () => {
    expect(
      articleTableOfContentsHeadings([
        { depth: 3, slug: "first", text: "First" },
        { depth: 3, slug: "second", text: "Second" },
      ]).map((heading) => heading.level),
    ).toEqual([1, 1]);
  });

  test("requires at least two useful headings before rendering", () => {
    const oneHeading = articleTableOfContentsHeadings([
      { depth: 2, slug: "only", text: "Only" },
    ]);
    const twoHeadings = articleTableOfContentsHeadings([
      { depth: 2, slug: "first", text: "First" },
      { depth: 2, slug: "second", text: "Second" },
    ]);

    expect(hasUsefulTableOfContents(oneHeading)).toBe(false);
    expect(hasUsefulTableOfContents(twoHeadings)).toBe(true);
  });

  test("appends generated article reference sections when notes and citations exist", () => {
    expect(
      articleTableOfContentsHeadings(
        [{ depth: 2, slug: "body-section", text: "Body Section" }],
        { references: articleReferenceFixture },
      ),
    ).toEqual([
      {
        depth: 2,
        href: "#body-section",
        id: "body-section",
        level: 1,
        order: 0,
        text: "Body Section",
      },
      {
        depth: 2,
        href: "#article-references-notes-heading",
        id: "article-references-notes-heading",
        level: 1,
        order: 1,
        text: "Notes",
      },
      {
        depth: 2,
        href: "#article-references-bibliography-heading",
        id: "article-references-bibliography-heading",
        level: 1,
        order: 2,
        text: "Bibliography",
      },
    ]);
  });

  test("uses only generated reference headings that have entries", () => {
    const notesOnly = articleTableOfContentsHeadings([], {
      references: {
        citations: [],
        notes: articleReferenceFixture.notes,
      },
    });
    const citationsOnly = articleTableOfContentsHeadings([], {
      references: {
        citations: articleReferenceFixture.citations,
        notes: [],
      },
    });
    const noReferences = articleTableOfContentsHeadings([], {
      references: {
        citations: [],
        notes: [],
      },
    });

    expect(notesOnly.map((heading) => heading.text)).toEqual(["Notes"]);
    expect(citationsOnly.map((heading) => heading.text)).toEqual([
      "Bibliography",
    ]);
    expect(noReferences).toEqual([]);
  });

  test("supports a custom generated reference heading ID prefix", () => {
    expect(
      articleTableOfContentsHeadings([], {
        referenceHeadingIdPrefix: "custom-references",
        references: articleReferenceFixture,
      }).map((heading) => heading.href),
    ).toEqual([
      "#custom-references-notes-heading",
      "#custom-references-bibliography-heading",
    ]);
  });
});
