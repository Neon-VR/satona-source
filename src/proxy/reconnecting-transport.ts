import Epoxy from "@mercuryworkshop/epoxy-transport";

// A closed Wisp multiplexer cannot serve another request. Rebuild it once,
// sharing recovery between concurrent requests from the same page.
export class ReconnectingTransport extends Epoxy {
  private recovery: Promise<void> | null = null;

  override async init() {
    if (new URL(this.wisp).hostname.endsWith(".onrender.com")) {
      const health = new URL("/healthz", this.wisp.replace(/^ws/, "http"));
      await fetch(health, {
        mode: "no-cors",
        cache: "no-store",
        signal: AbortSignal.timeout(90000),
      }).catch(() => {
        // A blocked health probe should not prevent the WebSocket handshake.
      });
    }
    await super.init();
  }

  override async request(...args: Parameters<Epoxy["request"]>): ReturnType<Epoxy["request"]> {
    if (this.recovery) await this.recovery;
    const failedClient = this.client;
    try {
      return await super.request(...args);
    } catch (error) {
      const [, method, body, , signal] = args;
      const disconnected = /MuxTaskEnded|Multiplexor task ended/.test(String(error));
      const handshakeEnded = /tls handshake eof/.test(String(error));
      // Never replay submissions or a consumed request body.
      if ((!disconnected && !handshakeEnded) ||
          !["GET", "HEAD"].includes(method.toUpperCase()) || body != null || signal?.aborted) {
        throw error;
      }
      // Workers cap each WebSocket at six TCP streams. A fresh multiplexer
      // also releases a failing pooled connection after TLS EOF.
      if ((disconnected || handshakeEnded) && this.client === failedClient && !this.recovery) {
        this.recovery = this.init().finally(() => { this.recovery = null; });
      }
      if (this.recovery) await this.recovery;
      signal?.throwIfAborted();
      return super.request(...args);
    }
  }
}
