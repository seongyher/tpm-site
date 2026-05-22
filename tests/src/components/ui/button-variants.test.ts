import { describe, expect, test } from "bun:test";

import {
  buttonControlBaseClasses,
  buttonLinkBaseClasses,
  buttonSizeClasses,
  buttonVariantClasses,
  prefetchAttributeValue,
} from "../../../../src/components/ui/button-variants";

describe("button variant helpers", () => {
  test("expose shared class tables for native and link-style buttons", () => {
    expect(buttonControlBaseClasses).toContain("disabled:pointer-events-none");
    expect(buttonLinkBaseClasses).toContain(
      "aria-disabled:pointer-events-none",
    );
    expect(buttonControlBaseClasses).toContain("break-words");
    expect(buttonLinkBaseClasses).toContain("max-w-full");
    expect(buttonSizeClasses.md).toContain("min-h-10");
    expect(buttonVariantClasses.primary.solid).toContain("bg-primary");
    expect(buttonVariantClasses.neutral.outline).toContain("border-border");
  });

  test("serializes Astro prefetch values", () => {
    expect(prefetchAttributeValue(undefined)).toBeUndefined();
    expect(prefetchAttributeValue(false)).toBe("false");
    expect(prefetchAttributeValue(true)).toBe("hover");
    expect(prefetchAttributeValue("tap")).toBe("tap");
  });
});
