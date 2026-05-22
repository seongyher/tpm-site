import {
  articleListDescriptionFitClass,
  articleListTitleFitClass,
} from "../lib/articles/article-list-title-fit";

/** Search-result payload returned by Pagefind. */
export interface PagefindData {
  excerpt: string;
  meta: {
    title?: string | undefined;
  };
  url: string;
}

/** Runtime Pagefind module shape loaded from the generated static bundle. */
export interface PagefindModule {
  options(options: { excerptLength: number }): Promise<void> | void;
  search(query: string): Promise<PagefindSearch>;
}

/** Lazy Pagefind result handle. */
export interface PagefindResult {
  data(): Promise<PagefindData>;
}

/** Pagefind search response containing lazy result handles. */
export interface PagefindSearch {
  results: PagefindResult[];
}

/** Prefetch dependency used by dynamically rendered search-result links. */
export type SearchResultPrefetcher = (url: string) => Promise<void> | void;

interface SearchErrorTarget {
  textContent: null | string;
}

const skippedExcerptTags = new Set(["script", "style", "template"]);
const tagNameTerminators = new Set([" ", "\n", "\t", "\r", "\f", "/", ">"]);

interface ExcerptState {
  markTarget: HTMLElement | undefined;
  skippedTag: string | undefined;
}

interface ExcerptTag {
  isClosing: boolean;
  name: string;
}

interface ExcerptTagMatch {
  end: number;
  start: number;
  tag: ExcerptTag | undefined;
}

/**
 * Checks the runtime shape of the Pagefind module loaded in the browser.
 *
 * @param value Unknown module value from dynamic import.
 * @returns Whether the module exposes the Pagefind search API.
 */
export function isPagefindModule(value: unknown): value is PagefindModule {
  return (
    typeof value === "object" &&
    value !== null &&
    "options" in value &&
    "search" in value &&
    typeof value.options === "function" &&
    typeof value.search === "function"
  );
}

/**
 * Loads the generated Pagefind module from built static output.
 *
 * @returns Pagefind module with configured search API.
 */
export async function loadPagefind(): Promise<PagefindModule> {
  const pagefindUrl = "/pagefind/pagefind.js";
  // Coverage note: Pagefind is generated only after a production build. Unit
  // tests inject a loader into `runSearch()` instead of importing generated
  // static output from the test process.
  const pagefindModule: unknown = await import(/* @vite-ignore */ pagefindUrl);

  if (!isPagefindModule(pagefindModule)) {
    throw new TypeError("Pagefind module has an unexpected shape.");
  }

  return pagefindModule;
}

/**
 * Renders search results into the target container.
 *
 * @param pagefind Search provider.
 * @param results Results container to replace.
 * @param value Search query text.
 * @param prefetchLink Link prefetch dependency for dynamic result anchors.
 */
export async function renderResults(
  pagefind: PagefindModule,
  results: HTMLElement,
  value: string,
  prefetchLink: SearchResultPrefetcher = prefetchSearchResult,
): Promise<void> {
  const searchDocument = results.ownerDocument;
  results.replaceChildren();

  if (value.trim() === "") {
    return;
  }

  const search = await pagefind.search(value);
  for (const result of search.results.slice(0, 20)) {
    const data = await result.data();
    const item = searchDocument.createElement("a");
    const title = searchDocument.createElement("strong");
    const excerpt = searchDocument.createElement("span");

    item.className =
      "search-result border-border text-foreground grid min-h-28 content-center gap-2 border-b py-6 no-underline transition-colors first:pt-0 last:border-b-0 last:pb-0 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
    item.href = data.url;
    item.dataset["astroPrefetch"] = "hover";
    const titleText = data.meta.title ?? data.url;
    title.className = `text-foreground line-clamp-2 leading-tight font-semibold tracking-normal ${articleListTitleFitClass(titleText, false)}`;
    title.textContent = titleText;
    excerpt.className = `text-muted-foreground line-clamp-3 transition-colors ${articleListDescriptionFitClass(data.excerpt, false)}`;
    excerpt.replaceChildren(
      searchExcerptFragment(searchDocument, data.excerpt),
    );
    item.append(title, excerpt);
    bindSearchResultPrefetch(item, data.url, prefetchLink);
    results.append(item);
  }
}

