import test from "node:test";
import assert from "node:assert/strict";
import { packet, serveWisp, validDestination } from "../src/wisp.js";

class WebSocketMock extends EventTarget {
  sent = [];
  send(data) { this.sent.push(data); }
  close(code) { this.code = code; }
  receive(data) { this.dispatchEvent(new MessageEvent("message", { data: data.buffer })); }
}
function connectPacket(id, host = "example.com", port = 443) {
  const name = new TextEncoder().encode(host);
  const payload = new Uint8Array(3 + name.length);
  payload[0] = 1;
  new DataView(payload.buffer).setUint16(1, port, true);
  payload.set(name, 3);
  return packet(1, id, payload);
}
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

test("rejects private addresses, unsupported ports and malformed hosts", () => {
  for (const host of ["127.0.0.1", "10.1.1.1", "172.16.0.1", "192.168.0.1", "169.254.169.254", "localhost", "a.local", "a/b"]) {
    assert.equal(validDestination(host, 443), false, host);
  }
  assert.equal(validDestination("example.com", 25), false);
  assert.equal(validDestination("example.com", 443), true);
});

test("negotiates v1 and transfers ordered TCP bytes with window replenishment", async () => {
  const ws = new WebSocketMock();
  const writes = [];
  let output;
  let target;
  serveWisp(ws, address => {
    target = address;
    return {
      opened: Promise.resolve(), closed: new Promise(() => {}),
      readable: new ReadableStream({ start(c) { output = c; } }),
      writable: new WritableStream({ write(bytes) { writes.push(bytes[0]); } }),
      close: async () => {},
    };
  });
  assert.equal(ws.sent[0][0], 3);
  assert.equal(new DataView(ws.sent[0].buffer).getUint32(5, true), 32);
  ws.receive(connectPacket(1));
  for (let i = 0; i < 32; i++) ws.receive(packet(2, 1, new Uint8Array([i])));
  await tick();
  assert.deepEqual(target, { hostname: "example.com", port: 443 });
  assert.deepEqual(writes, Array.from({ length: 32 }, (_, i) => i));
  assert.equal(ws.sent.filter(p => p[0] === 3).length, 2);
  output.enqueue(new Uint8Array([42, 43]));
  await tick();
  assert.deepEqual([...ws.sent.find(p => p[0] === 2).slice(5)], [42, 43]);
  output.close();
  await tick();
  assert.equal(ws.sent.at(-1)[5], 2);
});

test("reports connect failures and enforces stream limits", async () => {
  const ws = new WebSocketMock();
  serveWisp(ws, () => ({
    opened: new Promise(() => {}), closed: new Promise(() => {}),
    readable: new ReadableStream(), writable: new WritableStream(), close: async () => {},
  }));
  for (let i = 1; i <= 7; i++) ws.receive(connectPacket(i));
  assert.equal(ws.sent.at(-1)[5], 0x49);
  ws.dispatchEvent(new Event("close"));
  const failed = new WebSocketMock();
  serveWisp(failed, () => { throw new Error("blocked"); });
  failed.receive(connectPacket(1));
  assert.equal(failed.sent.at(-1)[5], 0x42);
});
