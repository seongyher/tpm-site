import jsdoc from "eslint-plugin-jsdoc";
import noUnsanitized from "eslint-plugin-no-unsanitized";
import type { ConfigWithExtends } from "typescript-eslint";

import { publicDocumentationRules } from "./documentation";
import { browserRuntimeGlobals, unsafeNumericGlobals } from "./restrictions";

/**
 * Creates Astro component rules for static views, docs, and unsafe HTML.
 *
 * @returns Flat config blocks scoped to Astro component files.
 */
export function createAstroConfigs(): readonly ConfigWithExtends[] {
  return [
    {
      files: ["apps/studio/src/**/*.astro", "src/**/*.astro"],
      plugins: {
        jsdoc,
        "no-unsanitized": noUnsanitized,
      },
      rules: {
        "astro/no-exports-from-components": "error",
        "astro/no-prerender-export-outside-pages": "error",
        "astro/no-set-html-directive": "error",
        "astro/no-set-text-directive": "error",
        "astro/no-unsafe-inline-scripts": "error",
        "astro/no-unused-css-selector": "error",
        "astro/prefer-class-list-directive": "error",
        "no-console": "error",
        "no-restricted-globals": [
          "error",
          ...unsafeNumericGlobals,
          ...browserRuntimeGlobals,
        ],
        ...publicDocumentationRules,
        "no-unsanitized/method": "error",
        "no-unsanitized/property": "error",
      },
    },
  ];
}
