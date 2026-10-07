import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../components/Icon";
import { loadGames, type Game } from "../lib/gn-games";
import { loadLumin } from "../lib/lumin";
import { readPreference, savePreference } from "../lib/preferences";
type Entry = Game & {
  source: "gn-math" | "LuminSDK";
  imageToken?: string;
  category?: string;
};
function Cover({ game }: { game: Entry }) {
  const [src, setSrc] = useState(
    game.coverFile
      ? `https://raw.githubusercontent.com/gn-math/covers/main/${game.coverFile}`
      : "",
  );
  useEffect(() => {
    if (!game.imageToken) return;
    let active = true;
    void loadLumin()
      .then((sdk) => sdk.getImageUrl(game.imageToken!))
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [game.imageToken]);
  return src ? (
    <img src={src} alt="" loading="lazy" onError={() => setSrc("")} />
  ) : (
    <span className="game-thumbnail-fallback">
      {game.name.slice(0, 2).toUpperCase()}
    </span>
  );
}
export default function Games() {
  const [source, setSource] = useState("All");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [gn, setGn] = useState<Entry[]>([]);
  const [lumin, setLumin] = useState<Entry[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [luminLoading, setLuminLoading] = useState(true);
  const [gnError, setGnError] = useState("");
  const [luminError, setLuminError] = useState("");
  const [favorites, setFavorites] = useState(() =>
    readPreference<string[]>("satona.game-favorites", []),
  );
  const [savedGames, setSavedGames] = useState(() =>
    readPreference<Entry[]>("satona.favorite-games", []),
  );
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [html, setHtml] = useState("");
  const [gameUrl, setGameUrl] = useState("");
  const [playError, setPlayError] = useState("");
  const [retry, setRetry] = useState(0);
  const iframe = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    loadGames()
      .then((games) => {
        if (active) {
          setGn(games.map((game) => ({ ...game, source: "gn-math" })));
          setGnError("");
        }
      })
      .catch(() => {
        if (active)
          setGnError("GN-Math could not load. You can still browse LuminSDK.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  useEffect(() => {
    if (query === search) return;
    const timer = setTimeout(() => {
      setSearch(query);
      setPage(1);
      setLumin([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);
  useEffect(() => {
    let active = true;
    setLuminLoading(true);
    setLuminError("");
    void loadLumin()
      .then((sdk) => sdk.getGames({ page, limit: 24, q: search }))
      .then((result) => {
        if (!active) return;
        const games = result.games.map((game) => ({
          id: game.id,
          name: game.name,
          htmlFile: "",
          source: "LuminSDK" as const,
          imageToken: game.image_token,
          category: game.category,
        }));
        setLumin((current) =>
          page === 1
            ? games
            : [
                ...current.filter(
                  (old) => !games.some((game) => game.id === old.id),
                ),
                ...games,
              ],
        );
        setPages(result.pages);
      })
      .catch(() => {
        if (active)
          setLuminError(
            "LuminSDK could not connect. Try again, or choose GN-Math.",
          );
      })
      .finally(() => {
        if (active) setLuminLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, search, retry]);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    const abort = new AbortController();
    setHtml("");
    setGameUrl("");
    setPlayError("");
    void (async () => {
      try {
        if (selected.source === "LuminSDK") {
          const sdk = await loadLumin();
          const result = await sdk.getGameUrl(selected.id);
          if (active) setGameUrl(result.url);
          return;
        }
        const path = selected.assetFolder
          ? `${selected.assetFolder}/index.html`
          : selected.htmlFile;
        const base = selected.assetFolder
          ? `https://cdn.jsdelivr.net/gh/gn-math/assets@main/${selected.assetFolder}/`
          : `https://raw.githubusercontent.com/gn-math/html/main/${selected.htmlFile}`;
        const url = `https://raw.githubusercontent.com/gn-math/${selected.assetFolder ? "assets" : "html"}/main/${path}`;
        const response = await fetch(url, { signal: abort.signal });
        if (!response.ok) throw new Error();
        const text = await response.text();
        const withBase = /<base\b/i.test(text)
          ? text
          : text.replace(
              /<head\b[^>]*>/i,
              (head) => `${head}<base href="${base}">`,
            );
        if (active)
          setHtml(
            withBase === text && !/<base\b/i.test(text)
              ? `<base href="${base}">${text}`
              : withBase,
          );
      } catch {
        if (active)
          setPlayError(
            "This game could not be loaded. Go back and try another game.",
          );
      }
    })();
    return () => {
      active = false;
      abort.abort();
    };
  }, [selected]);
  const filtered = useMemo(
    () =>
      gn.filter(
        (game) =>
          game.name.toLowerCase().includes(search.toLowerCase()) ||
          game.id.includes(search),
      ),
    [gn, search],
  );
  const games = useMemo(() => {
    const first = source === "LuminSDK" ? [] : filtered.slice(0, page * 24);
    const second = source === "gn-math" ? [] : lumin;
    const merged: Entry[] = [];
    for (let i = 0; i < Math.max(first.length, second.length); i++) {
      if (first[i]) merged.push(first[i]);
      if (second[i]) merged.push(second[i]);
    }
    if (!onlyFavorites) return merged;
    const available = new Map(
      [...savedGames, ...gn, ...lumin].map((game) => [
        `${game.source}:${game.id}`,
        game,
      ]),
    );
    return [...available.values()].filter(
      (game) =>
        favorites.includes(`${game.source}:${game.id}`) &&
        (source === "All" || source === game.source) &&
        game.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [
    source,
    filtered,
    lumin,
    page,
    onlyFavorites,
    favorites,
    savedGames,
    gn,
    search,
  ]);
  const hasMore =
    (source !== "LuminSDK" && filtered.length > page * 24) ||
    (source !== "gn-math" && page < pages);
  if (selected)
    return (
      <section className="section-page game-player-page">
        <div className="game-player-toolbar">
          <button
            className="secondary-button"
            onClick={() => setSelected(null)}
          >
            ← All games
          </button>
          <strong>{selected.name}</strong>
          <button
            className="secondary-button"
            onClick={() => void iframe.current?.requestFullscreen()}
          >
            Fullscreen ↗
          </button>
        </div>
        {playError ? (
          <p className="source-error" role="alert">
            {playError}
          </p>
        ) : html || gameUrl ? (
          <iframe
            ref={iframe}
            className="game-player-frame"
            title={selected.name}
            src={gameUrl || undefined}
            srcDoc={html || undefined}
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-popups"
            allow="fullscreen; autoplay; gamepad; pointer-lock"
            allowFullScreen
          />
        ) : (
          <div className="empty-library">Loading your game…</div>
        )}
      </section>
    );
  return (
    <section className="section-page games-page">
      <div className="section-heading">
        <div>
          <span className="section-kicker">PRESS PLAY ON SOMETHING GOOD</span>
          <h1>
            The arcade<span className="title-dot">.</span>
          </h1>
          <p>Two libraries. Endless rabbit holes. Zero installs.</p>
        </div>
        <div className="library-search">
          <Icon name="search" size={17} />
          <input
            aria-label="Search games"
            placeholder="Find your next favorite…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>
      <div className="library-controls">
        <label className="game-source-label">
          GAME SOURCE
          <select
            aria-label="Game source"
            value={source}
            onChange={(event) => setSource(event.target.value)}
          >
            <option>All</option>
            <option>LuminSDK</option>
            <option>gn-math</option>
          </select>
        </label>
        <button
          className={`filter-chip ${onlyFavorites ? "active" : ""}`}
          onClick={() => setOnlyFavorites(!onlyFavorites)}
        >
          ☆ Favorites
        </button>
        <button
          className="filter-chip"
          disabled={!games.length}
          onClick={() =>
            setSelected(games[Math.floor(Math.random() * games.length)])
          }
        >
          Surprise me ↗
        </button>
        <span>{games.length} games shown</span>
      </div>
      {source !== "LuminSDK" && gnError && (
        <p className="source-error">
          {gnError}{" "}
          <button
            className="secondary-button"
            onClick={() => setRetry(retry + 1)}
          >
            Retry
          </button>
        </p>
      )}
      {source !== "gn-math" && luminError && (
        <p className="source-error">
          {luminError}{" "}
          <button
            className="secondary-button"
            onClick={() => setRetry(retry + 1)}
          >
            Retry
          </button>
        </p>
      )}
      <div className="games-grid">
        {games.map((game) => {
          const key = `${game.source}:${game.id}`;
          return (
            <article className="game-card" key={key}>
              <div className="game-thumbnail">
                <Cover game={game} />
                <button
                  className={`game-favorite ${favorites.includes(key) ? "active" : ""}`}
                  aria-label={`Favorite ${game.name}`}
                  aria-pressed={favorites.includes(key)}
                  onClick={() => {
                    const next = favorites.includes(key)
                      ? favorites.filter((id) => id !== key)
                      : [...favorites, key];
                    setFavorites(next);
                    savePreference("satona.game-favorites", next);
                    const records = next.includes(key)
                      ? [
                          ...savedGames.filter(
                            (item) => `${item.source}:${item.id}` !== key,
                          ),
                          game,
                        ]
                      : savedGames.filter(
                          (item) => `${item.source}:${item.id}` !== key,
                        );
                    setSavedGames(records);
                    savePreference("satona.favorite-games", records);
                  }}
                >
                  ☆
                </button>
                <button
                  className="game-play-button"
                  onClick={() => setSelected(game)}
                >
                  <Icon name="play" size={15} />
                  Play
                </button>
              </div>
              <h2 className="game-card-title">{game.name}</h2>
              <small>
                {game.source}
                {game.category ? ` · ${game.category}` : ""}
              </small>
            </article>
          );
        })}
      </div>
      {!games.length && (
        <div className="empty-library">
          <h2>
            {(source !== "LuminSDK" && loading) ||
            (source !== "gn-math" && luminLoading)
              ? "Opening the arcade…"
              : "Nothing here yet"}
          </h2>
          <p>
            {onlyFavorites
              ? "Star a game to find it here."
              : "Try a different search or game source."}
          </p>
        </div>
      )}
      {hasMore && !onlyFavorites && (
        <button
          className="secondary-button load-more"
          disabled={luminLoading && source !== "gn-math"}
          onClick={() => setPage(page + 1)}
        >
          Load more games
        </button>
      )}
    </section>
  );
}
