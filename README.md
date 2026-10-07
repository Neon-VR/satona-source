# Satona

Satona is a React/Vite browser workspace. The Study Guides entrance is unchanged.
After signing in, choose Legacy UI or WebOS. WebOS has a galaxy desktop, movable
and resizable windows, minimize/maximize/restore, a Start menu, a taskbar, and an
app store. Installed apps and virtual files are saved on the current device.
The screen lock is decorative and does not protect access with a password.

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
- YouTube uses Data API metadata for discovery (`VITE_YOUTUBE_API_KEY`) and a
  lightweight player through Scramjet, without a direct youtube-nocookie iframe.
  Pasted video links do not require a Data API key. Playback remains dependent on
  the selected Wisp relay and YouTube compatibility.
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
YouTube assets use the built-in Worker's native HTTPS route immediately to avoid
TCP socket exhaustion. Its allowlisted player/search reads and Googlevideo SABR
POSTs preserve their binary bodies (up to 1 MiB) and are sent once, never retried.
Account mutations are excluded. Proxy frames cannot navigate the top-level app.
The checked-in `public/scramjet/scramjet.js` contains a history API compatibility
fix: a null/omitted pushState/replaceState URL must remain absent rather than be
rewritten to a `/null` destination (which can cause TikTok 404s). Preserve this
patch when updating vendored Scramjet assets, or upgrade to an upstream fix.

### Threaded games

Global COOP/COEP headers were rolled back because they blocked embedded pages.
The Bunny **Disabled threaded games** rule matches no requests (`NONE` of URL `*`).
Vite also leaves these headers unset. Do not re-enable global isolation without
testing every embedding flow. Games requiring SharedArrayBuffer are unsupported
in this mode. `thread-check.html` is an optional diagnostic, not an app feature.

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
404 document is currently `/dist/index-webos-20261007.html`, a versioned copy of the
production index. When deploying the next release, upload its hashed assets
first, then a new versioned HTML entry, update that custom document path, and
purge SATONA-STUDY. Verify the bundle URL on the public root; replacing
`index.html` alone can leave Bunny's custom fallback document stale.

For optional npm asset distribution, run
`node scripts/prepare-cdn.mjs <npm-package-name> <version>` after building.
Review `npm pack --dry-run` in `cdn-package/`, then publish with npm authentication
and 2FA. UNPKG and jsDelivr serve the published files; the full site still requires
an HTTPS host for the same-origin service worker.
