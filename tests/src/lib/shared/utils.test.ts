import { describe, expect, test } from "bun:test";

import { cn } from "../../../../src/lib/shared/utils";

describe("class name utility", () => {
  test("merges conditional classes and resolves Tailwind conflicts", () => {
    const hiddenClass = "";

    expect(cn("px-2", hiddenClass, "px-4")).toBe("px-4");
  });
});
