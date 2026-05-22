import type { LocalizationFixture } from "../../src/lib/localization/localization-fixtures";

/** Representative localization fixtures for layout and generated-output tests. */
export const representativeLocalizationFixtures: readonly LocalizationFixture[] =
  [
    {
      id: "single-english",
      labels: {
        labels: {
          "article.action.cite": "Cite",
          "article.action.pdf": "PDF",
          "article.action.share": "Share",
          "nav.articles": "Articles",
        },
        requiredLabelIds: [
          "nav.articles",
          "article.action.cite",
          "article.action.share",
          "article.action.pdf",
        ],
      },
      locales: [
        {
          direction: "ltr",
          id: "en",
          isDefault: true,
          label: "English",
          languageTag: "en-US",
          localeCode: "en_US",
        },
      ],
      routeMode: "single",
      routes: [
        {
          id: "article-intro",
          localeId: "en",
          path: "/articles/intro/",
          title: "Intro",
        },
      ],
    },
    {
      id: "single-french",
      labels: {
        labels: {
          "article.action.cite": "Citer",
          "article.action.pdf": "PDF",
          "article.action.share": "Partager",
          "nav.articles": "Articles",
        },
        requiredLabelIds: [
          "nav.articles",
          "article.action.cite",
          "article.action.share",
          "article.action.pdf",
        ],
      },
      locales: [
        {
          direction: "ltr",
          id: "fr",
          isDefault: true,
          label: "Français",
          languageTag: "fr-FR",
          localeCode: "fr_FR",
        },
      ],
      routeMode: "single",
      routes: [
        {
          id: "article-bonjour",
          localeId: "fr",
          path: "/articles/bonjour/",
          title: "Bonjour",
        },
      ],
    },
    {
      id: "multilingual-unprefixed-default",
      labels: {
        labels: {
          "article.action.cite": "Cite",
          "article.action.pdf": "PDF",
          "article.action.share": "Share",
          "nav.articles": "Articles",
        },
        requiredLabelIds: [
          "nav.articles",
          "article.action.cite",
          "article.action.share",
          "article.action.pdf",
        ],
      },
      locales: [
        {
          direction: "ltr",
          id: "en",
          isDefault: true,
          label: "English",
          languageTag: "en-US",
          localeCode: "en_US",
        },
        {
          direction: "ltr",
          id: "es",
          isDefault: false,
          label: "Español",
          languageTag: "es-ES",
          localeCode: "es_ES",
          routePrefix: "/es",
        },
      ],
      routeMode: "unprefixed-default",
      routes: [
        {
          alternates: ["/es/articulos/entrada/"],
          id: "article-entry",
          localeId: "en",
          path: "/articles/entry/",
          title: "Entry",
        },
        {
          alternates: ["/articles/entry/"],
          id: "article-entry",
          localeId: "es",
          path: "/es/articulos/entrada/",
          title: "Entrada",
        },
      ],
    },
    {
      id: "rtl-arabic",
      labels: {
        labels: {
          "article.action.cite": "استشهد",
          "article.action.pdf": "PDF",
          "article.action.share": "مشاركة",
          "nav.articles": "مقالات",
        },
        requiredLabelIds: [
          "nav.articles",
          "article.action.cite",
          "article.action.share",
          "article.action.pdf",
        ],
      },
      locales: [
        {
          direction: "rtl",
          id: "ar",
          isDefault: true,
          label: "العربية",
          languageTag: "ar",
          localeCode: "ar",
        },
      ],
      routeMode: "single",
      routes: [
        {
          id: "article-arabic",
          localeId: "ar",
          path: "/articles/arabic/",
          title: "مقالة",
        },
      ],
      unsupportedRtlSurfaces: ["horizontal-scroll-rail"],
    },
    {
      id: "long-string-and-missing",
      labels: {
        labels: {
          "article.action.cite":
            "CitationActionLabelWithoutAnySpacesForOverflow",
          "article.action.share": "Share",
          "nav.articles": "Articles",
        },
        requiredLabelIds: [
          "nav.articles",
          "article.action.cite",
          "article.action.share",
          "article.action.pdf",
        ],
      },
      locales: [
        {
          direction: "ltr",
          id: "en",
          isDefault: true,
          label: "English",
          languageTag: "en-US",
          localeCode: "en_US",
        },
        {
          direction: "ltr",
          id: "de",
          isDefault: false,
          label: "Deutsch",
          languageTag: "de-DE",
          localeCode: "de_DE",
          routePrefix: "/de",
        },
      ],
      routeMode: "unprefixed-default",
      routes: [
        {
          id: "article-long",
          localeId: "en",
          missingTranslations: ["de"],
          path: "/articles/long-label/",
          title: "Long label fixture",
        },
      ],
    },
  ];
