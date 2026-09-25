export type SearchEngine =
  | "google"
  | "duckduckgo"
  | "bing"
  | "yahoo"
  | "brave";

export const SEARCH_ENGINES: Record<SearchEngine, string> = {
  google: "https://www.google.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q=",
  bing: "https://www.bing.com/search?q=",
  yahoo: "https://search.yahoo.com/search?p=",
  brave: "https://search.brave.com/search?q=",
};

export function createSearchTarget(
  value: string,
  engine: SearchEngine
) {
  const input = value.trim();

  if (!input) return "";

  if (/^(https?:\/\/|about:blank|data:|blob:)/i.test(input)) {
    return input;
  }

  if (
    /^localhost(:\d+)?(\/.*)?$/i.test(input) ||
    /^127\.0\.0\.1(:\d+)?(\/.*)?$/i.test(input)
  ) {
    return `http://${input}`;
  }

  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(input)) {
    return `https://${input}`;
  }

  return `${SEARCH_ENGINES[engine]}${encodeURIComponent(input)}`;
}
