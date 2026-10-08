import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { flushSync } from "react-dom";
import GamePlayer from "../components/GamePlayer";
import GameCover from "../components/GameCover";
import GameLaunchDialog from "./GameLaunchDialog";
import { useGameSearch } from "./useGameSearch";
import {
  gameAppId,
  rememberGame,
  type GameEntry,
  type GameDisplayMode,
} from "../lib/game-library";
import Browser from "../Browser";
import Games from "../apps/Games";
import Minecraft from "../apps/Minecraft";
import YouTube from "../apps/YouTube";
import Chat from "../apps/Chat";
import Settings from "../apps/Settings";
import Account from "../apps/Account";
import CloudGaming from "../apps/CloudGaming";
import Icon from "../components/Icon";
import { readPreference, savePreference } from "../lib/preferences";
import GalaxyWallpaper from "./GalaxyWallpaper";
import DesktopStore from "./DesktopStore";
import Files from "./Files";
import { Notes, Calculator } from "./Utilities";
import { desktopApps, type DesktopApp } from "./registry";
import "./webos.css";

type AppWindow = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  url?: string;
  game?: GameEntry;
  mode?: GameDisplayMode;
};
type LauncherApp = DesktopApp & { game?: GameEntry };
function windowApp(w: AppWindow): LauncherApp {
  return w.game
    ? {
        id: w.id,
        name: w.game.name,
        game: w.game,
        icon: "games",
        color: "#8acaff",
        description: "Ready to play",
        category: "Games",
      }
    : desktopApps.find((a) => a.id === w.id)!;
}
const builtins = desktopApps.filter((a) => a.builtin).map((a) => a.id);
function AppIcon({ app, size = 27 }: { app: LauncherApp; size?: number }) {
  return (
    <span
      className={`os-app-icon os-icon-${app.id}`}
      style={{ "--app-color": app.color, color: app.color } as CSSProperties}
    >
      {app.game ? (
        <GameCover game={app.game} />
      ) : (
        <Icon name={app.icon} size={size} />
      )}
    </span>
  );
}

