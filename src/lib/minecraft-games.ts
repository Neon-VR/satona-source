import { useEffect, useState } from "react";
import { loadGames } from "./gn-games";
import { loadLumin } from "./lumin";
import { collectLuminMinecraft, sortMinecraftGames } from "./minecraft-catalog";
import type { GameEntry } from "./game-library";

let luminCatalog: Promise<GameEntry[]> | null = null;
export function loadLuminMinecraft() {
  if (!luminCatalog)
    luminCatalog = loadLumin()
      .then((sdk) =>
        collectLuminMinecraft((page, q) =>
          sdk.getGames({ page, q, limit: 100 }),
        ),
      )
      .catch((error) => {
        luminCatalog = null;
        throw error;
      });
  return luminCatalog;
}
export function useMinecraftGames() {
  const [games, setGames] = useState<GameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrors([]);
    const providers = [
      {
        name: "GN-Math",
        load: loadGames().then((games) =>
          sortMinecraftGames(
            games.map((game) => ({ ...game, source: "gn-math" as const })),
          ),
        ),
      },
      { name: "LuminSDK", load: loadLuminMinecraft() },
    ];
    const loaded: GameEntry[] = [];
    void Promise.all(
      providers.map(async (provider) => {
        try {
          loaded.push(...(await provider.load));
          if (active) setGames(sortMinecraftGames(loaded));
        } catch {
          if (active)
            setErrors((errors) => [
              ...errors,
              `${provider.name} could not load. Retry to get its versions.`,
            ]);
        }
      }),
    ).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [revision]);
  return {
    games,
    loading,
    errors,
    retry: () => setRevision((value) => value + 1),
  };
}
