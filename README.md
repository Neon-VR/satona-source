# Satona

Satona is a React/Vite browser workspace. The Study Guides entrance is unchanged.
After signing in, choose Legacy UI to launch the redesigned workspace. WebOS is
marked Coming soon and is disabled.

## Development

Run `pnpm install` and `pnpm dev`. Build with `pnpm build`.
The default Wisp endpoint is
`wss://satona-wisp-browser-20261005.satona.workers.dev/wisp/`.
Override it with `VITE_WISP_URL` or the Wisp setting in the app, then reload.
A local Node relay can use `ws://127.0.0.1:4000/`.

## Features

- Persistent browser frames, real reload, closeable tabs, saved links, and recent destinations.
- Classroom, Docs, Forms, Google Groups/forums, Gmail, YouTube, and custom tab titles/icons.
- Mint, lavender, sky, peach, and rose accents; reduced motion; a local scratchpad.
- LuminSDK and GN-Math catalogs, an All selector, search, favorites, random games, and fullscreen.
- GeForce NOW, RaccoonGame, and nowgg.fun launch through Scramjet from Cloud gaming.
- The watch room uses YouTube Data API metadata and youtube-nocookie.com playback.
  `VITE_YOUTUBE_API_KEY` enables discovery/search. Pasted video URLs and IDs work
  without a Data API key. Playback still depends on YouTube access and video restrictions.
- Chat filters targeted slurs in outgoing names/messages and incoming displayed content,
  while permitting ordinary profanity. See `CHAT_SETUP.md` and `CHAT_SETUP.sql`.
  Apply `CHAT_MODERATION.sql` in Supabase to enforce the filter at the database too;
  a browser-only filter does not prevent direct API submissions.

Preferences, bookmarks, notes, and history are stored on the current device.

## Relay and browser compatibility

The free [Cloudflare Worker](wisp-worker/README.md) permits six outbound TCP
streams per WebSocket and cannot connect to Cloudflare IP ranges. It does not
support UDP. TikTok and cloud gaming may load their interface but fail on some
media or streaming requests; changing a frontend cannot remove these limits.
Use a compatible Wisp relay in Settings for broader reachability.

Settings → Browsing → Proxy transport lets users select Epoxy or libcurl, then
apply and reload. Epoxy remains the default. The browser uses Scramjet production
defaults and recreates failed transport clients before retrying a bodyless GET/HEAD
once. Persistent TLS-connect failures on the bundled Worker use its streaming
HTTP fallback, enabling page reads from Cloudflare-hosted sites such as better16.xyz.
It never automatically replays submissions; WebSockets and form submissions still
require a reachable raw TCP destination or a compatible custom Wisp relay.
The checked-in `public/scramjet/scramjet.js` contains a history API compatibility
fix: a null/omitted pushState/replaceState URL must remain absent rather than be
rewritten to a `/null` destination (which can cause TikTok 404s). Preserve this
patch when updating vendored Scramjet assets, or upgrade to an upstream fix.

### Threaded games

The HTTPS host must return `Cross-Origin-Opener-Policy: same-origin` and
`Cross-Origin-Embedder-Policy: credentialless` on the top-level Satona document.
The SATONA-STUDY Bunny zone applies these through the **Enable threaded games**
edge rule for all request URLs. Vite development and preview use the same headers.
Scramjet detects the isolated parent and supplies the required isolation headers
on proxied documents and worker scripts, enabling SharedArrayBuffer and WASM
threads. Adding these headers only to Wisp responses cannot isolate the parent.
After changing the CDN rule, purge its cache and fully reload Satona before
opening a new game frame. External games embedded directly must also support
COEP; games opened through Scramjet receive its rewritten response headers.

## Checks

```
node --test --test-isolation=none scripts/features.test.mjs scripts/transport.test.mjs wisp-worker/test/*.test.js
pnpm build
```

`wisp-worker/browser-check.html` is a local Vite diagnostic for Google,
DuckDuckGo, and TikTok transport responses. It is not copied to production.

## Publishing

Push the source to `Neon-VR/satona-source` for the site's configured deployment
integration. Verify the deployed site at `https://satona-study.b-cdn.net/` after
its build finishes. A source push alone is not proof that the CDN has updated.

Bunny storage uses the `satona-site/dist` directory. The storage zone's custom
404 document is currently `/dist/index-1bf6c01.html`, a versioned copy of the
production index. When deploying the next release, upload its hashed assets
first, then a new versioned HTML entry, update that custom document path, and
purge SATONA-STUDY. Verify the bundle URL on the public root; replacing
`index.html` alone can leave Bunny's custom fallback document stale.

For optional npm asset distribution, run
`node scripts/prepare-cdn.mjs <npm-package-name> <version>` after building.
Review `npm pack --dry-run` in `cdn-package/`, then publish with npm authentication
and 2FA. UNPKG and jsDelivr serve the published files; the full site still requires
an HTTPS host for the same-origin service worker.
