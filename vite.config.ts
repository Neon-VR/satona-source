import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Threaded games need the top-level app and its proxied frames to be isolated.
// Mirror these headers on the production CDN (see README).
const isolationHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "credentialless",
};

export default defineConfig({
  plugins: [react()],
  server: { headers: isolationHeaders },
  preview: { headers: isolationHeaders },

  optimizeDeps: {
    noDiscovery: true,

    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",

      "@mercuryworkshop/scramjet",
      "@mercuryworkshop/scramjet-controller",
      "@mercuryworkshop/epoxy-transport",
    ],
  },
});
