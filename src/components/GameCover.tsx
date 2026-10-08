import { useEffect, useState } from "react";
import { loadLumin } from "../lib/lumin";
import type { GameEntry as Entry } from "../lib/game-library";
export default function GameCover({ game }: { game: Entry }) {
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
