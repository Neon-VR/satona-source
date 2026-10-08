import type { Game } from "./gn-games";
import { readPreference, savePreference } from "./preferences";
export type GameEntry = Game & {
  source: "gn-math" | "LuminSDK";
  imageToken?: string;
  category?: string;
};
export type GameDisplayMode = "exclusive" | "borderless" | "bordered";
export const gameAppId = (game: GameEntry) => `game:${game.source}:${game.id}`;
export function rememberGame(game: GameEntry) {
  const recent = readPreference<GameEntry[]>("satona.recent-games", []);
  const next = [
    game,
    ...recent.filter((item) => gameAppId(item) !== gameAppId(game)),
  ].slice(0, 16);
  savePreference("satona.recent-games", next);
  return next;
}
