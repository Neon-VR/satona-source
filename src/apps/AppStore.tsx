import Icon from "../components/Icon";
import { EMBEDDED_APPS } from "./EmbeddedApps";

type Props = {
  installed: string[];
  onInstall: (id: string) => void;
  onOpen: (id: string) => void;
};

const STORE_APPS = [
  {
    id: "roblox",
    name: "Roblox",
    description: "Play Roblox through Satona.",
    icon: "roblox",
  },
  {
    id: "wikipedia",
    name: "Wikipedia",
    description: "Explore the world's encyclopedia.",
    icon: "globe",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Code hosting and development tools.",
    icon: "globe",
  },
];

export default function AppStore({
  installed,
  onInstall,
  onOpen,
}: Props) {
  return (
    <div className="store-app">
      <div className="store-heading">
        <div>
          <span className="eyebrow">SATONA STORE</span>
          <h1>Apps for your desktop</h1>
          <p>Install web applications directly into Satona.</p>
        </div>
      </div>

      <div className="store-grid">
        {STORE_APPS.map((app) => {
          const isInstalled = installed.includes(app.id);

          return (
            <article className="store-card" key={app.id}>
              <div className="store-icon">
                <Icon name={app.icon} size={30} />
              </div>

              <div className="store-card-body">
                <h2>{app.name}</h2>
                <p>{app.description}</p>

                <button
                  className="accent-button"
                  onClick={() =>
                    isInstalled
                      ? onOpen(app.id)
                      : onInstall(app.id)
                  }
                >
                  {isInstalled ? "Open" : "Install"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="store-note">
        <Icon name="zap" size={17} />
        More applications can be added to the store registry.
      </div>
    </div>
  );
}
