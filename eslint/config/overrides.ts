import type { ConfigWithExtends } from "typescript-eslint";

/**
 * Creates targeted overrides for tool configs, declarations, and scripts.
 *
 * @returns Flat config blocks for local exceptions and convention overrides.
 */
export function createOverrideConfigs(): readonly ConfigWithExtends[] {
  return [
    {
      files: [
        "src/lib/**/*.ts",
        "src/pages/**/*.ts",
        "tests/**/*.ts",
        "scripts/**/*.ts",
        "*.config.{js,cjs,ts,mjs}",
      ],
      rules: {
        "no-console": "off",
      },
    },
    {
      files: ["scripts/**/*.ts", "tests/**/*.ts"],
      rules: {
        "security/detect-non-literal-fs-filename": "off",
      },
    },
    {
      files: ["eslint.config.ts", "eslint/**/*.ts", "*.config.{js,cjs,ts,mjs}"],
      rules: {
        "@typescript-eslint/no-deprecated": "off",
        "@typescript-eslint/no-unnecessary-condition": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-type-assertion": "off",
        "array-func/prefer-array-from": "off",
        "dot-notation": "off",
        "unicorn/no-anonymous-default-export": "off",
      },
    },
    {
      files: [
        "src/components/seo/AnnouncementJsonLd.astro",
        "src/components/seo/ArticleJsonLd.astro",
        "src/components/seo/SiteHead.astro",
      ],
      rules: {
        "astro/no-set-html-directive": "off",
      },
    },
    {
      files: ["src/scripts/search-page.ts"],
      rules: {
        "jsdoc/no-bad-blocks": "off",
        "no-unsanitized/method": "off",
      },
    },
    {
      files: ["src/env.d.ts"],
      rules: {
        "@typescript-eslint/triple-slash-reference": "off",
      },
    },
    {
      files: ["types/**/*.d.ts"],
      rules: {
        "@typescript-eslint/consistent-type-imports": "off",
      },
    },
  ];
}
