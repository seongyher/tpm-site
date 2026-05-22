import type { BibliographyEntry } from "../../../../src/lib/references/bibliography";

/** Shared bibliography entry fixture for component render tests. */
export const bibliographyEntryFixture = {
  display: {
    authors: "Baudrillard, Jean",
    fallbackText:
      "Baudrillard, Jean. Simulacra and Simulation. Semiotext(e). 1981. Source.",
    publisher: "Semiotext(e)",
    sourceUrl: "https://example.com/source-with-a-very-long-path-that-wraps",
    title: "Simulacra and Simulation",
    year: "1981",
  },
  id: "bibliography-baudrillard-simulacra",
  sourceArticles: [
    {
      articleId: "wittgensteins-most-beloved-quote-was-real-but-its-fake-now",
      date: "April 6, 2022",
      href: "/articles/wittgensteins-most-beloved-quote-was-real-but-its-fake-now/",
      markerIds: ["cite-ref-baudrillard-1981"],
      publishedAt: new Date("2022-04-06T23:58:10.000Z"),
      title: "Wittgenstein's Most Beloved Quote Was Real, But It's Fake Now",
    },
    {
      articleId: "what-is-a-meme",
      date: "May 16, 2021",
      href: "/articles/what-is-a-meme/",
      markerIds: ["cite-ref-baudrillard-1981-2"],
      publishedAt: new Date("2021-05-16T00:00:00.000Z"),
      title: "What Is A Meme?",
    },
  ],
  sourceKey: "doi:catalog-baudrillard",
  sourceContent: [
    {
      children: [
        { kind: "text", text: "Baudrillard, Jean. " },
        {
          children: [{ kind: "text", text: "Simulacra and Simulation" }],
          kind: "emphasis",
          text: "Simulacra and Simulation",
        },
        { kind: "text", text: ". Semiotext(e). 1981. " },
        {
          children: [{ kind: "text", text: "Source" }],
          kind: "link",
          text: "Source",
          url: "https://example.com/source-with-a-very-long-path-that-wraps",
        },
        { kind: "text", text: "." },
      ],
      kind: "paragraph",
      text: "Baudrillard, Jean. Simulacra and Simulation. Semiotext(e). 1981. Source.",
    },
  ],
  sourceText:
    "Baudrillard, Jean. Simulacra and Simulation. Semiotext(e). 1981. Source.",
  sourceUrl: "https://example.com/source-with-a-very-long-path-that-wraps",
} as const satisfies BibliographyEntry;
