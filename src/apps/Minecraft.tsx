import { useState } from "react";
import Icon from "../components/Icon";
import GameCover from "../components/GameCover";
import GamePlayer from "../components/GamePlayer";
import { type GameEntry, rememberGame } from "../lib/game-library";
import { useMinecraftGames } from "../lib/minecraft-games";
import { minecraftKey } from "../lib/minecraft-catalog";
import { readPreference, savePreference } from "../lib/preferences";
import "./minecraft.css";

function BlockLandscape() {
  const cube = (
    x: number,
    y: number,
    size: number,
    colors: string[],
    key: string,
  ) => (
    <g key={key}>
      <path
        d={`M${x},${y}l${size},${-size / 2} ${size},${size / 2} ${-size},${size / 2}Z`}
        fill={colors[0]}
      />
      <path
        d={`M${x},${y}l${size},${size / 2}v${size}l${-size},${-size / 2}Z`}
        fill={colors[1]}
      />
      <path
        d={`M${x + size},${y + size / 2}l${size},${-size / 2}v${size}l${-size},${size / 2}Z`}
        fill={colors[2]}
      />
    </g>
  );
  return (
    <svg
      className="mc-landscape"
      viewBox="0 0 1200 560"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mc-sky" x2="0" y2="1">
          <stop stopColor="#456a70" />
          <stop offset=".6" stopColor="#c5ad76" />
          <stop offset="1" stopColor="#efc988" />
        </linearGradient>
        <linearGradient id="mc-river" x2="0" y2="1">
          <stop stopColor="#a6caca" />
          <stop offset="1" stopColor="#235963" />
        </linearGradient>
      </defs>
      <path fill="url(#mc-sky)" d="M0 0h1200v560H0z" />
      <path fill="#ffdf8a" d="M842 83h73v73h-73z" />
      <g fill="#ddd9bc" opacity=".4">
        <path d="M180 97h120v18H180zM143 115h235v15H143zM967 64h147v19H967zM934 83h220v14H934z" />
      </g>
      <path
        fill="#527d72"
        d="M0 250h80v-35h60v-40h65v-38h52v40h56v58h90v45h94v-25h64v-42h75v-63h62v-40h55v40h70v60h100v35h84v-40h95v-48h58v45h40v368H0z"
      />
      <path
        fill="#385f51"
        d="M0 280h115v-50h80v40h94v42h130v32h197v-35h100v-40h86v-32h70v32h100v35h82v-48h146v304H0z"
      />
      <path
        fill="url(#mc-river)"
        d="M640 330h100v35h-54v36h100v39h-60v50h128v70H360v-50h165v-35h95v-50h-36v-50h56z"
      />
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i}>
          {cube(
            i * 87 - 90,
            400 + (i % 3) * 28,
            87,
            ["#719846", "#6b5339", "#4f432f"],
            "left",
          )}
          {cube(
            740 + i * 83,
            410 + (i % 3) * 37,
            83,
            ["#86a954", "#715a3f", "#524830"],
            "right",
          )}
        </g>
      ))}
      {[
        [-20, 260, 70],
        [120, 315, 58],
        [965, 260, 80],
        [1090, 350, 65],
        [280, 359, 34],
      ].map(([x, y, s], i) => (
        <g key={i}>
          <path
            fill="#65503a"
            d={`M${x + s * 0.8} ${y}h${s * 0.4}v${s * 2.2}h${-s * 0.4}z`}
          />
          {cube(x, y, s, ["#487344", "#315d3c", "#264b34"], "crown")}
          {cube(
            x + s * 0.22,
            y - s * 0.65,
            s * 0.78,
            ["#5a854e", "#3b693f", "#2c5437"],
            "top",
          )}
        </g>
      ))}
      <g fill="#d8d4bd" opacity=".35">
        <path d="M584 426h56v3h-56zM650 463h65v3h-65zM509 529h100v4H509z" />
      </g>
    </svg>
  );
}

