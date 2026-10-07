export type Game = {
  id: string;
  name: string;
  htmlFile: string;
  assetFolder?: string;
  coverFile?: string;
};

type GameMetadata = {
  id: string | number;
  name?: string;
};

type GitTree = {
  tree?: Array<{ path?: string; type?: string }>;
  message?: string;
};

const HTML_TREE_URL =
  "https://api.github.com/repos/gn-math/html/git/trees/main?recursive=1";
const COVER_TREE_URL =
  "https://api.github.com/repos/gn-math/covers/git/trees/main?recursive=1";
const ASSETS_ROOT_URL =
  "https://api.github.com/repos/gn-math/assets/contents?ref=main";
const GAME_METADATA_URL =
  "https://raw.githubusercontent.com/gn-math/assets/main/zones.json";

function numericId(path: string, extension: string) {
  const match = path.match(
    new RegExp(`^(\\d+)(?:-[^/]*)?\\.${extension}$`, "i"),
  );
  return match?.[1];
}

async function getTreeFiles(url: string, extension: string) {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  });

  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status}`);
  }

  const data = (await response.json()) as GitTree;
  if (!Array.isArray(data.tree)) {
    throw new Error(data.message || "GitHub returned an invalid file list.");
  }

  return data.tree
    .filter((entry) => entry.type === "blob" && typeof entry.path === "string")
    .map((entry) => entry.path as string)
    .filter((path) => numericId(path, extension) !== undefined);
}

async function getAssetFolders() {
  const response = await fetch(ASSETS_ROOT_URL, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) {
    throw new Error(`GN-Math assets returned ${response.status}`);
  }

  const data = (await response.json()) as Array<{
    name?: string;
    type?: string;
  }>;
  if (!Array.isArray(data)) {
    throw new Error("GN-Math assets returned an invalid file list.");
  }

  return new Set(
    data
      .filter((entry) => entry.type === "dir" && /^\d+$/.test(entry.name ?? ""))
      .map((entry) => entry.name as string),
  );
}

async function getGameNames() {
  const response = await fetch(GAME_METADATA_URL);
  if (!response.ok)
    throw new Error(`Library names returned ${response.status}`);
  const data = (await response.json()) as GameMetadata[];
  if (!Array.isArray(data))
    throw new Error("The library returned an invalid name list.");

  return new Map(
    data
      .filter((game) => game.name?.trim())
      .map((game) => [String(game.id), game.name!.trim()]),
  );
}

function byNumericId(files: string[], extension: string) {
  const result = new Map<string, string>();

  for (const file of files.sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  )) {
    const id = numericId(file, extension);
    if (!id) continue;

    const current = result.get(id);
    // Prefer the unmodified `<id>.<extension>` file when multiple versions exist.
    if (!current || file === `${id}.${extension}`) {
      result.set(id, file);
    }
  }

  return result;
}

let catalog: Promise<Game[]> | null = null;
export function loadGames() {
  if (!catalog) catalog = fetchGames().catch(error => { catalog = null; throw error; });
  return catalog;
}
async function fetchGames() {
  const [htmlFiles, coverFiles, assetFolders, namesById] = await Promise.all([
    getTreeFiles(HTML_TREE_URL, "html"),
    getTreeFiles(COVER_TREE_URL, "png"),
    getAssetFolders().catch((error: unknown) => {
      console.warn("Could not list additional library items:", error);
      return new Set<string>();
    }),
    getGameNames().catch((error: unknown) => {
      console.warn("Could not load GN-Math game names:", error);
      return new Map<string, string>();
    }),
  ]);
  const coversById = byNumericId(coverFiles, "png");

  return Array.from(byNumericId(htmlFiles, "html"), ([id, htmlFile]) => ({
    id,
    name: namesById.get(id) ?? `Game ${id}`,
    htmlFile,
    assetFolder: assetFolders.has(id) ? id : undefined,
    coverFile: coversById.get(id),
  })).sort((a, b) => Number(a.id) - Number(b.id));
}