export default function WebOS({ onExit }: { onExit: () => void }) {
  const [installed, setInstalled] = useState<string[]>(() => [
    ...new Set([
      ...builtins,
      ...readPreference<string[]>("satona.os.installed", []).filter((id) =>
        desktopApps.some((a) => a.id === id),
      ),
    ]),
  ]);
  const [windows, setWindows] = useState<AppWindow[]>([]);
  const [start, setStart] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingGame, setPendingGame] = useState<GameEntry | null>(null);
  const gameSearch = useGameSearch(search, start);
  const windowElements = useRef(new Map<string, HTMLElement>());
  const exclusive = useRef<string | null>(null);
  const [clock, setClock] = useState(new Date());
  const [notice, setNotice] = useState("");
  const [quick, setQuick] = useState(false);
  const [motion, setMotion] = useState(() =>
    readPreference("satona.motion", true),
  );
  const [locked, setLocked] = useState(false);
  const top = useRef(20);
  const drag = useRef<{
    id: string;
    type: "move" | "resize";
    px: number;
    py: number;
    origin: AppWindow;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const update = () => setMotion(readPreference("satona.motion", true));
    window.addEventListener("satona-preferences", update);
    return () => window.removeEventListener("satona-preferences", update);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setStart(false);
        setQuick(false);
        if (document.fullscreenElement && exclusive.current)
          void document.exitFullscreen().catch(() => {});
        setWindows((ws) =>
          ws.map((w) =>
            w.game && !w.minimized && w.mode !== "bordered"
              ? { ...w, mode: "bordered", maximized: false }
              : w,
          ),
        );
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    const resize = () =>
      setWindows((ws) =>
        ws.map((w) => ({
          ...w,
          width: Math.min(w.width, innerWidth - 16),
          height: Math.min(w.height, innerHeight - 100),
          x: Math.max(
            8,
            Math.min(w.x, innerWidth - Math.min(w.width, innerWidth - 16) - 8),
          ),
          y: Math.max(
            38,
            Math.min(
              w.y,
              innerHeight - Math.min(w.height, innerHeight - 100) - 68,
            ),
          ),
        })),
      );
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  function update(id: string, patch: Partial<AppWindow>) {
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }
  useEffect(() => {
    const changed = () => {
      if (!document.fullscreenElement && exclusive.current) {
        const id = exclusive.current;
        exclusive.current = null;
        setWindows((ws) =>
          ws.map((w) =>
            w.id === id ? { ...w, mode: "bordered", maximized: false } : w,
          ),
        );
      }
    };
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  function leaveExclusive(id: string) {
    if (exclusive.current === id) {
      exclusive.current = null;
      if (document.fullscreenElement)
        void document.exitFullscreen().catch(() => {});
    }
  }
  function closeWindow(id: string) {
    leaveExclusive(id);
    setWindows((ws) => ws.filter((w) => w.id !== id));
  }
  function minimizeWindow(id: string) {
    leaveExclusive(id);
    update(id, {
      minimized: true,
      ...(id.startsWith("game:") ? { mode: "bordered" as const } : {}),
    });
  }
  function launchGame(game: GameEntry, mode: GameDisplayMode) {
    const id = gameAppId(game);
    try {
      rememberGame(game);
    } catch {
      setNotice("Game opened, but recent games could not be saved.");
    }
    flushSync(() => {
      setStart(false);
      setQuick(false);
      setPendingGame(null);
      setWindows((ws) => {
        const existing = ws.find((w) => w.id === id);
        const width = Math.min(1080, innerWidth - 24),
          height = Math.min(720, innerHeight - 116);
        const win: AppWindow = existing
          ? {
              ...existing,
              minimized: false,
              maximized: false,
              mode,
              z: ++top.current,
            }
          : {
              id,
              game,
              mode,
              x: (innerWidth - width) / 2,
              y: Math.max(40, (innerHeight - height) / 2 - 20),
              width,
              height,
              z: ++top.current,
              minimized: false,
              maximized: false,
            };
        return existing ? ws.map((w) => (w.id === id ? win : w)) : [...ws, win];
      });
    });
    if (mode === "exclusive") {
      const element = windowElements.current.get(id);
      exclusive.current = id;
      if (element?.requestFullscreen) {
        void element.requestFullscreen().catch(() => {
          exclusive.current = null;
          update(id, { mode: "borderless" });
          setNotice(
            "Fullscreen is unavailable here. Your game is open borderless; move to the top edge for window controls.",
          );
        });
      } else {
        exclusive.current = null;
        update(id, { mode: "borderless" });
      }
    }
  }
  function open(id: string, url?: string) {
    setStart(false);
    setQuick(false);
    const exists = windows.find((w) => w.id === id);
    if (exists) {
      update(id, {
        minimized: false,
        z: ++top.current,
        ...(url ? { url } : {}),
      });
      return;
    }
    const small = innerWidth < 700,
      width = Math.min(id === "calculator" ? 380 : 1000, innerWidth - 24),
      height = Math.min(id === "calculator" ? 550 : 690, innerHeight - 116);
    setWindows((ws) => [
      ...ws,
      {
        id,
        x: Math.max(12, (innerWidth - width) / 2 + (ws.length % 3) * 18 - 18),
        y: Math.max(44, (innerHeight - height) / 2 - 20 + (ws.length % 3) * 14),
        width,
        height,
        z: ++top.current,
        minimized: false,
        maximized: small,
        url,
      },
    ]);
  }
  function install(id: string) {
    const next = [...installed, id];
    try {
      savePreference("satona.os.installed", next);
      setInstalled(next);
      setNotice(
        `${desktopApps.find((a) => a.id === id)?.name} is ready on your desktop.`,
      );
    } catch {
      setNotice("Your browser storage is full.");
    }
  }
  function uninstall(id: string) {
    if (builtins.includes(id)) return;
    const next = installed.filter((a) => a !== id);
    try {
      savePreference("satona.os.installed", next);
      setInstalled(next);
      setWindows((ws) => ws.filter((w) => w.id !== id));
      setNotice("App removed. Your saved notes and files are kept.");
    } catch {
      setNotice("Could not save app changes.");
    }
  }
  function begin(
    e: PointerEvent<HTMLElement>,
    w: AppWindow,
    type: "move" | "resize",
  ) {
    if (
      w.maximized ||
      (w.game && w.mode !== "bordered") ||
      (e.target as HTMLElement).closest("button")
    )
      return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: w.id, type, px: e.clientX, py: e.clientY, origin: w };
    setDragging(true);
  }
  function move(e: PointerEvent<HTMLElement>) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.px,
      dy = e.clientY - d.py;
    update(
      d.id,
      d.type === "move"
        ? {
            x: Math.max(
              0,
              Math.min(innerWidth - d.origin.width, d.origin.x + dx),
            ),
            y: Math.max(34, Math.min(innerHeight - 110, d.origin.y + dy)),
          }
        : {
            width: Math.max(
              Math.min(350, innerWidth - 16),
              Math.min(innerWidth - d.origin.x - 8, d.origin.width + dx),
            ),
            height: Math.max(
              260,
              Math.min(innerHeight - d.origin.y - 72, d.origin.height + dy),
            ),
          },
    );
  }
  function end() {
    drag.current = null;
    setDragging(false);
  }
  function content(w: AppWindow) {
    if (w.game)
      return (
        <GamePlayer
          game={w.game}
          onClose={() => closeWindow(w.id)}
          onOpenSteam={() => {
            minimizeWindow(w.id);
            open("games");
          }}
        />
      );
    if (w.id === "account") return <Account />;
    if (w.id === "browser")
      return <Browser key={w.url || "browser"} embedded initialUrl={w.url} />;
    if (w.id === "games")
      return (
        <Games
          onLaunch={setPendingGame}
          onOpenMinecraft={() => open("minecraft")}
        />
      );
    if (w.id === "minecraft")
      return <Minecraft onLaunch={(game) => launchGame(game, "exclusive")} />;
    if (w.id === "youtube") return <YouTube />;
    if (w.id === "chat") return <Chat />;
    if (w.id === "files") return <Files />;
    if (w.id === "notes") return <Notes />;
    if (w.id === "calculator") return <Calculator />;
    if (w.id === "settings") return <Settings />;
    if (w.id === "cloud")
      return <CloudGaming onOpen={(url) => open("browser", url)} />;
    if (w.id === "store")
      return (
        <DesktopStore
          installed={installed}
          install={install}
          uninstall={uninstall}
          open={open}
        />
      );
    return (
      <Browser
        embedded
        initialUrl={desktopApps.find((a) => a.id === w.id)?.url}
      />
    );
  }
  const visible = windows.filter((w) => !w.minimized);
  const active = visible.reduce(
    (a, w) => (w.z > (a?.z || 0) ? w : a),
    undefined as AppWindow | undefined,
  );
  return (
    <main
      className={`webos ${motion ? "" : "os-still"} ${dragging ? "os-dragging" : ""}`}
    >
      <GalaxyWallpaper />
      <header className="os-topbar">
        <span>
          <b>✦</b> SATONA <small>WEBOS</small>
        </span>
        <span>
          {clock.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </span>
        <button onClick={() => setLocked(true)}>
          Lock desktop <Icon name="lock" size={13} />
        </button>
      </header>
      <div
        className="os-desktop"
        onClick={() => {
          setStart(false);
          setQuick(false);
        }}
      >
        <nav className="os-shortcuts" aria-label="Desktop apps">
          {desktopApps
            .filter((a) => installed.includes(a.id))
            .map((app) => (
              <button
                key={app.id}
                onClick={(e) => {
                  e.stopPropagation();
                  open(app.id);
                }}
              >
                <AppIcon app={app} size={30} />
                <span>{app.name}</span>
              </button>
            ))}
        </nav>
        <aside className="os-desktop-note">
          <span>MAKE YOURSELF AT HOME</span>
          <h2>
            A universe
            <br />
            of your own.
          </h2>
          <p>
            Open an app. Follow a thought.
            <br />
            See where it takes you.
          </p>
          <button onClick={() => open("store")}>
            Discover your apps <span>↗</span>
          </button>
        </aside>
        <span className="os-wallpaper-caption">
          MILKY WAY / SATONA OBSERVATORY <i>✧</i>
        </span>
      </div>
      {windows.map((w) => {
        const app = windowApp(w);
        const borderless = !!w.game && w.mode !== "bordered";
        return (
          <section
            key={w.id}
            ref={(element) => {
              if (element) windowElements.current.set(w.id, element);
              else windowElements.current.delete(w.id);
            }}
            aria-label={`${app.name} window`}
            className={`os-app-window ${w.game ? "os-game-window" : ""} ${borderless ? "os-game-borderless" : ""} ${w.maximized ? "os-maximized" : ""} ${active?.id === w.id ? "os-focused" : ""}`}
            style={{
              display: w.minimized ? "none" : "flex",
              left: w.maximized ? 8 : w.x,
              top: w.maximized ? 38 : w.y,
              width: w.maximized ? "calc(100% - 16px)" : w.width,
              height: w.maximized ? "calc(100% - 112px)" : w.height,
              zIndex: borderless ? 150000 + w.z : w.z,
            }}
            onPointerDownCapture={() => {
              if (active?.id !== w.id) update(w.id, { z: ++top.current });
            }}
          >
            {borderless && (
              <div
                className="os-game-top-edge"
                tabIndex={0}
                aria-label="Show game window controls"
              />
            )}
            <header
              className="os-window-bar"
              onPointerDown={(e) => begin(e, w, "move")}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
              onDoubleClick={(e) => {
                if (!borderless && !(e.target as HTMLElement).closest("button"))
                  update(w.id, { maximized: !w.maximized });
              }}
            >
              <span>
                {w.game ? (
                  <GameCover game={w.game} />
                ) : (
                  <Icon name={app.icon} size={15} />
                )}
                {app.name}
              </span>
              <div>
                <button
                  aria-label={`Minimize ${app.name}`}
                  onClick={() => minimizeWindow(w.id)}
                >
                  −
                </button>
                <button
                  aria-label={`${borderless ? "Window" : w.maximized ? "Restore" : "Maximize"} ${app.name}`}
                  onClick={() => {
                    if (borderless) {
                      leaveExclusive(w.id);
                      update(w.id, { mode: "bordered", maximized: false });
                    } else update(w.id, { maximized: !w.maximized });
                  }}
                >
                  {w.maximized ? "❐" : "□"}
                </button>
                <button
                  className="os-close"
                  aria-label={`Close ${app.name}`}
                  onClick={() => closeWindow(w.id)}
                >
                  ×
                </button>
              </div>
            </header>
            <div className="os-window-body">{content(w)}</div>
            {!w.maximized && !borderless && (
              <div
                role="separator"
                aria-label={`Resize ${app.name}`}
                tabIndex={0}
                className="os-resizer"
                onPointerDown={(e) => begin(e, w, "resize")}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight")
                    update(w.id, {
                      width: Math.min(innerWidth - w.x - 8, w.width + 20),
                    });
                  if (e.key === "ArrowLeft")
                    update(w.id, { width: Math.max(350, w.width - 20) });
                  if (e.key === "ArrowDown")
                    update(w.id, {
                      height: Math.min(innerHeight - w.y - 72, w.height + 20),
                    });
                  if (e.key === "ArrowUp")
                    update(w.id, { height: Math.max(260, w.height - 20) });
                }}
              />
            )}
          </section>
        );
      })}
      {start && (
        <section className="os-start" aria-label="Start menu">
          <div className="os-start-heading">
            <span>
              Good{" "}
              {clock.getHours() < 12
                ? "morning"
                : clock.getHours() < 18
                  ? "afternoon"
                  : "evening"}
              .
            </span>
            <b>Make some space for you.</b>
          </div>
          <input
            autoFocus
            aria-label="Find an app"
            placeholder="Search your apps…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="os-start-label">
            YOUR APPS <button onClick={() => open("store")}>App Store ↗</button>
          </div>
          <div className="os-start-apps">
            {desktopApps
              .filter(
                (a) =>
                  installed.includes(a.id) &&
                  a.name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((a) => (
                <button key={a.id} onClick={() => open(a.id)}>
                  <AppIcon app={a} />
                  <span>{a.name}</span>
                </button>
              ))}
          </div>
          <div className="os-start-label">
            {search.trim() ? "GAMES · READY TO PLAY" : "RECENT GAMES"}
          </div>
          <div className="os-start-games">
            {gameSearch.games.map((game) => (
              <button
                key={gameAppId(game)}
                aria-label={`Launch ${game.name} (${game.source})`}
                onClick={() => launchGame(game, "exclusive")}
              >
                <GameCover game={game} />
                <span>
                  <b>{game.name}</b>
                  <small>{game.source} · Ready to play</small>
                </span>
                <span aria-hidden="true">▶</span>
              </button>
            ))}
            {gameSearch.busy && <p role="status">Searching games…</p>}
            {gameSearch.error && <p role="status">{gameSearch.error}</p>}
            {!gameSearch.busy && !gameSearch.games.length && (
              <p>
                {search.trim()
                  ? "No matching games. Try another name."
                  : "Search for a game to launch it directly."}
              </p>
            )}
          </div>
          <footer>
            <span>
              <img src="/satona-emblem.png" alt="" />
              Your Satona
            </span>
            <button onClick={onExit}>Switch experience ↗</button>
          </footer>
        </section>
      )}
      {quick && (
        <section className="os-quick" aria-label="Quick settings">
          <span className="os-eyebrow">AT A GLANCE</span>
          <h2>Your quiet corner.</h2>
          <p>{clock.toLocaleDateString(undefined, { dateStyle: "full" })}</p>
          <label>
            <input
              type="checkbox"
              checked={motion}
              onChange={(e) => {
                setMotion(e.target.checked);
                savePreference("satona.motion", e.target.checked);
              }}
            />
            Animated wallpaper
          </label>
          <button
            onClick={() => {
              setWindows((ws) => ws.map((w) => ({ ...w, minimized: true })));
              setQuick(false);
            }}
          >
            Show desktop
          </button>
          <button onClick={() => open("settings")}>All settings ↗</button>
        </section>
      )}
      <footer className="os-taskbar">
        <button
          className={`os-start-button ${start ? "selected" : ""}`}
          aria-label="Start"
          aria-expanded={start}
          onClick={() => {
            setStart(!start);
            setQuick(false);
          }}
        >
          <Icon name="apps" size={24} />
        </button>
        <span className="os-dock-divider" />
        <nav aria-label="Taskbar">
          {[...desktopApps, ...windows.filter((w) => w.game).map(windowApp)]
            .filter(
              (a) =>
                ["browser", "games", "files", "store"].includes(a.id) ||
                windows.some((w) => w.id === a.id),
            )
            .map((a) => {
              const win = windows.find((w) => w.id === a.id);
              return (
                <button
                  key={a.id}
                  title={a.name}
                  aria-label={`Taskbar ${a.name}`}
                  className={`${win ? "running" : ""} ${active?.id === a.id ? "active" : ""}`}
                  onClick={() =>
                    active?.id === a.id ? minimizeWindow(a.id) : open(a.id)
                  }
                >
                  <AppIcon app={a} size={23} />
                </button>
              );
            })}
        </nav>
        <div className="os-tray">
          <button
            aria-label="Quick settings"
            onClick={() => {
              setQuick(!quick);
              setStart(false);
            }}
          >
            ◉{" "}
            <span>
              {clock.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
              <small>
                {clock.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </small>
            </span>
          </button>
          <button
            aria-label="Show desktop"
            className="os-show-desktop"
            onClick={() =>
              setWindows((ws) => ws.map((w) => ({ ...w, minimized: true })))
            }
          />
        </div>
      </footer>
      {pendingGame && (
        <GameLaunchDialog
          game={pendingGame}
          onCancel={() => setPendingGame(null)}
          onPlay={(mode) => launchGame(pendingGame, mode)}
        />
      )}
      {notice && (
        <div className="os-toast" role="status">
          <Icon name="apps" size={23} />
          <span>{notice}</span>
        </div>
      )}
      {locked && (
        <div className="os-lock">
          <span>SATONA WEBOS</span>
          <strong>
            {clock.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </strong>
          <p>{clock.toLocaleDateString(undefined, { dateStyle: "full" })}</p>
          <button onClick={() => setLocked(false)}>Welcome back →</button>
          <small>Desktop screen lock · no password</small>
        </div>
      )}
    </main>
  );
}