/**
 * Prefetches a search result through Astro's browser prefetch runtime.
 *
 * @param url Internal result URL to prefetch.
 */
export async function prefetchSearchResult(url: string): Promise<void> {
  const { prefetch } = await import("astro:prefetch");

  prefetch(url);
}

/**
 * Renders the search error fallback.
 *
 * @param container Element that should display the error.
 */
export function renderSearchError(container: SearchErrorTarget): void {
  container.textContent = "Search is unavailable right now.";
}

function searchExcerptFragment(
  searchDocument: Document,
  excerptHtml: string,
): DocumentFragment {
  const fragment = searchDocument.createDocumentFragment();

  appendSearchExcerptHtml(searchDocument, fragment, excerptHtml);

  return fragment;
}

function appendSearchExcerptHtml(
  searchDocument: Document,
  fragment: DocumentFragment,
  excerptHtml: string,
): void {
  let cursor = 0;
  let state: ExcerptState = {
    markTarget: undefined,
    skippedTag: undefined,
  };

  while (cursor < excerptHtml.length) {
    const match = nextExcerptTag(excerptHtml, cursor);

    if (match === undefined) {
      appendSearchExcerptSegment(
        searchDocument,
        fragment,
        state,
        excerptHtml.slice(cursor),
      );
      return;
    }

    appendSearchExcerptSegment(
      searchDocument,
      fragment,
      state,
      excerptHtml.slice(cursor, match.start),
    );
    state = nextSearchExcerptState(searchDocument, fragment, state, match.tag);
    cursor = match.end + 1;
  }
}

function appendSearchExcerptText(
  searchDocument: Document,
  target: DocumentFragment | Element,
  text: string,
): void {
  if (text !== "") {
    target.append(searchDocument.createTextNode(text));
  }
}

function appendSearchExcerptSegment(
  searchDocument: Document,
  fragment: DocumentFragment,
  state: ExcerptState,
  text: string,
): void {
  if (state.skippedTag === undefined) {
    appendSearchExcerptText(searchDocument, state.markTarget ?? fragment, text);
  }
}

function nextSearchExcerptState(
  searchDocument: Document,
  fragment: DocumentFragment,
  state: ExcerptState,
  tag: ExcerptTag | undefined,
): ExcerptState {
  if (tag === undefined) {
    return state;
  }

  if (state.skippedTag !== undefined) {
    return tag.isClosing && tag.name === state.skippedTag
      ? { ...state, skippedTag: undefined }
      : state;
  }

  if (skippedExcerptTags.has(tag.name)) {
    return tag.isClosing ? state : { ...state, skippedTag: tag.name };
  }

  if (tag.name !== "mark") {
    return state;
  }

  if (tag.isClosing) {
    return { ...state, markTarget: undefined };
  }

  const mark = searchDocument.createElement("mark");
  mark.className =
    "rounded-xs bg-primary/20 px-0.5 text-foreground decoration-inherit";
  fragment.append(mark);

  return { ...state, markTarget: mark };
}

function nextExcerptTag(
  excerptHtml: string,
  cursor: number,
): ExcerptTagMatch | undefined {
  const start = excerptHtml.indexOf("<", cursor);

  if (start === -1) {
    return undefined;
  }

  const end = excerptHtml.indexOf(">", start + 1);

  if (end === -1) {
    return undefined;
  }

  return {
    end,
    start,
    tag: parseExcerptTag(excerptHtml.slice(start + 1, end)),
  };
}

