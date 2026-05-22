import sampleImage from "@site/assets/shared/tpm_defaultpic.jpg";

import type { ArticleListItem } from "../../../../src/lib/content/article-list";

/** Article-list fixture used by article component render tests. */
export const articleItems = [
  {
    author: "Seong-Young Her",
    authors: [
      {
        displayName: "Seong-Young Her",
        href: "/authors/seong-young-her/",
        id: "seong-young-her",
        type: "person",
      },
    ],
    category: {
      href: "/categories/history/",
      title: "History",
    },
    date: "April 6, 2022",
    description: "Article description.",
    href: "/articles/article-title/",
    image: {
      alt: "Article preview image",
      src: sampleImage,
    },
    title: "Article Title",
  },
  {
    author: "Seong-Young Her",
    authors: [
      {
        displayName: "Seong-Young Her",
        href: "/authors/seong-young-her/",
        id: "seong-young-her",
        type: "person",
      },
    ],
    category: {
      href: "/categories/metamemetics/",
      title: "Metamemetics",
    },
    date: "May 16, 2021",
    description: "Second article description.",
    href: "/articles/second-article/",
    title: "Second Article",
  },
] as const satisfies readonly ArticleListItem[];
