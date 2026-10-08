import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const source = ts.transpile(
  fs.readFileSync(
    new URL("../src/lib/minecraft-catalog.ts", import.meta.url),
    "utf8",
  ),
  { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
);
const { isMinecraftGame, sortMinecraftGames, collectLuminMinecraft } =
  await import(
    "data:text/javascript;base64," + Buffer.from(source).toString("base64")
  );
test("Minecraft routing matches both names regardless of case without moving unrelated games", () => {
  for (const name of [
    "Minecraft 1.12.2",
    "EAGLERCRAFT 1.8.8",
    "EaglercraftX",
    "Minecraft Tower Defense",
  ])
    assert.equal(isMinecraftGame({ name }), true);
  for (const name of ["Minesweeper", "CraftMine", "OvO"])
    assert.equal(isMinecraftGame({ name }), false);
});
test("version collection visits every page of both searches and removes overlapping IDs", async () => {
  const calls = [];
  const games = await collectLuminMinecraft(async (page, query) => {
    calls.push([page, query]);
    if (query === "minecraft")
      return {
        pages: 2,
        games:
          page === 1
            ? [
                { id: "a", name: "Minecraft 1.8.8" },
                { id: "noise", name: "OvO" },
              ]
            : [{ id: "b", name: "Minecraft 1.12.2" }],
      };
    return {
      pages: 2,
      games:
        page === 1
          ? [{ id: "a", name: "Minecraft 1.8.8" }]
          : [{ id: "c", name: "Eaglercraft 1.5.2" }],
    };
  });
  assert.deepEqual(calls, [
    [1, "minecraft"],
    [2, "minecraft"],
    [1, "eaglercraft"],
    [2, "eaglercraft"],
  ]);
  assert.deepEqual(
    games.map((game) => game.id),
    ["b", "a", "c"],
  );
  assert.ok(games.every((game) => game.source === "LuminSDK"));
});
test("same-name releases from different providers stay selectable", () => {
  const game = {
    id: "1",
    name: "Minecraft 1.12.2",
    htmlFile: "1.html",
    source: "gn-math",
  };
  assert.equal(
    sortMinecraftGames([game, game, { ...game, source: "LuminSDK" }]).length,
    2,
  );
});
test("failed later pages reject the catalog instead of caching an incomplete list", async () => {
  await assert.rejects(
    collectLuminMinecraft(async (page) => {
      if (page === 2) throw new Error("offline");
      return { pages: 2, games: [{ id: "1", name: "Minecraft" }] };
    }),
    /offline/,
  );
});