export default function Minecraft({
  onLaunch,
}: {
  onLaunch?: (game: GameEntry) => void;
}) {
  const { games, loading, errors, retry } = useMinecraftGames();
  const [tab, setTab] = useState<"play" | "versions">("play");
  const [source, setSource] = useState("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(() =>
    readPreference("satona.minecraft.version", ""),
  );
  const [playing, setPlaying] = useState<GameEntry | null>(null);
  const [notice, setNotice] = useState("");
  const selected =
    games.find((game) => minecraftKey(game) === selectedId) || games[0];
  const choose = (id: string) => {
    setSelectedId(id);
    try {
      savePreference("satona.minecraft.version", id);
    } catch {
      setNotice("This device could not save your selected version.");
    }
  };
  const play = (game: GameEntry) => {
    choose(minecraftKey(game));
    if (onLaunch) onLaunch(game);
    else {
      try {
        rememberGame(game);
      } catch {
        /* Launch still works without storage. */
      }
      setPlaying(game);
    }
  };
  if (playing)
    return (
      <div className="mc-inline-player">
        <header>
          <button onClick={() => setPlaying(null)}>← Minecraft Launcher</button>
          <strong>{playing.name}</strong>
        </header>
        <GamePlayer game={playing} onClose={() => setPlaying(null)} />
      </div>
    );
  const filtered = games.filter(
    (game) =>
      (source === "All" || game.source === source) &&
      game.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="minecraft-launcher">
      <aside className="mc-sidebar">
        <div className="mc-profile">
          <Icon name="minecraft" size={34} />
          <span>
            <b>SATONA</b>
            <small>Your blocky corner</small>
          </span>
        </div>
        <button
          className={tab === "play" ? "active" : ""}
          onClick={() => setTab("play")}
        >
          <Icon name="minecraft" size={31} />
          <span>
            MINECRAFT<small>& EAGLERCRAFT</small>
          </span>
        </button>
        <button
          className={tab === "versions" ? "active" : ""}
          onClick={() => setTab("versions")}
        >
          <Icon name="apps" size={24} />
          <span>
            ALL VERSIONS<small>{games.length} ready to play</small>
          </span>
        </button>
        <div className="mc-sidebar-bottom">
          <span>GN-MATH + LUMINSDK</span>
          <p>
            One launcher.
            <br />A world of possibilities.
          </p>
          <small>Satona community launcher</small>
        </div>
      </aside>
      <div className="mc-main">
        <header className="mc-header">
          <strong>MINECRAFT & EAGLERCRAFT</strong>
          <nav aria-label="Minecraft Launcher pages">
            <button
              className={tab === "play" ? "active" : ""}
              onClick={() => setTab("play")}
            >
              Play
            </button>
            <button
              className={tab === "versions" ? "active" : ""}
              onClick={() => setTab("versions")}
            >
              Installations <span>{games.length}</span>
            </button>
          </nav>
        </header>
        {(errors.length > 0 || notice) && (
          <div className="mc-notice" role="status">
            {errors.join(" ")} {notice}{" "}
            {errors.length > 0 && (
              <button onClick={retry}>Retry catalogs</button>
            )}
          </div>
        )}
        {tab === "play" ? (
          <>
            <div className="mc-hero">
              <BlockLandscape />
              <div className="mc-wordmark">
                <h1>MINECRAFT</h1>
                <span>THE SATONA COLLECTION</span>
              </div>
              <div className="mc-hero-caption">
                <span>BUILD SOMETHING THAT’S YOURS.</span>
                <h2>
                  A new world is
                  <br />
                  one click away.
                </h2>
                <p>Classic adventures. Different versions. Your choice.</p>
              </div>
              <span className="mc-hero-badge">EAGLERCRAFT + MINECRAFT</span>
            </div>
            <div className="mc-launch-bar">
              <Icon name="minecraft" size={38} />
              <label>
                <span>
                  {selected ? "Selected release" : "Finding releases…"}
                </span>
                <select
                  aria-label="Minecraft version"
                  value={selected ? minecraftKey(selected) : ""}
                  onChange={(e) => choose(e.target.value)}
                  disabled={!games.length}
                >
                  {!games.length && (
                    <option value="">
                      {loading ? "Loading versions…" : "No versions available"}
                    </option>
                  )}
                  {(["gn-math", "LuminSDK"] as const).map((provider) => (
                    <optgroup key={provider} label={provider}>
                      {games
                        .filter((game) => game.source === provider)
                        .map((game) => (
                          <option
                            key={minecraftKey(game)}
                            value={minecraftKey(game)}
                          >
                            {game.name} · {game.source}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <button
                className="mc-play"
                disabled={!selected}
                onClick={() => selected && play(selected)}
              >
                PLAY
              </button>
              <span className="mc-launch-source">
                {selected?.source || "YOUR LIBRARY"}
                <small>
                  {loading
                    ? "Finding all versions…"
                    : `${games.length} versions available`}
                </small>
              </span>
            </div>
            <div className="mc-below">
              <div>
                <span>YOUR NEXT ADVENTURE</span>
                <h3>Every version, in one place.</h3>
                <p>
                  Pick a release above or explore the full collection. Each version
                  launches directly from here.
                </p>
              </div>
              <button onClick={() => setTab("versions")}>
                Browse installations <span>↗</span>
              </button>
            </div>
          </>
        ) : (
          <div className="mc-installations">
            <div className="mc-installations-title">
              <div>
                <h1>Your installations</h1>
                <p>
                  All catalog versions are ready to play. No download needed.
                </p>
              </div>
              <button onClick={retry} disabled={loading}>
                {loading ? "Refreshing…" : "Refresh"}
              </button>
            </div>
            <div className="mc-filters">
              <input
                aria-label="Search Minecraft versions"
                placeholder="Search versions…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                aria-label="Minecraft source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option>All</option>
                <option>gn-math</option>
                <option>LuminSDK</option>
              </select>
            </div>
            <div className="mc-version-list">
              {filtered.map((game) => (
                <article key={minecraftKey(game)}>
                  <GameCover game={game} />
                  <div>
                    <h3>{game.name}</h3>
                    <small>{game.source} · Ready to play</small>
                  </div>
                  <button
                    aria-label={`Select ${game.name} (${game.source})`}
                    onClick={() => {
                      choose(minecraftKey(game));
                      setTab("play");
                    }}
                  >
                    Select
                  </button>
                  <button
                    className="mc-version-play"
                    aria-label={`Play ${game.name} (${game.source})`}
                    onClick={() => play(game)}
                  >
                    Play
                  </button>
                </article>
              ))}
            </div>
            {!filtered.length && (
              <p role="status">
                {loading
                  ? "Finding versions in both catalogs…"
                  : "No matching versions. Try another search or refresh the catalogs."}
              </p>
            )}
          </div>
        )}
        <footer className="mc-footer">
          {loading ? "● SYNCING CATALOGS" : "● READY TO PLAY"}
          <span>
            Community launcher · Not affiliated with Mojang or Microsoft
          </span>
        </footer>
      </div>
    </section>
  );
}
