import { connect } from "cloudflare:sockets";
import { serveWisp } from "./wisp.js";
import { relayHttp } from "./http-relay.js";
import { accountSync } from "./account-sync.js";
import { gamePage } from "./game-page.js";
import { accountAuth } from "./account-auth.js";

export default {
  fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === "/game") return gamePage(request, env);
    if (path === "/account/sync") return accountSync(request, env);
    if (path.startsWith("/account/")) return accountAuth(request, env);
    if (path === "/fetch") return relayHttp(request, env);
    if (path === "/healthz") {
      return Response.json({ service: "satona-wisp-browser-20261005", protocol: "Wisp v1 TCP", transports: ["epoxy", "libcurl"], udp: false, maxStreams: 6 });
    }
    if (path !== "/" && path !== "/wisp/") return new Response("Not found", { status: 404 });
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Satona Wisp TCP relay. Connect via WebSocket at /wisp/.", { status: 426 });
    }
    const origin = request.headers.get("Origin");
    const allowed = env.ALLOWED_ORIGINS.split(",");
    if (origin && !allowed.includes(origin)) return new Response("Origin not allowed", { status: 403 });
    const [client, server] = Object.values(new WebSocketPair());
    server.binaryType = "arraybuffer";
    server.accept();
    serveWisp(server, connect);
    return new Response(null, { status: 101, webSocket: client });
  },
};
