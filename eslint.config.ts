import path from "node:path";
import { fileURLToPath } from "node:url";

import js from "@eslint/js";
import { globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import astro from "eslint-plugin-astro";
import regexp from "eslint-plugin-regexp";
import tseslint from "typescript-eslint";

import { createAstroConfigs } from "./eslint/config/astro";
import { createBaseCodeConfigs } from "./eslint/config/base-code";
import {
  createComponentBoundaryConfigs,
  createSourceModuleConfigs,
} from "./eslint/config/components";
import { createDataConfigs } from "./eslint/config/data";
import { createMdxConfigs } from "./eslint/config/mdx";
import { createOverrideConfigs } from "./eslint/config/overrides";
import { createReactConfigs } from "./eslint/config/react";
import { createTailwindConfigs } from "./eslint/config/tailwind";
import { createTestConfigs } from "./eslint/config/tests";
import {
  createTypedPresetConfigs,
  createTypedRuleConfigs,
} from "./eslint/config/typed";

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  globalIgnores([
    ".astro/",
    "apps/studio/.astro/",
    ".lighthouseci/",
    ".unlighthouse/",
    ".wrangler/",
    "coverage/",
    "dist/",
    "dist-catalog/",
    "node_modules/",
    "playwright-report/",
    "target/",
    "test-results/",
    "tmp/",
    "package-lock.json",
  ]),
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
  },
  js.configs.recommended,
  ...astro.configs["flat/recommended"],
  ...astro.configs["flat/jsx-a11y-strict"],
  ...createMdxConfigs(),
  ...createDataConfigs(),
  regexp.configs["flat/recommended"],
  ...createTypedPresetConfigs(tsconfigRootDir),
  ...createBaseCodeConfigs(),
  ...createTypedRuleConfigs(),
  ...createSourceModuleConfigs(),
  ...createReactConfigs(),
  ...createTestConfigs(),
  ...createComponentBoundaryConfigs(),
  ...createAstroConfigs(),
  ...createTailwindConfigs(),
  ...createOverrideConfigs(),
  eslintConfigPrettier,
);
