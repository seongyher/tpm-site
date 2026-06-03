import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

const studioCss = readFileSync("apps/studio/src/styles/studio.css", "utf8");

describe("Studio visual accessibility tokens", () => {
  test("keeps semantic colors contrast-safe for small UI text", () => {
    const tokens = cssColorTokens(studioCss);

    expect(contrast(token(tokens, "accent"), "#ffffff")).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(
      contrast(token(tokens, "success"), token(tokens, "success-muted")),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(token(tokens, "warning"), token(tokens, "warning-muted")),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(token(tokens, "danger"), token(tokens, "danger-muted")),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(
        token(tokens, "accent-foreground"),
        token(tokens, "accent-muted"),
      ),
    ).toBeGreaterThanOrEqual(4.5);
  });

  test("keeps muted labels legible on panel, sidebar, and app backgrounds", () => {
    const tokens = cssColorTokens(studioCss);

    expect(
      contrast(token(tokens, "muted-foreground"), token(tokens, "panel")),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(token(tokens, "muted-foreground"), token(tokens, "sidebar")),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(token(tokens, "muted-foreground"), token(tokens, "background")),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

type StudioColorTokens = ReadonlyMap<string, string>;

function cssColorTokens(css: string): StudioColorTokens {
  const tokens = new Map<string, string>();

  for (const match of css.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6});/g)) {
    const [, name, value] = match;

    if (name !== undefined && value !== undefined) {
      tokens.set(name, value);
    }
  }

  return tokens;
}

function token(tokens: StudioColorTokens, name: string): string {
  const value = tokens.get(name);

  if (value === undefined) {
    throw new Error(`Missing Studio CSS color token: ${name}`);
  }

  return value;
}

function contrast(firstHex: string, secondHex: string): number {
  const first = relativeLuminance(hexToRgb(firstHex));
  const second = relativeLuminance(hexToRgb(secondHex));
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);

  return checkedDivide(lighter + 0.05, darker + 0.05);
}

function hexToRgb(hex: string): readonly [number, number, number] {
  return [hexComponent(hex, 1), hexComponent(hex, 3), hexComponent(hex, 5)];
}

function relativeLuminance(rgb: readonly [number, number, number]): number {
  const channelLuminance = (channel: number): number => {
    const normalized = checkedDivide(channel, 255);

    return normalized <= 0.039_28
      ? checkedDivide(normalized, 12.92)
      : checkedDivide(normalized + 0.055, 1.055) ** 2.4;
  };
  const [red, green, blue] = rgb;

  return (
    0.2126 * channelLuminance(red) +
    0.7152 * channelLuminance(green) +
    0.0722 * channelLuminance(blue)
  );
}

function hexComponent(hex: string, offset: number): number {
  return Number.parseInt(hex.slice(offset, offset + 2), 16);
}

function checkedDivide(numerator: number, denominator: number): number {
  const quotient = divide(numerator, denominator);

  if (quotient === undefined) {
    throw new Error("Cannot divide by zero.");
  }

  return quotient;
}

function divide(numerator: number, denominator: number): number | undefined {
  return denominator === 0 ? undefined : numerator * denominator ** -1;
}
