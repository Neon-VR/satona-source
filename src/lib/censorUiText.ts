const uiTerms: Record<string, string> = {
  game: "book",
  games: "books",
  proxy: "",
  proxies: "",
  proxied: "",
};

export function censorUiText(value: string) {
  return value.replace(/\b(game|games|proxy|proxies|proxied)\b/gi, (term) =>
    uiTerms[term.toLowerCase()],
  );
}
