import { describe, expect, test } from "bun:test";

import {
  type SemanticProfileKind,
  semanticProfileKinds,
} from "../../../src/lib/semantic-profile-kinds";

describe("semantic profile kinds", () => {
  test("keeps supported semantic profile kinds explicit and sorted for config users", () => {
    const kinds: SemanticProfileKind[] = Array.from(semanticProfileKinds);

    expect(kinds).toEqual([
      "audio",
      "book",
      "dataset",
      "event",
      "faq",
      "review",
      "software",
      "video",
    ]);
  });
});
