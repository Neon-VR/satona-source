import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../components/Icon";
import { loadGames, type Game } from "../lib/gn-games";
import { loadLumin } from "../lib/lumin";
import { readPreference, savePreference } from "../lib/preferences";
import "./steam.css";
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
    setSrc(
      game.coverFile
        ? `https://raw.githubusercontent.com/gn-math/covers/main/${game.coverFile}`
        : "",
    );
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
  }, [game.imageToken, game.coverFile]);
  return src ? (
    <img src={src} alt="" loading="lazy" onError={() => setSrc("")} />
  ) : (
    <span className="game-thumbnail-fallback">
      {game.name.slice(0, 2).toUpperCase()}
    </span>
  );
}
export default function Games() {
  const [view, setView] = useState<"store" | "library">("store");
  const [focused, setFocused] = useState<Entry | null>(null);
  const [recent, setRecent] = useState(() =>
    readPreference<Entry[]>("satona.recent-games", []),
  );
  const [sort, setSort] = useState("featured");
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
  function play(game: Entry) {
    const next = [
      game,
      ...recent.filter(
        (item) => `${item.source}:${item.id}` !== `${game.source}:${game.id}`,
      ),
    ].slice(0, 16);
    setRecent(next);
    savePreference("satona.recent-games", next);
    setSelected(game);
  }
  function showDetails(game: Entry) {
    setFocused(game);
    setView("library");
    setQuery("");
    setSearch("");
    setPage(1);
  }
  function favorite(game: Entry) {
    const key = `${game.source}:${game.id}`;
    const next = favorites.includes(key)
      ? favorites.filter((id) => id !== key)
      : [...favorites, key];
    const records = [
      ...savedGames.filter((item) => `${item.source}:${item.id}` !== key),
      ...(next.includes(key) ? [game] : []),
    ];
    setFavorites(next);
    setSavedGames(records);
    savePreference("satona.game-favorites", next);
    savePreference("satona.favorite-games", records);
  }
  const ordered =
    sort === "name"
      ? [...games].sort((a, b) => a.name.localeCompare(b.name))
      : games;
  const featured =
    focused ||
    games.find((game) => game.coverFile && !/^Game \d+/.test(game.name)) ||
    games[0];
  const card = (game: Entry) => (
    <article className="steam-card" key={`${game.source}:${game.id}`}>
      <button
        className="steam-card-art"
        onClick={() => {
          showDetails(game);
        }}
        aria-label={`View ${game.name}`}
      >
        <Cover game={game} />
        <span>✓ IN LIBRARY</span>
      </button>
      <div className="steam-card-info">
        <h3>{game.name}</h3>
        <small>
          {game.source}
          {game.category ? ` · ${game.category}` : ""}
        </small>
        <div>
          <b>Free to Play</b>
          <button
            className="steam-star"
            aria-label={`Favorite ${game.name}`}
            aria-pressed={favorites.includes(`${game.source}:${game.id}`)}
            onClick={() => favorite(game)}
          >
            {favorites.includes(`${game.source}:${game.id}`) ? "★" : "☆"}
          </button>
          <button className="steam-play-small" onClick={() => play(game)}>
            ▶ Play
          </button>
        </div>
      </div>
    </article>
  );
  if (selected)
    return (
      <section className="section-page game-player-page">
        <div className="game-player-toolbar">
          <button
            className="secondary-button"
            onClick={() => setSelected(null)}
          >
            ← Satona Steam
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
    <section className="satona-steam">
      <header className="steam-client-header">
        <div className="steam-brand">
          <Icon name="steam" size={30} />
          <span>
            SATONA <b>STEAM</b>
          </span>
          <small>COMMUNITY EDITION</small>
        </div>
        <nav aria-label="Satona Steam views">
          <button
            className={view === "store" ? "active" : ""}
            onClick={() => {
              setView("store");
              setOnlyFavorites(false);
            }}
          >
            STORE
          </button>
          <button
            className={view === "library" ? "active" : ""}
            onClick={() => setView("library")}
          >
            LIBRARY
          </button>
          <span>ALL YOUR GAMES. READY TO PLAY.</span>
        </nav>
      </header>
      <div className="steam-toolbar">
        <label>
          Source{" "}
          <select
            aria-label="Game source"
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setFocused(null);
            }}
          >
            <option>All</option>
            <option>LuminSDK</option>
            <option>gn-math</option>
          </select>
        </label>
        <div className="steam-search">
          <input
            aria-label="Search games"
            placeholder={
              view === "store" ? "Search the store" : "Search your library"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Icon name="search" />
        </div>
        <button
          className={onlyFavorites ? "active" : ""}
          onClick={() => setOnlyFavorites(!onlyFavorites)}
        >
          ★ Favorites <span>{favorites.length}</span>
        </button>
      </div>
      <div
        className={`steam-layout ${view === "library" ? "with-library" : ""}`}
      >
        {view === "library" && (
          <aside className="steam-library-sidebar">
            <h3>YOUR COLLECTION</h3>
            <button
              className="steam-library-home"
              onClick={() => {
                setFocused(null);
                setOnlyFavorites(false);
              }}
            >
              ▦ All games <span>{gn.length + lumin.length}</span>
            </button>
            <p>✓ Ready to play</p>
            <div>
              {ordered.map((game) => (
                <button
                  key={`${game.source}:${game.id}`}
                  className={featured === game ? "active" : ""}
                  onClick={() => showDetails(game)}
                >
                  <Cover game={game} />
                  <span>{game.name}</span>
                </button>
              ))}
            </div>
          </aside>
        )}
        <main className="steam-content">
          {((source !== "LuminSDK" && gnError) ||
            (source !== "gn-math" && luminError)) && (
            <div className="steam-notice" role="status">
              {source !== "LuminSDK" && gnError}{" "}
              {source !== "gn-math" && luminError}{" "}
              <button onClick={() => setRetry(retry + 1)}>
                Retry catalogs
              </button>
            </div>
          )}
          {featured && !search && !onlyFavorites && (
            <section className="steam-feature">
              <div className="steam-feature-art">
                <Cover
                  key={`${featured.source}:${featured.id}`}
                  game={featured}
                />
              </div>
              <div className="steam-feature-copy">
                <span>
                  {view === "store"
                    ? "FEATURED & RECOMMENDED"
                    : "IN YOUR LIBRARY"}
                </span>
                <h1>{featured.name}</h1>
                <p>
                  {view === "store"
                    ? "Your next great game is already here."
                    : "Installed in your Satona library. Launch instantly."}
                </p>
                <div className="steam-tags">
                  <span>{featured.source}</span>
                  <span>Free to Play</span>
                  <span>Browser game</span>
                </div>
                <button className="steam-play" onClick={() => play(featured)}>
                  ▶ PLAY NOW
                </button>
                <small>✓ Ready to play · No download needed</small>
              </div>
            </section>
          )}
          {view === "store" && !search && !onlyFavorites && (
            <div className="steam-value-banner">
              <div>
                <Icon name="steam" size={38} />
                <span>
                  <strong>Your entire library. On the house.</strong>
                  <small>Every catalog game is free and ready to launch.</small>
                </span>
              </div>
              <button onClick={() => setView("library")}>
                Explore your library →
              </button>
            </div>
          )}
          {recent.length > 0 && !search && !onlyFavorites && (
            <section className="steam-recent">
              <h2>JUMP BACK IN</h2>
              <div>
                {recent.slice(0, 4).map((game) => (
                  <button
                    key={`${game.source}:${game.id}`}
                    onClick={() => play(game)}
                  >
                    <Cover game={game} />
                    <span>
                      {game.name}
                      <small>▶ Play again</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
          <div className="steam-shelf-heading">
            <h2>
              {onlyFavorites
                ? "YOUR FAVORITES"
                : search
                  ? "SEARCH RESULTS"
                  : view === "library"
                    ? "ALL GAMES"
                    : "EXPLORE THE CATALOG"}{" "}
              <span>{ordered.length}</span>
            </h2>
            <select
              aria-label="Sort games"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="featured">Featured order</option>
              <option value="name">Name: A–Z</option>
            </select>
            <button
              disabled={!games.length}
              onClick={() =>
                play(games[Math.floor(Math.random() * games.length)])
              }
            >
              Surprise me ↗
            </button>
          </div>
          <div className="steam-grid">{ordered.map(card)}</div>
          {!games.length && (
            <div className="steam-empty">
              <Icon name="steam" size={48} />
              <h2>
                {(loading && source !== "LuminSDK") ||
                (luminLoading && source !== "gn-math")
                  ? "Loading your library…"
                  : "No games found"}
              </h2>
              <p>
                {onlyFavorites
                  ? "Star a game to add it to this collection."
                  : "Try another search or source."}
              </p>
            </div>
          )}
          {hasMore && !onlyFavorites && (
            <button
              className="steam-load-more"
              disabled={luminLoading && source !== "gn-math"}
              onClick={() => setPage(page + 1)}
            >
              {luminLoading ? "Loading…" : "Load more games"}
            </button>
          )}
        </main>
      </div>
      <footer className="steam-status">
        <span>● ALL GAMES READY TO PLAY</span>
        <span>
          GN-Math + LuminSDK · Community launcher, not affiliated with Valve
        </span>
      </footer>
    </section>
  );
}
