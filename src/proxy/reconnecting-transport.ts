import Epoxy from "@mercuryworkshop/epoxy-transport";

// A closed Wisp multiplexer cannot serve another request. Rebuild it once,
// sharing recovery between concurrent requests from the same page.
export class ReconnectingTransport extends Epoxy {
  private recovery: Promise<void> | null = null;
  private httpRelay?: string;
  private httpOrigins = new Set<string>();
  private engine: "epoxy" | "libcurl";
  private alternate?: import("@mercuryworkshop/libcurl-transport").default;
  private generation = 0;

  constructor(
    options: ConstructorParameters<typeof Epoxy>[0] & {
      httpRelay?: string;
      engine?: "epoxy" | "libcurl";
    },
  ) {
    super(options);
    this.httpRelay = options.httpRelay;
    this.engine = options.engine || "epoxy";
  }

  private requestPrimary(...args: Parameters<Epoxy["request"]>) {
    return this.alternate
      ? this.alternate.request(...args)
      : super.request(...args);
  }

  override connect(
    ...args: Parameters<Epoxy["connect"]>
  ): ReturnType<Epoxy["connect"]> {
    return this.alternate
      ? this.alternate.connect(...args)
      : super.connect(...args);
  }

  private async requestHttp(
    ...args: Parameters<Epoxy["request"]>
  ): ReturnType<Epoxy["request"]> {
    const [remote, method, , headers, signal] = args;
    const response = await fetch(this.httpRelay!, {
      method: "POST",
      credentials: "omit",
      cache: "no-store",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: remote.href,
        method: method.toUpperCase(),
        headers,
      }),
    });
    if (!response.ok)
      throw new Error(
        `HTTP relay could not reach ${remote.hostname} (${response.status}).`,
      );
    const metadata = JSON.parse(
      decodeURIComponent(response.headers.get("X-Satona-Metadata") || ""),
    );
    return {
      ...metadata,
      body:
        method.toUpperCase() === "HEAD" ||
        [204, 205, 304].includes(metadata.status)
          ? null
          : response.body,
    };
  }

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
    if (this.engine === "libcurl") {
      const { default: Libcurl } = await import(
        "@mercuryworkshop/libcurl-transport"
      );
      this.alternate ||= new Libcurl({ wisp: this.wisp });
      await this.alternate.init();
      this.ready = this.alternate.ready;
    } else {
      await super.init();
    }
    this.generation++;
  }

  override async request(
    ...args: Parameters<Epoxy["request"]>
  ): ReturnType<Epoxy["request"]> {
    const [remote, method, body, , signal] = args;
    const safeToRetry =
      ["GET", "HEAD"].includes(method.toUpperCase()) &&
      body == null &&
      !signal?.aborted;
    if (this.httpRelay && safeToRetry && this.httpOrigins.has(remote.origin))
      return this.requestHttp(...args);
    if (this.recovery) await this.recovery;
    const failedClient = this.generation;
    try {
      return await this.requestPrimary(...args);
    } catch (error) {
      const disconnected = /MuxTaskEnded|Multiplexor task ended/.test(
        String(error),
      );
      const handshakeEnded =
        /tls handshake eof|SSL connect error|curl.*(?:error|code)\D*35\b/i.test(
          String(error),
        );
      // Never replay submissions or a consumed request body.
      if (
        (!disconnected && !handshakeEnded) ||
        !safeToRetry ||
        signal?.aborted
      ) {
        throw error;
      }
      // Workers cap each WebSocket at six TCP streams. A fresh multiplexer
      // also releases a failing pooled connection after TLS EOF.
      if (
        (disconnected || handshakeEnded) &&
        this.generation === failedClient &&
        !this.recovery
      ) {
        this.recovery = this.init().finally(() => {
          this.recovery = null;
        });
      }
      if (this.recovery) await this.recovery;
      signal?.throwIfAborted();
      try {
        return await this.requestPrimary(...args);
      } catch (retryError) {
        if (
          !this.httpRelay ||
          signal?.aborted ||
          !/tls handshake eof|MuxTaskEnded|Multiplexor task ended|SSL connect error|curl.*(?:error|code)\D*35\b/i.test(
            String(retryError),
          )
        )
          throw retryError;
        const response = await this.requestHttp(...args);
        // Remember working HTTP routes for this session, with bounded storage.
        if (this.httpOrigins.size >= 128)
          this.httpOrigins.delete(this.httpOrigins.values().next().value!);
        this.httpOrigins.add(remote.origin);
        return response;
      }
    }
  }
}
