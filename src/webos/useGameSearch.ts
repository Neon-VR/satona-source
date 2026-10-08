import { useEffect, useState } from "react";
import { loadGames } from "../lib/gn-games";
import { loadLumin } from "../lib/lumin";
import { gameAppId, type GameEntry } from "../lib/game-library";
import { readPreference } from "../lib/preferences";
export function useGameSearch(query: string, enabled: boolean) {
  const [gn, setGn] = useState<GameEntry[]>([]),
    [lumin, setLumin] = useState<GameEntry[]>([]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void loadGames()
      .then((games) => {
        if (active)
          setGn(games.map((game) => ({ ...game, source: "gn-math" })));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [enabled]);
  useEffect(() => {
    setLumin([]);
    setError("");
    if (!enabled || query.trim().length < 2) {
      setBusy(false);
      return;
    }
    let active = true;
    setBusy(true);
    const timer = setTimeout(
      () =>
        void loadLumin()
          .then((sdk) => sdk.getGames({ page: 1, limit: 12, q: query.trim() }))
          .then((result) => {
            if (active)
              setLumin(
                result.games.map((game) => ({
                  id: game.id,
                  name: game.name,
                  htmlFile: "",
                  source: "LuminSDK",
                  imageToken: game.image_token,
                  category: game.category,
                })),
              );
          })
          .catch(() => {
            if (active)
              setError(
                "LuminSDK search is unavailable. GN-Math and recent games are still listed.",
              );
          })
          .finally(() => {
            if (active) setBusy(false);
          }),
      250,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, enabled]);
  const recent = readPreference<GameEntry[]>("satona.recent-games", []);
  const search = query.trim().toLowerCase();
  const matching = search
    ? [...gn, ...recent]
        .filter((game) => game.name.toLowerCase().includes(search))
        .sort(
          (a, b) =>
            Number(b.name.toLowerCase() === search) -
              Number(a.name.toLowerCase() === search) ||
            a.name.localeCompare(b.name),
        )
        .slice(0, 16)
    : recent.slice(0, 6);
  return {
    games: [
      ...new Map(
        [...matching, ...lumin].map((game) => [gameAppId(game), game]),
      ).values(),
    ],
    busy,
    error,
  };
}
