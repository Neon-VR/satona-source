import fs from "fs";
import path from "path";

const roots = [
  path.resolve("games"),
  path.resolve("public/games"),
  path.resolve("src/games"),
];

const output = path.resolve("src/generated/gameManifest.ts");

function titleCase(value) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function findIndex(folder) {
  const index = path.join(folder, "index.html");
  return fs.existsSync(index) ? index : null;
}

function getTitle(folder, html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  if (match?.[1]?.trim()) {
    return match[1]
      .replace(/\s+/g, " ")
      .trim();
  }

  return titleCase(path.basename(folder));
}

function scan(root, relativeRoot) {
  if (!fs.existsSync(root)) return [];

  const result = [];

  for (const entry of fs.readdirSync(root, {
    withFileTypes: true,
  })) {
    if (!entry.isDirectory()) continue;

    const folder = path.join(root, entry.name);
    const index = findIndex(folder);

    if (index) {
      const html = fs.readFileSync(index, "utf8");

      const rel = path
        .relative(relativeRoot, index)
        .split(path.sep)
        .join("/");

      const publicPath =
        root.includes(`${path.sep}public${path.sep}`)
          ? `/${rel}`
          : `/games/${entry.name}/index.html`;

      const thumb =
        fs.existsSync(path.join(folder, "thumbnail.png"))
          ? root.includes(`${path.sep}public${path.sep}`)
            ? `/${path
                .relative(relativeRoot, path.join(folder, "thumbnail.png"))
                .split(path.sep)
                .join("/")}`
            : `/games/${entry.name}/thumbnail.png`
          : undefined;

      result.push({
        id: entry.name,
        title: getTitle(folder, html),
        url: publicPath,
        thumbnail: thumb,
        initial: getTitle(folder, html)[0] || "?",
      });
    }
  }

  return result;
}

const games = [
  ...scan(path.resolve("games"), process.cwd()),
  ...scan(path.resolve("public/games"), process.cwd()),
  ...scan(path.resolve("src/games"), process.cwd()),
];

const unique = [];
const seen = new Set();

for (const game of games) {
  if (!seen.has(game.id)) {
    seen.add(game.id);
    unique.push(game);
  }
}

fs.mkdirSync(path.dirname(output), {
  recursive: true,
});

fs.writeFileSync(
  output,
  `const games = ${JSON.stringify(unique, null, 2)};\n\nexport default games;\n`
);

console.log(`Generated ${unique.length} game(s).`);
