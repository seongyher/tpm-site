import type { ImageMetadata } from "astro";
import { describe, expect, test } from "bun:test";

import {
  imageMetadataOrUndefined,
  isImageMetadata,
} from "../../../src/lib/content-images";

const imageMetadata = {
  format: "png",
  height: 720,
  src: "/src/example.png",
  width: 1280,
} as const satisfies ImageMetadata;

describe("content image helpers", () => {
  test("recognizes Astro image metadata", () => {
    expect(isImageMetadata(imageMetadata)).toBe(true);
    expect(imageMetadataOrUndefined(imageMetadata)).toBe(imageMetadata);
  });

  test("recognizes SVG component image metadata", () => {
    const SvgComponent = Object.assign(() => {
      return "";
    }, imageMetadata);

    expect(isImageMetadata(SvgComponent)).toBe(true);
    expect(imageMetadataOrUndefined(SvgComponent)).toBe(SvgComponent);
  });

  test("rejects unresolved content image strings and partial objects", () => {
    expect(isImageMetadata("../../assets/example.png")).toBe(false);
    expect(
      imageMetadataOrUndefined("../../assets/example.png"),
    ).toBeUndefined();
    expect(
      imageMetadataOrUndefined({
        height: 720,
        src: "/src/example.png",
        width: 1280,
      }),
    ).toBeUndefined();
    expect(imageMetadataOrUndefined(null)).toBeUndefined();
  });
});
