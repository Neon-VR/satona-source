import ProxiedApp from "./ProxiedApp";

export const EMBEDDED_APPS = {
  spotify: {
    id: "spotify",
    label: "Spotify",
    icon: "spotify",
    url: "https://open.spotify.com/",
  },
  netflix: {
    id: "netflix",
    label: "Netflix",
    icon: "netflix",
    url: "https://www.netflix.com/",
  },
  discord: {
    id: "discord",
    label: "Discord",
    icon: "discord",
    url: "https://discord.com/app",
  },
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    icon: "tiktok",
    url: "https://www.tiktok.com/",
  },
  youtube: {
    id: "youtube",
    label: "YouTube",
    icon: "youtube",
    url: "https://www.youtube.com/",
  },
  twitch: {
    id: "twitch",
    label: "Twitch",
    icon: "twitch",
    url: "https://www.twitch.tv/",
  },
  reddit: {
    id: "reddit",
    label: "Reddit",
    icon: "reddit",
    url: "https://www.reddit.com/",
  },
  docs: {
    id: "docs",
    label: "Google Docs",
    icon: "docs",
    url: "https://docs.google.com/",
  },
  roblox: {
    id: "roblox",
    label: "Roblox",
    icon: "roblox",
    url: "https://35.ip.nowgg.fun/apps/a/19900/b.html",
  },
  wikipedia: {
    id: "wikipedia",
    label: "Wikipedia",
    icon: "globe",
    url: "https://www.wikipedia.org/",
  },
  github: {
    id: "github",
    label: "GitHub",
    icon: "globe",
    url: "https://github.com/",
  },
} as const;

export type EmbeddedAppId = keyof typeof EMBEDDED_APPS;

export function EmbeddedApp({
  appId,
}: {
  appId: EmbeddedAppId;
}) {
  const app = EMBEDDED_APPS[appId];

  return <ProxiedApp url={app.url} title={app.label} />;
}
