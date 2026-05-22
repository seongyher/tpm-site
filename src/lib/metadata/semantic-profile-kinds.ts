/** Semantic profile kinds exposed to site-owner configuration. */
export const semanticProfileKinds = [
  "audio",
  "book",
  "dataset",
  "event",
  "faq",
  "review",
  "software",
  "video",
] as const;

/** Site-configurable semantic profile kind. */
export type SemanticProfileKind = (typeof semanticProfileKinds)[number];
