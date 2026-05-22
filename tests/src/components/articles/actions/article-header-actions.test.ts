import { describe, expect, test } from "bun:test";

import {
  articleHeaderActionClasses,
  articleHeaderActionRowClasses,
} from "../../../../../src/components/articles/actions/article-header-actions";

describe("article header action classes", () => {
  test("keep action row and control class contracts centralized", () => {
    expect(articleHeaderActionRowClasses).toContain("print:hidden");
    expect(articleHeaderActionRowClasses).toContain("flex-wrap");
    expect(articleHeaderActionClasses).toContain("text-muted-foreground");
    expect(articleHeaderActionClasses).toContain("focus-visible:outline-ring");
    expect(articleHeaderActionClasses).toContain("inline-flex");
  });
});
