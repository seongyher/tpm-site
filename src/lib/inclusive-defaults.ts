import type { SiteConfig } from "./site-config";
import {
  defaultHomepageDiscoveryLinksConfig,
  defaultHomepageEmptyTextConfig,
  defaultHomepageLabelsConfig,
} from "./site-config-defaults";

type InclusiveDefaultDiagnosticCode =
  | "config.identity-language-invalid"
  | "config.identity-locale-invalid"
  | "config.identity-locale-mismatch"
  | "config.localized-label-defaulted";

/** Site-owner-facing issue for locale, label, and inclusive-default config. */
export interface InclusiveDefaultIssue {
  code: InclusiveDefaultDiagnosticCode;
  message: string;
  repair: string;
  severity: "warning";
}

interface LabelSurface {
  path: string;
  value: string;
}

const defaultEnglishLabels = new Set<string>([
  ...Object.values(defaultHomepageLabelsConfig),
  ...Object.values(defaultHomepageEmptyTextConfig),
  ...defaultHomepageDiscoveryLinksConfig.map((link) => link.label),
]);

/**
 * Reports site config choices that are technically valid but likely hostile to
 * future localization, RTL, and non-English publishing.
 *
 * @param config Parsed site-owner config.
 * @returns Webmaster-facing warnings for inclusive default hardening.
 */
export function inclusiveDefaultIssues(
  config: SiteConfig,
): InclusiveDefaultIssue[] {
  return [...languageMetadataIssues(config), ...localizedLabelIssues(config)];
}

function languageMetadataIssues(config: SiteConfig): InclusiveDefaultIssue[] {
  const { language, locale } = config.identity;
  const invalidLanguage = isReasonableLanguageTag(language)
    ? []
    : [
        {
          code: "config.identity-language-invalid" as const,
          message: `Site language "${language}" should be a BCP 47 language tag such as "en", "fr", or "ar".`,
          repair:
            "Update identity.language in site/config/site.json to a hyphenated language tag used for <html lang> and generated metadata.",
          severity: "warning" as const,
        },
      ];
  const invalidLocale = isReasonableOpenGraphLocale(locale)
    ? []
    : [
        {
          code: "config.identity-locale-invalid" as const,
          message: `Site locale "${locale}" should use Open Graph locale format such as "en_US" or "fr_FR".`,
          repair:
            "Update identity.locale in site/config/site.json to an underscore-separated Open Graph locale.",
          severity: "warning" as const,
        },
      ];
  const mismatchedLocale =
    isEnglishLanguage(language) || !locale.startsWith("en_")
      ? []
      : [
          {
            code: "config.identity-locale-mismatch" as const,
            message: `Site language "${language}" is non-English but identity.locale is still "${locale}".`,
            repair:
              "Set identity.locale in site/config/site.json to the matching Open Graph locale for the publication language.",
            severity: "warning" as const,
          },
        ];

  return [...invalidLanguage, ...invalidLocale, ...mismatchedLocale];
}

function localizedLabelIssues(config: SiteConfig): InclusiveDefaultIssue[] {
  if (isEnglishLanguage(config.identity.language)) {
    return [];
  }

  return labelSurfaces(config)
    .filter((surface) => defaultEnglishLabels.has(surface.value))
    .map((surface) => ({
      code: "config.localized-label-defaulted" as const,
      message: `Non-English site language "${config.identity.language}" is using the default English label "${surface.value}" at ${surface.path}.`,
      repair:
        "Localize this label in site/config/site.json so generated navigation, homepage, feed, PDF, and future studio surfaces do not silently mix languages.",
      severity: "warning" as const,
    }));
}

function labelSurfaces(config: SiteConfig): LabelSurface[] {
  return [
    ...Object.entries(config.homepage.labels).map(([key, value]) => ({
      path: `homepage.labels.${key}`,
      value,
    })),
    ...Object.entries(config.homepage.emptyText).map(([key, value]) => ({
      path: `homepage.emptyText.${key}`,
      value,
    })),
    ...config.homepage.discoveryLinks.map((link, index) => ({
      path: `homepage.discoveryLinks[${index}].label`,
      value: link.label,
    })),
  ];
}

function isEnglishLanguage(language: string): boolean {
  const normalized = language.toLowerCase();

  return normalized === "en" || normalized.startsWith("en-");
}

function isReasonableLanguageTag(language: string): boolean {
  const [primary, ...subtags] = language.toLowerCase().split("-");

  return (
    language === language.trim() &&
    primary !== undefined &&
    primary.length >= 2 &&
    primary.length <= 3 &&
    allAsciiLowercase(primary) &&
    subtags.every(
      (subtag) =>
        subtag.length >= 2 &&
        subtag.length <= 8 &&
        Array.from(subtag).every(asciiLowercaseOrDigit),
    )
  );
}

function isReasonableOpenGraphLocale(locale: string): boolean {
  const [language, ...regions] = locale.split("_");

  return (
    locale === locale.trim() &&
    language !== undefined &&
    regions.length >= 1 &&
    language.length >= 2 &&
    language.length <= 3 &&
    allAsciiLowercase(language) &&
    regions.every(
      (region) =>
        region.length >= 2 &&
        region.length <= 8 &&
        Array.from(region).every(asciiUppercaseOrDigit),
    )
  );
}

function allAsciiLowercase(value: string): boolean {
  return Array.from(value).every(asciiLowercase);
}

function asciiLowercase(character: string): boolean {
  const code = character.codePointAt(0);

  return code !== undefined && code >= 97 && code <= 122;
}

function asciiLowercaseOrDigit(character: string): boolean {
  return asciiLowercase(character) || asciiDigit(character);
}

function asciiUppercaseOrDigit(character: string): boolean {
  const code = character.codePointAt(0);

  return (
    asciiDigit(character) || (code !== undefined && code >= 65 && code <= 90)
  );
}

function asciiDigit(character: string): boolean {
  const code = character.codePointAt(0);

  return code !== undefined && code >= 48 && code <= 57;
}
