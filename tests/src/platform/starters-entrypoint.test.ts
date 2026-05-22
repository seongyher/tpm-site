import { describe, expect, test } from "bun:test";

import {
  starterTemplateById,
  starterTemplateMatrix,
} from "../../../src/platform/starters";

describe("platform starters entrypoint", () => {
  test("exposes starter template contracts through the platform seam", () => {
    expect(starterTemplateById("minimal-blog").label).toBe("Minimal Blog");
    expect(starterTemplateMatrix().map((template) => template.id)).toContain(
      "kitchen-sink",
    );
  });
});