function parseExcerptTag(tagContent: string): ExcerptTag | undefined {
  const trimmedTag = tagContent.trim();

  if (trimmedTag === "" || trimmedTag.startsWith("!")) {
    return undefined;
  }

  const isClosing = trimmedTag.startsWith("/");
  const tagNameSource = isClosing
    ? trimmedTag.slice(1).trimStart()
    : trimmedTag;
  const name = tagNameSource.slice(0, tagNameEndIndex(tagNameSource));

  return name === "" ? undefined : { isClosing, name: name.toLowerCase() };
}

function tagNameEndIndex(value: string): number {
  for (let index = 0; index < value.length; index += 1) {
    const character = value.charAt(index);

    if (tagNameTerminators.has(character)) {
      return index;
    }
  }

  return value.length;
}

/**
 * Initializes the search page UI.
 *
 * @param searchDocument Browser document dependency.
 * @param locationSearch Current location search string.
 * @param pagefindLoader Loader for the Pagefind module.
 * @param prefetchLink Search-result link prefetch dependency.
 */
export async function runSearch(
  searchDocument = document,
  locationSearch = window.location.search,
  pagefindLoader = loadPagefind,
  prefetchLink = prefetchSearchResult,
): Promise<void> {
  const container = searchDocument.querySelector("#search");

  if (!(container instanceof HTMLElement)) {
    return;
  }

  const query = searchQuery(locationSearch);
  const input = searchInput(container, searchDocument);
  input.value = query;
  const results = searchResultsContainer(container, searchDocument);

  const pagefind = await pagefindLoader();
  await pagefind.options({ excerptLength: 24 });

  input.addEventListener("input", () => {
    renderResults(pagefind, results, input.value, prefetchLink).catch(() => {
      renderSearchError(results);
    });
  });
  await renderResults(pagefind, results, query, prefetchLink);
}

/**
 * Reads the query parameter used by the search page.
 *
 * @param locationSearch Raw URL search string.
 * @returns Search query text or an empty string.
 */
export function searchQuery(locationSearch: string): string {
  return new URLSearchParams(locationSearch).get("q") ?? "";
}

function searchInput(
  container: HTMLElement,
  searchDocument: Document,
): HTMLInputElement {
  const existingInput = container.querySelector('input[type="search"]');

  if (existingInput instanceof HTMLInputElement) {
    return existingInput;
  }

  const input = searchDocument.createElement("input");
  input.type = "search";
  input.placeholder = "Search";
  input.className =
    "border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-ring block min-h-10 w-full min-w-0 rounded-sm border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  container.append(input);

  return input;
}

function bindSearchResultPrefetch(
  item: HTMLAnchorElement,
  url: string,
  prefetchLink: SearchResultPrefetcher,
): void {
  let didPrefetch = false;
  const prefetchOnce = (): void => {
    if (didPrefetch) {
      return;
    }

    didPrefetch = true;
    void Promise.resolve(prefetchLink(url)).catch(() => undefined);
  };

  item.addEventListener("mouseenter", prefetchOnce, { passive: true });
  item.addEventListener("focus", prefetchOnce, { passive: true });
}

function searchResultsContainer(
  container: HTMLElement,
  searchDocument: Document,
): HTMLElement {
  const existingResults = container.querySelector("[data-search-results]");

  if (existingResults instanceof HTMLElement) {
    return existingResults;
  }

  const results = searchDocument.createElement("div");
  results.className = "grid min-w-0";
  results.dataset["searchResults"] = "";
  results.setAttribute("role", "region");
  results.setAttribute("aria-label", "Search results");
  results.setAttribute("aria-live", "polite");
  container.append(results);

  return results;
}

// Coverage note: this browser auto-init guard is exercised by built pages.
// Unit tests call `runSearch()` with injected DOM and Pagefind dependencies.
if (typeof document !== "undefined" && typeof window !== "undefined") {
  runSearch().catch(() => {
    const container = document.querySelector("#search");
    if (container instanceof HTMLElement) {
      renderSearchError(container);
    }
  });
}
