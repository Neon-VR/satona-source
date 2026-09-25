import { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon";
import { censorUiText } from "../lib/censorUiText";

type Game = {
  id: string;
  name: string;
  htmlFile: string;
  assetFolder?: string;
  coverFile?: string;
};

type GameMetadata = {
  id: string | number;
  name?: string;
};

type GitTree = {
  tree?: Array<{ path?: string; type?: string }>;
  message?: string;
};

const HTML_TREE_URL = "https://api.github.com/repos/gn-math/html/git/trees/main?recursive=1";
const COVER_TREE_URL = "https://api.github.com/repos/gn-math/covers/git/trees/main?recursive=1";
const ASSETS_ROOT_URL = "https://api.github.com/repos/gn-math/assets/contents?ref=main";
const GAME_METADATA_URL = "https://raw.githubusercontent.com/gn-math/assets/main/zones.json";
const HTML_BASE_URL = "https://raw.githubusercontent.com/gn-math/html/main/";
const COVER_BASE_URL = "https://raw.githubusercontent.com/gn-math/covers/main/";
const ASSETS_CONTENT_URL = "https://raw.githubusercontent.com/gn-math/assets/main/";
const ASSETS_BASE_URL = "https://cdn.jsdelivr.net/gh/gn-math/assets@main/";

function numericId(path: string, extension: string) {
  const match = path.match(new RegExp(`^(\\d+)(?:-[^/]*)?\\.${extension}$`, "i"));
  return match?.[1];
}

async function getTreeFiles(url: string, extension: string) {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  });

  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status}`);
  }

  const data = (await response.json()) as GitTree;
  if (!Array.isArray(data.tree)) {
    throw new Error(data.message || "GitHub returned an invalid file list.");
  }

  return data.tree
    .filter((entry) => entry.type === "blob" && typeof entry.path === "string")
    .map((entry) => entry.path as string)
    .filter((path) => numericId(path, extension) !== undefined);
}

async function getAssetFolders() {
  const response = await fetch(ASSETS_ROOT_URL, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) {
    throw new Error(`GN-Math assets returned ${response.status}`);
  }

  const data = await response.json() as Array<{ name?: string; type?: string }>;
  if (!Array.isArray(data)) {
    throw new Error("GN-Math assets returned an invalid file list.");
  }

  return new Set(
    data
      .filter((entry) => entry.type === "dir" && /^\d+$/.test(entry.name ?? ""))
      .map((entry) => entry.name as string),
  );
}

async function getGameNames() {
  const response = await fetch(GAME_METADATA_URL);
  if (!response.ok) throw new Error(`Library names returned ${response.status}`);
  const data = await response.json() as GameMetadata[];
  if (!Array.isArray(data)) throw new Error("The library returned an invalid name list.");

  return new Map(
    data
      .filter((game) => game.name?.trim())
      .map((game) => [String(game.id), game.name!.trim()]),
  );
}

function byNumericId(files: string[], extension: string) {
  const result = new Map<string, string>();

  for (const file of files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
    const id = numericId(file, extension);
    if (!id) continue;

    const current = result.get(id);
    // Prefer the unmodified `<id>.<extension>` file when multiple versions exist.
    if (!current || file === `${id}.${extension}`) {
      result.set(id, file);
    }
  }

  return result;
}

async function loadGames() {
  const [htmlFiles, coverFiles, assetFolders, namesById] = await Promise.all([
    getTreeFiles(HTML_TREE_URL, "html"),
    getTreeFiles(COVER_TREE_URL, "png"),
    getAssetFolders().catch((error: unknown) => {
      console.warn("Could not list additional library items:", error);
      return new Set<string>();
    }),
    getGameNames().catch((error: unknown) => {
      console.warn("Could not load GN-Math game names:", error);
      return new Map<string, string>();
    }),
  ]);
  const coversById = byNumericId(coverFiles, "png");

  return Array.from(byNumericId(htmlFiles, "html"), ([id, htmlFile]) => ({
    id,
    name: censorUiText(namesById.get(id) ?? `Game ${id}`),
    htmlFile,
    assetFolder: assetFolders.has(id) ? id : undefined,
    coverFile: coversById.get(id),
  })).sort((a, b) => Number(a.id) - Number(b.id));
}

export default function Games() {
  const [query, setQuery] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameHtml, setGameHtml] = useState("");
  const [gameHtmlError, setGameHtmlError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    loadGames()
      .then((loadedGames) => {
        if (!cancelled) setGames(loadedGames);
      })
      .catch((err: unknown) => {
        console.error("Failed to load the library:", err);
        if (!cancelled) setError("Could not load the library.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedGame) {
      setGameHtml("");
      setGameHtmlError("");
      return;
    }

    const controller = new AbortController();
    setGameHtml("");
    setGameHtmlError("");

    const htmlUrl = selectedGame.assetFolder
      ? `${ASSETS_CONTENT_URL}${selectedGame.assetFolder}/index.html`
      : `${HTML_BASE_URL}${selectedGame.htmlFile}`;
    const defaultBaseUrl = selectedGame.assetFolder
      ? `${ASSETS_BASE_URL}${selectedGame.assetFolder}/`
      : `${HTML_BASE_URL}${selectedGame.htmlFile}`;

    fetch(htmlUrl, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load book (${response.status}).`);
        return response.text();
      })
      .then((html) => {
        const base = `<base href="${defaultBaseUrl}">`;
        const withBase = /<base\b/i.test(html)
          ? html
          : /<head\b[^>]*>/i.test(html)
            ? html.replace(/<head\b[^>]*>/i, (head) => `${head}${base}`)
            : `${base}${html}`;
        setGameHtml(withBase);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          console.error("Failed to load GN-Math game HTML:", err);
          setGameHtmlError("Could not load this book’s HTML file.");
        }
      });

    return () => controller.abort();
  }, [selectedGame]);

  const filtered = useMemo(() => {
    const search = censorUiText(query.toLowerCase().trim()).toLowerCase();
    return search
      ? games.filter((game) => game.name.toLowerCase().includes(search) || game.id.includes(search))
      : games;
  }, [games, query]);

  if (selectedGame) {
    return (
      <section className="section-page game-player-page">
        <div className="game-player-toolbar">
          <button className="game-player-back" onClick={() => setSelectedGame(null)}>
            ← Books
          </button>
          <span>{selectedGame.name}</span>
        </div>
        {gameHtmlError ? (
          <div className="game-player-message">{gameHtmlError}</div>
        ) : gameHtml ? (
          <iframe
            className="game-player-frame"
            srcDoc={gameHtml}
            title={selectedGame.name}
            allow="fullscreen; autoplay; gamepad; pointer-lock"
            allowFullScreen
          />
        ) : (
          <div className="game-player-message">Loading book…</div>
        )}
      </section>
    );
  }

  return (
    <section className="section-page games-page">
      <div className="section-heading">
        <div>
          <span className="section-kicker">LIBRARY</span>
          <h1>Books</h1>
          <p>Browse the library.</p>
        </div>

        <div className="library-search">
          <Icon name="search" size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search books..."
          />
        </div>
      </div>

      {loading ? (
        <div className="empty-library">
          <Icon name="games" size={30} />
          <h2>Loading books...</h2>
          <p>Getting the latest library entries and covers.</p>
        </div>
      ) : error ? (
        <div className="empty-library">
          <Icon name="games" size={30} />
          <h2>Unable to load books</h2>
          <p>{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-library">
          <Icon name="games" size={30} />
          <h2>No books found</h2>
          <p>Try searching for another book.</p>
        </div>
      ) : (
        <div className="games-grid">
          {filtered.map((game) => (
            <article className="game-card" key={game.id}>
              <div className="game-thumbnail">
                {game.coverFile ? (
                  <img
                    src={`${COVER_BASE_URL}${game.coverFile}`}
                    alt={`${game.name} cover`}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                      event.currentTarget.parentElement?.classList.add("has-no-cover");
                    }}
                  />
                ) : null}
                <span className="game-thumbnail-fallback">{game.id}</span>
                <button
                  className="game-play-button"
                  onClick={() => setSelectedGame(game)}
                >
                  <Icon name="play" size={15} />
                  Play
                </button>
              </div>
              <h2 className="game-card-title">{game.name}</h2>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
