import { describe, expect, test } from "bun:test";

import { articleImagePresentation } from "../../../../src/lib/articles/article-image-policy";

describe("article image policy", () => {
  test("uses one bounded inspectable default for standalone article images", () => {
    const presentation = articleImagePresentation();

    expect(presentation.policy).toBe("bounded");
    expect(presentation.isInspectable).toBe(true);
    expect(presentation.figureClass).toContain("not-prose");
    expect(presentation.frameClass).toContain("w-fit");
    expect(presentation.frameClass).toContain("justify-self-center");
    expect(presentation.frameClass).toContain("group/article-image");
    expect(presentation.imageClass).toContain("max-h-[min(70svh,34rem)]");
    expect(presentation.imageClass).toContain("object-contain");
    expect(presentation.inspectionClass).toContain("top-2");
    expect(presentation.inspectionClass).toContain("opacity-0");
    expect(presentation.inspectionClass).toContain(
      "pointer-coarse:opacity-100",
    );
    expect(presentation.previewSizes).toBe(
      "(min-width: 48rem) 48rem, calc(100vw - 2rem)",
    );
  });

  test("keeps natural full-height display explicit and noninspectable", () => {
    const presentation = articleImagePresentation("natural");

    expect(presentation.policy).toBe("natural");
    expect(presentation.isInspectable).toBe(false);
    expect(presentation.frameClass).not.toContain("group/article-image");
    expect(presentation.imageClass).toContain("max-h-none");
    expect(presentation.previewSizes).toBe(
      "(min-width: 48rem) 48rem, calc(100vw - 2rem)",
    );
  });
});
