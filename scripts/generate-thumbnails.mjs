import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const roots = [
  path.resolve("games"),
  path.resolve("public/games"),
  path.resolve("src/games"),
];

const browser = await chromium.launch();

for (const root of roots) {
  if (!fs.existsSync(root)) continue;

  for (const entry of fs.readdirSync(root, {
    withFileTypes: true,
  })) {
    if (!entry.isDirectory()) continue;

    const folder = path.join(root, entry.name);
    const index = path.join(folder, "index.html");
    const thumbnail = path.join(folder, "thumbnail.png");

    if (!fs.existsSync(index) || fs.existsSync(thumbnail)) {
      continue;
    }

    const page = await browser.newPage({
      viewport: {
        width: 1280,
        height: 720,
      },
    });

    try {
      await page.goto(`file://${index}`, {
        waitUntil: "networkidle",
        timeout: 15000,
      });

      await page.waitForTimeout(1200);
      await page.screenshot({
        path: thumbnail,
      });

      console.log(`Thumbnail: ${entry.name}`);
    } catch (error) {
      console.log(
        `Could not thumbnail ${entry.name}: ${error.message}`
      );
    } finally {
      await page.close();
    }
  }
}

await browser.close();
