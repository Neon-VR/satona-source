# Satona

Satona is a React and Vite web app. Its Books library loads game HTML, covers, names, and supporting assets from the GN-Math GitHub repositories at runtime.

## Local development

Install dependencies with `pnpm install`, then run `pnpm dev`. Use `pnpm build` to create the production site in `dist/`.

The browser uses the Wisp endpoint configured by `VITE_WISP_URL`; when unset, it uses the local development endpoint on localhost and `wss://anura.pro/` elsewhere.

The shared chat backend setup is documented in [CHAT_SETUP.md](CHAT_SETUP.md), with its schema in [CHAT_SETUP.sql](CHAT_SETUP.sql).
