import { useState } from "react";
import { readPreference, savePreference } from "../lib/preferences";
export default function SavedLinks({
  onOpen,
}: {
  onOpen: (url: string) => void;
}) {
  const [links, setLinks] = useState(() =>
    readPreference<string[]>("satona.bookmarks", []),
  );
  return (
    <section className="section-page">
      <div className="section-heading">
        <div>
          <span className="section-kicker">KEEP THE GOOD STUFF</span>
          <h1>
            Saved links<span className="title-dot">.</span>
          </h1>
          <p>Hit the bookmark button while browsing to save a destination.</p>
        </div>
      </div>
      {links.length ? (
        links.map((url) => (
          <div className="saved-link-row" key={url}>
            <button onClick={() => onOpen(url)}>{url} ↗</button>
            <button
              aria-label={`Remove ${url}`}
              onClick={() => {
                const next = links.filter((link) => link !== url);
                setLinks(next);
                savePreference("satona.bookmarks", next);
              }}
            >
              ×
            </button>
          </div>
        ))
      ) : (
        <div className="empty-library">
          <h2>A place for your favorites</h2>
          <p>Your saved sites will appear here.</p>
        </div>
      )}
    </section>
  );
}
