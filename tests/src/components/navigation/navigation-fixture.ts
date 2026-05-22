import type { SectionNavItem } from "../../../../src/lib/site/navigation";

/** Category navigation fixture used by Astro component render tests. */
export const navigationItems = [
  {
    articles: [
      {
        description: "Current article description.",
        href: "/articles/current-article/",
        isCurrent: true,
        slug: "current-article",
        title: "Current Article With A Very Long Title For Wrapping",
      },
      {
        description: "Other article description.",
        href: "/articles/other-article/",
        isCurrent: false,
        slug: "other-article",
        title: "Other Article",
      },
    ],
    description: "Metamemetics category description.",
    href: "/categories/metamemetics/",
    isCurrent: false,
    isOpen: true,
    slug: "metamemetics",
    title: "Metamemetics",
  },
  {
    articles: [],
    description: "History category description.",
    href: "/categories/history/",
    isCurrent: true,
    isOpen: true,
    slug: "history",
    title: "History",
  },
] as const satisfies SectionNavItem[];
