# Satona Wisp server

This runs the official MercuryWorkshop JavaScript Wisp server on Node.js. It
uses Node TCP sockets for outbound streams, matching the local Wisp server
behavior without relying on Cloudflare Workers' outbound socket implementation.

## Deploy to Render

1. Push this project, including the root `render.yaml` and this directory, to a
   GitHub repository.
2. In Render, create a **Blueprint** from that repository and select the free
   plan for `satona-wisp-server`.
3. After the deploy succeeds, the service's URL will be shown in Render, for
   example `https://satona-wisp-server.onrender.com`.
4. Set `VITE_WISP_URL` for the Satona site to the same hostname with `wss://`
   and a trailing slash, then rebuild/redeploy the site.

Render free web services support WebSockets but can sleep after inactivity. The
first connection after sleeping may take about a minute to wake the service.
