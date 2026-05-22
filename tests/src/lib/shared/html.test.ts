import { describe, expect, test } from "vitest";

import { htmlIdFromText } from "../../../../src/lib/shared/html";

describe("htmlIdFromText", () => {
  test("normalizes display text into a heading-safe id stem", () => {
    expect(htmlIdFromText("Latest Articles")).toBe("latest-articles");
  });

  test("prefixes stems that start with digits", () => {
    expect(htmlIdFromText("4chan", "archive")).toBe("archive-4chan");
  });

  test("uses a safe fallback for punctuation-only labels", () => {
    expect(htmlIdFromText("!!!", "archive")).toBe("archive");
  });
});
