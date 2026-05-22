import {
  createOutputDiagnostic,
  type OutputDiagnostic,
} from "../diagnostics/output-verification";

/** Locale text direction. */
export type LocaleDirection = "ltr" | "rtl";

/** Locale route prefix mode. */
export type LocaleRouteMode =
  | "prefixed-default"
  | "single"
  | "unprefixed-default";

/** Normalized locale profile used by fixtures. */
export interface LocalizationFixtureLocaleProfile {
  readonly direction: LocaleDirection;
  readonly id: string;
  readonly isDefault: boolean;
  readonly label: string;
  readonly languageTag: string;
  readonly localeCode: string;
  readonly routePrefix?: string | undefined;
}

/** One translated route used by localization fixtures. */
export interface LocalizationFixtureRoute {
  readonly alternates?: readonly string[] | undefined;
  readonly id: string;
  readonly localeId: string;
  readonly missingTranslations?: readonly string[] | undefined;
  readonly path: string;
  readonly title: string;
}

/** Labels supplied by one fixture. */
export interface LocalizationFixtureLabels {
  readonly labels: Readonly<Record<string, string>>;
  readonly requiredLabelIds: readonly string[];
}

/** One fixture covering a localization scenario. */
export interface LocalizationFixture {
  readonly id: string;
  readonly labels: LocalizationFixtureLabels;
  readonly locales: readonly LocalizationFixtureLocaleProfile[];
  readonly routeMode: LocaleRouteMode;
  readonly routes: readonly LocalizationFixtureRoute[];
  readonly unsupportedRtlSurfaces?: readonly string[] | undefined;
}

/** Snapshot of metadata/feed/search/PDF behavior for one localized route. */
export interface LocalizationFixtureSnapshot {
  readonly alternateLinks: readonly string[];
  readonly direction: LocaleDirection;
  readonly feedLanguage: string;
  readonly htmlLang: string;
  readonly jsonLdInLanguage: string;
  readonly ogLocale: string;
  readonly pdfLanguage: string;
  readonly route: string;
  readonly searchLanguage: string;
}

/** Localization fixture report. */
export interface LocalizationFixtureReport {
  readonly diagnostics: readonly OutputDiagnostic[];
  readonly snapshots: readonly LocalizationFixtureSnapshot[];
}

/**
 * Creates metadata/feed/search/PDF snapshots and diagnostics for locale fixtures.
 *
 * @param fixtures Localization fixtures.
 * @returns Fixture snapshots plus diagnostics.
 */
export function createLocalizationFixtureReport(
  fixtures: readonly LocalizationFixture[],
): LocalizationFixtureReport {
  return {
    diagnostics: fixtures.flatMap(localizationDiagnostics),
    snapshots: fixtures.flatMap(localizationSnapshots),
  };
}

function localizationSnapshots(
  fixture: LocalizationFixture,
): LocalizationFixtureSnapshot[] {
  return fixture.routes.map((route) => {
    const locale = localeForRoute(fixture, route);
    return {
      alternateLinks: Array.from(route.alternates ?? []).sort(),
      direction: locale.direction,
      feedLanguage: locale.languageTag,
      htmlLang: locale.languageTag,
      jsonLdInLanguage: locale.languageTag,
      ogLocale: locale.localeCode,
      pdfLanguage: locale.languageTag,
      route: route.path,
      searchLanguage: locale.languageTag,
    };
  });
}

function localizationDiagnostics(
  fixture: LocalizationFixture,
): OutputDiagnostic[] {
  return [
    ...missingLabelDiagnostics(fixture),
    ...longStringDiagnostics(fixture),
    ...missingTranslationDiagnostics(fixture),
    ...rtlUnsupportedDiagnostics(fixture),
    ...routeModeDiagnostics(fixture),
  ];
}

function missingLabelDiagnostics(
  fixture: LocalizationFixture,
): OutputDiagnostic[] {
  return fixture.labels.requiredLabelIds.flatMap((labelId) =>
    !labelExists(fixture.labels.labels, labelId)
      ? [
          localeDiagnostic({
            code: "content.locale-missing-label",
            message: `${fixture.id} is missing required localized label ${labelId}.`,
            remediation:
              "Add the label to the locale label registry or remove it from required labels.",
          }),
        ]
      : [],
  );
}

