import { useEffect, useState } from "react";
import { GameIcon, PlayIcon, SearchIcon } from "./Icons";

type Game = {
  name: string;
  path: string;
};

export default function Games() {
  const [games, setGames] = useState<Game[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/games-manifest.json")
      .then((response) => {
        if (!response.ok) throw new Error("No library manifest");
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setGames(data);
      })
      .catch(() => setGames([]));
  }, []);

  const filtered = games.filter((game) =>
    game.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="satona-section">
      <div className="satona-section-heading">
        <div>
          <span className="satona-kicker">LIBRARY</span>
          <h1>Books</h1>
          <p>Your books, all in one place.</p>
        </div>

        <div className="satona-library-search">
          <SearchIcon />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search books..."
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="satona-empty">
          <GameIcon />
          <h2>No books found</h2>
          <p>
            Books will appear here automatically when they are included in
            the project library.
          </p>
        </div>
      ) : (
        <div className="satona-game-grid">
          {filtered.map((game) => (
            <article className="satona-game-card" key={game.path}>
              <div className="satona-game-icon">
                <GameIcon />
              </div>
              <div>
                <h3>{game.name}</h3>
                <span>{game.path}</span>
              </div>
              <button
                onClick={() => {
                  window.location.href = game.path;
                }}
              >
                <PlayIcon />
                Play
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
