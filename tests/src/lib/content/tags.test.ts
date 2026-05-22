import { describe, expect, test } from "bun:test";

import {
  normalizeTag,
  normalizeTagList,
  tagDiagnostics,
  tagPathSegment,
  tagSummariesFromArticles,
} from "../../../../src/lib/content/tags";
import { articleEntry } from "../../../helpers/content";

describe("tag helpers", () => {
  test("normalizes tag labels into canonical display form", () => {
    expect(normalizeTag("  Meme   History ")).toBe("meme history");
    expect(normalizeTag("C++")).toBe("c++");
  });

  test("reports noncanonical, duplicate, empty, and slash tags", () => {
    expect(
      tagDiagnostics(["Meme History", "meme   history", " ", "/pol/"]).map(
        (diagnostic) => diagnostic.message,
      ),
    ).toEqual([
      'tag must be canonical "meme history"',
      'tag must be canonical "meme history"',
      'duplicate canonical tag "meme history" also appears at index 0',
      "tag must not be empty",
      'tag must not contain "/"',
    ]);
  });

  test("normalizes safe tag lists and deduplicates after normalization", () => {
    expect(normalizeTagList([" Memes ", "memes", "Digital   Art"])).toEqual({
      changed: true,
      diagnostics: [],
      tags: ["memes", "digital art"],
    });
  });

  test("keeps invalid slash tags as diagnostics for manual repair", () => {
    expect(normalizeTagList(["/pol/"])).toMatchObject({
      changed: false,
      diagnostics: [
        {
          index: 0,
          message: 'tag must not contain "/"',
          value: "/pol/",
        },
      ],
      tags: ["/pol/"],
    });
  });

  test("builds encoded route segments without treating punctuation as slugs", () => {
    expect(tagPathSegment("meme history")).toBe("meme%20history");
    expect(tagPathSegment("c++")).toBe("c%2B%2B");
  });

  test("groups articles by canonical tags and sorts summaries deterministically", () => {
    const older = articleEntry({
      data: {
        date: new Date("2020-01-01T00:00:00.000Z"),
        tags: ["meme history", "memes"],
        title: "Older",
      },
      id: "older",
    });
    const newer = articleEntry({
      data: {
        date: new Date("2022-01-01T00:00:00.000Z"),
        tags: ["meme history"],
        title: "Newer",
      },
      id: "newer",
    });

    const summaries = tagSummariesFromArticles([older, newer]);

    expect(summaries.map((summary) => summary.label)).toEqual([
      "meme history",
      "memes",
    ]);
    expect(summaries[0]).toMatchObject({
      href: "/tags/meme%20history/",
      pathSegment: "meme%20history",
    });
    expect(summaries[0]?.articles.map((article) => article.id)).toEqual([
      "newer",
      "older",
    ]);
  });
});
