import test from "node:test";
import assert from "node:assert/strict";
import { gamePage } from "../src/game-page.js";
const env = {
  ALLOWED_ORIGINS: "https://satona-study.b-cdn.net,http://127.0.0.1:5174",
};
test("isolated game documents have the original asset base and permit only Satona framing", async () => {
  let destination;
  const result = await gamePage(
    new Request("https://relay.example/game?folder=2"),
    env,
    async (url) => {
      destination = url;
      return new Response("<html><head></head><body>Game</body></html>");
    },
  );
  assert.equal(
    destination,
    "https://raw.githubusercontent.com/gn-math/assets/main/2/index.html",
  );
  assert.match(
    await result.text(),
    /<base href="https:\/\/cdn.jsdelivr.net\/gh\/gn-math\/assets@main\/2\/">/,
  );
  assert.equal(result.headers.get("Content-Type"), "text/html; charset=utf-8");
  assert.equal(
    result.headers.get("Content-Security-Policy"),
    "frame-ancestors https://satona-study.b-cdn.net http://127.0.0.1:5174;",
  );
});
test("game hosting cannot fetch arbitrary hosts or traverse repository paths", async () => {
  for (const query of [
    "folder=../x",
    "file=../../secret.html",
    "file=https://evil.example/1.html",
    "file=1.html%3Fredirect=evil",
  ]) {
    const result = await gamePage(
      new Request(`https://relay.example/game?${query}`),
      env,
      () => {
        throw Error("unexpected fetch");
      },
    );
    assert.equal(result.status, 400);
  }
  const result = await gamePage(
    new Request("https://relay.example/game?file=1.html"),
    env,
    async () => new Response("missing", { status: 404 }),
  );
  assert.equal(result.status, 502);
});
