import { useEffect, useRef, useState } from "react";
import type { GameDisplayMode, GameEntry } from "../lib/game-library";
import GameCover from "../components/GameCover";
export default function GameLaunchDialog({
  game,
  onPlay,
  onCancel,
}: {
  game: GameEntry;
  onPlay: (mode: GameDisplayMode) => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<GameDisplayMode>("exclusive");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="game-launch-dialog"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <button
        className="game-dialog-close"
        aria-label="Cancel game launch"
        onClick={onCancel}
      >
        ×
      </button>
      <div className="game-launch-heading">
        <GameCover game={game} />
        <div>
          <small>READY TO PLAY</small>
          <h2>{game.name}</h2>
        </div>
      </div>
      <fieldset>
        <legend>SELECT LAUNCH OPTION</legend>
        {(
          [
            [
              "exclusive",
              "Exclusive borderless",
              "Fullscreen game only. Esc returns to a window.",
            ],
            [
              "borderless",
              "Borderless",
              "Fill the WebOS desktop without a window border.",
            ],
            [
              "bordered",
              "Bordered",
              "A separate window you can move, resize, and minimize.",
            ],
          ] as const
        ).map(([value, label, description]) => (
          <label key={value}>
            <input
              type="radio"
              name="game-display-mode"
              value={value}
              checked={mode === value}
              onChange={() => setMode(value)}
            />
            <span>
              <b>{label}</b>
              <small>{description}</small>
            </span>
          </label>
        ))}
      </fieldset>
      <footer>
        <span>All games are ready to play.</span>
        <button onClick={onCancel}>Cancel</button>
        <button className="game-launch-confirm" onClick={() => onPlay(mode)}>
          Play
        </button>
      </footer>
    </dialog>
  );
}
