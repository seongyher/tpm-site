import { describe, expect, test } from "bun:test";

import {
  compactEntryMetaItems,
  compactEntryPrefetch,
} from "../../../../../src/components/articles/lists/compact-entry";

describe("compact entry helpers", () => {
  test("prefers explicit metadata items", () => {
    expect(
      compactEntryMetaItems({
        author: "Ignored",
        date: "Ignored",
        href: "/articles/item/",
        metaItems: ["Pinned", { href: "/authors/a/", label: "Author" }],
        title: "Item",
      }),
    ).toEqual(["Pinned", { href: "/authors/a/", label: "Author" }]);
  });

  test("builds metadata from category, date, and author", () => {
    expect(
      compactEntryMetaItems({
        author: "Author",
        category: { href: "/categories/culture/", title: "Culture" },
        date: "May 5, 2026",
        href: "/articles/item/",
        title: "Item",
      }),
    ).toEqual([
      {
        href: "/categories/culture/",
        label: "Culture",
        prefetch: "hover",
      },
      "May 5, 2026",
      "Author",
    ]);
  });

  test("defaults internal links to hover prefetch", () => {
    expect(
      compactEntryPrefetch({ href: "/articles/item/", title: "Item" }),
    ).toBe("hover");
  });

  test("leaves external links unprefetched unless overridden", () => {
    expect(
      compactEntryPrefetch({
        href: "https://example.com/item",
        title: "Item",
      }),
    ).toBeUndefined();
    expect(
      compactEntryPrefetch({
        href: "https://example.com/item",
        prefetch: "tap",
        title: "Item",
      }),
    ).toBe("tap");
  });
});
