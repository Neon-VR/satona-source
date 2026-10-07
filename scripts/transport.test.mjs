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
  initGate,
  initFails = false,
  firstRequestSucceeds = false,
} = {}) {
  let attempts = 0;
  let initializations = 0;
  let httpAttempts = 0;
  let libcurlAttempts = 0;
  const httpRequests = [];
  class Epoxy {
    constructor({ wisp }) {
      this.wisp = wisp;
      this.ready = false;
    }
    async init() {
      initializations++;
      if (initGate) await initGate;
      if (initFails && initializations === 1)
        throw new Error("Initialization failed");
      this.client = {};
      this.ready = true;
    }
    async request() {
      attempts++;
      if (!this.client)
        throw new TypeError("Cannot read properties of null (reading 'fetch')");
      if ((!firstRequestSucceeds && attempts === 1) || persistent)
        throw new Error(failure);
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
    Response,
    Uint8Array,
    btoa,
    setTimeout,
    fetch: async (url, options) => {
      if (url === httpRelay) {
        httpAttempts++;
        httpRequests.push(JSON.parse(options.body));
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
    httpRequests,
  };
}

test("cold metadata requests wait for transport initialization without opening a frame", async () => {
  for (const engine of ["epoxy", "libcurl"]) {
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const state = setup({ engine, initGate: gate, firstRequestSucceeds: true });
    const starting = state.transport.init();
    const requests = [
      state.transport.request(...state.args),
      state.transport.request(...state.args),
    ];
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(state.counts(), { attempts: 0, initializations: 1 });
    release();
    await starting;
    assert.deepEqual(
      (await Promise.all(requests)).map((result) => result.status),
      [200, 200],
    );
    assert.deepEqual(state.counts(), { attempts: 2, initializations: 1 });
  }
});

test("a failed initialization can be retried without sending a request early", async () => {
  const state = setup({ initFails: true, firstRequestSucceeds: true });
  await assert.rejects(
    state.transport.request(...state.args),
    /Initialization failed/,
  );
  assert.equal(state.counts().attempts, 0);
  assert.equal((await state.transport.request(...state.args)).status, 200);
  assert.deepEqual(state.counts(), { attempts: 1, initializations: 2 });
});

test("disconnected GET rebuilds the client and retries once", async () => {
  const state = setup();
  await state.transport.init();
  assert.equal((await state.transport.request(...state.args)).status, 200);
  assert.deepEqual(state.counts(), { attempts: 2, initializations: 2 });
});

test("YouTube media reads use HTTPS once and preserve binary request bodies", async () => {
  const state = setup({ httpRelay: "https://relay.example/fetch" });
  const body = new Uint8Array([0, 255, 24, 128]);
  await state.transport.request(
    new URL("https://rr1.googlevideo.com/videoplayback"),
    "POST",
    body,
    [],
    undefined,
  );
  assert.equal(state.counts().attempts, 0);
  assert.equal(state.httpAttempts(), 1);
  assert.deepEqual(
    [...Buffer.from(state.httpRequests[0].bodyBase64, "base64")],
    [...body],
  );
});

test("YouTube account mutations and lookalike hosts do not use the media relay", async () => {
  for (const url of [
    "https://www.youtube.com/youtubei/v1/like/like",
    "https://youtube.com.attacker.example/youtubei/v1/player",
  ]) {
    const state = setup({ httpRelay: "https://relay.example/fetch" });
    await assert.rejects(
      state.transport.request(new URL(url), "POST", "{}", [], undefined),
    );
    assert.equal(state.httpAttempts(), 0);
  }
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
