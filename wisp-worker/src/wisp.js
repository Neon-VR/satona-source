const WINDOW = 32;
const MAX_STREAMS = 6;
const MAX_PACKET = 1024 * 1024;
const decoder = new TextDecoder("utf-8", { fatal: true });

export function packet(type, id, payload) {
  const bytes = new Uint8Array(5 + payload.length);
  bytes[0] = type;
  new DataView(bytes.buffer).setUint32(1, id, true);
  bytes.set(payload, 5);
  return bytes;
}

export function validDestination(host, port) {
  // This web relay only needs HTTP(S). Workers also reject private destinations
  // after DNS resolution, so aliases cannot bypass the platform restriction.
  if (port !== 80 && port !== 443) return false;
  if (!host || host.length > 253 || !/^[a-z0-9.-]+$/i.test(host)) return false;
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;
  if (/^\d+(\.\d+){3}$/.test(host)) {
    const [a, b, c, d] = host.split(".").map(Number);
    if ([a, b, c, d].some(n => n > 255)) return false;
    if (a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
        (a === 100 && b >= 64 && b <= 127)) return false;
  }
  return true;
}

export function serveWisp(ws, connectSocket) {
  const streams = new Map();
  let closed = false;
  const send = (type, id, payload) => {
    if (!closed) ws.send(packet(type, id, payload));
  };
  const credit = (id, count) => {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, count, true);
    send(3, id, bytes);
  };
  const closeStream = (id, reason = 2) => {
    const stream = streams.get(id);
    if (stream) {
      streams.delete(id);
      stream.closed = true;
      stream.socket.close().catch(() => {});
    }
    send(4, id, new Uint8Array([reason]));
  };
  const closeAll = () => {
    closed = true;
    for (const id of [...streams.keys()]) closeStream(id);
  };
  ws.addEventListener("close", closeAll);
  ws.addEventListener("error", closeAll);
  ws.addEventListener("message", event => {
    try {
      if (!(event.data instanceof ArrayBuffer) || event.data.byteLength < 5 || event.data.byteLength > MAX_PACKET) {
        console.warn("Invalid Wisp frame", typeof event.data, event.data?.constructor?.name);
        ws.close(1002, "Invalid Wisp packet");
        closeAll();
        return;
      }
      const bytes = new Uint8Array(event.data);
      const view = new DataView(event.data);
      const id = view.getUint32(1, true);
      if (!id) return;
      if (bytes[0] === 1) {
        if (streams.has(id)) { closeStream(id, 0x41); return; }
        if (streams.size >= MAX_STREAMS) { closeStream(id, 0x49); return; }
        if (bytes.length < 9 || bytes[5] !== 1) { closeStream(id, 0x41); return; }
        const port = view.getUint16(6, true);
        const host = decoder.decode(bytes.subarray(8)).toLowerCase();
        if (!validDestination(host, port)) { closeStream(id, 0x48); return; }
        let socket;
        try {
          // TLS remains end-to-end in Epoxy/libcurl; this socket carries bytes.
          socket = connectSocket({ hostname: host, port }, { secureTransport: "off" });
        } catch (error) { console.warn("Socket connect failed", String(error)); closeStream(id, 0x42); return; }
        const stream = { socket, writer: socket.writable.getWriter(), queue: Promise.resolve(), pending: 0, consumed: 0, closed: false };
        streams.set(id, stream);
        socket.closed.catch(() => { if (!stream.closed) closeStream(id, 3); });
        void (async () => {
          try {
            await socket.opened;
            const reader = socket.readable.getReader();
            while (!stream.closed) {
              const { value, done } = await reader.read();
              if (done) break;
              send(2, id, value);
            }
            if (!stream.closed) closeStream(id, 2);
          } catch (error) {
            console.warn("Socket read failed", String(error));
            if (!stream.closed) closeStream(id, 0x42);
          }
        })();
      } else if (bytes[0] === 2) {
        const stream = streams.get(id);
        if (!stream) { closeStream(id, 0x41); return; }
        if (++stream.pending > WINDOW) { closeStream(id, 0x49); return; }
        const data = bytes.slice(5);
        stream.queue = stream.queue.then(async () => {
          if (stream.closed) return;
          await stream.writer.write(data);
          stream.pending--;
          // Send a new absolute window once the client's whole old window has
          // been consumed. This avoids granting duplicate in-flight credit.
          if (++stream.consumed === WINDOW) {
            stream.consumed = 0;
            credit(id, WINDOW - stream.pending);
          }
        }).catch(() => { if (!stream.closed) closeStream(id, 3); });
      } else if (bytes[0] === 4) {
        closeStream(id);
      } else {
        closeStream(id, 0x41);
      }
    } catch (error) {
      console.warn("Wisp packet failed", String(error));
      ws.close(1002, "Invalid Wisp packet");
      closeAll();
    }
  });
  credit(0, WINDOW);
}
