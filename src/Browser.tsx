import { useEffect, useRef, useState } from "react";
import type { Frame } from "@mercuryworkshop/scramjet-controller";
import Sidebar, { type Section } from "./components/Sidebar";
import AnimatedGalaxyBackground from "./components/AnimatedGalaxyBackground";
import BrowserChrome from "./components/BrowserChrome";
import HomePage from "./components/HomePage";
import ProxyTab from "./components/ProxyTab";
import Games from "./apps/Games";
import Apps from "./apps/Apps";
import Chat from "./apps/Chat";
import Settings from "./apps/Settings";
import YouTube from "./apps/YouTube";
import CloudGaming from "./apps/CloudGaming";
import SavedLinks from "./apps/SavedLinks";
import { createTarget } from "./proxy/scramjet";
import { readPreference, savePreference } from "./lib/preferences";
type Tab = { id: string; title: string; url: string; revision: number };
const newTabData = (): Tab => ({
  id: crypto.randomUUID(),
  title: "New Tab",
  url: "",
  revision: 0,
});
export default function Browser({
  embedded = false,
  initialUrl = "",
}: {
  embedded?: boolean;
  initialUrl?: string;
}) {
  const [section, setSection] = useState<Section>("home");
  const [tabs, setTabs] = useState<Tab[]>(() => [
    {
      ...newTabData(),
      url: initialUrl,
      title: initialUrl ? "Web app" : "New Tab",
    },
  ]);
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [address, setAddress] = useState("");
  const [bookmarks, setBookmarks] = useState(() =>
    readPreference<string[]>("satona.bookmarks", []),
  );
  const frames = useRef<Record<string, Frame | null>>({});
  const active = tabs.find((tab) => tab.id === activeTab) || tabs[0];
  useEffect(() => {
    setAddress(active.url);
  }, [active.url, activeTab]);
  useEffect(() => {
    const update = () => setBookmarks(readPreference("satona.bookmarks", []));
    window.addEventListener("satona-preferences", update);
    return () => window.removeEventListener("satona-preferences", update);
  }, []);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
        const input =
          document.querySelector<HTMLInputElement>(embedded ? ".os-focused .address-bar input" : ".address-bar input");
        if (!input) return;
        event.preventDefault();
        input?.focus();
        input?.select();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [embedded]);
  function navigate(value: string) {
    const url = createTarget(
      value,
      localStorage.getItem("satona.searchEngine") || "google",
    );
    if (!url) return;
    let title = "Page";
    try {
      title = new URL(url).hostname.replace(/^www\./, "");
    } catch {}
    setTabs((current) =>
      current.map((tab) =>
        tab.id === activeTab
          ? { ...tab, url, title, revision: tab.revision + 1 }
          : tab,
      ),
    );
    setSection("home");
    setAddress(url);
    try {
      const history = readPreference<string[]>("satona.history", []);
      savePreference(
        "satona.history",
        [url, ...history.filter((item) => item !== url)].slice(0, 100),
      );
    } catch {}
  }
  function openNewTab() {
    const next = newTabData();
    setTabs((current) => [...current, next]);
    setActiveTab(next.id);
    setSection("home");
  }
  function closeTab(id: string) {
    const next = tabs.filter((tab) => tab.id !== id);
    if (!next.length) next.push(newTabData());
    setTabs(next);
    if (activeTab === id) setActiveTab(next[next.length - 1].id);
    delete frames.current[id];
  }
  function bookmark() {
    if (!active.url) return;
    const next = bookmarks.includes(active.url)
      ? bookmarks.filter((url) => url !== active.url)
      : [...bookmarks, active.url];
    setBookmarks(next);
    savePreference("satona.bookmarks", next);
  }
  const sectionPage = () => {
    if (embedded && section === "home")
      return (
        <section className="os-browser-newtab">
          <span className="os-eyebrow">A LITTLE CURIOSITY GOES A LONG WAY</span>
          <h1>
            Where to next<span>?</span>
          </h1>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              navigate(address);
            }}
          >
            <input
              aria-label="Search the web"
              placeholder="Search the web or enter a URL"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
            <button aria-label="Search the web">↗</button>
          </form>
          <div className="os-browser-shortcuts">
            {[
              ["Wikipedia", "https://en.wikipedia.org/"],
              ["YouTube", "https://www.youtube.com/"],
              ["Reddit", "https://www.reddit.com/"],
            ].map(([label, url]) => (
              <button key={url} onClick={() => navigate(url)}>
                {label} ↗
              </button>
            ))}
          </div>
          {bookmarks.length > 0 && (
            <div className="os-browser-bookmarks">
              <h2>Saved for later</h2>
              {bookmarks.slice(0, 12).map((url) => (
                <button key={url} onClick={() => navigate(url)}>
                  {url.replace(/^https?:\/\//, "")}
                </button>
              ))}
            </div>
          )}
          <small>SATONA BROWSER · YOUR WINDOW TO THE WEB</small>
        </section>
      );
    if (section === "games") return <Games />;
    if (section === "apps") return <Apps onOpen={navigate} />;
    if (section === "cloud") return <CloudGaming onOpen={navigate} />;
    if (section === "saved") return <SavedLinks onOpen={navigate} />;
    if (section === "chat") return <Chat />;
    if (section === "settings") return <Settings />;
    if (section === "youtube") return <YouTube />;
    if (section === "home")
      return <HomePage onSection={setSection} onSearch={navigate} />;
    return (
      <section className="section-page proxy-section">
        <div className="proxy-section-content">
          <span className="section-kicker">SET THE MOOD</span>
          <h1>{section === "movies" ? "Movie night." : "Your soundtrack."}</h1>
          <p>
            {section === "movies"
              ? "Explore Anigato in Satona."
              : "Take Spotify for a spin."}
          </p>
          <button
            className="primary-button"
            onClick={() =>
              navigate(
                section === "movies"
                  ? "https://anigato.lol/"
                  : "https://open.spotify.com/",
              )
            }
          >
            Open {section === "movies" ? "Anigato" : "Spotify"} ↗
          </button>
        </div>
      </section>
    );
  };
  return (
    <div className={`satona-app ${embedded ? "webos-browser" : ""}`}>
      {!embedded && <AnimatedGalaxyBackground />}
      {!embedded && (
        <Sidebar
          section={section}
          onSection={(next) => {
            if (next === "home") {
              setTabs((current) =>
                current.map((tab) =>
                  tab.id === activeTab
                    ? { ...tab, url: "", title: "New Tab" }
                    : tab,
                ),
              );
            }
            setSection(next);
          }}
        />
      )}
      <div className="satona-browser-shell">
        <BrowserChrome
          tabs={tabs}
          activeTab={activeTab}
          address={address}
          onTab={(id) => {
            setActiveTab(id);
            setSection("home");
          }}
          onClose={closeTab}
          onNewTab={openNewTab}
          onAddress={setAddress}
          onNavigate={() => navigate(address)}
          onBack={() => frames.current[activeTab]?.back()}
          onForward={() => frames.current[activeTab]?.forward()}
          onReload={() =>
            setTabs((current) =>
              current.map((tab) =>
                tab.id === activeTab
                  ? { ...tab, revision: tab.revision + 1 }
                  : tab,
              ),
            )
          }
          onHome={() => {
            setTabs((current) =>
              current.map((tab) =>
                tab.id === activeTab
                  ? { ...tab, url: "", title: "New Tab" }
                  : tab,
              ),
            );
            setSection("home");
          }}
          onFullscreen={() => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else void document.documentElement.requestFullscreen();
          }}
          onBookmark={bookmark}
          bookmarked={bookmarks.includes(active.url)}
        />
        <div className="satona-content">
          {tabs
            .filter((tab) => tab.url)
            .map((tab) => (
              <div
                key={tab.id}
                style={{
                  display:
                    section === "home" && activeTab === tab.id
                      ? "block"
                      : "none",
                  height: "100%",
                }}
              >
                <ProxyTab
                  url={tab.url}
                  revision={tab.revision}
                  onFrame={(frame) => {
                    frames.current[tab.id] = frame;
                  }}
                />
              </div>
            ))}
          {(section !== "home" || !active.url) && sectionPage()}
        </div>
      </div>
    </div>
  );
}
