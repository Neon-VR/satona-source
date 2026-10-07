import { useEffect, useState } from "react";
import Icon from "./Icon";
import type { Section } from "./Sidebar";
import { readPreference } from "../lib/preferences";
const shortcuts: {
  id: Section;
  label: string;
  icon: string;
  detail: string;
}[] = [
  {
    id: "games",
    label: "Satona Steam",
    icon: "steam",
    detail: "Find your next favorite",
  },
  {
    id: "cloud",
    label: "Cloud gaming",
    icon: "cloud",
    detail: "Big games. Any device.",
  },
  {
    id: "youtube",
    label: "Watch something",
    icon: "youtube",
    detail: "A little inspiration",
  },
  {
    id: "chat",
    label: "The lounge",
    icon: "chat",
    detail: "Your people are here",
  },
];
export default function HomePage({
  onSection,
  onSearch,
}: {
  onSection: (section: Section) => void;
  onSearch: (value: string) => void;
}) {
  const [now, setNow] = useState(new Date());
  const [note, setNote] = useState(() => readPreference("satona.note", ""));
  const [status, setStatus] = useState("");
  const recent = readPreference<string[]>("satona.history", []).slice(0, 4);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <main className="dashboard">
      <div className="dashboard-topline">
        <span>
          <i /> YOUR SPACE, REIMAGINED
        </span>
        <span>
          {now.toLocaleDateString([], {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}{" "}
          <b>
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </b>
        </span>
      </div>
      <section className="dashboard-hero">
        <div className="hero-orbit" aria-hidden="true">
          <i />
          <i />
          <i />
          <img src="/satona-emblem.png" alt="" />
        </div>
        <span className="section-kicker">WELCOME TO SATONA</span>
        <h1>
          A little escape.
          <br />
          <em>A lot to explore.</em>
        </h1>
        <p>All your corners of the internet, in one place.</p>
        <form
          className="home-search"
          onSubmit={(event) => {
            event.preventDefault();
            const value = new FormData(event.currentTarget).get("query");
            if (typeof value === "string") onSearch(value);
          }}
        >
          <Icon name="search" />
          <input
            name="query"
            aria-label="Search the web"
            placeholder="Where do you want to go?"
            autoComplete="off"
          />
          <kbd>Ctrl L</kbd>
          <button aria-label="Search the web" type="submit">
            ↗
          </button>
        </form>
        <div className="hero-links">
          <button onClick={() => onSearch("https://www.tiktok.com/")}>
            TikTok ↗
          </button>
          <button onClick={() => onSearch("https://discord.com/app")}>
            Discord ↗
          </button>
          <button onClick={() => onSection("apps")}>All apps ↗</button>
        </div>
      </section>
      <div className="dashboard-heading">
        <h2>Pick your next adventure</h2>
        <span>GOOD TIMES START HERE</span>
      </div>
      <div className="adventure-grid">
        {shortcuts.map((item, index) => (
          <button
            className={`adventure-card adventure-${index}`}
            key={item.id}
            onClick={() => onSection(item.id)}
          >
            <span className="adventure-icon">
              <Icon name={item.icon} size={26} />
            </span>
            <span className="adventure-arrow">↗</span>
            <h3>{item.label}</h3>
            <p>{item.detail}</p>
          </button>
        ))}
      </div>
      <div className="dashboard-bottom">
        <section className="recent-panel">
          <div className="dashboard-heading">
            <h2>Pick up where you left off</h2>
            <button onClick={() => onSection("saved")}>Saved links ↗</button>
          </div>
          {recent.length ? (
            recent.map((url) => (
              <button
                className="recent-link"
                key={url}
                onClick={() => onSearch(url)}
              >
                <Icon name="external" size={16} />
                <span>{url.replace(/^https?:\/\//, "")}</span>
                <span>↗</span>
              </button>
            ))
          ) : (
            <p className="subtle-note">
              Your recent destinations will appear here. Go explore.
            </p>
          )}
        </section>
        <section className="note-panel">
          <span className="section-kicker">A LITTLE HEADSPACE</span>
          <h2>
            Scratchpad <span>✎</span>
          </h2>
          <textarea
            aria-label="Personal scratchpad"
            placeholder="A thought, a link, a reminder…"
            value={note}
            maxLength={3000}
            onChange={(event) => {
              setNote(event.target.value);
              try {
                localStorage.setItem(
                  "satona.note",
                  JSON.stringify(event.target.value),
                );
                setStatus("Saved on this device");
              } catch {
                setStatus("Storage is full");
              }
            }}
          />
          <small>{status || "Just for you. Saved on this device."}</small>
        </section>
      </div>
    </main>
  );
}
