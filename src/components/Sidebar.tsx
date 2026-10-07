import Icon from "./Icon";

export type Section =
  | "home"
  | "apps"
  | "games"
  | "cloud"
  | "saved"
  | "movies"
  | "music"
  | "chat"
  | "youtube"
  | "settings";

type Props = {
  section: Section;
  onSection: (section: Section) => void;
};

const items: { id: Section; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "apps", label: "Apps", icon: "apps" },
  { id: "games", label: "Satona Steam", icon: "steam" },
  { id: "cloud", label: "Cloud gaming", icon: "cloud" },
  { id: "movies", label: "Movies", icon: "movies" },
  { id: "music", label: "Music", icon: "music" },
  { id: "chat", label: "Chat", icon: "chat" },
  { id: "youtube", label: "YouTube", icon: "youtube" },
  { id: "saved", label: "Saved links", icon: "bookmark" },
];

export default function Sidebar({ section, onSection }: Props) {
  return (
    <aside className="satona-sidebar">
      <button
        className="satona-sidebar-logo"
        onClick={() => onSection("home")}
        title="Satona"
      >
        <picture>
          <source media="(max-width: 800px)" srcSet="/satona-emblem.png" />
          <img src="/satona-wordmark.png" alt="Satona" />
        </picture>
      </button>

      <div className="satona-sidebar-main">
        <span className="nav-caption">YOUR WORKSPACE</span>
        {items.map((item) => (
          <button
            key={item.id}
            className={`satona-sidebar-button ${
              section === item.id ? "active" : ""
            }`}
            onClick={() => onSection(item.id)}
            title={item.label}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <button
        className={`satona-sidebar-button satona-sidebar-settings ${
          section === "settings" ? "active" : ""
        }`}
        onClick={() => onSection("settings")}
        title="Settings"
      >
        <Icon name="settings" />
        <span>Settings</span>
      </button>
    </aside>
  );
}
