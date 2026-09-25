import Icon from "./Icon";

export type Section =
  | "home"
  | "games"
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
  { id: "games", label: "Books", icon: "games" },
  { id: "movies", label: "Movies", icon: "movies" },
  { id: "music", label: "Music", icon: "music" },
  { id: "chat", label: "Chat", icon: "chat" },
  { id: "youtube", label: "YouTube", icon: "youtube" },
];

export default function Sidebar({ section, onSection }: Props) {
  return (
    <aside className="satona-sidebar">
      <button
        className="satona-sidebar-logo"
        onClick={() => onSection("home")}
        title="Satona"
      >
        <img src="/satona-logo.png" alt="Satona" />
      </button>

      <div className="satona-sidebar-main">
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
      </button>
    </aside>
  );
}
