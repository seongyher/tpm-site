import { describe, expect, test } from "bun:test";

import {
  type AnchoredPreset,
  anchoredPresetConfig,
  type AnchorPlacement,
  type AnchorRect,
  computeAnchoredPosition,
  detectDetach,
  emptyAnchorRect,
  flipAlignment,
  flipSide,
  initialPlacement,
  offset,
  shiftIntoBoundary,
  sizeToBoundary,
} from "../../../../src/lib/interactions/anchored-positioning";

const viewport = rect({ height: 600, width: 800, x: 0, y: 0 });
const header = rect({ height: 96, width: 800, x: 0, y: 0 });
const floating = { height: 240, width: 320 } as const;
const middleTrigger = rect({ height: 32, width: 80, x: 240, y: 24 });

describe("anchored positioning", () => {
  test("maps every product preset to a documented placement contract", () => {
    const presets: readonly AnchoredPreset[] = [
      "article-action-menu",
      "article-citation-menu",
      "header-dropdown",
      "header-search-end",
      "header-search-start",
      "inline-hover-preview",
      "mobile-shell-panel",
    ];

    for (const preset of presets) {
      expect(anchoredPresetConfig(preset).placement).toBe(
        expectedPlacement(preset),
      );
      if (preset === "mobile-shell-panel") {
        expect(anchoredPresetConfig(preset).safeGutter).toBe(0);
      } else {
        expect(anchoredPresetConfig(preset).safeGutter).toBeGreaterThan(0);
      }
    }
  });

  test("places header dropdowns below the header and aligned to the trigger start", () => {
    const result = computeAnchoredPosition(
      input({
        blockAnchorRect: header,
        inlineAnchorRect: middleTrigger,
        placement: "bottom-start",
      }),
    );

    expect(result.x).toBe(middleTrigger.x);
    expect(result.y).toBe(header.height);
    expect(result.placement).toBe("bottom-start");
    expect(result.state).toContain("preferred");
  });

  test("flips header dropdown alignment near the right edge before clamping", () => {
    const edgeTrigger = rect({ height: 32, width: 80, x: 700, y: 24 });
    const result = computeAnchoredPosition(
      input({
        blockAnchorRect: header,
        inlineAnchorRect: edgeTrigger,
        placement: "bottom-start",
      }),
    );

    expect(result.placement).toBe("bottom-end");
    expect(result.state).toContain("flipped-alignment");
    expect(result.x + floating.width).toBe(edgeTrigger.x + edgeTrigger.width);
  });

  test("shifts and sizes panels that are wider than the available viewport", () => {
    const result = computeAnchoredPosition(
      input({
        floatingSize: { height: 240, width: 900 },
        inlineAnchorRect: middleTrigger,
        placement: "bottom-start",
      }),
    );

    expect(result.x).toBe(16);
    expect(result.maxWidth).toBe(768);
    expect(result.state).toContain("sized-inline");
  });

  test("fills the mobile viewport below the header without depending on trigger x", () => {
    const result = computeAnchoredPosition(
      input({
        blockAnchorRect: header,
        floatingSize: { height: 700, width: 100 },
        inlineAnchorRect: rect({ height: 40, width: 40, x: 0, y: 24 }),
        placement: "viewport-fill",
        safeGutter: anchoredPresetConfig("mobile-shell-panel").safeGutter,
      }),
    );

    expect(result.x).toBe(0);
    expect(result.y).toBe(96);
    expect(result.maxWidth).toBe(800);
    expect(result.maxHeight).toBe(504);
    expect(result.placement).toBe("viewport-fill");
  });

  test("flips inline hover previews above the trigger when bottom space is insufficient", () => {
    const lowTrigger = rect({ height: 20, width: 80, x: 320, y: 560 });
    const result = computeAnchoredPosition(
      input({
        blockAnchorRect: lowTrigger,
        fallback: ["flip", "shift-then-size"],
        inlineAnchorRect: lowTrigger,
        offset: 8,
        placement: "bottom-start",
      }),
    );

    expect(result.placement).toBe("top-start");
    expect(result.y).toBe(312);
    expect(result.state).toContain("flipped-side");
  });

  test("supports centered top placements without forcing an alignment suffix", () => {
    const trigger = rect({ height: 40, width: 80, x: 360, y: 320 });
    const result = computeAnchoredPosition(
      input({
        blockAnchorRect: trigger,
        fallback: ["none"],
        floatingSize: { height: 120, width: 200 },
        inlineAnchorRect: trigger,
        offset: 12,
        placement: "top",
      }),
    );

    expect(result.placement).toBe("top");
    expect(result.x).toBe(300);
    expect(result.y).toBe(188);
    expect(result.state).toEqual(["preferred"]);
  });

  test("flips top placements below the trigger when start space is insufficient", () => {
    const highTrigger = rect({ height: 24, width: 80, x: 320, y: 110 });
    const result = computeAnchoredPosition(
      input({
        blockAnchorRect: highTrigger,
        fallback: ["flip", "shift-then-size"],
        inlineAnchorRect: highTrigger,
        offset: 8,
        placement: "top-start",
      }),
    );

    expect(result.placement).toBe("bottom-start");
    expect(result.y).toBe(142);
    expect(result.state).toContain("flipped-side");
  });

  test("exposes deterministic operation helpers", () => {
    const preferred = initialPlacement(
      input({
        blockAnchorRect: header,
        inlineAnchorRect: rect({ height: 32, width: 80, x: 780, y: 24 }),
        placement: "bottom-start",
      }),
    );
    const aligned = flipAlignment(
      preferred,
      input({ blockAnchorRect: header }),
    );
    const shifted = shiftIntoBoundary(
      aligned,
      input({ blockAnchorRect: header }),
    );
    const sized = sizeToBoundary(shifted, input({ blockAnchorRect: header }));

    expect(preferred.x).toBe(780);
    expect(shifted.x).toBeLessThan(preferred.x);
    expect(sized.maxHeight).toBeGreaterThan(0);
  });

  test("applies offsets and preserves subpixel geometry deterministically", () => {
    const subpixelHeader = rect({ height: 95.5, width: 800, x: 0, y: 0 });
    const subpixelTrigger = rect({
      height: 31.5,
      width: 80.5,
      x: 120.25,
      y: 8,
    });
    const result = computeAnchoredPosition(
      input({
        blockAnchorRect: subpixelHeader,
        inlineAnchorRect: subpixelTrigger,
        offset: 2.5,
        placement: "bottom-start",
      }),
    );

    expect(offset(subpixelHeader, floating.height, "bottom", 2.5)).toBe(98);
    expect(offset(subpixelHeader, floating.height, "top", 2.5)).toBe(-242.5);
    expect(result.x).toBeCloseTo(120.25);
    expect(result.y).toBeCloseTo(98);
  });

  test("exposes side flipping and detach detection as pure helpers", () => {
    const lowTrigger = rect({ height: 20, width: 80, x: 790, y: 560 });
    const preferred = initialPlacement(
      input({
        blockAnchorRect: lowTrigger,
        fallback: ["flip", "shift-then-size"],
        inlineAnchorRect: lowTrigger,
        placement: "bottom-start",
      }),
    );
    const flipped = flipSide(
      preferred,
      input({
        blockAnchorRect: lowTrigger,
        fallback: ["flip", "shift-then-size"],
        inlineAnchorRect: lowTrigger,
        placement: "bottom-start",
      }),
    );
    const detached = detectDetach(
      { maxWidth: 120, x: 16 },
      input({ inlineAnchorRect: lowTrigger }),
    );

    expect(flipped.placement).toBe("top-start");
    expect(detached).toBe(true);
  });

  test("provides an immutable zero rectangle for defensive fallbacks", () => {
    expect(emptyAnchorRect()).toEqual({ height: 0, width: 0, x: 0, y: 0 });
  });
});

function input(
  overrides: Partial<Parameters<typeof computeAnchoredPosition>[0]> = {},
): Parameters<typeof computeAnchoredPosition>[0] {
  return {
    boundaryRect: viewport,
    blockAnchorRect: middleTrigger,
    fallback: ["flip-alignment", "shift-then-size"],
    floatingSize: floating,
    inlineAnchorRect: middleTrigger,
    offset: 0,
    placement: "bottom-start",
    safeGutter: 16,
    ...overrides,
  };
}

function rect(rectangle: AnchorRect): AnchorRect {
  return rectangle;
}

function expectedPlacement(preset: AnchoredPreset): AnchorPlacement {
  switch (preset) {
    case "article-action-menu": {
      return "bottom-end";
    }

    case "article-citation-menu": {
      return "bottom-end";
    }

    case "header-dropdown": {
      return "bottom-start";
    }

    case "header-search-end": {
      return "bottom-end";
    }

    case "header-search-start": {
      return "bottom-start";
    }

    case "inline-hover-preview": {
      return "bottom-start";
    }

    case "mobile-shell-panel": {
      return "viewport-fill";
    }
  }
}
