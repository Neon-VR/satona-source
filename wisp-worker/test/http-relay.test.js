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
