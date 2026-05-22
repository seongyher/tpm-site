import type { ArticleListItem } from "../../lib/article-list";
import type { SectionNavItem } from "../../lib/navigation";

/** Deliberately awkward text used to exercise wrapping behavior. */
export const longUnbrokenWord =
  "metamemeticcountercounterinterpretationwithoutnaturalbreakpoints";

/** Deliberately long translated label used to expose localized action overflow. */
export const longTranslatedActionLabel =
  "AkademischeLangformAktionOhneNatuerlicheTrennstellen";

/** Tag set large enough to expose wrapping and density issues. */
export const catalogTags = [
  "research",
  "philosophy",
  "history",
  "platforms",
  "field-notes",
  longUnbrokenWord,
] as const;

/** Navigation data with long titles, current state, dense lists, and one-item lists. */
export const catalogNavigationItems = [
  {
    articles: [
      {
        description: "A compact article example for navigation previews.",
        href: "/articles/diagrams-are-not-decorations/",
        isCurrent: false,
        slug: "diagrams-are-not-decorations",
        title: "Diagrams Are Not Decorations",
      },
      {
        description: "A deliberately long title for wrapping behavior.",
        href: "/articles/catalog-boundary-example/",
        isCurrent: true,
        slug: "catalog-boundary-example",
        title: "A Catalog Article With a Long But Plausible Title",
      },
      {
        description: "A hostile long-word title example.",
        href: "/articles/hostile-title-example/",
        isCurrent: false,
        slug: "hostile-title-example",
        title: `One ${longUnbrokenWord} Example`,
      },
    ],
    description: "How research notes move through a publication.",
    href: "/categories/research/",
    isCurrent: false,
    isOpen: true,
    slug: "research",
    title: "Research",
  },
  {
    articles: [
      {
        description: "Game studies category article example.",
        href: "/articles/twitch-plays-pokemon/",
        isCurrent: false,
        slug: "twitch-plays-pokemon",
        title: "Twitch Plays Pokemon",
      },
    ],
    description: "Games and culture.",
    href: "/categories/game-studies/",
    isCurrent: false,
    isOpen: false,
    slug: "game-studies",
    title: "Game Studies",
  },
] as const satisfies readonly SectionNavItem[];

/** Article card/list data with compact, long-title, and long-word variants. */
export const catalogArticleItems = [
  {
    author: "Catalog Fixture",
    category: {
      href: "/categories/research/",
      title: "Research",
    },
    date: "January 12, 2026",
    description:
      "A compact article teaser with enough text to check wrapping and rhythm.",
    href: "/articles/catalog-boundary-example/",
    title: "A Catalog Article With a Long But Plausible Editorial Title",
  },
  {
    author: "Catalog Fixture",
    category: {
      href: "/categories/platform-notes/",
      title: "Platform Notes",
    },
    date: "January 9, 2026",
    description:
      "A second card keeps list spacing and repeated-item styling visible.",
    href: "/articles/catalog-spacing-example/",
    title: "A Compact Catalog Row",
  },
  {
    author: "Catalog Fixture",
    category: {
      href: "/categories/aesthetics/",
      title: "Aesthetics",
    },
    date: "January 1, 2026",
    description: `A hostile fixture with ${longUnbrokenWord} in ordinary prose.`,
    href: "/articles/hostile-article-card/",
    title: `A Very Long Article Title Containing ${longUnbrokenWord}`,
  },
] as const satisfies readonly ArticleListItem[];

/** RTL article/list fixtures for catalog-only layout review. */
export const catalogRtlArticleItems = [
  {
    author: "كاتب الفهرس",
    category: {
      href: "/categories/research/",
      title: "بحث",
    },
    date: "١٢ يناير ٢٠٢٦",
    description:
      "مثال قصير لاختبار اتجاه النص العربي داخل بطاقات المقالات والقوائم.",
    href: "/articles/rtl-catalog-example/",
    title: "مثال عربي طويل نسبيا لاختبار التفاف العنوان في الواجهة",
  },
] as const satisfies readonly ArticleListItem[];
