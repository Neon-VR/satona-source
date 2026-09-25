import {
  useEffect,
  useRef,
  useState,
} from "react";

import Sidebar, {
  type Section,
} from "./components/Sidebar";

import BrowserChrome from "./components/BrowserChrome";
import HomePage from "./components/HomePage";
import AnimatedGalaxyBackground from "./components/AnimatedGalaxyBackground";

import Games from "./apps/Games";
import Chat from "./apps/Chat";
import Settings from "./apps/Settings";
import YouTube from "./apps/YouTube";

import {
  createTarget,
  ensureController,
  getController,
} from "./proxy/scramjet";

type Tab = {
  id: string;
  title: string;
  url: string;
  started: boolean;
};

function makeId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function getSiteName(url: string) {
  try {
    return new URL(url).hostname
      .replace(/^www\./, "")
      .split(".")[0];
  } catch {
    return "New Tab";
  }
}

export default function Browser() {
  const [section, setSection] =
    useState<Section>("home");

  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: makeId(),
      title: "New Tab",
      url: "",
      started: false,
    },
  ]);

  const [activeTab, setActiveTab] =
    useState(tabs[0].id);

  const [address, setAddress] = useState("");

  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("satona.history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [searchEngine, setSearchEngine] =
    useState("google");

  const frameRefs = useRef<
    Record<string, HTMLIFrameElement | null>
  >({});

  const frames = useRef<Record<string, any>>({});

  const active =
    tabs.find((tab) => tab.id === activeTab) ||
    tabs[0];

  useEffect(() => {
    const update = () => {
      setSearchEngine(
        localStorage.getItem("satona.searchEngine") ||
          "google"
      );
    };

    update();

    window.addEventListener(
      "satona-settings-change",
      update
    );

    return () =>
      window.removeEventListener(
        "satona-settings-change",
        update
      );
  }, []);

  useEffect(() => {
    setAddress(active?.url || "");
  }, [activeTab, active?.url]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "satona.history",
        JSON.stringify(history)
      );
    } catch {}
  }, [history]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "l"
      ) {
        event.preventDefault();

        const input = document.querySelector(
          ".address-bar input"
        ) as HTMLInputElement | null;

        input?.focus();
        input?.select();
      }
    };

    window.addEventListener("keydown", handleShortcut);

    return () =>
      window.removeEventListener(
        "keydown",
        handleShortcut
      );
  }, []);

  function updateTab(
    id: string,
    changes: Partial<Tab>
  ) {
    setTabs((current) =>
      current.map((tab) =>
        tab.id === id
          ? { ...tab, ...changes }
          : tab
      )
    );
  }

  async function navigate(
    value = address,
    tabId = activeTab
  ) {
    const target = createTarget(
      value,
      searchEngine
    );

    if (!target) return;

    setSection("home");

    updateTab(tabId, {
      url: target,
      title: getSiteName(target),
      started: true,
    });

    setAddress(target);

    setHistory((current) => {
      const next = [
        target,
        ...current.filter((item) => item !== target),
      ];

      return next.slice(0, 100);
    });

    await ensureController();

    const controller = getController();

    const iframe = frameRefs.current[tabId];

    if (!controller || !iframe) return;

    if (!frames.current[tabId]) {
      frames.current[tabId] =
        controller.createFrame(iframe);
    }

    frames.current[tabId].go(target);
  }

  function newTab() {
    const tab = {
      id: makeId(),
      title: "New Tab",
      url: "",
      started: false,
    };

    setTabs((current) => [
      ...current,
      tab,
    ]);

    setActiveTab(tab.id);
    setSection("home");
    setAddress("");
  }

  function openSection(next: Section) {
    setSection(next);

    if (next !== "home") {
      const current = active;

      if (current?.started) {
        updateTab(current.id, {
          started: false,
          url: "",
          title: next === "youtube"
            ? "YouTube"
            : next[0].toUpperCase() +
              next.slice(1),
        });
      }
    }
  }

  function submitHomeSearch(value: string) {
    setSection("home");
    navigate(value);
  }

  function reload() {
    if (!active?.url) return;

    navigate(active.url);
  }

  function goBack() {
    const frame = frames.current[activeTab];

    frame?.back?.();
  }

  function goForward() {
    const frame = frames.current[activeTab];

    frame?.forward?.();
  }

  function fullscreen() {
    document.documentElement
      .requestFullscreen?.();
  }

  function renderSection() {
    if (section === "home") {
      return (
        <HomePage
          onSection={openSection}
          onSearch={submitHomeSearch}
        />
      );
    }

    if (section === "games") {
      return <Games />;
    }

    if (section === "chat") {
      return <Chat />;
    }

    if (section === "settings") {
      return <Settings />;
    }

    if (section === "youtube") {
      return <YouTube />;
    }

    return (
      <div className="section-page proxy-section">
        <div className="proxy-section-content">
          <span className="section-kicker">
            SATONA
          </span>

          <h1>
            {section === "movies"
              ? "Anigato"
              : section === "music"
              ? "Spotify"
              : "Discord"}
          </h1>

          <p>
            This service opens in Satona.
          </p>

          <button
            className="primary-button"
            onClick={() => {
              const urls = {
                movies: "https://anigato.lol/",
                music: "https://open.spotify.com/",
                chat: "https://discord.com/app",
              };

              navigate(
                urls[
                  section as
                    | "movies"
                    | "music"
                    | "chat"
                ]
              );
            }}
          >
            Open
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="satona-app">
      <AnimatedGalaxyBackground />

      <Sidebar
        section={section}
        onSection={openSection}
      />

      <div className="satona-browser-shell">
        <BrowserChrome
          tabs={tabs}
          activeTab={activeTab}
          address={address}
          onTab={(id) => {
            setActiveTab(id);
            setSection("home");
          }}
          onNewTab={newTab}
          onAddress={setAddress}
          onNavigate={() => navigate(address)}
          onBack={goBack}
          onForward={goForward}
          onReload={reload}
          onHome={() => openSection("home")}
          onFullscreen={fullscreen}
        />

        <div className="satona-content">
          {section === "home" &&
          active?.started ? (
            <div className="browser-frame-container">
              <iframe
                ref={(element) => {
                  frameRefs.current[activeTab] =
                    element;
                }}
                title="Satona Browser"
                className="browser-frame"
                allow="fullscreen; autoplay; gamepad; pointer-lock; clipboard-read; clipboard-write"
              />
            </div>
          ) : (
            renderSection()
          )}
        </div>
      </div>
    </div>
  );
}
