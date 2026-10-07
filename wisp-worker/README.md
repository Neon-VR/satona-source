# Satona free Wisp Worker

The browser's default relay is the Worker `satona-wisp-browser-20261005`, deployed with `wrangler deploy` from this directory. Live endpoint: `wss://satona-wisp-browser-20261005.satona.workers.dev/wisp/`. Older relays remain unchanged.

Supports Wisp v1 TCP streams used by both Epoxy and libcurl transports. Connect to `wss://<deployment-host>/wisp/`. TLS certificate validation stays in the client. `/healthz` reports capabilities.

Free Worker limitations: six simultaneous outbound TCP streams per WebSocket, HTTP/HTTPS ports only, no UDP, and Cloudflare blocks raw TCP connections to Cloudflare IPs and private networks. The `/fetch` endpoint provides a streaming HTTP fallback for GET/HEAD requests that fail their TLS connection twice. It preserves redirects and cookies, verifies TLS through Cloudflare's fetch API, and limits browser callers to `ALLOWED_ORIGINS`. The browser never automatically replays submissions. WebSockets, form submissions, anti-bot checks, and media may still need a full Wisp server. Free-plan quotas also apply.

`ALLOWED_ORIGINS` limits browser callers to the deployed Satona site and local development. It is not authentication; non-browser clients can supply their own Origin header.

The browser also sends YouTube resource GETs directly through `/fetch`. Native
HTTPS handles up to 1 MiB of binary POST data for Googlevideo `/videoplayback`
and a fixed set of YouTube read APIs (`player`, `next`, `browse`, `search`,
`updated_metadata`, `guide`, `att/get`). These are original requests, not POST retries.
Account mutation endpoints, lookalike domains, and all other POSTs are rejected.

Run `npm test` for protocol checks. Then `wrangler deploy --dry-run` and `wrangler deploy`. Test the returned endpoint with both transports before configuring `VITE_WISP_URL` and republishing the frontend.

Verification on 2026-10-05: the live `/healthz` returned Wisp v1 TCP capabilities. Epoxy 3.0.1 and libcurl-transport 2.0.5 both received HTTP 200 from `https://www.google.com/`. Both failed the TLS connection to `https://anigato.lol/` through the free Worker. The `transport-check.html` page can repeat these checks through the root Vite dev server at `http://127.0.0.1:5173/wisp-worker/transport-check.html`.
