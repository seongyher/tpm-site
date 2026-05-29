# Publishable Feed, Article Continuity, And Embeds

This note defines three small platform behaviors that should stay reusable
across site instances:

- RSS entries should come from publishable content, not only article routes.
- Article pages should offer one chronological reading continuation before the
  support call to action.
- Embedded media should use a provider-aware layout contract instead of treating
  every iframe as video.

## RSS Publishables

Articles and announcements are both publishable entries. RSS should include both
when the site has `features.feed` enabled and the entry is visible on the
`feed` surface.

The default remains permissive:

```yaml
visibility:
  feed: true
```

Authors only need to write `visibility.feed: false` for exceptions. Feed output
must remain newest-first across all included publishable kinds. Feed items keep
the current article behavior for title, canonical link, publication date,
author, description, and generated social-preview image enclosures.

Implementation requirements:

- use the existing content defaults and `normalizePublishableVisibility`;
- include announcements without adding announcement-specific hard-coded paths to
  reusable feed logic;
- preserve source-specific canonical URLs;
- keep social image fallback behavior for entries without their own image;
- test inclusion, opt-out, sorting, and source wiring.

## Article Continuity

The end of an article should guide a reader to one more article before asking
for support. The section appears above the support block and is intentionally
about chronological continuity, not recommendation logic.

Selection rules:

1. Sort published articles from oldest to newest using the route helper date
   ordering contract.
2. For the current article, select the immediate newer article.
3. If the current article is the newest article, select the immediate older
   article and label the section `Previous Article`.
4. If there is no neighboring article, render no section.

The section should consume the same article-list item shape used by archive and
related-article blocks. This keeps article cards responsive and avoids a custom
one-off layout.

Implementation requirements:

- exclude announcements;
- preserve current support, category, related, references, and tag ordering
  after adding the new section;
- keep the block within the article end stack/prose measure;
- test helper selection and layout placement.

## Embed Layouts

Raw Markdown iframes and MDX embed components should share one layout model:

- `video`: responsive `aspect-video` frame for YouTube-like video embeds;
- `audio`: compact fixed-height frame for SoundCloud-like audio players;
- `unknown`: conservative video frame unless a later provider requires a better
  default.

Provider-specific components such as `YouTubeEmbed` and `SoundCloudEmbed` are
thin wrappers over the generic iframe primitive. Markdown authors may still
paste normal provider iframe markup; the Markdown transform classifies the
provider and applies the same layout contract automatically.

Implementation requirements:

- do not require authors to convert existing Markdown to MDX;
- preserve PDF fallback captions for embedded media;
- keep provider-specific behavior in one classifier so components and Markdown
  transforms cannot drift;
- test YouTube/video and SoundCloud/audio behavior for both component and raw
  iframe paths.

## Design Review

The three changes are ready for implementation because they reuse existing
platform boundaries:

- feed visibility already exists in the publishable model and site config;
- article list items already provide a reusable responsive display contract;
- the current iframe transformer already centralizes PDF fallbacks, so adding a
  provider-aware layout contract reduces special-case CSS instead of adding it.

The main risk is over-abstracting embeds. The implementation should start with
only the layouts the site already needs: video and SoundCloud audio. Additional
providers should be added when content requires them.
