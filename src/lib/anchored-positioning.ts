/** Rectangle shape used by the anchored positioning engine. */
export interface AnchorRect {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

/** Logical side for a floating surface relative to an anchor. */
type AnchorSide = "bottom" | "left" | "right" | "top";

/** Logical inline alignment for a floating surface relative to an anchor. */
type AnchorAlignment = "center" | "end" | "start";

/** Placement preference for an anchored surface. */
export type AnchorPlacement =
  "viewport-fill" | `${AnchorSide}-${AnchorAlignment}` | AnchorSide;

/** Ordered collision strategy used after preferred placement is computed. */
type AnchorFallback =
  | "flip"
  | "flip-alignment"
  | "none"
  | "shift"
  | "shift-then-size"
  | "size-then-shift";

/** Public anchored positioning presets used by components. */
export type AnchoredPreset =
  | "article-action-menu"
  | "article-citation-menu"
  | "header-dropdown"
  | "header-search-end"
  | "header-search-start"
  | "inline-hover-preview"
  | "mobile-shell-panel";

/** Placement state emitted for tests, debugging, and data attributes. */
type AnchoredPositionState =
  | "clamped"
  | "detached"
  | "flipped-alignment"
  | "flipped-side"
  | "preferred"
  | "shifted-inline-end"
  | "shifted-inline-start"
  | "sized-block"
  | "sized-inline";

/** Inputs needed to compute a floating surface position. */
interface AnchoredPositionInput {
  readonly blockAnchorRect: AnchorRect;
  readonly boundaryRect: AnchorRect;
  readonly fallback: readonly AnchorFallback[];
  readonly floatingSize: Pick<AnchorRect, "height" | "width">;
  readonly inlineAnchorRect: AnchorRect;
  readonly offset: number;
  readonly placement: AnchorPlacement;
  readonly safeGutter: number;
}

/** Result of anchored positioning computation. */
interface AnchoredPositionResult {
  readonly detached: boolean;
  readonly maxHeight: number;
  readonly maxWidth: number;
  readonly placement: AnchorPlacement;
  readonly state: readonly AnchoredPositionState[];
  readonly x: number;
  readonly y: number;
}

/** Product-level defaults for an anchored preset. */
interface AnchoredPresetConfig {
  readonly fallback: readonly AnchorFallback[];
  readonly offset: number;
  readonly placement: AnchorPlacement;
  readonly safeGutter: number;
}

interface WorkingPlacement {
  readonly placement: AnchorPlacement;
  readonly state: readonly AnchoredPositionState[];
  readonly x: number;
  readonly y: number;
}

const defaultSafeGutter = 16;
const prosePreviewOffset = 8;
const zeroRect = { height: 0, width: 0, x: 0, y: 0 } as const;

const presetConfigs = {
  "article-action-menu": {
    fallback: ["flip-alignment", "shift-then-size"],
    offset: 4,
    placement: "bottom-end",
    safeGutter: defaultSafeGutter,
  },
  "article-citation-menu": {
    fallback: ["flip-alignment", "shift-then-size"],
    offset: 4,
    placement: "bottom-end",
    safeGutter: defaultSafeGutter,
  },
  "header-dropdown": {
    fallback: ["flip-alignment", "shift-then-size"],
    offset: 0,
    placement: "bottom-start",
    safeGutter: defaultSafeGutter,
  },
  "header-search-end": {
    fallback: ["shift-then-size"],
    offset: 0,
    placement: "bottom-end",
    safeGutter: defaultSafeGutter,
  },
  "header-search-start": {
    fallback: ["shift-then-size"],
    offset: 0,
    placement: "bottom-start",
    safeGutter: defaultSafeGutter,
  },
  "inline-hover-preview": {
    fallback: ["flip", "shift-then-size"],
    offset: prosePreviewOffset,
    placement: "bottom-start",
    safeGutter: defaultSafeGutter,
  },
  "mobile-shell-panel": {
    fallback: ["size-then-shift"],
    offset: 0,
    placement: "viewport-fill",
    safeGutter: 0,
  },
} as const satisfies Record<AnchoredPreset, AnchoredPresetConfig>;

/**
 * Returns immutable defaults for an anchored preset.
 *
 * @param preset Product-level positioning preset.
 * @returns Preset configuration.
 */
export function anchoredPresetConfig(
  preset: AnchoredPreset,
): AnchoredPresetConfig {
  switch (preset) {
    case "article-action-menu": {
      return presetConfigs["article-action-menu"];
    }

    case "article-citation-menu": {
      return presetConfigs["article-citation-menu"];
    }

    case "header-dropdown": {
      return presetConfigs["header-dropdown"];
    }

    case "header-search-end": {
      return presetConfigs["header-search-end"];
    }

    case "header-search-start": {
      return presetConfigs["header-search-start"];
    }

    case "inline-hover-preview": {
      return presetConfigs["inline-hover-preview"];
    }

    case "mobile-shell-panel": {
      return presetConfigs["mobile-shell-panel"];
    }
  }
}

/**
 * Computes the final coordinates and size constraints for an anchored surface.
 *
 * @param input Serializable positioning input.
 * @returns Deterministic anchored position result.
 */
export function computeAnchoredPosition(
  input: AnchoredPositionInput,
): AnchoredPositionResult {
  if (input.placement === "viewport-fill") {
    return viewportFillPlacement(input);
  }

  const preferred = initialPlacement(input);
  const sideFlipped = input.fallback.includes("flip")
    ? flipSideWhenNeeded(preferred, input)
    : preferred;
  const alignmentFlipped = input.fallback.includes("flip-alignment")
    ? flipAlignmentWhenNeeded(sideFlipped, input)
    : sideFlipped;
  const shifted = input.fallback.some(isShiftFallback)
    ? shiftIntoBoundary(alignmentFlipped, input)
    : alignmentFlipped;
  const sized = sizeToBoundary(shifted, input);
  const detached = detectDetach(sized, input);

  return {
    detached,
    maxHeight: sized.maxHeight,
    maxWidth: sized.maxWidth,
    placement: sized.placement,
    state: detached ? appendState(sized.state, "detached") : sized.state,
    x: sized.x,
    y: sized.y,
  };
}

/**
 * Computes preferred coordinates before collision fallback.
 *
 * @param input Serializable positioning input.
 * @returns Preferred working placement.
 */
export function initialPlacement(
  input: AnchoredPositionInput,
): WorkingPlacement {
  const side = placementSide(input.placement);
  const alignment = placementAlignment(input.placement);
  const x = inlineCoordinate(input.inlineAnchorRect, input.floatingSize.width, {
    alignment,
  });
  const y = blockCoordinate(input.blockAnchorRect, input.floatingSize.height, {
    offset: input.offset,
    side,
  });

  return {
    placement: input.placement,
    state: ["preferred"],
    x,
    y,
  };
}

/**
 * Computes the block-axis coordinate after applying a side and offset.
 *
 * @param anchor Block-axis anchor rectangle.
 * @param floatingHeight Floating surface height.
 * @param side Logical side for the floating surface.
 * @param amount Gap between the anchor and floating surface.
 * @returns Block-axis coordinate for the floating surface.
 */
export function offset(
  anchor: AnchorRect,
  floatingHeight: number,
  side: AnchorSide,
  amount: number,
): number {
  return blockCoordinate(anchor, floatingHeight, { offset: amount, side });
}

/**
 * Moves a placement to the opposite side when the preferred side cannot fit.
 *
 * @param placement Current working placement.
 * @param input Serializable positioning input.
 * @returns Placement with optional side flip.
 */
export function flipSide(
  placement: WorkingPlacement,
  input: AnchoredPositionInput,
): WorkingPlacement {
  return flipSideWhenNeeded(placement, input);
}

/**
 * Tries the opposite inline alignment when the preferred alignment overflows.
 *
 * @param placement Current working placement.
 * @param input Serializable positioning input.
 * @returns Placement with optional alignment flip.
 */
export function flipAlignment(
  placement: WorkingPlacement,
  input: AnchoredPositionInput,
): WorkingPlacement {
  return flipAlignmentWhenNeeded(placement, input);
}

/**
 * Shifts a floating element inside the viewport boundary.
 *
 * @param placement Current working placement.
 * @param input Serializable positioning input.
 * @returns Boundary-constrained placement.
 */
export function shiftIntoBoundary(
  placement: WorkingPlacement,
  input: AnchoredPositionInput,
): WorkingPlacement {
  const { boundaryRect, floatingSize, safeGutter } = input;
  const minimumX = boundaryRect.x + safeGutter;
  const maximumX =
    boundaryRect.x + boundaryRect.width - safeGutter - floatingSize.width;
  const shiftedX = clamp(placement.x, minimumX, Math.max(minimumX, maximumX));
  const state = shiftedState(placement.state, placement.x, shiftedX);

  return {
    placement: placement.placement,
    state,
    x: shiftedX,
    y: placement.y,
  };
}

/**
 * Computes max dimensions for a surface after placement.
 *
 * @param placement Current working placement.
 * @param input Serializable positioning input.
 * @returns Placement plus size constraints.
 */
export function sizeToBoundary(
  placement: WorkingPlacement,
  input: AnchoredPositionInput,
): AnchoredPositionResult {
  const { boundaryRect, floatingSize, safeGutter } = input;
  const boundaryEndX = boundaryRect.x + boundaryRect.width - safeGutter;
  const boundaryEndY = boundaryRect.y + boundaryRect.height - safeGutter;
  const maxWidth = Math.max(0, boundaryRect.width - safeGutter * 2);
  const maxHeight = Math.max(
    0,
    boundaryEndY - Math.max(boundaryRect.y + safeGutter, placement.y),
  );
  const sizedInline = floatingSize.width > maxWidth;
  const sizedBlock = placement.y + floatingSize.height > boundaryEndY;
  const state = [
    ...placement.state,
    ...(sizedInline ? (["sized-inline"] as const) : []),
    ...(sizedBlock ? (["sized-block"] as const) : []),
    ...(placement.x + floatingSize.width > boundaryEndX ||
    placement.x < boundaryRect.x + safeGutter
      ? (["clamped"] as const)
      : []),
  ];

  return {
    detached: false,
    maxHeight,
    maxWidth,
    placement: placement.placement,
    state,
    x: placement.x,
    y: placement.y,
  };
}

/**
 * Reports whether clamping broke the visual relationship to the trigger.
 *
 * @param result Current computed result.
 * @param input Serializable positioning input.
 * @returns Whether the panel is detached from the inline anchor.
 */
export function detectDetach(
  result: Pick<AnchoredPositionResult, "maxWidth" | "x">,
  input: AnchoredPositionInput,
): boolean {
  const anchorCenter =
    input.inlineAnchorRect.x + input.inlineAnchorRect.width / 2;
  const resultEnd =
    result.x + Math.min(input.floatingSize.width, result.maxWidth);

  return anchorCenter < result.x || anchorCenter > resultEnd;
}

function viewportFillPlacement(
  input: AnchoredPositionInput,
): AnchoredPositionResult {
  const x = input.boundaryRect.x + input.safeGutter;
  const y =
    input.blockAnchorRect.y + input.blockAnchorRect.height + input.offset;
  const maxWidth = Math.max(0, input.boundaryRect.width - input.safeGutter * 2);
  const maxHeight = Math.max(
    0,
    input.boundaryRect.y + input.boundaryRect.height - y - input.safeGutter,
  );

  return {
    detached: false,
    maxHeight,
    maxWidth,
    placement: "viewport-fill",
    state: ["preferred", "sized-block", "sized-inline"],
    x,
    y,
  };
}

function flipSideWhenNeeded(
  placement: WorkingPlacement,
  input: AnchoredPositionInput,
): WorkingPlacement {
  const side = placementSide(placement.placement);
  const overflowsBlockEnd =
    side === "bottom" &&
    placement.y + input.floatingSize.height >
      input.boundaryRect.y + input.boundaryRect.height - input.safeGutter;
  const overflowsBlockStart =
    side === "top" && placement.y < input.boundaryRect.y + input.safeGutter;

  if (!overflowsBlockEnd && !overflowsBlockStart) {
    return placement;
  }

  const flippedSide = oppositeSide(side);
  const flippedPlacement = placementWithSide(placement.placement, flippedSide);
  const flippedY = blockCoordinate(
    input.blockAnchorRect,
    input.floatingSize.height,
    {
      offset: input.offset,
      side: flippedSide,
    },
  );

  return {
    placement: flippedPlacement,
    state: appendState(placement.state, "flipped-side"),
    x: placement.x,
    y: flippedY,
  };
}

function flipAlignmentWhenNeeded(
  placement: WorkingPlacement,
  input: AnchoredPositionInput,
): WorkingPlacement {
  const alignment = placementAlignment(placement.placement);

  if (alignment === "center" || fitsInline(placement, input)) {
    return placement;
  }

  const flippedAlignment = oppositeAlignment(alignment);
  const flippedX = inlineCoordinate(
    input.inlineAnchorRect,
    input.floatingSize.width,
    {
      alignment: flippedAlignment,
    },
  );
  const flippedPlacement = placementWithAlignment(
    placement.placement,
    flippedAlignment,
  );
  const flipped = {
    placement: flippedPlacement,
    state: appendState(placement.state, "flipped-alignment"),
    x: flippedX,
    y: placement.y,
  };

  return fitsInline(flipped, input) ? flipped : placement;
}

function fitsInline(
  placement: Pick<WorkingPlacement, "x">,
  input: AnchoredPositionInput,
): boolean {
  const start = input.boundaryRect.x + input.safeGutter;
  const end =
    input.boundaryRect.x + input.boundaryRect.width - input.safeGutter;

  return placement.x >= start && placement.x + input.floatingSize.width <= end;
}

function isShiftFallback(fallback: AnchorFallback): boolean {
  return (
    fallback === "shift" ||
    fallback === "shift-then-size" ||
    fallback === "size-then-shift"
  );
}

function placementSide(placement: AnchorPlacement): AnchorSide {
  if (placement === "viewport-fill") {
    return "bottom";
  }

  if (placement.startsWith("bottom")) {
    return "bottom";
  }

  if (placement.startsWith("left")) {
    return "left";
  }

  if (placement.startsWith("right")) {
    return "right";
  }

  return "top";
}

function placementAlignment(placement: AnchorPlacement): AnchorAlignment {
  if (!placement.includes("-")) {
    return "center";
  }

  if (placement.endsWith("-end")) {
    return "end";
  }

  if (placement.endsWith("-start")) {
    return "start";
  }

  return "center";
}

function placementWithSide(
  placement: AnchorPlacement,
  side: AnchorSide,
): AnchorPlacement {
  const alignment = placementAlignment(placement);

  return alignment === "center" ? side : `${side}-${alignment}`;
}

function placementWithAlignment(
  placement: AnchorPlacement,
  alignment: AnchorAlignment,
): AnchorPlacement {
  return `${placementSide(placement)}-${alignment}`;
}

function oppositeSide(side: AnchorSide): AnchorSide {
  switch (side) {
    case "bottom": {
      return "top";
    }

    case "left": {
      return "right";
    }

    case "right": {
      return "left";
    }

    case "top": {
      return "bottom";
    }
  }
}

function oppositeAlignment(alignment: AnchorAlignment): AnchorAlignment {
  switch (alignment) {
    case "center": {
      return "center";
    }

    case "end": {
      return "start";
    }

    case "start": {
      return "end";
    }
  }
}

function inlineCoordinate(
  anchor: AnchorRect,
  floatingWidth: number,
  options: {
    readonly alignment: AnchorAlignment;
  },
): number {
  switch (options.alignment) {
    case "center": {
      return anchor.x + anchor.width / 2 - floatingWidth / 2;
    }

    case "end": {
      return anchor.x + anchor.width - floatingWidth;
    }

    case "start": {
      return anchor.x;
    }
  }
}

function blockCoordinate(
  anchor: AnchorRect,
  floatingHeight: number,
  options: { readonly offset: number; readonly side: AnchorSide },
): number {
  if (options.side === "top") {
    return anchor.y - floatingHeight - options.offset;
  }

  if (options.side === "bottom") {
    return anchor.y + anchor.height + options.offset;
  }

  return anchor.y;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function appendState(
  state: readonly AnchoredPositionState[],
  nextState: AnchoredPositionState,
): readonly AnchoredPositionState[] {
  return state.includes(nextState) ? state : [...state, nextState];
}

function shiftedState(
  state: readonly AnchoredPositionState[],
  originalX: number,
  shiftedX: number,
): readonly AnchoredPositionState[] {
  if (shiftedX < originalX) {
    return appendState(state, "shifted-inline-end");
  }

  if (shiftedX > originalX) {
    return appendState(state, "shifted-inline-start");
  }

  return state;
}

/**
 * Returns an empty rectangle for tests and defensive browser fallbacks.
 *
 * @returns Zero-sized rectangle at the viewport origin.
 */
export function emptyAnchorRect(): AnchorRect {
  return zeroRect;
}
