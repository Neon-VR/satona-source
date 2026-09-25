import { useRef, useState } from "react";

const engines = [
  {
    id: "google",
    name: "Google",
    url: "https://www.google.com/search?q=",
  },
  {
    id: "duckduckgo",
    name: "DuckDuckGo",
    url: "https://duckduckgo.com/?q=",
  },
  {
    id: "bing",
    name: "Bing",
    url: "https://www.bing.com/search?q=",
  },
  {
    id: "yahoo",
    name: "Yahoo",
    url: "https://search.yahoo.com/search?p=",
  },
  {
    id: "brave",
    name: "Brave Search",
    url: "https://search.brave.com/search?q=",
  },
];

export default function Settings() {
  const [engine, setEngine] = useState(
    () => localStorage.getItem("satona.searchEngine") || "google"
  );

  const [wallpaper, setWallpaper] = useState(
    () => localStorage.getItem("satona.customWallpaper") || ""
  );

  const fileInput = useRef<HTMLInputElement>(null);

  function chooseEngine(value: string) {
    setEngine(value);
    localStorage.setItem("satona.searchEngine", value);
    window.dispatchEvent(new Event("satona-settings-change"));
  }

  function uploadWallpaper(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();

    reader.onload = () => {
      const value = String(reader.result || "");

      localStorage.setItem(
        "satona.customWallpaper",
        value
      );

      setWallpaper(value);

      window.dispatchEvent(
        new Event("satona-wallpaper-change")
      );
    };

    reader.readAsDataURL(file);
  }

  function resetWallpaper() {
    localStorage.removeItem("satona.customWallpaper");
    setWallpaper("");

    window.dispatchEvent(
      new Event("satona-wallpaper-change")
    );
  }

  return (
    <section className="section-page settings-page">
      <div className="section-heading">
        <div>
          <span className="section-kicker">PREFERENCES</span>
          <h1>Settings</h1>
          <p>Customize your Satona experience.</p>
        </div>
      </div>

      <div className="settings-grid">
        <section className="settings-card">
          <div>
            <span className="settings-label">
              APPEARANCE
            </span>
            <h2>Wallpaper</h2>
            <p>
              Upload an image or animated GIF. It will persist
              across sessions.
            </p>
          </div>

          <div className="wallpaper-preview">
            {wallpaper ? (
              <img src={wallpaper} alt="" />
            ) : (
              <div className="wallpaper-preview-default">
                Animated Galaxy
              </div>
            )}
          </div>

          <div className="settings-actions">
            <button
              onClick={() => fileInput.current?.click()}
            >
              Choose Wallpaper
            </button>

            <button onClick={resetWallpaper}>
              Reset to Default
            </button>

            <input
              ref={fileInput}
              type="file"
              accept="image/*,.gif"
              hidden
              onChange={(event) =>
                uploadWallpaper(event.target.files?.[0])
              }
            />
          </div>
        </section>

        <section className="settings-card">
          <div>
            <span className="settings-label">
              BROWSING
            </span>
            <h2>Default Search Engine</h2>
            <p>
              Searches are submitted through Satona.
            </p>
          </div>

          <div className="engine-list">
            {engines.map((item) => (
              <label className="engine-option" key={item.id}>
                <input
                  type="radio"
                  name="search-engine"
                  checked={engine === item.id}
                  onChange={() => chooseEngine(item.id)}
                />
                <span>{item.name}</span>
              </label>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
