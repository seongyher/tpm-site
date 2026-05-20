import type { KnipConfig } from "knip";

const config = {
  entry: [
    "astro.config.ts",
    "eslint/**/*.ts",
    "eslint.config.ts",
    "lighthouserc.json",
    "playwright.config.ts",
    "scripts/**/*.ts",
    "src/content.config.ts",
    "src/pages/**/*.{astro,ts,tsx}",
    "src/scripts/**/*.ts",
    "tests/**/*.ts",
  ],
  ignore: [
    ".astro/**",
    ".lighthouseci/**",
    "coverage/**",
    "dist/**",
    "dist-catalog/**",
    "playwright-report/**",
    "public/**",
    "test-results/**",
  ],
  ignoreBinaries: ["gitleaks"],
  ignoreDependencies: [
    "@typescript-eslint/parser",
    "@tailwindcss/typography",
    "html-validate",
    "markdownlint-cli2",
    "pagefind",
    "sort-package-json",
    "tailwindcss",
    "tw-animate-css",
  ],
  project: [
    "astro.config.ts",
    "eslint/**/*.ts",
    "eslint.config.ts",
    "playwright.config.ts",
    "scripts/**/*.ts",
    "src/**/*.{astro,ts,tsx}",
    "tests/**/*.ts",
  ],
} satisfies KnipConfig;

export default config;
