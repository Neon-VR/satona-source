import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type BrowserShortcut = {
  id: string;
  name: string;
  url: string;
  icon?: string;
  color?: string;
};

const SHORTCUT_KEY = "satona.browser.shortcuts";
const WALLPAPER_KEY = "satona.wallpaper";

const DEFAULT_SHORTCUTS: BrowserShortcut[] = [
  { id: "google", name: "Google", url: "https://www.google.com", icon: "G", color: "#4285f4" },
  { id: "youtube", name: "YouTube", url: "https://www.youtube.com", icon: "▶", color: "#ff0033" },
  { id: "spotify", name: "Spotify", url: "https://open.spotify.com", icon: "S", color: "#1ed760" },
  { id: "discord", name: "Discord", url: "https://discord.com", icon: "D", color: "#5865f2" },
  { id: "reddit", name: "Reddit", url: "https://www.reddit.com", icon: "R", color: "#ff4500" },
  { id: "twitch", name: "Twitch", url: "https://www.twitch.tv", icon: "T", color: "#9146ff" },
  { id: "amazon", name: "Amazon", url: "https://www.amazon.com", icon: "a", color: "#232f3e" },
  { id: "ebay", name: "eBay", url: "https://www.ebay.com", icon: "e", color: "#ffffff" },
  { id: "walmart", name: "Walmart", url: "https://www.walmart.com", icon: "W", color: "#0071ce" },
  { id: "airbnb", name: "Airbnb", url: "https://www.airbnb.com", icon: "A", color: "#ff385c" },
];

const DEFAULT_SUGGESTIONS: BrowserShortcut[] = [
  { id: "docs", name: "Google Docs", url: "https://docs.google.com", icon: "D", color: "#4285f4" },
  { id: "github", name: "GitHub", url: "https://github.com", icon: "GH", color: "#181717" },
  { id: "tiktok", name: "TikTok", url: "https://www.tiktok.com", icon: "♪", color: "#111111" },
  { id: "netflix", name: "Netflix", url: "https://www.netflix.com", icon: "N", color: "#e50914" },
];

const BUILTIN_WALLPAPERS = [
  { id: "galaxy", name: "Galaxy", className: "satona-wallpaper-galaxy" },
  { id: "nebula", name: "Nebula", className: "satona-wallpaper-nebula" },
  { id: "midnight", name: "Midnight", className: "satona-wallpaper-midnight" },
];

