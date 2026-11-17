import { describe, expect, test } from "bun:test";

import { citationTitleParts } from "../../../../src/lib/citations/citation-preview";

describe("citation title preview", () => {
  test("retains both text segments around the selected title", () => {
    expect(citationTitleParts("Title: Title.", { start: 7, end: 12 })).toEqual({
      before: "Title: ",
      title: "Title",
      after: ".",
    });
  });

  test("renders plain text when the title range is absent or invalid", () => {
    expect(citationTitleParts("Title", undefined)).toBeUndefined();

    for (const [start, end] of [
      [Number.NaN, 3],
      [0, 2.5],
      [-1, 3],
      [3, 3],
      [0, 6],
    ] as const) {
      expect(citationTitleParts("Title", { start, end })).toBeUndefined();
    }
  });
});
