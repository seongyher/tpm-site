import { describe, expect, test } from "bun:test";

import {
  articleContinuityItem,
  articleContinuitySelection,
} from "../../../../src/lib/content/article-continuity";
import {
  articleEntry,
  authorEntry,
  categorySummary,
} from "../../../helpers/content";

describe("article continuity", () => {
  const older = articleEntry({
    data: {
      author: "Known Author",
      title: "Older Article",
    },
    date: new Date("2020-01-01T00:00:00.000Z"),
    id: "older",
  });
  const middle = articleEntry({
    data: {
      title: "Middle Article",
    },
    date: new Date("2021-01-01T00:00:00.000Z"),
    id: "middle",
  });
  const newest = articleEntry({
    data: {
      title: "Newest Article",
    },
    date: new Date("2022-01-01T00:00:00.000Z"),
    id: "newest",
  });

  test("selects the immediate newer article for middle articles", () => {
    expect(
      articleContinuitySelection(middle, [newest, older, middle]),
    ).toMatchObject({
      article: { id: "newest" },
      direction: "next",
    });
  });

  test("falls back to the immediate older article for the newest article", () => {
    expect(
      articleContinuitySelection(newest, [newest, older, middle]),
    ).toMatchObject({
      article: { id: "middle" },
      direction: "previous",
    });
  });

  test("omits continuity when no neighbor exists", () => {
    expect(articleContinuitySelection(newest, [newest])).toBeUndefined();
  });

  test("omits continuity when the current article is absent from the source list", () => {
    expect(articleContinuitySelection(newest, [older, middle])).toBeUndefined();
  });

  test("maps a selected neighbor to article-list props", () => {
    const selection = articleContinuitySelection(older, [
      newest,
      older,
      middle,
    ]);

    if (selection === undefined) {
      throw new Error("Expected continuity selection.");
    }

    expect(
      articleContinuityItem(
        selection,
        [categorySummary({ articles: [middle], title: "History" })],
        [
          authorEntry({
            aliases: ["Known Author"],
            displayName: "Known Author",
          }),
        ],
      ),
    ).toMatchObject({
      item: {
        href: "/articles/middle/",
        title: "Middle Article",
      },
      label: "Next Article",
    });
  });
});
