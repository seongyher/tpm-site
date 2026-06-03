import { describe, expect, test } from "bun:test";

import {
  createTypedPresetConfigs,
  createTypedRuleConfigs,
} from "../../../eslint/config/typed";

describe("typed ESLint config", () => {
  test("enables parser services for all typed project files", () => {
    const [config] = createTypedPresetConfigs("/repo");

    expect(config?.files).toContain("src/**/*.{ts,tsx}");
    expect(config?.files).toContain("apps/studio/src/**/*.{ts,tsx}");
    expect(config?.languageOptions?.parserOptions).toMatchObject({
      project: [
        "./apps/studio/tsconfig.json",
        "./tsconfig.json",
        "./tsconfig.tools.json",
      ],
      tsconfigRootDir: "/repo",
    });
  });

  test("enforces strict TypeScript safety rules", () => {
    const [config] = createTypedRuleConfigs();

    expect(config?.rules?.["@typescript-eslint/no-explicit-any"]).toEqual([
      "error",
      { fixToUnknown: true, ignoreRestArgs: false },
    ]);
    expect(config?.rules?.["@typescript-eslint/no-non-null-assertion"]).toBe(
      "error",
    );
  });
});
