import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function setup({
  failure = "MuxTaskEnded",
  method = "GET",
  healthFails = false,
  persistent = false,
  httpRelay,
  engine = "epoxy",
  status = 200,
} = {}) {
  let attempts = 0;
  let initializations = 0;
  let httpAttempts = 0;
  let libcurlAttempts = 0;
  class Epoxy {
    constructor({ wisp }) {
      this.wisp = wisp;
    }
    async init() {
      initializations++;
      this.client = {};
    }
    async request() {
      attempts++;
      if (attempts === 1 || persistent) throw new Error(failure);
      return { status: 200 };
    }
  }
  class Libcurl extends Epoxy {
    async request(...args) {
      libcurlAttempts++;
      return super.request(...args);
    }
  }
  const source = readFileSync(
    new URL("../src/proxy/reconnecting-transport.ts", import.meta.url),
    "utf8",
  )
    .replace('import Epoxy from "@mercuryworkshop/epoxy-transport";', "")
    .replace(
      /await import\(\s*"@mercuryworkshop\/libcurl-transport"\s*\)/,
      "({ default: MockLibcurl })",
    )
    .replace(
      "export class ReconnectingTransport",
      "class ReconnectingTransport",
    );
  const compiled = ts.transpile(source, { target: ts.ScriptTarget.ES2022 });
  const Transport = vm.runInNewContext(compiled + "\nReconnectingTransport;", {
    Epoxy,
    MockLibcurl: Libcurl,
    URL,
    AbortSignal,
    setTimeout,
    fetch: async (url) => {
      if (url === httpRelay) {
        httpAttempts++;
        return new Response("fallback page", {
          headers: {
            "X-Satona-Metadata": encodeURIComponent(
              JSON.stringify({ status, statusText: "OK", headers: [] }),
            ),
          },
        });
      }
      if (healthFails) throw new Error("Health probe blocked");
    },
  });
  const transport = new Transport({
    wisp: "wss://test.onrender.com/wisp/",
    httpRelay,
    engine,
  });
  return {
    transport,
    args: [new URL("https://example.com"), method, null, {}, undefined],
    counts: () => ({ attempts, initializations }),
    httpAttempts: () => httpAttempts,
    libcurlAttempts: () => libcurlAttempts,
  };
}

test("disconnected GET rebuilds the client and retries once", async () => {
  const state = setup();
  await state.transport.init();
  assert.equal((await state.transport.request(...state.args)).status, 200);
  assert.deepEqual(state.counts(), { attempts: 2, initializations: 2 });
});
test("submissions are never replayed", async () => {
  const state = setup({ method: "POST" });
  await state.transport.init();
  await assert.rejects(state.transport.request(...state.args), /MuxTaskEnded/);
  assert.equal(state.counts().attempts, 1);
});
test("TLS EOF replaces the exhausted connection before retrying GET", async () => {
  const state = setup({ failure: "tls handshake eof" });
  await state.transport.init();
  assert.equal((await state.transport.request(...state.args)).status, 200);
  assert.deepEqual(state.counts(), { attempts: 2, initializations: 2 });
});
test("aborted GET is never replayed", async () => {
  const state = setup();
  await state.transport.init();
  state.args[4] = AbortSignal.abort();
  await assert.rejects(state.transport.request(...state.args));
  assert.equal(state.counts().attempts, 1);
});
test("blocked health probe still permits transport initialization", async () => {
  const state = setup({ healthFails: true });
  await state.transport.init();
  assert.equal(state.counts().initializations, 1);
});

test("persistent TLS EOF uses the configured HTTP relay and remembers the working route", async () => {
  const state = setup({
    failure: "tls handshake eof",
    persistent: true,
    httpRelay: "https://relay.example/fetch",
  });
  await state.transport.init();
  assert.equal((await state.transport.request(...state.args)).status, 200);
  assert.equal((await state.transport.request(...state.args)).status, 200);
  assert.equal(state.counts().attempts, 2);
  assert.equal(state.httpAttempts(), 2);
});

test("HTTP fallback never replays POST or a GET with a body", async () => {
  for (const method of ["POST", "GET"]) {
    const state = setup({
      method,
      failure: "tls handshake eof",
      persistent: true,
      httpRelay: "https://relay.example/fetch",
    });
    if (method === "GET") state.args[2] = "body";
    await state.transport.init();
    await assert.rejects(
      state.transport.request(...state.args),
      /tls handshake eof/,
    );
    assert.equal(state.httpAttempts(), 0);
  }
});

test("libcurl selection uses libcurl and recovers its SSL connect failure", async () => {
  const state = setup({
    engine: "libcurl",
    failure: "error code 35: SSL connect error",
    persistent: true,
    httpRelay: "https://relay.example/fetch",
  });
  await state.transport.init();
  assert.equal((await state.transport.request(...state.args)).status, 200);
  assert.equal(state.libcurlAttempts(), 2);
  assert.equal(state.httpAttempts(), 1);
});

test("fallback preserves bodyless HTTP statuses and HEAD", async () => {
  for (const [method, status] of [
    ["GET", 304],
    ["GET", 204],
    ["HEAD", 200],
  ]) {
    const state = setup({
      method,
      status,
      failure: "tls handshake eof",
      persistent: true,
      httpRelay: "https://relay.example/fetch",
    });
    await state.transport.init();
    assert.equal((await state.transport.request(...state.args)).body, null);
  }
});

test("certificate verification errors are not retried through the HTTP fallback", async () => {
  const state = setup({
    failure: "invalid peer certificate",
    persistent: true,
    httpRelay: "https://relay.example/fetch",
  });
  await state.transport.init();
  await assert.rejects(state.transport.request(...state.args), /certificate/);
  assert.equal(state.httpAttempts(), 0);
});
