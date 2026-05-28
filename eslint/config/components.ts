import sonarjs from "eslint-plugin-sonarjs";
import type { ConfigWithExtends } from "typescript-eslint";

import { componentFiles } from "./files";
import {
  componentSyntaxRestrictions,
  normalModuleSyntaxRestrictions,
  sourceModuleSyntaxRestrictions,
} from "./restrictions";

/**
 * Creates component boundary rules that keep view files pure and focused.
 *
 * @returns Flat config blocks for component purity and import boundaries.
 */
export function createComponentBoundaryConfigs(): readonly ConfigWithExtends[] {
  return [
    {
      files: ["apps/studio/src/**/*.{ts,tsx}", "src/**/*.{ts,tsx}"],
      rules: {
        "no-console": "error",
      },
    },
    {
      files: [...componentFiles],
      plugins: {
        sonarjs,
      },
      rules: {
        "no-param-reassign": "error",
        "no-restricted-imports": [
          "error",
          {
            paths: [
              {
                message:
                  "Components must not import filesystem APIs. Move IO into scripts, loaders, or helpers outside the view layer.",
                name: "node:fs",
              },
              {
                message:
                  "Components must not import filesystem APIs. Move IO into scripts, loaders, or helpers outside the view layer.",
                name: "node:fs/promises",
              },
              {
                message:
                  "Components must not import process APIs. Pass explicit data into views instead.",
                name: "node:process",
              },
            ],
            patterns: [
              {
                group: ["scripts/**", "../scripts/**", "../../scripts/**"],
                message: "Components must not import repository scripts.",
              },
            ],
          },
        ],
        "no-restricted-syntax": [
          "error",
          ...normalModuleSyntaxRestrictions,
          ...componentSyntaxRestrictions,
        ],
        "sonarjs/cognitive-complexity": ["error", 8],
      },
    },
  ];
}

/**
 * Creates source-module export restrictions for reusable TypeScript modules.
 *
 * @returns Flat config blocks for module export conventions.
 */
export function createSourceModuleConfigs(): readonly ConfigWithExtends[] {
  return [
    {
      files: [
        "apps/studio/src/**/*.ts",
        "src/lib/**/*.ts",
        "scripts/**/*.ts",
        "tests/**/*.ts",
      ],
      rules: {
        "no-restricted-syntax": ["error", ...sourceModuleSyntaxRestrictions],
      },
    },
  ];
}