function SvgIcon({
  name,
  size = 18,
}: {
  name: string;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<string, ReactNode> = {
    back: <path d="M15 18l-6-6 6-6" />,
    forward: <path d="M9 18l6-6-6-6" />,
    refresh: <><path d="M20 11a8 8 0 0 0-14.9-3" /><path d="M4 4v5h5" /><path d="M4 13a8 8 0 0 0 14.9 3" /><path d="M20 20v-5h-5" /></>,
    home: <><path d="M3 11.5L12 4l9 7.5" /><path d="M5.5 10.5V20h13v-9.5" /><path d="M9.5 20v-5h5v5" /></>,
    star: <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3z" />,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-1.8 1.8-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.7v.2h-2.6v-.2a1.8 1.8 0 0 0-1.1-1.7 1.8 1.8 0 0 0-2 .4l-.1.1-1.8-1.8.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.7-1.1h-.2v-2.6H6a1.8 1.8 0 0 0 1.7-1.1 1.8 1.8 0 0 0-.4-2l-.1-.1L9 6.3l.1.1a1.8 1.8 0 0 0 2 .4A1.8 1.8 0 0 0 12.2 5v-.2h2.6V5a1.8 1.8 0 0 0 1.1 1.7 1.8 1.8 0 0 0 2-.4l.1-.1 1.8 1.8-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.7 1.1h.2v2.6H21a1.8 1.8 0 0 0-1.6 1.2z" /></>,
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="M16 16l5 5" /></>,
    camera: <><path d="M4 8h3l1.5-2h7L17 8h3v10H4z" /><circle cx="12" cy="13" r="3" /></>,
    download: <><path d="M12 3v11" /><path d="M8 10l4 4 4-4" /><path d="M4 20h16" /></>,
    sidebar: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 4v16" /></>,
    user: <><circle cx="12" cy="8" r="3" /><path d="M5 20c.7-3.5 3-5 7-5s6.3 1.5 7 5" /></>,
    maximize: <><path d="M8 4H4v4" /><path d="M16 4h4v4" /><path d="M20 16v4h-4" /><path d="M4 16v4h4" /></>,
    minimize: <path d="M5 12h14" />,
    close: <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
  };

  return <svg {...common}>{paths[name] ?? paths.more}</svg>;
}

function SatonaMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="7.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="16" cy="16" rx="14" ry="5" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(-15 16 16)" />
      <circle cx="16" cy="16" r="2.5" fill="currentColor" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <span className="satona-google-mark" aria-hidden="true">
      G
    </span>
  );
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "";

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^localhost(:\d+)?(\/|$)/i.test(trimmed) || /^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/|$)/.test(trimmed)) {
    return `http://${trimmed}`;
  }

  if (trimmed.includes(".") && !trimmed.includes(" ")) {
    return `https://${trimmed}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

function getStoredShortcuts() {
  try {
    const raw = localStorage.getItem(SHORTCUT_KEY);
    if (!raw) return DEFAULT_SHORTCUTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_SHORTCUTS;
  } catch {
    return DEFAULT_SHORTCUTS;
  }
}

export function WallpaperLayer() {
  const [wallpaper, setWallpaper] = useState<string>(() => {
    try {
      return localStorage.getItem(WALLPAPER_KEY) || "builtin:galaxy";
    } catch {
      return "builtin:galaxy";
    }
  });

  useEffect(() => {
    const handler = () => {
      setWallpaper(localStorage.getItem(WALLPAPER_KEY) || "builtin:galaxy");
    };

    window.addEventListener("satona:wallpaper-change", handler);
    window.addEventListener("storage", handler);

    return () => {
      window.removeEventListener("satona:wallpaper-change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  if (wallpaper.startsWith("data:image/")) {
    return (
      <div className="satona-browser-wallpaper">
        <img
          src={wallpaper}
          alt=""
          className="satona-browser-wallpaper-image"
        />
        <div className="satona-browser-wallpaper-overlay" />
      </div>
    );
  }

  const id = wallpaper.replace("builtin:", "");
  const builtIn =
    BUILTIN_WALLPAPERS.find((item) => item.id === id) ??
    BUILTIN_WALLPAPERS[0];

  return (
    <div className={`satona-browser-wallpaper ${builtIn.className}`}>
      <div className="satona-browser-stars" />
      <div className="satona-browser-nebula" />
      <div className="satona-browser-wallpaper-overlay" />
    </div>
  );
}

export function WallpaperPicker() {
  const [value, setValue] = useState<string>(() => {
    try {
      return localStorage.getItem(WALLPAPER_KEY) || "builtin:galaxy";
    } catch {
      return "builtin:galaxy";
    }
  });

  const fileRef = useRef<HTMLInputElement>(null);

  const apply = (next: string) => {
    setValue(next);
    localStorage.setItem(WALLPAPER_KEY, next);
    window.dispatchEvent(new Event("satona:wallpaper-change"));
  };

  const upload = (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      apply(reader.result);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="satona-wallpaper-picker">
      <div className="satona-settings-heading">
        <div>
          <strong>Wallpaper</strong>
          <span>Used by the desktop and Satona Browser</span>
        </div>
      </div>

      <div className="satona-wallpaper-options">
        {BUILTIN_WALLPAPERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`satona-wallpaper-option ${
              value === `builtin:${item.id}` ? "active" : ""
            }`}
            onClick={() => apply(`builtin:${item.id}`)}
          >
            <span className={`satona-wallpaper-preview ${item.className}`}>
              <span />
            </span>
            <strong>{item.name}</strong>
          </button>
        ))}
      </div>

      <div className="satona-wallpaper-actions">
        <button
          type="button"
          className="satona-settings-button"
          onClick={() => fileRef.current?.click()}
        >
          Upload image / GIF
        </button>

        <button
          type="button"
          className="satona-settings-button secondary"
          onClick={() => apply("builtin:galaxy")}
        >
          Reset to default
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,.gif"
          hidden
          onChange={(event) => upload(event.target.files?.[0])}
        />
      </div>

      <p className="satona-settings-note">
        GIF wallpapers are kept as their original data URL and rendered as an
        image, so animated GIFs continue playing.
      </p>
    </div>
  );
}

export function AddSiteTile({
  onAdd,
}: {
  onAdd: (site: BrowserShortcut) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const submit = () => {
    if (!name.trim() || !url.trim()) return;

    onAdd({
      id: `custom-${Date.now()}`,
      name: name.trim(),
      url: normalizeUrl(url),
      icon: name.trim().slice(0, 2).toUpperCase(),
      color: "#2a2f3a",
    });

    setName("");
    setUrl("");
    setOpen(false);
  };

  if (open) {
    return (
      <div className="satona-add-site-editor">
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Site name"
        />
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com"
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
          }}
        />
        <div>
          <button type="button" onClick={submit}>
            Add
          </button>
          <button type="button" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="satona-speed-dial-tile add"
      onClick={() => setOpen(true)}
    >
      <span className="satona-speed-dial-icon">
        <SvgIcon name="plus" size={28} />
      </span>
      <span className="satona-speed-dial-label">Add a site</span>
    </button>
  );
}

export function SpeedDial({
  onNavigate,
}: {
  onNavigate: (url: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [shortcuts, setShortcuts] =
    useState<BrowserShortcut[]>(getStoredShortcuts);

  const addShortcut = (site: BrowserShortcut) => {
    const next = [...shortcuts, site];
    setShortcuts(next);
    localStorage.setItem(SHORTCUT_KEY, JSON.stringify(next));
  };

  const submitSearch = () => {
    if (!query.trim()) return;
    onNavigate(normalizeUrl(query));
  };

  const allShortcuts = useMemo(() => shortcuts.slice(0, 12), [shortcuts]);

  return (
    <div className="satona-speed-dial">
      <div className="satona-speed-dial-center">
        <form
          className="satona-home-search"
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch();
          }}
        >
          <GoogleMark />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the web"
            aria-label="Search the web"
          />
          <button
            type="button"
            className="satona-home-search-icon"
            aria-label="Image search"
          >
            <SvgIcon name="camera" size={19} />
          </button>
          <button
            type="submit"
            className="satona-home-search-icon"
            aria-label="Search"
          >
            <SvgIcon name="search" size={20} />
          </button>
        </form>

        <section className="satona-speed-dial-section">
          <div className="satona-section-title">
            <span>Speed Dial</span>
            <button type="button">Edit</button>
          </div>

          <div className="satona-speed-dial-grid">
            {allShortcuts.map((site) => (
              <button
                type="button"
                className="satona-speed-dial-tile"
                key={site.id}
                onClick={() => onNavigate(site.url)}
              >
                <span
                  className="satona-speed-dial-icon"
                  style={{ background: site.color }}
                >
                  {site.icon}
                </span>
                <span className="satona-speed-dial-label">{site.name}</span>
              </button>
            ))}

            <AddSiteTile onAdd={addShortcut} />
          </div>
        </section>

        <section className="satona-suggestions">
          <div className="satona-section-title">
            <span>Suggestions</span>
          </div>

          <div className="satona-suggestion-row">
            {DEFAULT_SUGGESTIONS.map((site) => (
              <button
                type="button"
                className="satona-suggestion"
                key={site.id}
                onClick={() => onNavigate(site.url)}
              >
                <span
                  className="satona-suggestion-icon"
                  style={{ background: site.color }}
                >
                  {site.icon}
                </span>
                <span>{site.name}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function BrowserSidebar({
  collapsed,
  setCollapsed,
  onHome,
  onNavigate,
  onSettings,
}: {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  onHome: () => void;
  onNavigate: (url: string) => void;
  onSettings: () => void;
}) {
  const quick = [
    { name: "Spotify", icon: "S", color: "#1ed760", url: "https://open.spotify.com" },
    { name: "Discord", icon: "D", color: "#5865f2", url: "https://discord.com" },
    { name: "YouTube", icon: "▶", color: "#ff0033", url: "https://www.youtube.com" },
  ];

  return (
    <aside className={`satona-browser-sidebar ${collapsed ? "collapsed" : ""}`}>
      <button
        className="satona-browser-side-button"
        type="button"
        title="Collapse sidebar"
        onClick={() => setCollapsed(!collapsed)}
      >
        <SvgIcon name="sidebar" />
      </button>

      <div className="satona-browser-side-divider" />

      <button className="satona-browser-side-button active" onClick={onHome} type="button">
        <SvgIcon name="home" />
        {!collapsed && <span>Home</span>}
      </button>

      <button className="satona-browser-side-button" type="button">
        <SvgIcon name="star" />
        {!collapsed && <span>Bookmarks</span>}
      </button>

      <div className="satona-browser-side-divider" />

      {quick.map((item) => (
        <button
          key={item.name}
          type="button"
          className="satona-browser-side-button quick"
          title={item.name}
          onClick={() => onNavigate(item.url)}
        >
          <span
            className="satona-browser-quick-icon"
            style={{ background: item.color }}
          >
            {item.icon}
          </span>
          {!collapsed && <span>{item.name}</span>}
        </button>
      ))}

      <div className="satona-browser-side-spacer" />

      <button className="satona-browser-side-button" type="button">
        <SvgIcon name="history" />
        {!collapsed && <span>History</span>}
      </button>

      <button className="satona-browser-side-button" type="button" onClick={onSettings}>
        <SvgIcon name="settings" />
        {!collapsed && <span>Settings</span>}
      </button>

      <button className="satona-browser-side-button" type="button">
        <SvgIcon name="more" />
        {!collapsed && <span>More</span>}
      </button>
    </aside>
  );
}

export function BrowserWindow({
  children,
  currentUrl,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onHome,
  onClose,
  onMinimize,
  onMaximize,
  onSettings,
}: {
  children: ReactNode;
  currentUrl?: string;
  onNavigate: (url: string) => void;
  onBack?: () => void;
  onForward?: () => void;
  onReload?: () => void;
  onHome?: () => void;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onSettings?: () => void;
}) {
  const [address, setAddress] = useState(currentUrl || "");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setAddress(currentUrl || "");
  }, [currentUrl]);

  const submitAddress = () => {
    const next = normalizeUrl(address);
    if (!next) return;
    onNavigate(next);
  };

  return (
    <div className="satona-browser-window">
      <div className="satona-browser-tabbar">
        <div className="satona-browser-tab active">
          <SatonaMark size={20} />
          <span className="satona-browser-tab-title">Satona Browser</span>
          <button type="button" className="satona-browser-tab-close">
            <SvgIcon name="close" size={13} />
          </button>
        </div>

        <button type="button" className="satona-browser-new-tab" title="New tab">
          <SvgIcon name="plus" size={19} />
        </button>

        <div className="satona-browser-window-controls">
          <button type="button" onClick={onMinimize}>
            <SvgIcon name="minimize" size={16} />
          </button>
          <button type="button" onClick={onMaximize}>
            <SvgIcon name="maximize" size={15} />
          </button>
          <button type="button" className="close" onClick={onClose}>
            <SvgIcon name="close" size={16} />
          </button>
        </div>
      </div>

      <div className="satona-browser-main">
        <BrowserSidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          onHome={onHome || (() => onNavigate(""))}
          onNavigate={onNavigate}
          onSettings={onSettings || (() => undefined)}
        />

        <div className="satona-browser-content">
          <div className="satona-browser-navbar">
            <div className="satona-browser-nav-buttons">
              <button type="button" onClick={onBack}>
                <SvgIcon name="back" />
              </button>
              <button type="button" onClick={onForward}>
                <SvgIcon name="forward" />
              </button>
              <button type="button" onClick={onReload}>
                <SvgIcon name="refresh" />
              </button>
            </div>

            <div className="satona-browser-vpn">
              <span className="satona-vpn-dot" />
              VPN
            </div>

            <form
              className="satona-browser-address"
              onSubmit={(event) => {
                event.preventDefault();
                submitAddress();
              }}
            >
              <span className="satona-address-lock">
                <SatonaMark size={17} />
              </span>
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Enter search or web address"
                spellCheck={false}
              />
            </form>

            <div className="satona-browser-nav-actions">
              <button type="button" title="Downloads">
                <SvgIcon name="download" />
              </button>
              <button type="button" title="Menu">
                <SvgIcon name="more" />
              </button>
              <button type="button" title="Profile">
                <SvgIcon name="user" />
              </button>
              <button type="button" title="Settings" onClick={onSettings}>
                <SvgIcon name="settings" />
              </button>
            </div>
          </div>

          <div className="satona-browser-viewport">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrowserSpeedDial({
  onNavigate,
}: {
  onNavigate: (url: string) => void;
}) {
  return (
    <div className="satona-browser-home">
      <WallpaperLayer />
      <SpeedDial onNavigate={onNavigate} />
    </div>
  );
}

export { SvgIcon };
