import http from "node:http";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";

const port = Number(process.env.PORT || 4000);

// Keep this server usable for normal web browsing, while rejecting requests
// into the host's private network and limiting resource use per connection.
wisp.options.allow_private_ips = false;
wisp.options.allow_loopback_ips = false;
wisp.options.stream_limit_per_host = 6;
wisp.options.stream_limit_total = 32;

const server = http.createServer((request, response) => {
  if (request.url === "/healthz") {
    response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    response.end("ok");
    return;
  }

  response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  response.end("Satona Wisp server. Connect using a WebSocket client.");
});

server.on("upgrade", (request, socket, head) => {
  if (request.url !== "/" && request.url !== "/wisp/") {
    socket.write("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }

  wisp.routeRequest(request, socket, head);
});

server.on("error", (error) => {
  console.error("Wisp server error:", error);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Satona Wisp server listening on 0.0.0.0:${port}`);
});
