import { fixupPluginRules } from "@eslint/compat";
import totalFunctions from "eslint-plugin-total-functions";
import tseslint, { type ConfigWithExtends } from "typescript-eslint";

import { typedFiles } from "./files";
import { normalModuleSyntaxRestrictions } from "./restrictions";
import { requiredConfig, rulesAsErrors } from "./shared";

const totalFunctionsRecommendedConfig = requiredConfig(
  totalFunctions.configs["recommended"],
  "total-functions/recommended",
);

/**
 * Creates the shared type-aware TypeScript preset configs.
 *
 * @param tsconfigRootDir Directory used to resolve TypeScript project files.
 * @returns Flat config blocks with parser services enabled for typed files.
 */
export function createTypedPresetConfigs(
  tsconfigRootDir: string,
): readonly ConfigWithExtends[] {
  return [
    ...scopeToTypedFiles(tseslint.configs.recommended, tsconfigRootDir),
    ...scopeToTypedFiles(tseslint.configs.strictTypeChecked, tsconfigRootDir),
    ...scopeToTypedFiles(
      tseslint.configs.stylisticTypeChecked,
      tsconfigRootDir,
    ),
  ];
}

/**
 * Creates project-specific type-aware TypeScript strictness rules.
 *
 * @returns Flat config blocks for local typed-code conventions.
 */
export function createTypedRuleConfigs(): readonly ConfigWithExtends[] {
  return [
    {
      files: [...typedFiles],
      plugins: {
        "total-functions": fixupPluginRules(totalFunctions),
      },
      rules: {
        ...rulesAsErrors(totalFunctionsRecommendedConfig.rules),
        "@typescript-eslint/array-type": [
          "error",
          {
            default: "array-simple",
            readonly: "array-simple",
          },
        ],
        "@typescript-eslint/ban-ts-comment": [
          "error",
          {
            minimumDescriptionLength: 10,
            "ts-check": false,
            "ts-expect-error": "allow-with-description",
            "ts-ignore": true,
            "ts-nocheck": true,
          },
        ],
        "@typescript-eslint/consistent-type-exports": "error",
        "@typescript-eslint/consistent-type-imports": [
          "error",
          {
            disallowTypeAnnotations: true,
            fixStyle: "inline-type-imports",
            prefer: "type-imports",
          },
        ],
        "@typescript-eslint/default-param-last": "error",
        "@typescript-eslint/dot-notation": [
          "error",
          {
            allowIndexSignaturePropertyAccess: false,
          },
        ],
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": [
          "error",
          {
            allowArgumentsExplicitlyTypedAsAny: false,
            allowDirectConstAssertionInArrowFunctions: false,
            allowedNames: [],
            allowHigherOrderFunctions: false,
            allowOverloadFunctions: false,
            allowTypedFunctionExpressions: false,
          },
        ],
        "@typescript-eslint/no-array-delete": "error",
        "@typescript-eslint/no-confusing-void-expression": [
          "error",
          {
            ignoreArrowShorthand: true,
            ignoreVoidOperator: false,
          },
        ],
        "@typescript-eslint/no-deprecated": "off",
        "@typescript-eslint/no-duplicate-enum-values": "error",
        "@typescript-eslint/no-empty-object-type": "error",
        "@typescript-eslint/no-explicit-any": [
          "error",
          {
            fixToUnknown: true,
            ignoreRestArgs: false,
          },
        ],
        "@typescript-eslint/no-extraneous-class": [
          "error",
          {
            allowConstructorOnly: false,
            allowEmpty: false,
            allowStaticOnly: false,
            allowWithDecorator: false,
          },
        ],
        "@typescript-eslint/no-floating-promises": [
          "error",
          {
            ignoreIIFE: false,
            ignoreVoid: false,
          },
        ],
        "@typescript-eslint/no-for-in-array": "error",
        "@typescript-eslint/no-import-type-side-effects": "error",
        "@typescript-eslint/no-misused-promises": [
          "error",
          {
            checksVoidReturn: true,
          },
        ],
        "@typescript-eslint/no-misused-spread": "error",
        "@typescript-eslint/no-mixed-enums": "error",
        "@typescript-eslint/no-namespace": [
          "error",
          {
            allowDeclarations: false,
            allowDefinitionFiles: false,
          },
        ],
        "@typescript-eslint/no-non-null-assertion": "error",
        "@typescript-eslint/no-require-imports": "error",
        "@typescript-eslint/no-unnecessary-condition": [
          "error",
          {
            allowConstantLoopConditions: false,
          },
        ],
        "@typescript-eslint/no-unnecessary-type-arguments": "error",
        "@typescript-eslint/no-unnecessary-type-assertion": "error",
        "@typescript-eslint/no-unnecessary-type-conversion": "error",
        "@typescript-eslint/no-unsafe-type-assertion": "error",
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            args: "all",
            argsIgnorePattern: "^_",
            reportUsedIgnorePattern: true,
          },
        ],
        "@typescript-eslint/no-wrapper-object-types": "error",
        "@typescript-eslint/only-throw-error": "error",
        "@typescript-eslint/prefer-enum-initializers": "error",
        "@typescript-eslint/prefer-literal-enum-member": "error",
        "@typescript-eslint/prefer-nullish-coalescing": "error",
        "@typescript-eslint/prefer-optional-chain": "error",
        "@typescript-eslint/prefer-promise-reject-errors": "error",
        "@typescript-eslint/prefer-readonly": "error",
        "@typescript-eslint/promise-function-async": "error",
        "@typescript-eslint/require-array-sort-compare": [
          "error",
          {
            ignoreStringArrays: true,
          },
        ],
        "@typescript-eslint/restrict-plus-operands": [
          "error",
          {
            allowAny: false,
            allowBoolean: false,
            allowNullish: false,
            allowNumberAndString: false,
            allowRegExp: false,
          },
        ],
        "@typescript-eslint/restrict-template-expressions": [
          "error",
          {
            allowAny: false,
            allowBoolean: false,
            allowNever: false,
            allowNullish: false,
            allowNumber: true,
            allowRegExp: false,
          },
        ],
        "@typescript-eslint/strict-boolean-expressions": [
          "error",
          {
            allowAny: false,
            allowNullableBoolean: false,
            allowNullableEnum: false,
            allowNullableNumber: false,
            allowNullableObject: true,
            allowNullableString: false,
            allowNumber: false,
            allowString: false,
          },
        ],
        "@typescript-eslint/switch-exhaustiveness-check": [
          "error",
          {
            allowDefaultCaseForExhaustiveSwitch: false,
            considerDefaultExhaustiveForUnions: false,
            requireDefaultForNonUnion: false,
          },
        ],
        "@typescript-eslint/triple-slash-reference": "error",
        "dot-notation": "off",
        "no-restricted-syntax": ["error", ...normalModuleSyntaxRestrictions],
        "total-functions/no-unsafe-readonly-mutable-assignment": "off",
        "total-functions/no-unsafe-type-assertion": "off",
        "total-functions/require-strict-mode": "off",
      },
    },
  ];
}

function scopeToTypedFiles(
  configs: readonly ConfigWithExtends[],
  tsconfigRootDir: string,
): readonly ConfigWithExtends[] {
  return configs.map((config) => ({
    ...config,
    files: [...typedFiles],
    languageOptions: {
      ...config.languageOptions,
      parserOptions: {
        ...config.languageOptions?.parserOptions,
        project: ["./tsconfig.json", "./tsconfig.tools.json"],
        tsconfigRootDir,
      },
    },
  }));
}
