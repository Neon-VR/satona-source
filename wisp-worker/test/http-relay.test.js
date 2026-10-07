import test from "node:test";
import assert from "node:assert/strict";
import { relayHttp } from "../src/http-relay.js";
const origin = "https://satona-study.b-cdn.net";
const env = { ALLOWED_ORIGINS: origin };
const request = (input = {}, from = origin) =>
  new Request("https://relay.workers.dev/fetch", {
    method: "POST",
    headers: { Origin: from, "Content-Type": "application/json" },
    body: JSON.stringify({
      url: "https://better16.xyz/",
      method: "GET",
      headers: [],
      ...input,
    }),
  });

test("embedded player receives the actual embedding app identity", async () => {
  await relayHttp(
    request({ url: "https://www.youtube.com/embed/aqz-KE-bpKQ" }),
    env,
    async (_url, options) => {
      assert.equal(options.headers.get("Referer"), `${origin}/`);
      return new Response("player");
    },
  );
});

test("video read POSTs preserve bytes and stream upstream media", async () => {
  const result = await relayHttp(
    request({
      url: "https://rr1.googlevideo.com/videoplayback",
      method: "POST",
      bodyBase64: "AP8YgA==",
    }),
    env,
    async (url, options) => {
      assert.equal(options.method, "POST");
      assert.deepEqual([...options.body], [0, 255, 24, 128]);
      return new Response(new Uint8Array([1, 2, 3]), {
        headers: { "content-type": "video/mp4" },
      });
    },
  );
  assert.deepEqual([...new Uint8Array(await result.arrayBuffer())], [1, 2, 3]);
});

test("relay rejects video lookalikes, account mutations, and bodies on GET", async () => {
  for (const url of [
    "https://googlevideo.com.attacker.example/videoplayback",
    "https://www.youtube.com/youtubei/v1/like/like",
    "http://rr1.googlevideo.com/videoplayback",
  ]) {
    assert.equal(
      (
        await relayHttp(
          request({ url, method: "POST", bodyBase64: "e30=" }),
          env,
        )
      ).status,
      405,
    );
  }
  assert.equal(
    (await relayHttp(request({ bodyBase64: "e30=" }), env)).status,
    400,
  );
});

test("HTTP fallback preserves redirects and separate cookies without following the redirect", async () => {
  const result = await relayHttp(
    request({
      headers: [
        ["Cookie", "session=example"],
        ["Host", "wrong.example"],
      ],
    }),
    env,
    async (url, options) => {
      assert.equal(url.hostname, "better16.xyz");
      assert.equal(options.redirect, "manual");
      assert.equal(options.headers.get("Cookie"), "session=example");
      assert.equal(options.headers.has("Host"), false);
      return new Response(null, {
        status: 302,
        headers: [
          ["Location", "/start"],
          ["Set-Cookie", "one=1"],
          ["Set-Cookie", "two=2"],
        ],
      });
    },
  );
  const meta = JSON.parse(
    decodeURIComponent(result.headers.get("X-Satona-Metadata")),
  );
  assert.equal(meta.status, 302);
  assert.deepEqual(
    meta.headers.filter(([key]) => key === "set-cookie"),
    [
      ["set-cookie", "one=1"],
      ["set-cookie", "two=2"],
    ],
  );
  assert.equal(result.headers.get("Access-Control-Allow-Origin"), origin);
});

test("HTTP fallback rejects unapproved origins, private destinations, credentials, recursion and unsafe methods", async () => {
  const unexpected = () => {
    throw new Error("must not fetch");
  };
  assert.equal(
    (await relayHttp(request({}, "https://other.example"), env, unexpected))
      .status,
    403,
  );
  for (const url of [
    "http://127.0.0.1/",
    "http://169.254.169.254/",
    "http://localhost/",
    "ftp://example.com/",
    "https://u:p@example.com/",
    "https://relay.workers.dev/",
    "https://example.com:444/",
  ]) {
    assert.equal(
      (await relayHttp(request({ url }), env, unexpected)).status,
      400,
      url,
    );
  }
  assert.equal(
    (await relayHttp(request({ method: "POST" }), env, unexpected)).status,
    405,
  );
});

test("HTTP fallback streams upstream errors as responses and exposes readable bodies", async () => {
  const result = await relayHttp(
    request(),
    env,
    async () => new Response("not found", { status: 404 }),
  );
  assert.equal(result.status, 200);
  assert.equal(
    JSON.parse(decodeURIComponent(result.headers.get("X-Satona-Metadata")))
      .status,
    404,
  );
  assert.equal(await result.text(), "not found");
});
