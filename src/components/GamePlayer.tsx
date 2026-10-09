import { useEffect, useState } from "react";
import ProxyTab from "./ProxyTab";
import { loadLumin } from "../lib/lumin";
import type { GameEntry } from "../lib/game-library";
import GameCover from "./GameCover";
import { isMinecraftGame } from "../lib/minecraft-catalog";
import minecraftLogo from "../assets/minecraft-loading.png";
import "./game-launch.css";

export default function GamePlayer({
  game,
  onClose,
  onOpenSteam,
}: {
  game: GameEntry;
  onClose: () => void;
  onOpenSteam?: () => void;
}) {
  const [url, setUrl] = useState("");
  const [introDone, setIntroDone] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setUrl("");
    setIntroDone(false);
    setError("");
    const introTimer = setTimeout(() => setIntroDone(true), 3000);
    const timer = setTimeout(() => {
      if (active) setError("The game provider did not respond. Try again.");
    }, 30000);
    void (async () => {
      try {
        const next =
          game.source === "LuminSDK"
            ? (await (await loadLumin()).getGameUrl(game.id)).url
            : game.assetFolder
              ? `https://raw.githubusercontent.com/gn-math/assets/main/${encodeURIComponent(game.assetFolder)}/index.html`
              : `https://raw.githubusercontent.com/gn-math/html/main/${encodeURIComponent(game.htmlFile)}`;
        const target = new URL(next);
        if (target.protocol !== "https:")
          throw new Error("Unsupported game URL");
        if (active) {
          clearTimeout(timer);
          setUrl(next);
        }
      } catch {
        if (active) {
          clearTimeout(timer);
          setError("This game could not be opened. Try again in a moment.");
        }
      }
    })();
    return () => {
      active = false;
      clearTimeout(timer);
      clearTimeout(introTimer);
    };
  }, [game.id, game.source, game.assetFolder, game.htmlFile, attempt]);
  return (
    <div className="standalone-game-player">
      {url && (
        <ProxyTab
          key={`${url}:${attempt}`}
          url={url}
          revision={attempt}
          title={game.name}
          gameDocument={game.source === "gn-math"}
          onFrame={() => {}}
        />
      )}
      {introDone && !url && (
        <div className="game-connection-status" role="status">
          <p>{error || "Connecting to the game provider…"}</p>
          {error && (
            <button onClick={() => setAttempt((value) => value + 1)}>
              Retry
            </button>
          )}
          <button onClick={onClose}>Close game</button>
        </div>
      )}
      {!introDone && isMinecraftGame(game) && (
        <div
          className="minecraft-loading-screen"
          aria-label={`Starting ${game.name}`}
        >
          <img src={minecraftLogo} alt="Minecraft" />
          <div
            key={attempt}
            className="game-three-second-progress minecraft-progress"
            role="progressbar"
            aria-label="Starting Minecraft"
          />
          <button
            className="game-dialog-close"
            aria-label={`Cancel ${game.name} launch`}
            onClick={onClose}
          >
            ×
          </button>
          {error ? (
            <div className="minecraft-loading-error" role="alert">
              <p>{error}</p>
              <button onClick={() => setAttempt((value) => value + 1)}>
                Try again
              </button>
              <button onClick={onClose}>Close game</button>
            </div>
          ) : (
            <span className="minecraft-loading-status" role="status">
              Loading {game.name}…
            </span>
          )}
        </div>
      )}
      {!introDone && !isMinecraftGame(game) && (
        <div className="game-starting-backdrop">
          <section
            className="game-starting-panel"
            role="dialog"
            aria-modal="true"
            aria-label={`Starting ${game.name}`}
          >
            <button
              className="game-dialog-close"
              aria-label={`Cancel ${game.name} launch`}
              onClick={onClose}
            >
              ×
            </button>
            <div className="game-starting-art">
              <GameCover game={game} />
            </div>
            <div className="game-starting-copy">
              <span>Starting game</span>
              <h2>{game.name}</h2>
              <div role="status">
                <b>{error ? "COULD NOT START" : "LAUNCHING"}</b>
                <p>{error || "Opening your game…"}</p>
              </div>
              <div
                key={attempt}
                className="game-three-second-progress"
                role="progressbar"
                aria-label="Starting game"
              />
              {error && (
                <button onClick={() => setAttempt((value) => value + 1)}>
                  Try again
                </button>
              )}
              {onOpenSteam && (
                <button onClick={onOpenSteam}>Open Satona Steam</button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
