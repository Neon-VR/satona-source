import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function setup({ failure = "MuxTaskEnded", method = "GET", healthFails = false } = {}) {
  let attempts = 0;
  let initializations = 0;
  class Epoxy {
    constructor({ wisp }) { this.wisp = wisp; }
    async init() { initializations++; this.client = {}; }
    async request() {
      attempts++;
      if (attempts === 1) throw new Error(failure);
      return { status: 200 };
    }
  }
  const source = readFileSync(new URL("../src/proxy/reconnecting-transport.ts", import.meta.url), "utf8")
    .replace('import Epoxy from "@mercuryworkshop/epoxy-transport";', "")
    .replace("export class ReconnectingTransport", "class ReconnectingTransport");
  const compiled = ts.transpile(source, { target: ts.ScriptTarget.ES2022 });
  const Transport = vm.runInNewContext(compiled + "\nReconnectingTransport;", {
    Epoxy, URL, AbortSignal, setTimeout,
    fetch: async () => { if (healthFails) throw new Error("Health probe blocked"); },
  });
  const transport = new Transport({ wisp: "wss://test.onrender.com/wisp/" });
  return { transport, args: [new URL("https://example.com"), method, null, {}, undefined],
    counts: () => ({ attempts, initializations }) };
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
