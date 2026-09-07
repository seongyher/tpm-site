import { describe, expect, test } from "bun:test";
import { Linter } from "eslint";
import tseslint from "typescript-eslint";

import {
  createTypedPresetConfigs,
  createTypedRuleConfigs,
} from "../../../eslint/config/typed";

describe("typed ESLint config", () => {
  test("enables parser services for all typed project files", () => {
    const [config] = createTypedPresetConfigs("/repo");

    expect(config?.files).toContain("src/**/*.{ts,tsx}");
    expect(config?.languageOptions?.parserOptions).toMatchObject({
      project: ["./tsconfig.json", "./tsconfig.tools.json"],
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

  test.each([
    [
      "rejects ordinary unused parameters before used parameters",
      "export function keep(unused: number, used: number) { return used; }",
      "unusedVar",
    ],
    [
      "accepts explicitly unused parameters",
      "export function keep(_unused: number, used: number) { return used; }",
      null,
    ],
    [
      "rejects used parameters marked as unused",
      "export function keep(_used: number) { return _used; }",
      "usedIgnoredVar",
    ],
    [
      "continues rejecting unused local variables",
      "export function keep(used: number) { const unused = used; return 1; }",
      "unusedVar",
    ],
  ])("%s", (_description, source, expectedMessageId) => {
    const [config] = createTypedRuleConfigs();
    const ruleName = "@typescript-eslint/no-unused-vars";
    const rule = config?.rules?.["@typescript-eslint/no-unused-vars"];

    if (rule === undefined) {
      throw new Error("Expected the unused-variable policy to be configured.");
    }

    const messages = new Linter().verify(
      source,
      {
        files: ["**/*.ts"],
        languageOptions: { parser: tseslint.parser },
        plugins: { "@typescript-eslint": tseslint.plugin },
        rules: { [ruleName]: rule },
      },
      { filename: "fixture.ts" },
    );

    expect(messages.map((message) => message.messageId)).toEqual(
      expectedMessageId === null ? [] : [expectedMessageId],
    );
    expect(messages.every((message) => message.ruleId === ruleName)).toBe(true);
  });
});