function longStringDiagnostics(
  fixture: LocalizationFixture,
): OutputDiagnostic[] {
  return Object.entries(fixture.labels.labels).flatMap(([labelId, label]) =>
    label.length > 32 && !/\s/u.test(label)
      ? [
          localeDiagnostic({
            code: "content.locale-long-unbroken-string",
            message: `${fixture.id} label ${labelId} is a long unbroken string.`,
            remediation:
              "Verify components can wrap or truncate this label without overflow.",
          }),
        ]
      : [],
  );
}

function missingTranslationDiagnostics(
  fixture: LocalizationFixture,
): OutputDiagnostic[] {
  return fixture.routes.flatMap((route) =>
    (route.missingTranslations ?? []).map((localeId) =>
      localeDiagnostic({
        code: "content.locale-missing-translation",
        message: `${route.id} is missing a ${localeId} translation.`,
        remediation:
          "Add the translated route or mark the fallback relationship explicitly.",
        route: route.path,
      }),
    ),
  );
}

function rtlUnsupportedDiagnostics(
  fixture: LocalizationFixture,
): OutputDiagnostic[] {
  const hasRtl = fixture.locales.some((locale) => locale.direction === "rtl");

  return hasRtl
    ? (fixture.unsupportedRtlSurfaces ?? []).map((surface) =>
        localeDiagnostic({
          code: "html.locale-rtl-unsupported-surface",
          message: `${fixture.id} marks ${surface} as not yet verified for RTL.`,
          remediation:
            "Add RTL layout coverage or keep the surface disabled for RTL locales.",
        }),
      )
    : [];
}

function routeModeDiagnostics(
  fixture: LocalizationFixture,
): OutputDiagnostic[] {
  if (fixture.routeMode === "single") {
    return [];
  }

  const missingPrefixes = fixture.locales
    .filter(
      (locale) =>
        fixture.routeMode === "prefixed-default" ||
        (fixture.routeMode === "unprefixed-default" && !locale.isDefault),
    )
    .filter((locale) => locale.routePrefix === undefined);

  return missingPrefixes.map((locale) =>
    localeDiagnostic({
      code: "route.locale-prefix-missing",
      message: `${fixture.id} locale ${locale.id} needs a route prefix for ${fixture.routeMode} mode.`,
      remediation:
        "Set routePrefix for every locale that should publish under a localized prefix.",
    }),
  );
}

function localeForRoute(
  fixture: LocalizationFixture,
  route: LocalizationFixtureRoute,
): LocalizationFixtureLocaleProfile {
  const locale = fixture.locales.find((item) => item.id === route.localeId);
  if (locale === undefined) {
    throw new Error(
      `Localization fixture ${fixture.id} references unknown locale ${route.localeId}.`,
    );
  }

  return locale;
}

function localeDiagnostic({
  code,
  message,
  remediation,
  route,
}: {
  readonly code:
    | "content.locale-long-unbroken-string"
    | "content.locale-missing-label"
    | "content.locale-missing-translation"
    | "html.locale-rtl-unsupported-surface"
    | "route.locale-prefix-missing";
  readonly message: string;
  readonly remediation: string;
  readonly route?: string | undefined;
}): OutputDiagnostic {
  const category = diagnosticCategoryFromCode(code);
  return createOutputDiagnostic({
    category,
    code,
    location: route === undefined ? undefined : { route },
    message,
    moduleId: "content.localization-fixtures",
    owner: "site-config",
    remediation,
    severity: "warning",
  });
}

function diagnosticCategoryFromCode(
  code:
    | "content.locale-long-unbroken-string"
    | "content.locale-missing-label"
    | "content.locale-missing-translation"
    | "html.locale-rtl-unsupported-surface"
    | "route.locale-prefix-missing",
): "content" | "html" | "route" {
  if (code.startsWith("content.")) {
    return "content";
  }

  if (code.startsWith("html.")) {
    return "html";
  }

  return "route";
}

function labelExists(
  labels: Readonly<Record<string, string>>,
  labelId: string,
): boolean {
  return Object.entries(labels).some(([candidate]) => candidate === labelId);
}
