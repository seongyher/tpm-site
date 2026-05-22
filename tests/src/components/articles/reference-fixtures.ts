import type { ArticleReferenceData } from "../../../../src/lib/references/article-references/model";

/** Shared normalized reference data for article reference component tests. */
export const articleReferenceFixture = {
  citations: [
    {
      bibtex: {
        entryType: "book",
        fields: {
          author: "Baudrillard, Jean",
          title: "Simulacra",
          url: "https://example.com/source",
          year: "1981",
        },
        key: "baudrillard-1981",
        normalizedKey: "baudrillard-1981",
        raw: "@book{baudrillard-1981}",
      },
      definition: {
        children: [
          {
            children: [
              { kind: "text", text: "Baudrillard, Jean. " },
              {
                children: [{ kind: "text", text: "Simulacra" }],
                kind: "emphasis",
                text: "Simulacra",
              },
              { kind: "text", text: ". " },
              {
                children: [{ kind: "text", text: "Archive" }],
                kind: "link",
                text: "Archive",
                url: "https://example.com/source",
              },
              { kind: "text", text: ". " },
              { kind: "inlineCode", text: "1981" },
            ],
            kind: "paragraph",
            text: "Baudrillard, Jean. Simulacra. Archive. 1981",
          },
        ],
      },
      displayLabel: "Baudrillard 1981",
      id: "cite-baudrillard-1981",
      kind: "citation",
      label: "cite-baudrillard-1981",
      order: 1,
      references: [
        {
          backlinkId: "cite-backref-baudrillard-1981",
          displayText: "1",
          entryId: "cite-baudrillard-1981",
          id: "cite-ref-baudrillard-1981",
          kind: "citation",
          label: "cite-baudrillard-1981",
          order: 1,
        },
        {
          backlinkId: "cite-backref-baudrillard-1981-2",
          displayText: "1",
          entryId: "cite-baudrillard-1981",
          id: "cite-ref-baudrillard-1981-2",
          kind: "citation",
          label: "cite-baudrillard-1981",
          order: 2,
        },
      ],
    },
  ],
  notes: [
    {
      definition: {
        children: [
          {
            children: [
              { kind: "text", text: "Context with " },
              { kind: "inlineCode", text: "code" },
              { kind: "text", text: "." },
            ],
            kind: "paragraph",
            text: "Context with code.",
          },
        ],
      },
      displayLabel: "Internal note label",
      id: "note-context",
      kind: "note",
      label: "note-context",
      order: 1,
      references: [
        {
          backlinkId: "note-backref-context",
          displayText: "1",
          entryId: "note-context",
          id: "note-ref-context",
          kind: "note",
          label: "note-context",
          order: 1,
        },
      ],
    },
  ],
} as const satisfies ArticleReferenceData;
