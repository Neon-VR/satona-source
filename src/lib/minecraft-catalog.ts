import type { GameEntry } from "./game-library";
import type { LuminGame } from "./lumin";

export const isMinecraftGame = (game: { name: string }) =>
  /minecraft|eaglercraft/i.test(game.name);
export const minecraftKey = (game: GameEntry) => `${game.source}:${game.id}`;
export function sortMinecraftGames(games: GameEntry[]) {
  const unique = [
    ...new Map(
      games.filter(isMinecraftGame).map((game) => [minecraftKey(game), game]),
    ).values(),
  ];
  return unique.sort((a, b) => {
    const version = (name: string) => name.match(/\d+(?:\.\d+)+/)?.[0] || "0";
    return (
      version(b.name).localeCompare(version(a.name), undefined, {
        numeric: true,
      }) ||
      a.name.localeCompare(b.name) ||
      a.source.localeCompare(b.source)
    );
  });
}

// Both searches are paginated; overlapping results keep their provider ID.
export async function collectLuminMinecraft(
  fetchPage: (
    page: number,
    query: string,
  ) => Promise<{ games: LuminGame[]; pages: number }>,
) {
  const results: GameEntry[] = [];
  for (const query of ["minecraft", "eaglercraft"]) {
    let pages = 1;
    for (let page = 1; page <= pages; page++) {
      const result = await fetchPage(page, query);
      if (
        !Number.isInteger(result.pages) ||
        result.pages < 0 ||
        result.pages > 1000
      )
        throw new Error("Invalid game catalog pagination");
      pages = Math.max(1, result.pages);
      results.push(
        ...result.games.map((game) => ({
          id: String(game.id),
          name: game.name,
          htmlFile: "",
          source: "LuminSDK" as const,
          imageToken: game.image_token,
          category: game.category,
        })),
      );
    }
  }
  return sortMinecraftGames(results);
}
