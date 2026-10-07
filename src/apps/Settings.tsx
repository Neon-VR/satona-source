import { useState } from "react";
import {
  presetIcon,
  readPreference,
  savePreference,
  tabPresets,
} from "../lib/preferences";
export default function Settings() {
  const [identity, setIdentity] = useState(() =>
    readPreference("satona.identity", {
      title: "Satona",
      icon: "/satona-emblem.png",
    }),
  );
  const [accent, setAccent] = useState(() =>
    readPreference("satona.galaxy-accent", "#c4a1ff"),
  );
  const [motion, setMotion] = useState(() =>
    readPreference("satona.motion", true),
  );
  const [engine, setEngine] = useState(
    () => localStorage.getItem("satona.searchEngine") || "google",
  );
  const [relay, setRelay] = useState(
    () => localStorage.getItem("satona.wisp") || "",
  );
  const [transport, setTransport] = useState(() =>
    localStorage.getItem("satona.transport") === "libcurl"
      ? "libcurl"
      : "epoxy",
  );
  const [status, setStatus] = useState("");
  function saveTab(value = identity) {
    if (!value.title.trim()) {
      setStatus("Enter a tab title first.");
      return;
    }
    if (
      value.icon &&
      !/^(https:\/\/|\/[^/]|data:image\/(png|jpeg|webp|gif|x-icon);base64,)/i.test(
        value.icon,
      )
    ) {
      setStatus("Choose an image or use an HTTPS favicon URL.");
      return;
    }
    try {
      savePreference("satona.identity", value);
      setIdentity(value);
      setStatus("Tab appearance saved.");
    } catch {
      setStatus("Could not save. Try a smaller image.");
    }
  }
  return (
    <section className="section-page settings-page">
      <div className="section-heading">
        <div>
          <span className="section-kicker">MAKE YOURSELF AT HOME</span>
          <h1>
            Your Satona<span className="title-dot">.</span>
          </h1>
          <p>Little details. A space that feels like you.</p>
        </div>
      </div>
      <p className="status-message" role="status">
        {status}
      </p>
      <div className="settings-grid">
        <section className="settings-card">
          <span className="settings-label">TAB APPEARANCE</span>
          <h2>A different first impression</h2>
          <p>
            Change the real browser tab title and favicon. Your preset stays
            saved on this device.
          </p>
          <div className="preset-grid">
            {tabPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() =>
                  saveTab({ title: preset.title, icon: presetIcon(preset) })
                }
              >
                <img src={presetIcon(preset)} alt="" />
                {preset.label}
              </button>
            ))}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              saveTab();
            }}
          >
            <label className="settings-field">
              Custom tab title
              <input
                maxLength={100}
                value={identity.title}
                onChange={(event) =>
                  setIdentity({ ...identity, title: event.target.value })
                }
              />
            </label>
            <label className="settings-field">
              Favicon image URL
              <input
                value={identity.icon}
                onChange={(event) =>
                  setIdentity({ ...identity, icon: event.target.value })
                }
                placeholder="https://…"
              />
            </label>
            <label className="settings-field">
              Or upload an icon
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > 200000) {
                    setStatus("Choose an icon smaller than 200 KB.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () =>
                    setIdentity({ ...identity, icon: String(reader.result) });
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            <button className="primary-button" type="submit">
              Save tab appearance
            </button>
          </form>
        </section>
        <section className="settings-card">
          <span className="settings-label">LOOK & FEEL</span>
          <h2>Find your color</h2>
          <p>Choose an accent for the whole workspace.</p>
          <div className="accent-options">
            {["#c4a1ff", "#b7b0ff", "#a5d9ff", "#ffc79a", "#f6aed1"].map(
              (color, index) => (
                <button
                  key={color}
                  aria-label={
                    ["Galaxy purple", "Lavender", "Sky", "Peach", "Rose"][index]
                  }
                  aria-pressed={accent === color}
                  style={{ background: color }}
                  onClick={() => {
                    setAccent(color);
                    savePreference("satona.galaxy-accent", color);
                  }}
                />
              ),
            )}
          </div>
          <label className="settings-field">
            <span>
              <input
                style={{ width: "auto" }}
                type="checkbox"
                checked={motion}
                onChange={(event) => {
                  setMotion(event.target.checked);
                  savePreference("satona.motion", event.target.checked);
                }}
              />{" "}
              Enable animations
            </span>
          </label>
          <hr />
          <h2>Your launch experience</h2>
          <p>Legacy UI is available now. WebOS is coming soon.</p>
          <button
            className="secondary-button"
            onClick={() => location.reload()}
          >
            Return to launcher
          </button>
        </section>
        <section className="settings-card">
          <span className="settings-label">BROWSING</span>
          <h2>Search your way</h2>
          <label className="settings-field">
            Default search engine
            <select
              value={engine}
              onChange={(event) => {
                setEngine(event.target.value);
                localStorage.setItem("satona.searchEngine", event.target.value);
                window.dispatchEvent(new Event("satona-settings-change"));
              }}
            >
              {[
                "google",
                "duckduckgo",
                "bing",
                "brave",
                "ecosia",
                "startpage",
              ].map((name) => (
                <option value={name} key={name}>
                  {name[0].toUpperCase() + name.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <p>
            The default free Cloudflare relay cannot reach every website. You
            can use your own Wisp server when a site is incompatible.
          </p>
          <label className="settings-field">
            Proxy transport
            <select
              value={transport}
              onChange={(event) => setTransport(event.target.value)}
            >
              <option value="epoxy">Epoxy</option>
              <option value="libcurl">libcurl</option>
            </select>
          </label>
          <p>
            Choose how Satona connects through your Wisp server. Applying this
            restarts Satona and closes its browsing tabs.
          </p>
          <button
            className="secondary-button"
            onClick={() => {
              localStorage.setItem("satona.transport", transport);
              location.reload();
            }}
          >
            Apply transport &amp; reload
          </button>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              try {
                if (relay && !["wss:", "ws:"].includes(new URL(relay).protocol))
                  throw new Error();
                if (location.protocol === "https:" && relay.startsWith("ws:"))
                  throw new Error();
                if (relay) localStorage.setItem("satona.wisp", relay);
                else localStorage.removeItem("satona.wisp");
                setStatus("Relay saved. Reload Satona to connect.");
              } catch {
                setStatus("Enter a valid secure wss:// relay URL.");
              }
            }}
          >
            <label className="settings-field">
              Custom Wisp endpoint
              <input
                value={relay}
                onChange={(event) => setRelay(event.target.value)}
                placeholder="Default Cloudflare relay"
              />
            </label>
            <button className="secondary-button">Save relay</button>
          </form>
        </section>
        <section className="settings-card">
          <span className="settings-label">YOUR SPACE</span>
          <h2>A fresh start</h2>
          <p>Clear recent browsing destinations saved on this device.</p>
          <button
            className="secondary-button"
            onClick={() => {
              localStorage.removeItem("satona.history");
              window.dispatchEvent(new Event("satona-history-clear"));
              setStatus("Recent browsing history cleared.");
            }}
          >
            Clear recent history
          </button>
          <h2>Keep in touch</h2>
          <div className="settings-actions">
            <a
              href="https://discord.gg/rVjU8genrK"
              target="_blank"
              rel="noreferrer"
            >
              Join Discord ↗
            </a>
            <a
              href="https://www.tiktok.com/@Civtac07"
              target="_blank"
              rel="noreferrer"
            >
              TikTok ↗
            </a>
          </div>
          <p>
            Chat blocks slurs in names and messages. Ordinary swear words are
            allowed.
          </p>
        </section>
      </div>
    </section>
  );
}
