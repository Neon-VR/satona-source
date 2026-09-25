import Icon from "./Icon";

type Tab = {
  id: string;
  title: string;
  url: string;
};

type Props = {
  tabs: Tab[];
  activeTab: string;
  address: string;
  onTab: (id: string) => void;
  onNewTab: () => void;
  onAddress: (value: string) => void;
  onNavigate: () => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onHome: () => void;
  onFullscreen: () => void;
};

export default function BrowserChrome({
  tabs,
  activeTab,
  address,
  onTab,
  onNewTab,
  onAddress,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onHome,
  onFullscreen,
}: Props) {
  return (
    <header className="browser-chrome">
      <div className="browser-tabs">
        <button
          className="chrome-home-tab"
          onClick={onHome}
          title="New Tab"
        >
          <span className="chrome-tab-logo">
            <img src="/satona-logo.png" alt="" />
          </span>
          <span>Satona</span>
        </button>

        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`chrome-tab ${
              activeTab === tab.id ? "active" : ""
            }`}
            onClick={() => onTab(tab.id)}
          >
            <span className="chrome-tab-title">
              {tab.title || "New Tab"}
            </span>
          </button>
        ))}

        <button
          className="chrome-add-tab"
          onClick={onNewTab}
          title="New tab"
        >
          <Icon name="plus" size={17} />
        </button>
      </div>

      <div className="browser-nav">
        <div className="browser-nav-buttons">
          <button onClick={onBack} title="Back">
            <Icon name="back" size={18} />
          </button>

          <button onClick={onForward} title="Forward">
            <Icon name="forward" size={18} />
          </button>

          <button onClick={onReload} title="Reload">
            <Icon name="refresh" size={17} />
          </button>
        </div>

        <form
          className="address-bar"
          onSubmit={(event) => {
            event.preventDefault();
            onNavigate();
          }}
        >
          <Icon name="search" size={16} />
          <input
            value={address}
            onChange={(event) => onAddress(event.target.value)}
            placeholder="Search or enter a URL"
          />
        </form>

        <div className="browser-tools">
          <div className="mini-player">
            <span className="mini-player-title">
              Nothing playing
            </span>
            <button>
              <Icon name="back" size={13} />
            </button>
            <button>
              <Icon name="play" size={13} />
            </button>
            <button>
              <Icon name="forward" size={13} />
            </button>
          </div>

          <button title="Split view">
            <Icon name="split" size={17} />
          </button>

          <button title="Bookmark">
            <Icon name="bookmark" size={17} />
          </button>

          <button title="Open in new window">
            <Icon name="external" size={17} />
          </button>

          <button onClick={onFullscreen} title="Fullscreen">
            <Icon name="fullscreen" size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}
