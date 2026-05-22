import { describe, expect, test } from "bun:test";

import type {
  ArticleReferenceLabel,
  ArticleReferenceMarker,
} from "../../../../../src/lib/references/article-references/model";

describe("article reference model", () => {
  test("keeps canonical labels and markers structurally typed", () => {
    const label: ArticleReferenceLabel = "cite-baudrillard-1981";
    const marker: ArticleReferenceMarker = {
      backlinkId: "cite-backref-baudrillard-1981",
      displayText: "1",
      entryId: "cite-baudrillard-1981",
      id: "cite-ref-baudrillard-1981",
      kind: "citation",
      label,
      order: 1,
    };

    expect(marker.label).toBe(label);
  });
});
