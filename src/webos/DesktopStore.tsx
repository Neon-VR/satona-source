import { useState } from "react";
import Icon from "../components/Icon";
import { desktopApps } from "./registry";
export default function DesktopStore({
  installed,
  install,
  uninstall,
  open,
}: {
  installed: string[];
  install: (id: string) => void;
  uninstall: (id: string) => void;
  open: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  return (
    <div className="os-store os-padded">
      <span className="os-eyebrow">THE SATONA COLLECTION</span>
      <h1>More room for possibility.</h1>
      <p>Little apps. Big adventures. Make this space your own.</p>
      <div className="os-store-feature">
        <div>
          <span>MADE FOR YOUR DOWNTIME</span>
          <h2>
            A whole arcade.
            <br />
            One little icon.
          </h2>
          <button onClick={() => open("games")}>Explore Arcade ↗</button>
        </div>
        <Icon name="games" size={110} />
      </div>
      <div className="os-store-tools">
        <input
          aria-label="Search apps"
          placeholder="Find your next favorite…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="App category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {["All", "Essentials", "Play", "Create", "Explore", "Connect"].map(
            (c) => (
              <option key={c}>{c}</option>
            ),
          )}
        </select>
      </div>
      <div className="os-store-grid">
        {desktopApps
          .filter(
            (a) =>
              (category === "All" || a.category === category) &&
              `${a.name} ${a.description}`
                .toLowerCase()
                .includes(query.toLowerCase()),
          )
          .map((app) => (
            <article key={app.id}>
              <div className="os-app-icon" style={{ color: app.color }}>
                <Icon name={app.icon} size={27} />
              </div>
              <div>
                <h3>{app.name}</h3>
                <p>{app.description}</p>
                <small>
                  {app.url
                    ? "Web shortcut"
                    : app.builtin
                      ? "Included with WebOS"
                      : "Desktop app"}
                </small>
              </div>
              <div className="os-store-actions">
                <button
                  onClick={() =>
                    installed.includes(app.id) ? open(app.id) : install(app.id)
                  }
                >
                  {installed.includes(app.id) ? "Open" : "Install"}
                </button>
                {installed.includes(app.id) && !app.builtin && (
                  <button
                    className="os-text-button"
                    onClick={() => uninstall(app.id)}
                  >
                    Uninstall
                  </button>
                )}
              </div>
            </article>
          ))}
      </div>
    </div>
  );
}
