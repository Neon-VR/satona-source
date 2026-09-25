import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const searchRoots = [
  "games",
  "src/games",
  "public/games",
  "src/apps/games",
  "public/apps/games",
];

const ignored = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".vite",
]);

const playable = new Set([
  ".html",
  ".htm",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
]);

const results = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir, {
    withFileTypes: true,
  })) {
    if (ignored.has(entry.name)) continue;

    const absolute = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(absolute);
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();

    if (!playable.has(extension)) continue;

    const relative = path
      .relative(root, absolute)
      .replaceAll("\\", "/");

    if (
      relative.includes("node_modules/") ||
      relative.startsWith("scripts/")
    ) {
      continue;
    }

    const base = path.basename(
      entry.name,
      extension
    );

    if (
      ["index", "main", "game"].includes(
        base.toLowerCase()
      )
    ) {
      continue;
    }

    results.push({
      id: relative
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase(),
      title: base
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (c) =>
          c.toUpperCase()
        ),
      path: relative,
      url: relative.startsWith("public/")
        ? "/" + relative.slice("public/".length)
        : null,
    });
  }
}

for (const rootDir of searchRoots) {
  walk(path.join(root, rootDir));
}

const unique = Array.from(
  new Map(
    results.map((item) => [
      item.path,
      item,
    ])
  ).values()
).sort((a, b) =>
  a.title.localeCompare(b.title)
);

const output = `export type GameEntry = {
  id: string;
  title: string;
  path: string;
  url: string | null;
};

const games: GameEntry[] = ${JSON.stringify(
  unique,
  null,
  2
)};

export default games;
`;

fs.mkdirSync(
  path.join(root, "src/generated"),
  { recursive: true }
);

fs.writeFileSync(
  path.join(
    root,
    "src/generated/games.ts"
  ),
  output
);

console.log(
  `Satona: detected ${unique.length} game file(s).`
);
