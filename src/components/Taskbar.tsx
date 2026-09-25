import Icon from "./Icon";
import SatonaLogo from "./SatonaLogo";
import type { WindowState } from "./WindowManager";

type App = {
  id: string;
  label: string;
  icon: string;
};

type Props = {
  windows: WindowState[];
  apps: App[];
  onOpen: (id: string) => void;
  onToggle: (id: string) => void;
  onSearch: () => void;
};

export default function Taskbar({
  windows,
  apps,
  onOpen,
  onToggle,
  onSearch,
}: Props) {
  return (
    <footer className="taskbar">
      <button className="taskbar-start" onClick={() => onOpen("browser")}>
        <SatonaLogo compact />
      </button>

      <button className="taskbar-search" onClick={onSearch}>
        <Icon name="search" size={17} />
        <span>Search Satona</span>
      </button>

      <div className="taskbar-pinned">
        {apps.map((app) => {
          const open = windows.find((item) => item.appId === app.id);

          return (
            <button
              key={app.id}
              className={`taskbar-app ${open ? "active" : ""}`}
              onClick={() => {
                if (open) onToggle(open.id);
                else onOpen(app.id);
              }}
              title={app.label}
            >
              <Icon name={app.icon} size={21} />
            </button>
          );
        })}
      </div>

      <div className="taskbar-spacer" />

      <div className="taskbar-tray">
        <Icon name="wifi" size={17} />
        <Icon name="volume" size={17} />
        <Icon name="battery" size={18} />
        <span className="tray-time">
          {new Date().toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>
    </footer>
  );
}
