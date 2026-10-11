# Article Scholar Meta

Source: `src/components/seo/ArticleScholarMeta.astro`

## Purpose

`ArticleScholarMeta` emits Google Scholar/Highwire citation metadata for an
article page.

## Public Contract

- `metadata: ArticleScholarMetaViewModel`

The view model must already contain normalized title, author names,
publication date, language, abstract, keywords, and citation references.

## Composition Relationships

Used by `ArticleLayout` inside the document head. `article-scholar-meta.ts`
derives the metadata; this component only serializes it as `<meta>`
tags.

## Layout And Responsiveness

No visible layout.

## Layering And Scrolling

No layering or scroll behavior.

## Interaction States

No interaction.

## Accessibility Semantics

The component emits machine-readable metadata only and should not duplicate
visible content.

## Content Edge Cases

Handle multiple authors, empty optional metadata, punctuation-heavy titles, and
dates that must remain stable for citation crawlers.

## Theme Behavior

No theme behavior.

## Testable Invariants

- Every article emits `citation_title`, at least one `citation_author`, and
  `citation_publication_date`.
- Articles omit `citation_pdf_url` because the site does not generate PDFs.

## Follow-Up Notes

- Keep crawler-facing metadata in normalized helpers so this component remains
  a simple serializer.
