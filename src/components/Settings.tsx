import { ChangeEvent } from "react";
import { UploadIcon } from "./Icons";
import type { SearchEngine } from "../lib/search";

type Props = {
  wallpaper: string;
  setWallpaper: (value: string) => void;
  searchEngine: SearchEngine;
  setSearchEngine: (value: SearchEngine) => void;
};

const engines = [
  ["google", "Google"],
  ["duckduckgo", "DuckDuckGo"],
  ["bing", "Bing"],
  ["yahoo", "Yahoo"],
  ["brave", "Brave Search"],
] as const;

const defaults = [
  "radial-gradient(circle at 20% 20%, rgba(120,90,255,.22), transparent 35%), radial-gradient(circle at 80% 70%, rgba(40,180,255,.14), transparent 35%), #08090d",
  "radial-gradient(circle at 50% 50%, rgba(90,70,190,.22), transparent 22%), radial-gradient(circle at 15% 80%, rgba(20,120,255,.12), transparent 35%), #07080c",
  "radial-gradient(circle at 80% 10%, rgba(150,70,255,.16), transparent 30%), radial-gradient(circle at 10% 90%, rgba(0,190,180,.1), transparent 35%), #08090d",
];

export default function Settings({
  wallpaper,
  setWallpaper,
  searchEngine,
  setSearchEngine,
}: Props) {
  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setWallpaper(reader.result);
      }
    };

    reader.readAsDataURL(file);
  }

  return (
    <section className="satona-section satona-settings-page">
      <div className="satona-section-heading">
        <div>
          <span className="satona-kicker">PREFERENCES</span>
          <h1>Settings</h1>
          <p>Customize the Satona browser experience.</p>
        </div>
      </div>

      <div className="satona-settings-grid">
        <section className="satona-setting-card">
          <div className="satona-setting-heading">
            <div>
              <span className="satona-kicker">APPEARANCE</span>
              <h2>Wallpaper</h2>
            </div>
          </div>

          <div
            className="satona-wallpaper-preview"
            style={
              wallpaper
                ? { backgroundImage: `url("${wallpaper}")` }
                : undefined
            }
          />

          <div className="satona-default-wallpapers">
            {defaults.map((background, index) => (
              <button
                key={index}
                style={{ background }}
                onClick={() => setWallpaper(background)}
                title={`Default ${index + 1}`}
              />
            ))}
          </div>

          <label className="satona-upload">
            <UploadIcon />
            Upload image or GIF
            <input
              type="file"
              accept="image/*,.gif"
              onChange={upload}
            />
          </label>

          <button
            className="satona-danger-button"
            onClick={() => setWallpaper("")}
          >
            Reset to default
          </button>

          <p className="satona-setting-note">
            Images and animated GIFs are stored locally in your browser.
          </p>
        </section>

        <section className="satona-setting-card">
          <div>
            <span className="satona-kicker">SEARCH</span>
            <h2>Default search engine</h2>
            <p>Used whenever your address bar input is not a URL.</p>
          </div>

          <div className="satona-engine-list">
            {engines.map(([value, label]) => (
              <label
                key={value}
                className={`satona-engine-option ${
                  searchEngine === value ? "active" : ""
                }`}
              >
                <input
                  type="radio"
                  name="search-engine"
                  checked={searchEngine === value}
                  onChange={() =>
                    setSearchEngine(value as SearchEngine)
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
