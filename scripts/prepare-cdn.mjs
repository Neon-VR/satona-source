import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const [name, version = "0.1.0"] = process.argv.slice(2);
if (!name || !/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(name)) {
  throw new Error(
    "Usage: node scripts/prepare-cdn.mjs <npm-package-name> <version>",
  );
}
if (!/^\d+\.\d+\.\d+$/.test(version))
  throw new Error("Use an exact x.y.z version");
const output = resolve("cdn-package");
await readFile(resolve("dist/index.html"));
await mkdir(output, { recursive: true });
// Explicit allowlist excludes credentials, source, and the multi-GB game cache.
const files = [
  "index.html",
  "assets",
  "controller",
  "scramjet",
  "utils",
  "icons",
  "sw.js",
  "thread-check.html",
  "favicon.svg",
  "icons.svg",
  "satona-browser-logo.png",
  "satona-logo.png",
  "study-guides-icon.svg",
  "satona-wordmark.png",
  "satona-emblem.png",
];
for (const file of files) {
  if (file === "assets") {
    // This fixed path contains generated bundles only; omit stale releases.
    await rm(resolve(output, "assets"), { recursive: true, force: true });
  }
  await cp(resolve("dist", file), resolve(output, file), { recursive: true });
}
await writeFile(
  resolve(output, "package.json"),
  JSON.stringify(
    {
      name,
      version,
      description: "Satona browser production assets",
      private: false,
      files,
      publishConfig: { access: "public" },
    },
    null,
    2,
  ) + "\n",
);
await writeFile(
  resolve(output, "README.md"),
  "# Satona browser assets\n\nServe these files at the root of an HTTPS website. " +
    "The proxy requires a same-origin service worker and a separate Wisp WebSocket server. " +
    "UNPKG and jsDelivr distribute the assets; they do not run the Wisp server.\n",
);
console.log(
  `Prepared ${output}. Review with npm pack --dry-run in that directory before publishing.`,
);
