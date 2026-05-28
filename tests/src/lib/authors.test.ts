import { describe, expect, test } from "bun:test";

import {
  authorDisplayNameForArticle,
  authorEntriesForByline,
  authorProfiles,
  authorSummariesForArticle,
  hasUsefulAuthorProfileContent,
  normalizeAuthorAlias,
  unknownAuthorBylines,
} from "../../../src/lib/authors";
import { articleEntry, authorEntry } from "../../helpers/content";

describe("author helpers", () => {
  test("normalizes aliases for case-insensitive byline matching", () => {
    expect(normalizeAuthorAlias("  Seong-Young   Her ")).toBe(
      "seong-young her",
    );
  });

  test("resolves single and multi-author bylines in author order", () => {
    const seong = authorEntry({
      displayName: "Seong-Young Her",
      id: "seong-young-her",
    });
    const masha = authorEntry({
      displayName: "Masha Zharova",
      id: "masha-zharova",
    });

    expect(
      authorEntriesForByline("Seong-Young Her & Masha Zharova", [
        masha,
        seong,
      ]).map((author) => author.id),
    ).toEqual(["seong-young-her", "masha-zharova"]);
  });

  test("returns structured summaries and a structured display byline when known", () => {
    const article = articleEntry({
      data: { author: "Seong-Young Her & Masha Zharova" },
    });
    const authors = [
      authorEntry({
        displayName: "Seong-Young Her",
        id: "seong-young-her",
      }),
      authorEntry({
        displayName: "Masha Zharova",
        id: "masha-zharova",
      }),
    ];

    expect(
      authorSummariesForArticle(article, authors).map((author) => author.href),
    ).toEqual(["/authors/seong-young-her/", "/authors/masha-zharova/"]);
    expect(authorDisplayNameForArticle(article, authors)).toBe(
      "Seong-Young Her & Masha Zharova",
    );
  });

  test("falls back to the legacy byline when no author mapping exists", () => {
    const article = articleEntry({ data: { author: "Unknown Author" } });

    expect(authorSummariesForArticle(article, [])).toEqual([]);
    expect(authorDisplayNameForArticle(article, [])).toBe("Unknown Author");
    expect(unknownAuthorBylines([article], [])).toEqual(["Unknown Author"]);
  });

  test("builds profiles with sorted article relationships", () => {
    const author = authorEntry({
      displayName: "Seong-Young Her",
      id: "seong-young-her",
    });
    const older = articleEntry({
      data: {
        author: "Seong-Young Her",
        date: new Date("2020-01-01T00:00:00.000Z"),
      },
      id: "older",
    });
    const newer = articleEntry({
      data: {
        author: "Seong-Young Her",
        date: new Date("2022-01-01T00:00:00.000Z"),
      },
      id: "newer",
    });

    expect(authorProfiles([author], [older, newer])[0]?.articles).toEqual([
      newer,
      older,
    ]);
  });

  test("sorts author profiles by display name", () => {
    const zed = authorEntry({
      displayName: "Zed Author",
      id: "zed-author",
    });
    const ada = authorEntry({
      displayName: "Ada Author",
      id: "ada-author",
    });

    expect(authorProfiles([zed, ada], []).map((profile) => profile.id)).toEqual(
      ["ada-author", "zed-author"],
    );
  });

  test("detects author profiles that should render biography content", () => {
    const emptyProfile = authorProfiles(
      [
        authorEntry({
          displayName: "Seong-Young Her",
          id: "seong-young-her",
        }),
      ],
      [],
    )[0];
    const profileWithBio = authorProfiles(
      [
        authorEntry({
          displayName: "Masha Zharova",
          id: "masha-zharova",
          shortBio: "Short profile.",
        }),
      ],
      [],
    )[0];

    if (emptyProfile === undefined || profileWithBio === undefined) {
      throw new Error("Expected test author profiles.");
    }

    expect(hasUsefulAuthorProfileContent(emptyProfile)).toBe(false);
    expect(
      hasUsefulAuthorProfileContent(emptyProfile, { hasProfileBody: true }),
    ).toBe(true);
    expect(hasUsefulAuthorProfileContent(profileWithBio)).toBe(true);
  });

  test("fails duplicate aliases across author profiles", () => {
    const first = authorEntry({
      aliases: ["Another", "Same"],
      displayName: "First",
      id: "first",
    });
    const second = authorEntry({
      aliases: ["same"],
      displayName: "Second",
      id: "second",
    });
    const third = authorEntry({
      aliases: ["another"],
      displayName: "Third",
      id: "third",
    });

    expect(() => authorProfiles([first, second, third], [])).toThrow(
      "Duplicate author aliases: another, same.",
    );
  });
});
