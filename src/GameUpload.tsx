import { useMemo, useState } from "react";

type GameItem = {
  id: string;
  file: File;
  name: string;
  category: string;
  thumbnail: string;
  thumbnailSearch: string;
};

const CATEGORIES = [
  "Action",
  "Arcade",
  "Adventure",
  "Racing",
  "Puzzle",
  "Sports",
  "Strategy",
  "Simulation",
  "Other",
];

function titleCase(value: string) {
  return value
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function generateName(filename: string) {
  return titleCase(filename);
}

function guessCategory(name: string) {
  const value = name.toLowerCase();

  if (
    /race|racing|car|drift|kart|speed|drive|motor|track/.test(value)
  ) {
    return "Racing";
  }

  if (
    /shoot|gun|war|fight|battle|zombie|combat|weapon|fps/.test(value)
  ) {
    return "Action";
  }

  if (
    /jump|platform|runner|arcade|flappy|brick|snake|pong/.test(value)
  ) {
    return "Arcade";
  }

  if (
    /puzzle|match|2048|sudoku|word|tetris|logic/.test(value)
  ) {
    return "Puzzle";
  }

  if (
    /football|soccer|basket|basketball|baseball|golf|tennis|sport/.test(
      value
    )
  ) {
    return "Sports";
  }

  if (
    /quest|adventure|island|explore|explorer|dungeon|quest/.test(value)
  ) {
    return "Adventure";
  }

  if (
    /city|farm|farming|house|life|simulator|simulation|truck/.test(value)
  ) {
    return "Simulation";
  }

  if (
    /strategy|tower|warcraft|civilization|empire|defense/.test(value)
  ) {
    return "Strategy";
  }

  return "Other";
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("satona-games", 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("games")) {
        db.createObjectStore("games", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveGame(game: GameItem) {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("games", "readwrite");

    transaction.objectStore("games").put({
      id: game.id,
      name: game.name,
      category: game.category,
      thumbnail: game.thumbnail,
      fileName: game.file.name,
      fileType: game.file.type,
      fileSize: game.file.size,
      file: game.file,
      createdAt: Date.now(),
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  db.close();
}

export default function GameUpload({
  onClose,
}: {
  onClose: () => void;
}) {
  const [games, setGames] = useState<GameItem[]>([]);
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const [autoName, setAutoName] = useState(true);
  const [autoCategory, setAutoCategory] = useState(true);
  const [autoThumbnail, setAutoThumbnail] = useState(true);

  const [status, setStatus] = useState("");

  const active = useMemo(
    () => games.find((game) => game.id === activeGame) ?? null,
    [games, activeGame]
  );

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;

    const newGames: GameItem[] = Array.from(fileList).map((file) => {
      const name = generateName(file.name);
      const category = guessCategory(name);

      return {
        id:
          crypto.randomUUID?.() ??
          `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        name,
        category,
        thumbnail: "",
        thumbnailSearch: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(
          `${name} book`
        )}`,
      };
    });

    setGames((current) => [...current, ...newGames]);

    if (newGames.length) {
      setActiveGame(newGames[0].id);
    }
  }

  function updateGame(id: string, changes: Partial<GameItem>) {
    setGames((current) =>
      current.map((game) =>
        game.id === id ? { ...game, ...changes } : game
      )
    );
  }

  function removeGame(id: string) {
    setGames((current) => current.filter((game) => game.id !== id));

    if (activeGame === id) {
      setActiveGame(null);
    }
  }

  function regenerateMetadata(game: GameItem) {
    const name = autoName
      ? generateName(game.file.name)
      : game.name;

    const category = autoCategory
      ? guessCategory(name)
      : game.category;

    updateGame(game.id, {
      name,
      category,
      thumbnailSearch: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(
        `${name} book`
      )}`,
    });
  }

  async function publishGame(game: GameItem) {
    try {
      setStatus(`Saving ${game.name}...`);
      await saveGame(game);
      setStatus(`${game.name} saved successfully.`);
    } catch (error) {
      console.error(error);
      setStatus("Could not save the book.");
    }
  }

  async function publishAll() {
    if (!games.length) {
      setStatus("No books selected.");
      return;
    }

    try {
      setStatus(`Saving ${games.length} book${games.length === 1 ? "" : "s"}...`);

      for (const game of games) {
        await saveGame(game);
      }

      setStatus(
        `${games.length} book${games.length === 1 ? "" : "s"} saved successfully.`
      );
    } catch (error) {
      console.error(error);
      setStatus("Some books could not be saved.");
    }
  }

  return (
    <div className="satona-upload-page">
      <header className="upload-header">
        <div>
          <div className="upload-kicker">SATONA ADMIN</div>
          <h1>Book Upload Center</h1>
          <p>Manage, organize and publish books to Satona.</p>
        </div>

        <button className="upload-close" onClick={onClose}>
          Exit
        </button>
      </header>

      <div className="upload-layout">
        <aside className="upload-sidebar">
          <label className="upload-dropzone">
            <input
              type="file"
              multiple
              accept=".html,.htm,.zip,.js,.json"
              onChange={(event) => {
                addFiles(event.target.files);
                event.currentTarget.value = "";
              }}
            />

            <span className="upload-plus">+</span>
            <strong>Upload Books</strong>
            <small>
              Select one or multiple book files
            </small>
          </label>

          <div className="upload-sidebar-section">
            <div className="upload-sidebar-title">
              AUTOMATION
            </div>

            <label className="upload-toggle">
              <span>
                <strong>Auto Name</strong>
                <small>Generate names from filenames</small>
              </span>

              <input
                type="checkbox"
                checked={autoName}
                onChange={(event) => setAutoName(event.target.checked)}
              />
            </label>

            <label className="upload-toggle">
              <span>
                <strong>Auto Category</strong>
                <small>Automatically categorize books</small>
              </span>

              <input
                type="checkbox"
                checked={autoCategory}
                onChange={(event) =>
                  setAutoCategory(event.target.checked)
                }
              />
            </label>

            <label className="upload-toggle">
              <span>
                <strong>Auto Thumbnail Search</strong>
                <small>Prepare Google Images searches</small>
              </span>

              <input
                type="checkbox"
                checked={autoThumbnail}
                onChange={(event) =>
                  setAutoThumbnail(event.target.checked)
                }
              />
            </label>
          </div>

          <div className="upload-stats">
            <span>UPLOAD QUEUE</span>
            <strong>{games.length}</strong>
          </div>
        </aside>

        <main className="upload-main">
          {!games.length ? (
            <div className="upload-empty">
              <div className="upload-empty-icon">🎮</div>
              <h2>No books in the queue</h2>
              <p>
                Upload a book or select multiple files to begin.
              </p>
            </div>
          ) : (
            <>
              <div className="upload-toolbar">
                <div>
                  <strong>{games.length} book{games.length === 1 ? "" : "s"}</strong>
                  <span> ready for publishing</span>
                </div>

                <button
                  className="upload-publish-all"
                  onClick={publishAll}
                >
                  Publish All
                </button>
              </div>

              <div className="upload-content">
                <section className="upload-game-list">
                  {games.map((game) => (
                    <button
                      key={game.id}
                      className={
                        activeGame === game.id
                          ? "upload-game-item active"
                          : "upload-game-item"
                      }
                      onClick={() => setActiveGame(game.id)}
                    >
                      <div className="upload-game-thumb">
                        {game.thumbnail ? (
                          <img src={game.thumbnail} alt="" />
                        ) : (
                          <span>🎮</span>
                        )}
                      </div>

                      <div className="upload-game-info">
                        <strong>{game.name}</strong>
                        <small>
                          {game.category} • {game.file.name}
                        </small>
                      </div>
                    </button>
                  ))}
                </section>

                {active && (
                  <section className="upload-editor">
                    <div className="upload-editor-header">
                      <div>
                        <span className="upload-editor-kicker">
                          BOOK EDITOR
                        </span>
                        <h2>{active.name}</h2>
                      </div>

                      <button
                        className="upload-danger"
                        onClick={() => removeGame(active.id)}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="upload-preview">
                      {active.thumbnail ? (
                        <img src={active.thumbnail} alt="" />
                      ) : (
                        <div className="upload-preview-placeholder">
                          🎮
                        </div>
                      )}
                    </div>

                    <div className="upload-field">
                      <label>Book Name</label>
                      <input
                        value={active.name}
                        onChange={(event) =>
                          updateGame(active.id, {
                            name: event.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="upload-field">
                      <label>Category</label>
                      <select
                        value={active.category}
                        onChange={(event) =>
                          updateGame(active.id, {
                            category: event.target.value,
                          })
                        }
                      >
                        {CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="upload-field">
                      <label>Thumbnail URL</label>
                      <input
                        placeholder="https://..."
                        value={active.thumbnail}
                        onChange={(event) =>
                          updateGame(active.id, {
                            thumbnail: event.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="upload-thumbnail-actions">
                      <button
                        onClick={() => {
                          window.open(
                            active.thumbnailSearch,
                            "_blank",
                            "noopener,noreferrer"
                          );
                        }}
                      >
                        🔎 Find Thumbnail
                      </button>

                      <button
                        onClick={() => regenerateMetadata(active)}
                      >
                        ✨ Regenerate Metadata
                      </button>
                    </div>

                    <div className="upload-file-info">
                      <span>FILE</span>
                      <strong>{active.file.name}</strong>

                      <span>SIZE</span>
                      <strong>
                        {(active.file.size / 1024 / 1024).toFixed(2)} MB
                      </strong>

                      <span>TYPE</span>
                      <strong>{active.file.type || "Unknown"}</strong>
                    </div>

                    <button
                      className="upload-publish"
                      onClick={() => publishGame(active)}
                    >
                      Publish Book
                    </button>
                  </section>
                )}
              </div>

              {status && (
                <div className="upload-status">
                  {status}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
