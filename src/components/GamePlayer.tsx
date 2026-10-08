import { useEffect, useRef, useState } from "react";
import { loadLumin } from "../lib/lumin";
import type { GameEntry } from "../lib/game-library";
import GameCover from "./GameCover";
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
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => {
    let active = true;
    setUrl("");
    setReady(false);
    setError("");
    const timer = setTimeout(() => {
      if (active)
        setError(
          "The game is taking longer than expected. You can retry or return to your library.",
        );
    }, 30000);
    loadTimer.current = timer;
    void (async () => {
      try {
        const next =
          game.source === "LuminSDK"
            ? (await (await loadLumin()).getGameUrl(game.id)).url
            : `https://satona-wisp-browser-20261005.satona.workers.dev/game?${new URLSearchParams(game.assetFolder ? { folder: game.assetFolder } : { file: game.htmlFile })}`;
        const target = new URL(next);
        if (target.protocol !== "https:")
          throw new Error("Unsupported game URL");
        if (active) setUrl(next);
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
    };
  }, [game.id, game.source, game.assetFolder, game.htmlFile, attempt]);
  return (
    <div className="standalone-game-player">
      {url && (
        <iframe
          key={`${url}:${attempt}`}
          title={game.name}
          src={url}
          sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-popups"
          allow="fullscreen; autoplay; gamepad; pointer-lock"
          allowFullScreen
          onLoad={() => {
            clearTimeout(loadTimer.current);
            setReady(true);
            setError("");
          }}
        />
      )}
      {!ready && (
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
              {!error && <div className="game-launch-progress" />}
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
