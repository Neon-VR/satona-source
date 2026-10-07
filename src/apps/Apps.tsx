import { useState } from "react";

const apps = [
  { name: "NVIDIA GeForce NOW", url: "https://play.geforcenow.com/", domain: "nvidia.com" },
  { name: "nowgg.fun", url: "https://nowgg.fun/", domain: "nowgg.fun" },
  { name: "TikTok", url: "https://www.tiktok.com/", domain: "tiktok.com" },
  { name: "Instagram", url: "https://www.instagram.com/", domain: "instagram.com" },
  { name: "Reddit", url: "https://www.reddit.com/", domain: "reddit.com" },
  { name: "Pinterest", url: "https://www.pinterest.com/", domain: "pinterest.com" },
  { name: "Tumblr", url: "https://www.tumblr.com/", domain: "tumblr.com" },
  { name: "Twitch", url: "https://www.twitch.tv/", domain: "twitch.tv" },
  { name: "Spotify", url: "https://open.spotify.com/", domain: "spotify.com" },
  { name: "SoundCloud", url: "https://soundcloud.com/", domain: "soundcloud.com" },
  { name: "Discord", url: "https://discord.com/app", domain: "discord.com" },
  { name: "CrazyGames", url: "https://www.crazygames.com/", domain: "crazygames.com" },
  { name: "itch.io", url: "https://itch.io/", domain: "itch.io" },
];

export default function Apps({ onOpen }: { onOpen: (url: string) => void }) {
  const [failedIcons, setFailedIcons] = useState<string[]>([]);
  return (
    <section className="section-page apps-page">
      <div className="section-heading">
        <div>
          <span className="section-kicker">EXPLORE</span>
          <h1>Apps</h1>
          <p>Your favorite apps, one click away. Open any app in Satona.</p>
        </div>
      </div>
      <div className="apps-grid">
        {apps.map(app => (
          <button className="app-launcher" key={app.domain} onClick={() => onOpen(app.url)}>
            <span className="app-launcher-icon">
              {failedIcons.includes(app.domain) ? app.name.slice(0, 2) : (
                <img src={`https://www.google.com/s2/favicons?domain=${app.domain}&sz=128`} alt="" loading="lazy"
                  onError={() => setFailedIcons(current => [...current, app.domain])} />
              )}
            </span>
            <strong>{app.name}</strong>
            <span className="app-launcher-domain">{app.domain}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
